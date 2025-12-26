import { executeQuery } from '../../utils/database.js';

// In-memory store for tracking requests
const requestStore = new Map();

// Clean old entries every 1 minute
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestStore.entries()) {
    if (now - data.firstRequest > data.windowMs) {
      requestStore.delete(key);
    }
  }
}, 60000);

/**
 * Rate limiter middleware with automatic IP blacklisting
 * @param {Object} options - Configuration options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @param {number} options.maxRequests - Max requests per window (default: 10)
 * @param {number} options.blockThreshold - Violations before blocking IP (default: 3)
 * @param {string} options.message - Custom error message
 */
export function rateLimiter(options = {}) {
  const {
    windowMs = 60000, // 1 minute
    maxRequests = 10,
    blockThreshold = 3, // Block after 3 violations
    message = 'Too many requests, please try again later'
  } = options;

  return async (req, res, next) => {
    try {
      // Get client IP
      const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                       req.headers['x-real-ip'] || 
                       req.connection.remoteAddress || 
                       req.ip || 
                       'Unknown';

      // Check if IP is already blacklisted (from database)
      if (req.user && req.user.id) {
        const blacklistCheck = await executeQuery(
          'SELECT id, reason FROM ip_blacklist WHERE user_id = ? AND ip_address = ? LIMIT 1',
          [req.user.id, clientIP]
        );

        if (blacklistCheck.success && blacklistCheck.data.length > 0) {
          console.log(`🚫 Blocked request from blacklisted IP ${clientIP} for user ${req.user.id}`);
          
          // Log activity
          try {
            await executeQuery(`
              INSERT INTO activities (user_id, username, type, action, description, metadata, ip_address, user_agent)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              req.user.id,
              req.user.username || 'Unknown',
              'other',
              'Blocked Request',
              'Request blocked from blacklisted IP',
              JSON.stringify({ reason: blacklistCheck.data[0].reason }),
              clientIP,
              req.headers['user-agent'] || ''
            ]);
          } catch (logError) {
            console.error('Failed to log blocked request:', logError);
          }

          return res.status(403).json({
            status: 'error',
            message: 'Your IP address has been blocked due to suspicious activity. Please contact support.'
          });
        }
      }

      // Create unique key for this IP and endpoint
      const key = `${clientIP}:${req.path}`;
      const now = Date.now();

      // Get or create request data for this key
      let requestData = requestStore.get(key);

      if (!requestData) {
        requestData = {
          count: 0,
          firstRequest: now,
          violations: 0,
          windowMs: windowMs
        };
        requestStore.set(key, requestData);
      }

      // Reset if window has passed
      if (now - requestData.firstRequest > windowMs) {
        requestData.count = 0;
        requestData.firstRequest = now;
      }

      // Increment request count
      requestData.count++;

      // Check if limit exceeded
      if (requestData.count > maxRequests) {
        requestData.violations++;
        
        console.warn(`⚠️ Rate limit exceeded for IP ${clientIP} on ${req.path} (violation #${requestData.violations})`);

        // Log spam detection activity
        if (req.user) {
          try {
            await executeQuery(`
              INSERT INTO activities (user_id, username, type, action, description, metadata, ip_address, user_agent)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              req.user.id,
              req.user.username || 'Unknown',
              'other',
              'Spam Detected',
              `Rate limit exceeded: ${requestData.count} requests in ${Math.floor(windowMs / 1000)}s (limit: ${maxRequests})`,
              JSON.stringify({ 
                endpoint: req.path, 
                count: requestData.count, 
                violation_number: requestData.violations 
              }),
              clientIP,
              req.headers['user-agent'] || ''
            ]);
          } catch (logError) {
            console.error('Failed to log spam detection:', logError);
          }
        }

        // Block IP if threshold reached
        if (requestData.violations >= blockThreshold && req.user && req.user.id) {
          try {
            // Check if already blacklisted
            const existingBlock = await executeQuery(
              'SELECT id FROM ip_blacklist WHERE user_id = ? AND ip_address = ?',
              [req.user.id, clientIP]
            );

            if (!existingBlock.success || existingBlock.data.length === 0) {
              // Add to blacklist
              await executeQuery(
                `INSERT INTO ip_blacklist (user_id, ip_address, reason, blocked_by, expires_at)
                 VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
                [
                  req.user.id, 
                  clientIP, 
                  `Auto-blocked: ${requestData.violations} rate limit violations on ${req.path}`,
                  'system'
                ]
              );

              console.log(`🚫 IP ${clientIP} blocked for user ${req.user.id} due to ${requestData.violations} violations`);

              // Log blocking activity
              await executeQuery(`
                INSERT INTO activities (user_id, username, type, action, description, metadata, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `, [
                req.user.id,
                req.user.username || 'Unknown',
                'other',
                'IP Blocked',
                `IP automatically blocked after ${requestData.violations} spam violations`,
                JSON.stringify({ 
                  endpoint: req.path, 
                  violations: requestData.violations,
                  block_duration: '24 hours'
                }),
                clientIP,
                req.headers['user-agent'] || ''
              ]);

              // Clear from memory store
              requestStore.delete(key);
            }
          } catch (blockError) {
            console.error('Failed to block IP:', blockError);
          }

          return res.status(403).json({
            status: 'error',
            message: 'Your IP has been blocked due to excessive requests. Please contact support if you believe this is an error.'
          });
        }

        return res.status(429).json({
          status: 'error',
          message: message,
          retryAfter: Math.ceil((windowMs - (now - requestData.firstRequest)) / 1000)
        });
      }

      // Continue to next middleware
      next();

    } catch (error) {
      console.error('Rate limiter error:', error);
      // Don't block request if rate limiter fails
      next();
    }
  };
}

/**
 * Strict rate limiter for sensitive operations
 * More restrictive limits for critical endpoints
 */
export function strictRateLimiter() {
  return rateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 5,  // Only 5 requests per minute
    blockThreshold: 2, // Block after 2 violations
    message: 'Too many attempts. Please slow down.'
  });
}

/**
 * Moderate rate limiter for regular operations
 */
export function moderateRateLimiter() {
  return rateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 20, // 20 requests per minute
    blockThreshold: 3, // Block after 3 violations
    message: 'Rate limit exceeded. Please wait before trying again.'
  });
}

/**
 * Lenient rate limiter for less critical endpoints
 */
export function lenientRateLimiter() {
  return rateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 50, // 50 requests per minute
    blockThreshold: 5, // Block after 5 violations
    message: 'Too many requests. Please try again later.'
  });
}

export default rateLimiter;

