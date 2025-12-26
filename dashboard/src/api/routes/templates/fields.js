import express from 'express';
import { executeQuery } from '../../../utils/database.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

// Get all fields for a template
router.get('/:templateId/fields', authenticateToken, async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user.id;

    // Verify user owns the template
    const templateCheck = await executeQuery(
      'SELECT id FROM templates WHERE id = ? AND created_by = ?',
      [templateId, userId]
    );

    if (!templateCheck.success || templateCheck.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template not found or access denied'
      });
    }

    const fields = await executeQuery(
      `SELECT * FROM template_fields 
       WHERE template_id = ? 
       ORDER BY field_order ASC, created_at ASC`,
      [templateId]
    );

    res.json({
      success: true,
      data: fields.success ? fields.data : []
    });
  } catch (error) {
    console.error('Error fetching template fields:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template fields'
    });
  }
});

// Add a new field to a template
router.post('/:templateId/fields', authenticateToken, async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user.id;
    const {
      field_name,
      field_type = 'text',
      field_label,
      field_placeholder,
      max_length = 255,
      is_required = false,
      field_order = 0
    } = req.body;

    if (!field_name) {
      return res.status(400).json({
        success: false,
        message: 'Field name is required'
      });
    }

    // Verify user owns the template
    const templateCheck = await executeQuery(
      'SELECT id FROM templates WHERE id = ? AND created_by = ?',
      [templateId, userId]
    );

    if (!templateCheck.success || templateCheck.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template not found or access denied'
      });
    }

    // Check if field name already exists for this template
    const existingField = await executeQuery(
      'SELECT id FROM template_fields WHERE template_id = ? AND field_name = ?',
      [templateId, field_name]
    );

    if (existingField.success && existingField.data.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Field name already exists for this template'
      });
    }

    // Insert the new field
    const result = await executeQuery(
      `INSERT INTO template_fields 
       (template_id, field_name, field_type, field_label, field_placeholder, max_length, is_required, field_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [templateId, field_name, field_type, field_label, field_placeholder, max_length, is_required, field_order]
    );

    // Get the created field
    const newField = await executeQuery(
      'SELECT * FROM template_fields WHERE id = ?',
      [result.data.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Field added successfully',
      data: newField.success ? newField.data[0] : null
    });
  } catch (error) {
    console.error('Error adding template field:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add template field'
    });
  }
});

// Update a template field
router.put('/:templateId/fields/:fieldId', authenticateToken, async (req, res) => {
  try {
    const { templateId, fieldId } = req.params;
    const userId = req.user.id;
    const {
      field_name,
      field_type,
      field_label,
      field_placeholder,
      max_length,
      is_required,
      field_order
    } = req.body;

    // Verify user owns the template
    const templateCheck = await executeQuery(
      'SELECT id FROM templates WHERE id = ? AND created_by = ?',
      [templateId, userId]
    );

    if (!templateCheck.success || templateCheck.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template not found or access denied'
      });
    }

    // Verify field exists and belongs to the template
    const fieldCheck = await executeQuery(
      'SELECT id FROM template_fields WHERE id = ? AND template_id = ?',
      [fieldId, templateId]
    );

    if (!fieldCheck.success || fieldCheck.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }

    // Check for duplicate field name (excluding current field)
    if (field_name) {
      const duplicateCheck = await executeQuery(
        'SELECT id FROM template_fields WHERE template_id = ? AND field_name = ? AND id != ?',
        [templateId, field_name, fieldId]
      );

      if (duplicateCheck.success && duplicateCheck.data.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Field name already exists for this template'
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (field_name !== undefined) {
      updates.push('field_name = ?');
      values.push(field_name);
    }
    if (field_type !== undefined) {
      updates.push('field_type = ?');
      values.push(field_type);
    }
    if (field_label !== undefined) {
      updates.push('field_label = ?');
      values.push(field_label);
    }
    if (field_placeholder !== undefined) {
      updates.push('field_placeholder = ?');
      values.push(field_placeholder);
    }
    if (max_length !== undefined) {
      updates.push('max_length = ?');
      values.push(max_length);
    }
    if (is_required !== undefined) {
      updates.push('is_required = ?');
      values.push(is_required);
    }
    if (field_order !== undefined) {
      updates.push('field_order = ?');
      values.push(field_order);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(fieldId);

    await executeQuery(
      `UPDATE template_fields SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get the updated field
    const updatedField = await executeQuery(
      'SELECT * FROM template_fields WHERE id = ?',
      [fieldId]
    );

    res.json({
      success: true,
      message: 'Field updated successfully',
      data: updatedField.success ? updatedField.data[0] : null
    });
  } catch (error) {
    console.error('Error updating template field:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template field'
    });
  }
});

// Delete a template field
router.delete('/:templateId/fields/:fieldId', authenticateToken, async (req, res) => {
  try {
    const { templateId, fieldId } = req.params;
    const userId = req.user.id;

    // Verify user owns the template
    const templateCheck = await executeQuery(
      'SELECT id FROM templates WHERE id = ? AND created_by = ?',
      [templateId, userId]
    );

    if (!templateCheck.success || templateCheck.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template not found or access denied'
      });
    }

    // Verify field exists and belongs to the template
    const fieldCheck = await executeQuery(
      'SELECT id FROM template_fields WHERE id = ? AND template_id = ?',
      [fieldId, templateId]
    );

    if (!fieldCheck.success || fieldCheck.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }

    // Delete the field
    await executeQuery(
      'DELETE FROM template_fields WHERE id = ?',
      [fieldId]
    );

    res.json({
      success: true,
      message: 'Field deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template field:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete template field'
    });
  }
});


export default router;
