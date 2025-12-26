import { executeQuery } from './src/utils/database.js';
import bcrypt from 'bcryptjs';

async function resetPassword() {
  const username = 'vohuunhan';
  const newPassword = 'admin123';
  
  console.log(`🔐 Resetting password for user: ${username}`);
  console.log(`New password: ${newPassword}\n`);
  
  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // Update the password
  const result = await executeQuery(
    'UPDATE users SET password_hash = ? WHERE username = ?',
    [hashedPassword, username]
  );
  
  if (result.success) {
    console.log('✅ Password updated successfully!');
    console.log(`\n📋 Login credentials:`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${newPassword}`);
  } else {
    console.log('❌ Failed to update password');
    console.error(result.error);
  }
  
  process.exit(0);
}

resetPassword().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
