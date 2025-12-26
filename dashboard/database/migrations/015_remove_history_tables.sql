-- ============================================
-- REMOVE HISTORY TABLES MIGRATION
-- ============================================
-- Created: December 16, 2025
-- Purpose: Remove all usage history tracking tables
-- Author: Database Migration Script
-- ============================================

-- Bảo vệ: Chỉ chạy trên database read1
USE read1;

-- ============================================
-- 1. DROP HISTORY TABLES
-- ============================================

-- Xóa bảng lịch sử đăng nhập
DROP TABLE IF EXISTS login_history;

-- Xóa bảng IP bị chặn
DROP TABLE IF EXISTS ip_blacklist;

-- Xóa bảng lịch sử giao dịch
DROP TABLE IF EXISTS transaction_history;

-- ============================================
-- 2. XÓA DATA LIÊN QUAN (nếu có)
-- ============================================

-- Xóa các thiết lập liên quan đến history tracking
DELETE FROM site_settings 
WHERE `key` IN (
    'track_login_history',
    'track_transaction_history',
    'login_history_retention_days',
    'transaction_history_retention_days'
);

-- ============================================
-- 3. CẬP NHẬT VIEWS (nếu có sử dụng)
-- ============================================

-- Kiểm tra và xóa view user_dashboard_analytics nếu có reference đến transaction_history
DROP VIEW IF EXISTS user_dashboard_analytics;

-- Tạo lại view user_dashboard_analytics không có transaction_history
CREATE OR REPLACE VIEW user_dashboard_analytics AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    u.created_at as user_since,
    u.last_login,
    u.is_active,
    u.role,
    
    -- Account statistics
    COUNT(DISTINCT al.id) as total_accounts,
    COUNT(DISTINCT CASE WHEN al.status = 'success' THEN al.id END) as successful_accounts,
    
    -- Website usage
    COUNT(DISTINCT w.id) as total_websites,
    COUNT(DISTINCT CASE WHEN w.is_active = 1 THEN w.id END) as active_websites
    
FROM users u
LEFT JOIN account_list al ON u.id = al.user_id
LEFT JOIN websites w ON u.id = w.user_id
WHERE u.deleted_at IS NULL
GROUP BY u.id;

-- ============================================
-- 4. ĐÁNH DẤU MIGRATION ĐÃ CHẠY
-- ============================================

INSERT INTO site_settings (`key`, `value`, created_at, updated_at)
VALUES ('history_tables_removed', 'true', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    `value` = 'true',
    updated_at = NOW();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

SELECT '✅ History tables removed successfully!' as status;
SELECT 'Dropped: login_history, ip_blacklist, transaction_history' as tables_removed;
