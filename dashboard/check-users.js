import { executeQuery } from './src/utils/database.js';
import bcrypt from 'bcryptjs';

async function checkUsers() {
  console.log('📋 Checking users in database...\n');
  
  // Get all users
  const result = await executeQuery('SELECT id, username, email, is_admin, is_active, created_at FROM users');
  
  if (result.success && result.data.length > 0) {
    console.log(`Found ${result.data.length} users:\n`);
    result.data.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Username: ${user.username}`);
      console.log(`Email: ${user.email || 'N/A'}`);
      console.log(`Is Admin: ${user.is_admin ? 'Yes' : 'No'}`);
      console.log(`Is Active: ${user.is_active ? 'Yes' : 'No'}`);
      console.log(`Created: ${user.created_at}`);
      console.log('---');
    });
    
    // Create admin user if not exists
    console.log('\n🔐 Creating admin user with password: admin123\n');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const insertResult = await executeQuery(
      `INSERT INTO users (username, email, password_hash, is_admin, is_active) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       password_hash = VALUES(password_hash),
       is_admin = VALUES(is_admin)`,
      ['admin', 'admin@example.com', hashedPassword, 1, 1]
    );
    
    if (insertResult.success) {
      console.log('✅ Admin user created/updated successfully!');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('❌ Failed to create admin user');
    }
    
  } else {
    console.log('No users found in database');
  }
  
  process.exit(0);
}

checkUsers().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
