-- Add sharing and approval features to templates table
-- Add columns one by one with error handling

-- Add is_shared column
ALTER TABLE templates ADD COLUMN is_shared BOOLEAN DEFAULT FALSE;

-- Add approval_status column
ALTER TABLE templates ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved';

-- Add approved_by column
ALTER TABLE templates ADD COLUMN approved_by INT DEFAULT NULL;

-- Add approved_at column  
ALTER TABLE templates ADD COLUMN approved_at TIMESTAMP NULL DEFAULT NULL;

-- Add submitted_for_approval_at column
ALTER TABLE templates ADD COLUMN submitted_for_approval_at TIMESTAMP NULL DEFAULT NULL;

-- Add rejection_reason column
ALTER TABLE templates ADD COLUMN rejection_reason TEXT DEFAULT NULL;

-- Add foreign key constraint for approved_by
ALTER TABLE templates ADD CONSTRAINT fk_templates_approved_by 
FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add indexes for better performance
ALTER TABLE templates ADD INDEX idx_approval_status (approval_status);
ALTER TABLE templates ADD INDEX idx_is_shared (is_shared);
ALTER TABLE templates ADD INDEX idx_approved_by (approved_by);

-- Update existing admin templates to be auto-approved (use is_admin column instead of role)
UPDATE templates SET 
  approval_status = 'approved',
  approved_at = NOW()
WHERE created_by IN (SELECT id FROM users WHERE is_admin = 1);
