import { executeQuery, testConnection } from './src/utils/database.js';
import { hashPassword } from './src/utils/auth.js';

const checkAdmin = async () => {
  console.log('🔄 Checking database connection...');
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Could not connect to database');
    return;
  }

  console.log('🔄 Checking admin user...');
  const result = await executeQuery('SELECT * FROM users WHERE username = ?', ['admin']);
  
  if (result.success && result.data.length > 0) {
    console.log('✅ Admin user exists:', result.data[0].username);
    console.log('🔑 Password hash:', result.data[0].password_hash);
  } else {
    console.log('⚠️ Admin user does not exist. Creating one...');
    
    // Create admin user
    const passwordHash = await hashPassword('admin123'); // Default password
    const insertResult = await executeQuery(`
      INSERT INTO users (username, email, password_hash, is_admin, is_active, first_name, last_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['admin', 'admin@example.com', passwordHash, true, true, 'Admin', 'User']);
    
    if (insertResult.success) {
      console.log('✅ Admin user created successfully.');
      console.log('👤 Username: admin');
      console.log('🔑 Password: admin123');
    } else {
      console.error('❌ Failed to create admin user:', insertResult.error);
    }
  }

  // Check login_history table
  console.log('🔄 Checking login_history table...');
  const historyCheck = await executeQuery('SELECT 1 FROM login_history LIMIT 1');
  if (!historyCheck.success) {
      console.log('⚠️ login_history table might be missing:', historyCheck.error);
  } else {
      console.log('✅ login_history table exists');
  }

  // Check activities table
  console.log('🔄 Checking activities table...');
  const activitiesCheck = await executeQuery('SELECT 1 FROM activities LIMIT 1');
  if (!activitiesCheck.success) {
      console.log('⚠️ activities table might be missing:', activitiesCheck.error);
  } else {
      console.log('✅ activities table exists');
  }

  process.exit();
};

checkAdmin();
