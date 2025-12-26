import { executeQuery } from './src/utils/database.js';

console.log('🔍 Checking user password hash...');
const result = await executeQuery('SELECT id, username, email, password_hash FROM users WHERE username = "vohuunhan"');
if (result.success && result.data.length > 0) {
  const user = result.data[0];
  console.log('User found:');
  console.log('ID:', user.id);
  console.log('Username:', user.username);
  console.log('Email:', user.email);
  console.log('Password hash:', user.password_hash);
} else {
  console.log('User not found');
}

