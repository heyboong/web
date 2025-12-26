# Database Migration Guide - Remove Payment/Topup Features

## 📋 Overview

Migration này loại bỏ các tables và columns liên quan đến payment/topup features đã bị remove khỏi application code.

## ⚠️ Important Notes

**BACKUP DATABASE TRƯỚC KHI CHẠY MIGRATION!**

```bash
mysqldump -u read1 -p read1 > backup_before_payment_removal_$(date +%Y%m%d_%H%M%S).sql
```

## 🗑️ What Will Be Removed

### Tables được xóa:
- ✅ `topup_transactions` - Topup payment transactions
- ✅ `user_points_transactions` - Points system transactions  
- ✅ `user_balance_transactions` - Balance transactions

### Columns được xóa:
- ✅ `users.balance` - User balance amount
- ✅ `users.points` - User points amount
- ✅ `tools.price` - Tool price in USD
- ✅ `tools.points_cost` - Tool cost in points

### Data được cleanup:
- ✅ Transaction history entries với type: topup, payment, refund, points_*
- ✅ Site settings liên quan đến payment/topup
- ✅ Activity logs về payment/topup

### Views được update:
- ✅ `user_dashboard_analytics` - Removed balance/points columns

## 🚀 How to Run Migration

### Option 1: Manual SQL (Recommended)

```bash
# 1. Backup database
mysqldump -u read1 -p read1 > backup_$(date +%Y%m%d).sql

# 2. Run migration
mysql -u read1 -p read1 < database/migrations/014_remove_payment_topup_features.sql

# 3. Verify changes
mysql -u read1 -p read1 -e "SHOW TABLES LIKE '%topup%'; SHOW TABLES LIKE '%points%';"
```

### Option 2: Using Node.js migrate script

```bash
npm run migrate
```

### Option 3: phpMyAdmin

1. Login to phpMyAdmin
2. Select database `read1`
3. Go to SQL tab
4. Copy content from `014_remove_payment_topup_features.sql`
5. Click "Go" to execute

## ✅ Verification Steps

After migration, verify:

```sql
-- 1. Check tables are removed
SHOW TABLES LIKE '%topup%';
SHOW TABLES LIKE '%points%';
SHOW TABLES LIKE '%balance%';
-- Should return empty

-- 2. Check users table structure
DESCRIBE users;
-- Should NOT have: balance, points columns

-- 3. Check tools table structure  
DESCRIBE tools;
-- Should NOT have: price, points_cost columns

-- 4. Check view structure
SHOW CREATE VIEW user_dashboard_analytics;
-- Should NOT include balance/points

-- 5. Check transaction history
SELECT DISTINCT type FROM transaction_history;
-- Should NOT include: topup, payment, refund, points_*

-- 6. Verify migration tracking
SELECT * FROM site_settings WHERE `key` = 'payment_features_removed';
-- Should return: value = 'true'
```

## 🔄 Rollback (if needed)

If you need to rollback:

```bash
# Restore from backup
mysql -u read1 -p read1 < backup_YYYYMMDD.sql
```

## 📊 Expected Changes

### Before Migration:
- Total Tables: ~25
- Users table columns: ~15 (including balance, points)
- Tools table columns: ~12 (including price, points_cost)
- Transaction types: 10+ (including payment types)

### After Migration:
- Total Tables: ~22 (3 tables removed)
- Users table columns: ~13 (balance, points removed)
- Tools table columns: ~10 (price, points_cost removed)
- Transaction types: 4 (only: tool_usage, subscription, system, admin_action)

## 🎯 Impact on Application

### Routes Affected (Already Removed):
- ❌ `/billing/*` - Removed
- ❌ `/admin/user-points` - Removed
- ❌ `/admin/topup-management` - Removed

### Components Affected (Already Updated):
- ✅ Navigation menus - Payment items removed
- ✅ User dashboard - Balance/points widgets removed
- ✅ Tool pages - Payment method selection removed
- ✅ Admin panels - Topup management removed

### API Endpoints Affected (Should be removed):
- `/api/billing/*`
- `/api/topup/*`
- `/api/user-points/*`

## 📝 Post-Migration Tasks

1. **Clear Application Cache**
```bash
# If using Redis
redis-cli FLUSHALL

# If using file cache
rm -rf storage/cache/*
```

2. **Restart Application Server**
```bash
pm2 restart dashboard
# or
npm run server
```

3. **Test Key Features**
- ✅ User login/registration
- ✅ Tool usage (without payment)
- ✅ Admin dashboard
- ✅ User management
- ✅ Analytics

4. **Monitor Logs**
```bash
tail -f logs/app.log
tail -f logs/error.log
```

## 🐛 Troubleshooting

### Error: "Unknown column 'balance'"
**Cause**: Application code still referencing removed columns  
**Fix**: Check and update code to remove balance/points references

### Error: "Table doesn't exist: topup_transactions"
**Cause**: Application code still querying removed tables  
**Fix**: Check and remove API endpoints/queries for payment features

### Error: "View user_dashboard_analytics invalid"
**Cause**: View might be cached  
**Fix**: 
```sql
DROP VIEW user_dashboard_analytics;
-- Then recreate from migration file
```

## 📞 Support

If issues occur:
1. Check application logs: `logs/app.log`
2. Check database logs: `mysql error log`
3. Verify migration was fully executed
4. Restore from backup if needed

## ✨ Related Files

- Migration: `database/migrations/014_remove_payment_topup_features.sql`
- Clean Schema: `database/migrations/SCHEMA_CLEAN.sql`
- Code Changes: See git commits for payment feature removal

---

**Migration Date**: December 16, 2025  
**Version**: 1.0.0  
**Status**: Ready for execution
