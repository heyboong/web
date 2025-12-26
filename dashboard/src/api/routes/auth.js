import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeQuery } from '../../utils/database.js';
import { apiConfig } from '../../configs/database.config.js';

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user by username or email
    const result = await executeQuery(
      'SELECT id, username, email, password_hash, is_active, is_admin FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (!result.success || result.data.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = result.data[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.is_admin ? 'admin' : 'user'
    };

    console.log('Login - JWT Secret being used:', apiConfig.jwtSecret);
    console.log('Login - User payload:', payload);
    
    const authToken = jwt.sign(payload, apiConfig.jwtSecret, {
      expiresIn: '7d'
    });
    
    console.log('Login - Generated token:', authToken);

    // Update last login
    await executeQuery(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Save login history
    try {
      const userAgent = req.headers['user-agent'] || '';
      const ipAddress = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
      
      // Parse user agent for device info
      const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
      const isTablet = /tablet|ipad/i.test(userAgent);
      const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
      
      // Parse browser
      let browser = 'Unknown';
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';
      
      // Parse OS
      let os = 'Unknown';
      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac')) os = 'macOS';
      else if (userAgent.includes('Linux')) os = 'Linux';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'iOS';
      
      await executeQuery(`
        INSERT INTO login_history (user_id, ip_address, user_agent, device_type, browser, os, session_token)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [user.id, ipAddress, userAgent, deviceType, browser, os, authToken.substring(0, 50)]);
      
      // Log activity
      await executeQuery(`
        INSERT INTO activities (user_id, username, type, action, description, metadata, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user.id, 
        user.username, 
        'login', 
        'User Login', 
        `${user.username} logged in from ${deviceType}`,
        JSON.stringify({ device_type: deviceType, browser, os }),
        ipAddress,
        userAgent
      ]);
    } catch (historyError) {
      console.error('Failed to save login history:', historyError);
      // Don't fail the login if history save fails
    }

    res.json({
      success: true,
      authToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user profile
router.get('/user/profile', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, apiConfig.jwtSecret);
    
    const result = await executeQuery(
      'SELECT id, username, email, is_admin, balance FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!result.success || result.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: result.data[0]
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;

