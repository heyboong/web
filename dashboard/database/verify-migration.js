import { executeQuery } from '../src/utils/database.js';

const verifyMigration = async () => {
  try {
    console.log('🔍 Verifying database migration...\n');
    
    // 1. Check if topup_transactions table exists
    console.log('1️⃣ Checking removed tables...');
    const tables = await executeQuery("SHOW TABLES LIKE '%topup%'");
    if (tables.data.length === 0) {
      console.log('   ✅ topup_transactions table removed');
    } else {
      console.log('   ❌ topup_transactions table still exists');
    }
    
    const pointsTables = await executeQuery("SHOW TABLES LIKE '%points%'");
    if (pointsTables.data.length === 0) {
      console.log('   ✅ user_points_transactions table removed');
    } else {
      console.log('   ❌ user_points_transactions table still exists');
    }
    
    const balanceTables = await executeQuery("SHOW TABLES LIKE '%balance%'");
    if (balanceTables.data.length === 0) {
      console.log('   ✅ user_balance_transactions table removed');
    } else {
      console.log('   ❌ user_balance_transactions table still exists');
    }
    
    // 2. Check users table structure
    console.log('\n2️⃣ Checking users table columns...');
    const usersColumns = await executeQuery("DESCRIBE users");
    const userCols = usersColumns.data.map(c => c.Field);
    
    if (!userCols.includes('balance')) {
      console.log('   ✅ users.balance column removed');
    } else {
      console.log('   ❌ users.balance column still exists');
    }
    
    if (!userCols.includes('points')) {
      console.log('   ✅ users.points column removed');
    } else {
      console.log('   ❌ users.points column still exists');
    }
    
    // 3. Check tools table structure
    console.log('\n3️⃣ Checking tools table columns...');
    const toolsColumns = await executeQuery("DESCRIBE tools");
    const toolCols = toolsColumns.data.map(c => c.Field);
    
    if (!toolCols.includes('price')) {
      console.log('   ✅ tools.price column removed');
    } else {
      console.log('   ❌ tools.price column still exists');
    }
    
    if (!toolCols.includes('points_cost')) {
      console.log('   ✅ tools.points_cost column removed');
    } else {
      console.log('   ❌ tools.points_cost column still exists');
    }
    
    // 4. Check transaction history types
    console.log('\n4️⃣ Checking transaction history...');
    
    // Check if table exists first
    const checkTableResult = await executeQuery(
      "SHOW TABLES LIKE 'transaction_history'"
    );
    
    if (checkTableResult.data.length === 0) {
      console.log('   ✅ transaction_history table removed');
    } else {
      const txTypes = await executeQuery("SELECT DISTINCT type FROM transaction_history");
      const types = txTypes.data.map(t => t.type);
      
      const removedTypes = ['topup', 'payment', 'refund', 'points_purchase', 'points_bonus'];
      const hasRemovedTypes = removedTypes.some(t => types.includes(t));
      
      if (!hasRemovedTypes) {
        console.log('   ✅ Payment/topup transaction types cleaned');
        console.log('   📊 Current types:', types.join(', '));
      } else {
        console.log('   ❌ Payment/topup transaction types still exist');
        console.log('   📊 Found types:', types.join(', '));
      }
    }
    
    // 5. Check migration status
    console.log('\n5️⃣ Checking migration status...');
    const migrationStatus = await executeQuery(
      "SELECT setting_value FROM site_settings WHERE setting_key = 'payment_features_removed'"
    );
    
    if (migrationStatus.data.length > 0 && migrationStatus.data[0].setting_value === 'true') {
      console.log('   ✅ Migration tracked in site_settings');
    } else {
      console.log('   ❌ Migration not tracked');
    }
    
    // 6. Check view structure
    console.log('\n6️⃣ Checking user_dashboard_analytics view...');
    try {
      const viewData = await executeQuery("SELECT * FROM user_dashboard_analytics LIMIT 1");
      const viewCols = Object.keys(viewData.data[0] || {});
      
      if (!viewCols.includes('balance') && !viewCols.includes('points')) {
        console.log('   ✅ View updated (balance/points removed)');
        console.log('   📊 View columns:', viewCols.join(', '));
      } else {
        console.log('   ❌ View still has balance/points columns');
      }
    } catch (err) {
      console.log('   ⚠️  View check skipped:', err.message);
    }
    
    console.log('\n🎉 Migration verification completed!\n');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
  
  process.exit(0);
};

verifyMigration();
