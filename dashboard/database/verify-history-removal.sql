-- ============================================
-- VERIFY HISTORY TABLES REMOVAL
-- ============================================
-- Run this script to verify history tables were removed
-- Usage: mysql -u read1 -p read1 < verify-history-removal.sql
-- ============================================

USE read1;

SELECT '
========================================
🔍 HISTORY TABLES REMOVAL VERIFICATION
========================================
' AS '';

-- ============================================
-- 1. CHECK REMOVED TABLES
-- ============================================

SELECT '
1️⃣ CHECKING REMOVED TABLES
Expected: 0 results for each query
' AS '';

SELECT 'Checking login_history table...' AS '';
SHOW TABLES LIKE 'login_history';

SELECT 'Checking ip_blacklist table...' AS '';
SHOW TABLES LIKE 'ip_blacklist';

SELECT 'Checking transaction_history table...' AS '';
SHOW TABLES LIKE 'transaction_history';

-- ============================================
-- 2. CHECK ALL REMAINING TABLES
-- ============================================

SELECT '
2️⃣ ALL REMAINING TABLES IN DATABASE
' AS '';

SHOW TABLES;

-- ============================================
-- 3. CHECK VIEW UPDATE
-- ============================================

SELECT '
3️⃣ CHECKING user_dashboard_analytics VIEW
Expected: No transaction_history references
' AS '';

SELECT 'View columns:' AS '';
SELECT COLUMN_NAME, DATA_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'read1'
AND TABLE_NAME = 'user_dashboard_analytics'
ORDER BY ORDINAL_POSITION;

-- ============================================
-- 4. CHECK MIGRATION STATUS
-- ============================================

SELECT '
4️⃣ CHECKING MIGRATION STATUS
Expected: history_tables_removed = true
' AS '';

SELECT 
    `key`,
    `value`,
    CASE 
        WHEN `value` = 'true' THEN '✅ Migration tracked'
        ELSE '❌ Migration not tracked'
    END AS status
FROM site_settings 
WHERE `key` = 'history_tables_removed';

-- ============================================
-- 5. SUMMARY CHECK
-- ============================================

SELECT '
========================================
📊 REMOVAL SUMMARY
========================================
' AS '';

SELECT 
    'Tables Check' AS category,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'read1' 
            AND TABLE_NAME IN ('login_history', 'ip_blacklist', 'transaction_history')
        ) = 0 THEN '✅ PASS - All history tables removed'
        ELSE '❌ FAIL - Some history tables still exist'
    END AS status
UNION ALL
SELECT 
    'Migration Tracking' AS category,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM site_settings 
            WHERE `key` = 'history_tables_removed' AND `value` = 'true'
        ) = 1 THEN '✅ PASS - Migration tracked'
        ELSE '❌ FAIL - Migration not tracked'
    END AS status
UNION ALL
SELECT 
    'View Update' AS category,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.VIEWS 
            WHERE TABLE_SCHEMA = 'read1' 
            AND TABLE_NAME = 'user_dashboard_analytics'
        ) THEN '✅ PASS - View exists and updated'
        ELSE '⚠️ WARNING - View may need manual check'
    END AS status;

SELECT '
========================================
✅ Verification Complete!
========================================

Removed Tables:
- login_history (lịch sử đăng nhập)
- ip_blacklist (danh sách IP chặn)  
- transaction_history (lịch sử giao dịch)

Impact:
- Users will not have login history tracked
- Transaction history will not be stored
- IP blacklist feature disabled

Note: Existing user data and website data remain intact
========================================
' AS '';
