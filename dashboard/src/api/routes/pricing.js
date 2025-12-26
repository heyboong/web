// Import Dependencies
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { executeQuery } from '../../utils/database.js';

const router = express.Router();

// Get all active pricing plans
router.get('/plans', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT * FROM pricing_plans 
      WHERE is_active = TRUE 
      ORDER BY sort_order ASC
    `);
    
    if (!result.success) {
      throw new Error('Database query failed');
    }
    
    // Parse features JSON for each plan
    const plansWithParsedFeatures = result.data.map(plan => ({
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
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

// Get user's active subscription
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await executeQuery(`
      SELECT 
        us.*,
        pp.name as plan_name,
        pp.description as plan_description,
        pp.price,
        pp.currency,
        pp.duration_type,
        pp.duration_value,
        pp.features
      FROM user_subscriptions us
      JOIN pricing_plans pp ON us.plan_id = pp.id
      WHERE us.user_id = ? AND us.status = 'active' AND us.end_date > NOW()
      ORDER BY us.end_date DESC
      LIMIT 1
    `, [userId]);
    
    if (!result.success) {
      throw new Error('Database query failed');
    }
    
    // Parse features JSON if subscription exists
    let subscriptionData = null;
    if (result.data.length > 0) {
      subscriptionData = {
        ...result.data[0],
        features: typeof result.data[0].features === 'string' ? JSON.parse(result.data[0].features) : result.data[0].features
      };
    }
    
    res.json({
      success: true,
      data: subscriptionData
    });
  } catch (error) {
    console.error('Get user subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user subscription'
    });
  }
});

// Purchase a plan
router.post('/purchase', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.body;
    
    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }
    
    // Get plan details
    const planResult = await executeQuery(
      'SELECT * FROM pricing_plans WHERE id = ? AND is_active = TRUE',
      [planId]
    );
    
    if (!planResult.success || planResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    const plan = planResult.data[0];
    
    // Check if user has sufficient balance
    const balanceResult = await executeQuery(
      'SELECT balance FROM users WHERE id = ?',
      [userId]
    );
    
    if (!balanceResult.success || balanceResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const userBalance = parseFloat(balanceResult.data[0].balance);
    const planPrice = parseFloat(plan.price);
    
    if (userBalance < planPrice) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }
    
    // Calculate end date
    let endDate = new Date();
    if (plan.duration_type === 'daily') {
      endDate.setDate(endDate.getDate() + plan.duration_value);
    } else if (plan.duration_type === 'monthly') {
      endDate.setMonth(endDate.getMonth() + plan.duration_value);
    } else if (plan.duration_type === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + plan.duration_value);
    } else if (plan.duration_type === 'lifetime') {
      endDate = new Date('2099-12-31'); // Far future date for lifetime
    }
    
    // Start transaction
    await executeQuery('START TRANSACTION');
    
    try {
      // Deduct balance
      const deductResult = await executeQuery(
        'UPDATE users SET balance = balance - ? WHERE id = ?',
        [planPrice, userId]
      );
      
      if (!deductResult.success) {
        throw new Error('Failed to deduct balance');
      }
      
      // Cancel any existing active subscriptions
      await executeQuery(
        'UPDATE user_subscriptions SET status = "cancelled" WHERE user_id = ? AND status = "active"',
        [userId]
      );
      
      // Create new subscription
      const subscriptionResult = await executeQuery(`
        INSERT INTO user_subscriptions (user_id, plan_id, end_date, status)
        VALUES (?, ?, ?, 'active')
      `, [userId, planId, endDate]);
      
      if (!subscriptionResult.success) {
        throw new Error('Failed to create subscription');
      }
      
      // Commit transaction
      await executeQuery('COMMIT');
      
      res.json({
        success: true,
        message: 'Plan purchased successfully',
        data: {
          subscriptionId: subscriptionResult.data.insertId,
          endDate: endDate,
          planName: plan.name
        }
      });
    } catch (error) {
      // Rollback transaction
      await executeQuery('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Purchase plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to purchase plan'
    });
  }
});

// Check if user has access to phishing features
router.get('/check-access', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await executeQuery(`
      SELECT 
        us.end_date,
        pp.name as plan_name,
        pp.duration_type
      FROM user_subscriptions us
      JOIN pricing_plans pp ON us.plan_id = pp.id
      WHERE us.user_id = ? AND us.status = 'active' AND us.end_date > NOW()
      ORDER BY us.end_date DESC
      LIMIT 1
    `, [userId]);
    
    if (!result.success) {
      throw new Error('Database query failed');
    }
    
    const hasAccess = result.data.length > 0;
    const subscription = hasAccess ? result.data[0] : null;
    
    res.json({
      success: true,
      data: {
        hasAccess,
        subscription
      }
    });
  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check access'
    });
  }
});

export default router;
