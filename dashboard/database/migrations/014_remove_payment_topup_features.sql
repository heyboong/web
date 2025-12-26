-- Migration: Remove payment/topup related tables and columns
-- Date: 2025-12-16
-- Purpose: Clean up database schema after removing payment/topup features from the application

-- Drop tables that are no longer used (payment/topup related)
DROP TABLE IF EXISTS `topup_transactions`;
DROP TABLE IF EXISTS `user_points_transactions`;
DROP TABLE IF EXISTS `user_balance_transactions`;

-- Remove balance and points columns from users table if they exist
ALTER TABLE `users` 
DROP COLUMN IF EXISTS `balance`,
DROP COLUMN IF EXISTS `points`;

-- Remove payment-related columns from tools table if they exist
ALTER TABLE `tools`
DROP COLUMN IF EXISTS `price`,
DROP COLUMN IF EXISTS `points_cost`;

-- Update user_dashboard_analytics view to remove balance and points
-- First drop the existing view
DROP VIEW IF EXISTS `user_dashboard_analytics`;

-- Recreate view without balance and points columns
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

-- Clean up transaction_history table - remove payment/topup related transactions
DELETE FROM `transaction_history` 
WHERE `type` IN ('topup', 'topup_bonus', 'payment', 'refund', 'points_purchase', 'points_bonus');

-- Update site_settings to remove payment-related settings
DELETE FROM `site_settings` 
WHERE `key` IN (
    'payment_enabled',
    'payment_gateway',
    'payment_api_key',
    'points_enabled',
    'points_rate',
    'topup_enabled',
    'min_topup_amount',
    'max_topup_amount'
);

-- Add migration tracking
INSERT INTO `site_settings` (`key`, `value`, `type`, `description`) 
VALUES (
    'payment_features_removed', 
    'true', 
    'boolean', 
    'Payment and topup features have been removed from the system'
) ON DUPLICATE KEY UPDATE `value` = 'true', `updated_at` = CURRENT_TIMESTAMP;

-- Update activity_logs to mark migration completion
INSERT INTO `transaction_history` (`type`, `amount`, `description`, `user_id`, `created_at`)
SELECT 'system', 0, 'Database cleanup: Payment/topup features removed', id, NOW()
FROM `users` 
WHERE `is_admin` = 1 
LIMIT 1;
