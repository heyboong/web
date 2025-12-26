-- Create system_announcement table for system-wide announcement modal
-- This is separate from the notifications table to avoid conflicts
CREATE TABLE IF NOT EXISTS system_announcement (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL, -- HTML content
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default announcement
INSERT INTO system_announcement (title, content, is_active) 
VALUES (
    'Welcome to Scanvia!',
    '<h2>Welcome to our platform!</h2><p>We are glad to have you here. Please explore our features and let us know if you need any help.</p>',
    FALSE
);

