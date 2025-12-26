import { executeQuery } from './src/utils/database.js';

async function fixStatusColumn() {
  try {
    // Update status column to include approved and rejected
    const result = await executeQuery(`
      ALTER TABLE topup_transactions 
      MODIFY COLUMN status ENUM('pending','approved','rejected','completed','cancelled','expired') 
      DEFAULT 'pending'
    `);
    
    console.log('Updated status column:', result);
    
    // Test approve transaction 5
    const approveResult = await executeQuery(`
      UPDATE topup_transactions 
      SET status = 'approved', updated_at = NOW(), completed_at = NOW() 
      WHERE id = 5
    `);
    
    console.log('Approved transaction 5:', approveResult);
    
    // Check the updated transaction
    const checkResult = await executeQuery('SELECT * FROM topup_transactions WHERE id = 5');
    console.log('Updated transaction:', checkResult.data[0]);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixStatusColumn();
