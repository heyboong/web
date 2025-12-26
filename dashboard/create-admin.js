import { executeQuery, closePool } from './src/utils/database.js';
import { hashPassword } from './src/utils/auth.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => {
  return new Promise(resolve => rl.question(query, resolve));
};

const createAdmin = async () => {
  try {
    console.log('\n🔐 === CREATE ADMIN USER === 🔐\n');

    const username = await askQuestion('Enter username (default: admin): ') || 'admin';
    const email = await askQuestion('Enter email (default: admin@example.com): ') || 'admin@example.com';
    const password = await askQuestion('Enter password (default: Admin123!): ') || 'Admin123!';

    console.log('\n⏳ Creating admin user...');

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user
    // Using ON CONFLICT (username) DO UPDATE to handle existing user (PostgreSQL syntax handled by converter or native)
    // Note: Our convertQuery helper handles basic MySQL to Postgres conversion.
    // For safety, let's check existence first.

    const existingUser = await executeQuery('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    
    if (existingUser.success && existingUser.data.length > 0) {
      console.log('⚠️  User already exists. Updating to admin...');
      const userId = existingUser.data[0].id;
      
      const updateResult = await executeQuery(
        'UPDATE users SET password_hash = ?, is_admin = true, admin = true, email_verified = true WHERE id = ?',
        [hashedPassword, userId]
      );

      if (updateResult.success) {
        console.log(`✅ User '${username}' updated to admin successfully!`);
      } else {
        console.error('❌ Failed to update user:', updateResult.error);
      }
    } else {
      const insertResult = await executeQuery(
        `INSERT INTO users (
          username, email, password_hash, is_admin, admin, email_verified, is_active
        ) VALUES (?, ?, ?, true, true, true, true)`,
        [username, email, hashedPassword]
      );

      if (insertResult.success) {
        console.log(`✅ Admin user '${username}' created successfully!`);
      } else {
        console.error('❌ Failed to create admin user:', insertResult.error);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  } finally {
    rl.close();
    await closePool();
    process.exit(0);
  }
};

createAdmin();
