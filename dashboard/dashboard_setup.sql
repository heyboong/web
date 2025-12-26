-- Complete SQL setup for dashboard with real data
-- This file contains all the necessary tables and sample data for the dashboard home page

-- ==============================================
-- 1. CREATE TABLES
-- ==============================================

-- Create user_analytics table for storing user balance, points, and statistics
CREATE TABLE IF NOT EXISTS user_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    total_balance DECIMAL(10,2) DEFAULT 0.00,
    points INT DEFAULT 0,
    tool_use_count INT DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_analytics (user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create tools table for managing available tools
CREATE TABLE IF NOT EXISTS tools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category ENUM('seo', 'development', 'design', 'analytics', 'productivity', 'other') DEFAULT 'other',
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    price DECIMAL(10,2) DEFAULT 0.00,
    points_cost INT DEFAULT 0,
    icon VARCHAR(10) DEFAULT '🔧',
    url VARCHAR(255),
    is_featured BOOLEAN DEFAULT FALSE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_is_featured (is_featured),
    INDEX idx_usage_count (usage_count),
    UNIQUE KEY unique_tool_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create tool_usage table for tracking user tool usage
CREATE TABLE IF NOT EXISTS tool_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tool_id INT NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_duration INT DEFAULT 0, -- in seconds
    success BOOLEAN DEFAULT TRUE,
    notes TEXT,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_tool_id (tool_id),
    INDEX idx_used_at (used_at),
    INDEX idx_user_tool (user_id, tool_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create notifications table for user notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL, -- NULL means system-wide notification
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('admin', 'system', 'promotion', 'maintenance', 'update') DEFAULT 'admin',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('draft', 'scheduled', 'sent', 'cancelled') DEFAULT 'draft',
    target_audience ENUM('all', 'new_users', 'premium_users', 'admin') DEFAULT 'all',
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP NULL,
    scheduled_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_points_transactions table for tracking point changes
CREATE TABLE IF NOT EXISTS user_points_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    points_change INT NOT NULL, -- positive for earning, negative for spending
    reason VARCHAR(255) NOT NULL,
    reference_type ENUM('tool_usage', 'purchase', 'bonus', 'admin_adjustment') DEFAULT 'tool_usage',
    reference_id INT NULL, -- ID of the related record (tool_id, purchase_id, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_reference_type (reference_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_balance_transactions table for tracking balance changes
CREATE TABLE IF NOT EXISTS user_balance_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL, -- positive for deposits, negative for withdrawals
    transaction_type ENUM('deposit', 'withdrawal', 'tool_purchase', 'refund', 'bonus') DEFAULT 'deposit',
    description VARCHAR(255) NOT NULL,
    reference_id INT NULL, -- ID of the related record
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_transaction_type (transaction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================
-- 2. INSERT SAMPLE DATA
-- ==============================================

-- Insert sample tools
INSERT IGNORE INTO tools (name, description, category, status, price, points_cost, icon, url, is_featured, usage_count) VALUES
('SEO Analyzer', 'Analyze your website SEO performance and get detailed recommendations', 'seo', 'active', 9.99, 100, '🔍', '/tools/seo-analyzer', TRUE, 1250),
('Code Generator', 'Generate code snippets for various programming languages', 'development', 'active', 19.99, 200, '💻', '/tools/code-generator', FALSE, 890),
('Image Optimizer', 'Optimize images for web performance without losing quality', 'design', 'active', 14.99, 150, '🖼️', '/tools/image-optimizer', TRUE, 2100),
('Text Summarizer', 'Summarize long texts automatically using AI', 'productivity', 'active', 7.99, 80, '📝', '/tools/text-summarizer', FALSE, 650),
('Analytics Dashboard', 'Create beautiful analytics dashboards with real-time data', 'analytics', 'active', 24.99, 250, '📊', '/tools/analytics-dashboard', TRUE, 420),
('Color Palette Generator', 'Generate harmonious color palettes for your designs', 'design', 'active', 5.99, 60, '🎨', '/tools/color-palette', FALSE, 320),
('Password Generator', 'Generate secure passwords with customizable options', 'productivity', 'active', 2.99, 30, '🔐', '/tools/password-generator', FALSE, 1800),
('QR Code Generator', 'Create QR codes for URLs, text, and contact information', 'productivity', 'active', 3.99, 40, '📱', '/tools/qr-generator', FALSE, 750),
('Facebook Password Changer', 'Change your Facebook password securely using advanced encryption', 'productivity', 'active', 15.99, 150, '🔑', '/tools/change-pass', TRUE, 0);

-- Insert sample user analytics (using existing user ID 3)
INSERT INTO user_analytics (user_id, balance, total_balance, points, tool_use_count, last_activity) VALUES
(3, 1250.75, 5670.25, 1580, 42, NOW() - INTERVAL 2 HOUR);

-- Insert sample tool usage records
INSERT INTO tool_usage (user_id, tool_id, used_at, session_duration, success, notes) VALUES
(3, 1, NOW() - INTERVAL 2 HOUR, 300, TRUE, 'Analyzed main website'),
(3, 2, NOW() - INTERVAL 1 DAY, 450, TRUE, 'Generated React components'),
(3, 3, NOW() - INTERVAL 3 DAY, 180, TRUE, 'Optimized product images'),
(3, 4, NOW() - INTERVAL 1 WEEK, 120, TRUE, 'Summarized research paper'),
(3, 1, NOW() - INTERVAL 1 WEEK, 240, TRUE, 'Analyzed blog posts'),
(3, 5, NOW() - INTERVAL 2 WEEK, 600, TRUE, 'Created marketing dashboard'),
(3, 6, NOW() - INTERVAL 2 WEEK, 90, TRUE, 'Generated brand colors'),
(3, 7, NOW() - INTERVAL 3 WEEK, 60, TRUE, 'Generated team passwords');

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, priority, status, target_audience, is_read, sent_at) VALUES
(3, 'New tools available', 'We\'ve added 3 new tools to your toolkit. Check them out!', 'admin', 'medium', 'sent', 'all', FALSE, NOW() - INTERVAL 2 HOUR),
(3, 'System maintenance scheduled', 'System maintenance will occur tonight at 2 AM. Some features may be temporarily unavailable.', 'maintenance', 'high', 'sent', 'all', TRUE, NOW() - INTERVAL 4 HOUR),
(3, 'Welcome bonus points', 'You\'ve received 100 points as a welcome bonus! Use them to access premium tools.', 'promotion', 'low', 'sent', 'new_users', TRUE, NOW() - INTERVAL 1 DAY),
(3, 'Feature update: Analytics Dashboard', 'We\'ve updated the analytics dashboard with new metrics and improved visualizations.', 'update', 'medium', 'draft', 'all', FALSE, NOW() - INTERVAL 1 DAY),
(3, 'Points expiring soon', 'You have 50 points expiring in 7 days. Use them before they expire!', 'admin', 'medium', 'scheduled', 'all', FALSE, NULL);

-- Insert sample points transactions
INSERT INTO user_points_transactions (user_id, points_change, reason, reference_type, reference_id) VALUES
(3, 100, 'Welcome bonus', 'bonus', NULL),
(3, -100, 'Used SEO Analyzer', 'tool_usage', 1),
(3, -200, 'Used Code Generator', 'tool_usage', 2),
(3, -150, 'Used Image Optimizer', 'tool_usage', 3),
(3, -80, 'Used Text Summarizer', 'tool_usage', 4),
(3, 50, 'Daily login bonus', 'bonus', NULL),
(3, 30, 'Tool usage reward', 'tool_usage', 1),
(3, -250, 'Used Analytics Dashboard', 'tool_usage', 5);

-- Insert sample balance transactions
INSERT INTO user_balance_transactions (user_id, amount, transaction_type, description, reference_id) VALUES
(3, 1000.00, 'deposit', 'Initial account funding', NULL),
(3, 500.00, 'deposit', 'Monthly subscription payment', NULL),
(3, -9.99, 'tool_purchase', 'SEO Analyzer subscription', 1),
(3, -19.99, 'tool_purchase', 'Code Generator subscription', 2),
(3, -14.99, 'tool_purchase', 'Image Optimizer subscription', 3),
(3, 25.00, 'refund', 'Refund for cancelled service', NULL),
(3, 50.00, 'bonus', 'Referral bonus', NULL);

-- ==============================================
-- 3. CREATE VIEWS FOR EASY QUERYING
-- ==============================================

-- Create a view for recent tools used by user
CREATE OR REPLACE VIEW user_recent_tools AS
SELECT 
    t.id,
    t.name,
    t.description,
    t.icon,
    t.url,
    t.category,
    COUNT(tu.id) as uses,
    MAX(tu.used_at) as last_used,
    TIMESTAMPDIFF(HOUR, MAX(tu.used_at), NOW()) as hours_ago
FROM tools t
LEFT JOIN tool_usage tu ON t.id = tu.tool_id
WHERE tu.user_id = 3 OR tu.user_id IS NULL
GROUP BY t.id, t.name, t.description, t.icon, t.url, t.category
HAVING uses > 0
ORDER BY last_used DESC
LIMIT 10;

-- Create a view for user dashboard analytics
CREATE OR REPLACE VIEW user_dashboard_analytics AS
SELECT 
    u.id as user_id,
    u.username,
    COALESCE(ua.balance, 0) as balance,
    COALESCE(ua.total_balance, 0) as total_balance,
    COALESCE(ua.points, 0) as points,
    COALESCE(ua.tool_use_count, 0) as tool_use_count,
    ua.last_activity,
    (SELECT COUNT(*) FROM notifications n WHERE n.user_id = u.id AND n.is_read = FALSE) as unread_notifications
FROM users u
LEFT JOIN user_analytics ua ON u.id = ua.user_id
WHERE u.id = 3;

-- ==============================================
-- 4. USEFUL QUERIES FOR TESTING
-- ==============================================

-- Query to get dashboard data for user ID 3
-- SELECT * FROM user_dashboard_analytics;

-- Query to get recent tools for user ID 3
-- SELECT * FROM user_recent_tools;

-- Query to get notifications for user ID 3
-- SELECT * FROM notifications WHERE user_id = 3 OR user_id IS NULL ORDER BY created_at DESC LIMIT 5;

-- Query to get tool usage statistics
-- SELECT 
--     t.name,
--     COUNT(tu.id) as total_uses,
--     AVG(tu.session_duration) as avg_duration,
--     MAX(tu.used_at) as last_used
-- FROM tools t
-- LEFT JOIN tool_usage tu ON t.id = tu.tool_id
-- WHERE tu.user_id = 3
-- GROUP BY t.id, t.name
-- ORDER BY total_uses DESC;
