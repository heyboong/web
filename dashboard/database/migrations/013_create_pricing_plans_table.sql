-- Create pricing_plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USDT',
    duration_type ENUM('daily', 'monthly', 'yearly', 'lifetime') NOT NULL,
    duration_value INT NOT NULL, -- Số ngày/tháng/năm (0 cho lifetime)
    features JSON, -- Danh sách tính năng được bao gồm
    is_active BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_is_active (is_active),
    INDEX idx_duration_type (duration_type),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NOT NULL,
    auto_renew BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES pricing_plans(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default pricing plans
INSERT INTO pricing_plans (name, description, price, currency, duration_type, duration_value, features, is_popular, sort_order) VALUES
('Basic Daily', 'Access to phishing tools for 1 day', 5.00, 'USDT', 'daily', 1, '["Create phishing pages", "Manage campaigns", "View analytics"]', FALSE, 1),
('Pro Monthly', 'Full access to all features for 1 month', 25.00, 'USDT', 'monthly', 1, '["Unlimited phishing pages", "Advanced analytics", "Priority support", "Custom domains"]', TRUE, 2),
('Premium Yearly', 'Complete package for 1 year with 20% discount', 240.00, 'USDT', 'yearly', 1, '["Everything in Pro", "White-label solution", "API access", "Dedicated support"]', FALSE, 3),
('Lifetime Access', 'One-time payment for lifetime access', 500.00, 'USDT', 'lifetime', 0, '["All features forever", "Future updates included", "Highest priority support", "Custom development"]', FALSE, 4);
