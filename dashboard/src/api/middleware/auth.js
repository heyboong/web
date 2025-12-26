import jwt from 'jsonwebtoken';
import { executeQuery } from '../../utils/database.js';
import { apiConfig } from '../../configs/database.config.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Auth middleware - URL:', req.url);
  console.log('Auth middleware - Token exists:', !!token);

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Access token required'
    });
  }

  console.log('Auth middleware - JWT Secret being used:', apiConfig.jwtSecret);
  console.log('Auth middleware - Token to verify:', token);
  
  jwt.verify(token, apiConfig.jwtSecret, async (err, decoded) => {
    if (err) {
      console.log('JWT verification error:', err.message);
      return res.status(403).json({
        status: 'error',
        message: 'Invalid or expired token'
      });
    }

    console.log('JWT decoded successfully:', decoded);

    try {
      // Get user details from database
      const result = await executeQuery(
        'SELECT id, username, email, is_active, is_admin FROM users WHERE id = ?',
        [decoded.id]
      );

      if (!result.success || result.data.length === 0 || !result.data[0].is_active) {
        return res.status(403).json({
          status: 'error',
          message: 'User not found or inactive'
        });
      }

      req.user = result.data[0];
      next();
    } catch (error) {
      console.error('Error verifying user:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Authentication error'
      });
    }
  });
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};
