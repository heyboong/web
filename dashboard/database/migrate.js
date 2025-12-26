import { executeQuery } from '../src/utils/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigrations = async () => {
  try {
    console.log('🔄 Starting database migrations...');
    
    // Check if admin column already exists
    const checkColumnResult = await executeQuery(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'admin'"
    );
    
    if (checkColumnResult.success && checkColumnResult.data.length === 0) {
      console.log('🔧 Adding admin column to users table...');
      const adminColumnResult = await executeQuery('ALTER TABLE users ADD COLUMN admin BOOLEAN DEFAULT FALSE');
      
      if (adminColumnResult.success) {
        console.log('✅ Admin column added successfully');
      } else {
        console.error('❌ Failed to add admin column:', adminColumnResult.error);
        return false;
      }
    } else {
      console.log('✅ Admin column already exists');
    }
    
    // Run payment/topup removal migration
    console.log('🧹 Checking for payment/topup cleanup...');
    
    // Check if migration has already been run
    const checkMigrationResult = await executeQuery(
      "SELECT value FROM site_settings WHERE `key` = 'payment_features_removed'"
    );
    
    if (checkMigrationResult.success && checkMigrationResult.data.length === 0) {
      console.log('🔧 Running payment/topup removal migration...');
      
      // Read and execute migration file
      const migrationPath = path.join(__dirname, 'migrations', '014_remove_payment_topup_features.sql');
      
      if (fs.existsSync(migrationPath)) {
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = migrationSQL
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
          try {
            await executeQuery(statement);
          } catch (err) {
            // Ignore errors for DROP IF EXISTS statements
            if (!statement.includes('DROP') && !statement.includes('DELETE')) {
              console.warn('⚠️  Warning during migration:', err.message);
            }
          }
        }
        
        console.log('✅ Payment/topup features removed from database');
      } else {
        console.log('⚠️  Migration file not found, skipping...');
      }
    } else {
      console.log('✅ Payment/topup cleanup already completed');
    }
    
    // Run history tables removal migration
    console.log('🧹 Checking for history tables cleanup...');
    
    // Check if migration has already been run
    const checkHistoryMigrationResult = await executeQuery(
      "SELECT value FROM site_settings WHERE `key` = 'history_tables_removed'"
    );
    
    if (checkHistoryMigrationResult.success && checkHistoryMigrationResult.data.length === 0) {
      console.log('🔧 Running history tables removal migration...');
      
      // Read and execute migration file
      const historyMigrationPath = path.join(__dirname, 'migrations', '015_remove_history_tables.sql');
      
      if (fs.existsSync(historyMigrationPath)) {
        const migrationSQL = fs.readFileSync(historyMigrationPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = migrationSQL
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
          try {
            await executeQuery(statement);
          } catch (err) {
            // Ignore errors for DROP IF EXISTS statements
            if (!statement.includes('DROP') && !statement.includes('DELETE')) {
              console.warn('⚠️  Warning during migration:', err.message);
            }
          }
        }
        
        console.log('✅ History tables removed from database');
      } else {
        console.log('⚠️  History migration file not found, skipping...');
      }
    } else {
      console.log('✅ History tables cleanup already completed');
    }
    
    console.log('🎉 All migrations completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
};

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

export default runMigrations;
