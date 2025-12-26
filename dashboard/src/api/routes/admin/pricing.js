// Import Dependencies
import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { executeQuery } from '../../../utils/database.js';

const router = express.Router();

// Middleware to require admin
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

router.use(authenticateToken);
router.use(requireAdmin);

// Get all pricing plans
router.get('/plans', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT * FROM pricing_plans 
      ORDER BY sort_order ASC, created_at DESC
    `);
    
    if (!result.success) {
      throw new Error('Database query failed');
    }
    
    // Parse features JSON for each plan
    const plansWithParsedFeatures = result.data.map(plan => ({
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || [])
    }));
    
    res.json({
      success: true,
      data: plansWithParsedFeatures
    });
  } catch (error) {
    console.error('Get pricing plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing plans'
    });
  }
});

// Create new pricing plan
router.post('/plans', async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      currency,
      duration_type,
      duration_value,
      features,
      is_active,
      is_popular,
      sort_order
    } = req.body;

    // Validate required fields
    if (!name || !price || !duration_type) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and duration type are required'
      });
    }

    const result = await executeQuery(`
      INSERT INTO pricing_plans 
      (name, description, price, currency, duration_type, duration_value, features, is_active, is_popular, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      description || '',
      parseFloat(price),
      currency || 'USDT',
      duration_type,
      parseInt(duration_value) || 1,
      JSON.stringify(features || []),
      is_active ? 1 : 0,
      is_popular ? 1 : 0,
      parseInt(sort_order) || 0
    ]);

    if (!result.success) {
      throw new Error('Failed to create pricing plan');
    }

    res.json({
      success: true,
      message: 'Pricing plan created successfully',
      data: {
        id: result.data.insertId
      }
    });
  } catch (error) {
    console.error('Create pricing plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create pricing plan'
    });
  }
});

// Update pricing plan
router.put('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      currency,
      duration_type,
      duration_value,
      features,
      is_active,
      is_popular,
      sort_order
    } = req.body;

    // Validate required fields
    if (!name || !price || !duration_type) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and duration type are required'
      });
    }

    const result = await executeQuery(`
      UPDATE pricing_plans 
      SET name = ?, description = ?, price = ?, currency = ?, duration_type = ?, 
          duration_value = ?, features = ?, is_active = ?, is_popular = ?, sort_order = ?
      WHERE id = ?
    `, [
      name,
      description || '',
      parseFloat(price),
      currency || 'USDT',
      duration_type,
      parseInt(duration_value) || 1,
      JSON.stringify(features || []),
      is_active ? 1 : 0,
      is_popular ? 1 : 0,
      parseInt(sort_order) || 0,
      id
    ]);

    if (!result.success) {
      throw new Error('Failed to update pricing plan');
    }

    if (result.data.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pricing plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Pricing plan updated successfully'
    });
  } catch (error) {
    console.error('Update pricing plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pricing plan'
    });
  }
});

// Delete pricing plan
router.delete('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if plan has active subscriptions
    const subscriptionCheck = await executeQuery(
      'SELECT COUNT(*) as count FROM user_subscriptions WHERE plan_id = ? AND status = "active"',
      [id]
    );

    if (!subscriptionCheck.success) {
      throw new Error('Database query failed');
    }

    if (subscriptionCheck.data[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete plan with active subscriptions'
      });
    }

    const result = await executeQuery(
      'DELETE FROM pricing_plans WHERE id = ?',
      [id]
    );

    if (!result.success) {
      throw new Error('Failed to delete pricing plan');
    }

    if (result.data.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pricing plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Pricing plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete pricing plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pricing plan'
    });
  }
});

// Get all subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [];

    if (status) {
      whereClause = 'WHERE us.status = ?';
      queryParams.push(status);
    }

    const result = await executeQuery(`
      SELECT 
        us.*,
        pp.name as plan_name,
        pp.price,
        pp.currency,
        pp.duration_type,
        u.username,
        u.email
      FROM user_subscriptions us
      JOIN pricing_plans pp ON us.plan_id = pp.id
      JOIN users u ON us.user_id = u.id
      ${whereClause}
      ORDER BY us.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    if (!result.success) {
      throw new Error('Database query failed');
    }

    // Get total count
    const countResult = await executeQuery(`
      SELECT COUNT(*) as total 
      FROM user_subscriptions us
      JOIN pricing_plans pp ON us.plan_id = pp.id
      JOIN users u ON us.user_id = u.id
      ${whereClause}
    `, queryParams);

    if (!countResult.success) {
      throw new Error('Database query failed');
    }

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.data[0].total,
        pages: Math.ceil(countResult.data[0].total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions'
    });
  }
});

export default router;
