-- Migration to change websites table from storing HTML content to template IDs
-- This allows dynamic template updates to affect all associated websites

-- Add new columns for template IDs
ALTER TABLE websites 
ADD COLUMN phishing_template_id INT NULL AFTER temp2,
ADD COLUMN login_template_id INT NULL AFTER phishing_template_id;

-- Add foreign key constraints to link to templates table
ALTER TABLE websites 
ADD CONSTRAINT fk_websites_phishing_template 
    FOREIGN KEY (phishing_template_id) REFERENCES templates(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_websites_login_template 
    FOREIGN KEY (login_template_id) REFERENCES templates(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX idx_websites_phishing_template ON websites(phishing_template_id);
CREATE INDEX idx_websites_login_template ON websites(login_template_id);

-- Note: We'll keep temp1 and temp2 columns for backward compatibility during transition
-- They can be removed in a future migration after all data is migrated

-- Add comment to document the change
ALTER TABLE websites COMMENT = 'Updated to use template IDs instead of storing HTML content directly';
