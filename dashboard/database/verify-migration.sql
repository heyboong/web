-- ============================================
-- VERIFY PAYMENT/TOPUP MIGRATION SCRIPT
-- ============================================
-- Run this script in MySQL client to verify migration success
-- Usage: mysql -u read1 -p read1 < verify-migration.sql
-- Or copy/paste into phpMyAdmin or MySQL Workbench
-- ============================================

USE read1;

SELECT '
========================================
🔍 DATABASE MIGRATION VERIFICATION
========================================
' AS '';

-- ============================================
-- 1. CHECK REMOVED TABLES
-- ============================================
SELECT '
1️⃣ CHECKING REMOVED TABLES
Expected: 0 results for each query
' AS '';

SELECT 'Checking topup_transactions table...' AS '';
SHOW TABLES LIKE '%topup%';

SELECT 'Checking user_points_transactions table...' AS '';
SHOW TABLES LIKE '%points_transactions%';

SELECT 'Checking user_balance_transactions table...' AS '';
SHOW TABLES LIKE '%balance_transactions%';

-- ============================================
-- 2. CHECK USERS TABLE STRUCTURE
-- ============================================
SELECT '
2️⃣ CHECKING USERS TABLE COLUMNS
Expected: balance and points columns should NOT exist
' AS '';

DESCRIBE users;

SELECT 'Verifying balance column removed...' AS '';
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ users.balance column REMOVED'
        ELSE '❌ users.balance column STILL EXISTS'
    END AS result
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'read1' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'balance';

SELECT 'Verifying points column removed...' AS '';
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ users.points column REMOVED'
        ELSE '❌ users.points column STILL EXISTS'
    END AS result
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'read1' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'points';

-- ============================================
-- 3. CHECK TOOLS TABLE STRUCTURE
-- ============================================
SELECT '
3️⃣ CHECKING TOOLS TABLE COLUMNS
Expected: price and points_cost columns should NOT exist
' AS '';

DESCRIBE tools;

SELECT 'Verifying price column removed...' AS '';
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ tools.price column REMOVED'
        ELSE '❌ tools.price column STILL EXISTS'
    END AS result
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'read1' 
AND TABLE_NAME = 'tools' 
AND COLUMN_NAME = 'price';

SELECT 'Verifying points_cost column removed...' AS '';
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ tools.points_cost column REMOVED'
        ELSE '❌ tools.points_cost column STILL EXISTS'
    END AS result
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'read1' 
AND TABLE_NAME = 'tools' 
AND COLUMN_NAME = 'points_cost';

-- ============================================
-- 4. CHECK TRANSACTION HISTORY
-- ============================================
SELECT '
4️⃣ CHECKING TRANSACTION HISTORY
Expected: No topup/payment/refund/points types
' AS '';

SELECT 'Current transaction types:' AS '';
SELECT DISTINCT type, COUNT(*) as count
FROM transaction_history
GROUP BY type
ORDER BY type;

SELECT 'Checking for payment-related types...' AS '';
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Payment/topup transaction types REMOVED'
        ELSE CONCAT('❌ Found ', COUNT(*), ' payment-related transactions')
    END AS result
FROM transaction_history
WHERE type IN ('topup', 'payment', 'refund', 'points_purchase', 'points_bonus');

-- ============================================
-- 5. CHECK MIGRATION STATUS
-- ============================================
SELECT '
5️⃣ CHECKING MIGRATION STATUS
Expected: payment_features_removed = true
' AS '';

SELECT 
    `key`,
    `value`,
    CASE 
        WHEN `value` = 'true' THEN '✅ Migration tracked'
        ELSE '❌ Migration not tracked'
    END AS status
FROM site_settings 
WHERE `key` = 'payment_features_removed';

-- ============================================
-- 6. CHECK VIEW STRUCTURE
-- ============================================
SELECT '
6️⃣ CHECKING user_dashboard_analytics VIEW
Expected: balance and points columns should NOT exist
' AS '';

SELECT 'View columns:' AS '';
SELECT COLUMN_NAME, DATA_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'read1'
AND TABLE_NAME = 'user_dashboard_analytics'
ORDER BY ORDINAL_POSITION;

SELECT 'Verifying balance column removed from view...' AS '';
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ View balance column REMOVED'
        ELSE '❌ View balance column STILL EXISTS'
    END AS result
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'read1' 
AND TABLE_NAME = 'user_dashboard_analytics' 
AND COLUMN_NAME = 'balance';

SELECT 'Verifying points column removed from view...' AS '';
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ View points column REMOVED'
        ELSE '❌ View points column STILL EXISTS'
    END AS result
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'read1' 
AND TABLE_NAME = 'user_dashboard_analytics' 
AND COLUMN_NAME = 'points';

-- ============================================
-- 7. SUMMARY CHECK
-- ============================================
SELECT '
========================================
📊 MIGRATION SUMMARY
========================================
' AS '';

SELECT 
    'Tables Check' AS category,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'read1' 
            AND TABLE_NAME IN ('topup_transactions', 'user_points_transactions', 'user_balance_transactions')
        ) = 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END AS status
UNION ALL
SELECT 
    'Users Columns' AS category,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = 'read1' 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME IN ('balance', 'points')
        ) = 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END AS status
UNION ALL
SELECT 
    'Tools Columns' AS category,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = 'read1' 
            AND TABLE_NAME = 'tools' 
            AND COLUMN_NAME IN ('price', 'points_cost')
        ) = 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END AS status
UNION ALL
SELECT 
    'Transaction Types' AS category,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM transaction_history 
            WHERE type IN ('topup', 'payment', 'refund', 'points_purchase', 'points_bonus')
        ) = 0 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END AS status
UNION ALL
SELECT 
    'Migration Tracking' AS category,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM site_settings 
            WHERE `key` = 'payment_features_removed' AND `value` = 'true'
        ) = 1 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END AS status;

SELECT '
========================================
✅ Verification Complete!
========================================
' AS '';
