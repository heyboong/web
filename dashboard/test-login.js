import { executeQuery } from './src/utils/database.js';
import { hashPassword, comparePassword } from './src/utils/auth.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const testLogin = async () => {
  try {
    console.log('🧪 Testing Login Process...');
    const username = 'admin';
    const password = 'Admin@123';

    // 1. Fetch user from DB
    console.log(`🔍 Searching for user: ${username}`);
    const result = await executeQuery(
      'SELECT id, username, email, password, is_active, is_admin FROM users WHERE username = ?',
      [username]
    );

    if (!result.success || result.data.length === 0) {
      console.error('❌ User not found in database!');
      return;
    }

    const user = result.data[0];
    console.log('✅ User found:', { 
      id: user.id, 
      username: user.username, 
      is_active: user.is_active,
      has_password: !!user.password 
    });

    // 2. Check password
    console.log('🔐 Verifying password...');
    console.log('   Input password:', password);
    console.log('   Stored hash:', user.password);

    const isValid = await bcrypt.compare(password, user.password);

    if (isValid) {
      console.log('✅ Password Match! Login should be successful.');
    } else {
      console.error('❌ Password Mismatch!');
      
      // Debugging: Try hashing the input password to compare format
      const newHash = await bcrypt.hash(password, 12);
      console.log('   New hash of input:', newHash);
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  }
};

testLogin();
