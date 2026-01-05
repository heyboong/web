import { executeQuery } from './src/utils/database.js';
import dotenv from 'dotenv';

dotenv.config();

const inspectTable = async () => {
  try {
    console.log('🔍 Inspecting users table structure...');
    
    // Query to get column information for PostgreSQL
    const result = await executeQuery(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);

    if (result.success) {
      console.log('✅ Columns in users table:');
      console.table(result.data);
    } else {
      console.error('❌ Failed to get table info:', result.error);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
};

inspectTable();
