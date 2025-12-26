-- Create telegram_bots table for managing multiple Telegram bots
CREATE TABLE IF NOT EXISTS telegram_bots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    bot_name VARCHAR(255) NOT NULL,
    bot_token VARCHAR(500) NOT NULL,
    chat_id VARCHAR(255) NOT NULL,
    bot_username VARCHAR(255),
    is_enabled BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    webhook_url VARCHAR(500),
    webhook_set_at TIMESTAMP NULL,
    
    -- Notification settings
    notify_new_accounts BOOLEAN DEFAULT TRUE,
    notify_website_views BOOLEAN DEFAULT FALSE,
    notify_errors BOOLEAN DEFAULT TRUE,
    
    -- Stats
    messages_sent INT DEFAULT 0,
    last_message_at TIMESTAMP NULL,
    last_error TEXT,
    last_error_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bot_token (bot_token),
    INDEX idx_user_id (user_id),
    INDEX idx_is_enabled (is_enabled),
    INDEX idx_is_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
