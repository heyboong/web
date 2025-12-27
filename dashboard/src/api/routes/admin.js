import express from 'express';
import pricingRouter from './admin/pricing.js';
import { executeQuery } from '../../utils/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

console.log(' Admin router loaded successfully');

// Mount sub-routers
router.use('/pricing', pricingRouter);

// Admin Middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Apply middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status, role } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT id, username, email, is_admin, is_active, created_at, last_login, balance FROM users WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const params = [];
    
    if (search) {
      const searchCondition = ' AND (username LIKE ? OR email LIKE ?)';
      query += searchCondition;
      countQuery += searchCondition;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (status) {
      const isActive = status === 'active';
      query += ' AND is_active = ?';
      countQuery += ' AND is_active = ?';
      params.push(isActive);
    }
    
    if (role) {
      const isAdmin = role === 'admin';
      query += ' AND is_admin = ?';
      countQuery += ' AND is_admin = ?';
      params.push(isAdmin);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    
    // Get users
    const usersResult = await executeQuery(query, [...params, parseInt(limit), parseInt(offset)]);
    
    // Get total count
    const countResult = await executeQuery(countQuery, params);
    const total = countResult.success ? countResult.data[0].total : 0;
    
    res.json({
      success: true,
      data: {
        users: usersResult.success ? usersResult.data : [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

export default router;
