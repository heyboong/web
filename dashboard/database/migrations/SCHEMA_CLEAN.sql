-- Updated database schema (cleaned version without payment/topup)
-- Date: 2025-12-16
-- This is the clean schema after removing payment/topup features

-- --------------------------------------------------------
-- Updated Users Table (removed balance and points)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_admin` tinyint(1) DEFAULT '0',
  `admin` tinyint(1) DEFAULT '0',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_is_admin` (`is_admin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Updated Tools Table (removed price and points_cost)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tools` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` enum('seo','development','design','analytics','productivity','other') COLLATE utf8mb4_unicode_ci DEFAULT 'other',
  `status` enum('active','inactive','maintenance') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `icon` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '🔧',
  `url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT '0',
  `usage_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`),
  KEY `idx_is_featured` (`is_featured`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Updated Transaction History (removed payment/topup types)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transaction_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('tool_usage','subscription','system','admin_action') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) DEFAULT '0.00',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_transaction_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Updated User Dashboard Analytics View (removed balance/points)
-- --------------------------------------------------------
CREATE OR REPLACE VIEW `user_dashboard_analytics` AS
SELECT 
    u.id AS user_id,
    u.username,
    COUNT(DISTINCT tu.id) AS tool_use_count,
    MAX(tu.used_at) AS last_activity,
    COUNT(DISTINCT CASE WHEN n.is_read = 0 THEN n.id END) AS unread_notifications
FROM users u
LEFT JOIN tool_usage tu ON u.id = tu.user_id
LEFT JOIN notifications n ON u.id = n.user_id
GROUP BY u.id, u.username;

-- --------------------------------------------------------
-- Indexes for better performance
-- --------------------------------------------------------

-- Users table indexes (already included in CREATE TABLE)
-- Tools table indexes (already included in CREATE TABLE)
-- Transaction history indexes (already included in CREATE TABLE)

-- Additional composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_active_admin ON users(is_active, is_admin);
CREATE INDEX IF NOT EXISTS idx_tools_status_featured ON tools(status, is_featured);
CREATE INDEX IF NOT EXISTS idx_transaction_user_type ON transaction_history(user_id, type, created_at);

-- --------------------------------------------------------
-- Notes:
-- --------------------------------------------------------
-- Tables REMOVED:
--   - topup_transactions (payment feature)
--   - user_points_transactions (points system)
--   - user_balance_transactions (balance system)
--
-- Columns REMOVED from users:
--   - balance (payment feature)
--   - points (points system)
--
-- Columns REMOVED from tools:
--   - price (payment feature)
--   - points_cost (points system)
--
-- Transaction types REMOVED:
--   - topup, topup_bonus, payment, refund
--   - points_purchase, points_bonus
--
-- Views UPDATED:
--   - user_dashboard_analytics (removed balance/points)
