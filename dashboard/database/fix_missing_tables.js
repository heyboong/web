import { executeQuery, testConnection } from '../src/utils/database.js';

const fixMissingTables = async () => {
  console.log('🔄 Checking database connection...');
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Could not connect to database');
    return;
  }

  // 1. Ensure login_history table
  console.log('🔧 Ensuring login_history table structure...');
  const createLoginHistorySQL = `
    CREATE TABLE IF NOT EXISTS login_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      ip_address VARCHAR(45) NOT NULL,
      user_agent TEXT,
      device_type VARCHAR(50),
      browser VARCHAR(100),
      os VARCHAR(100),
      location VARCHAR(255),
      is_successful BOOLEAN DEFAULT TRUE,
      session_token VARCHAR(500),
      is_active BOOLEAN DEFAULT TRUE,
      logged_out_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_ip_address (ip_address),
      INDEX idx_is_active (is_active),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  const result1 = await executeQuery(createLoginHistorySQL);
  if (result1.success) {
      console.log('✅ login_history table ensured');
  } else {
      console.error('❌ Failed to ensure login_history table:', result1.error);
  }

  // 2. Ensure activities table
  console.log('🔧 Ensuring activities table structure...');
  const createActivitiesSQL = `
    CREATE TABLE IF NOT EXISTS activities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      username VARCHAR(255),
      type VARCHAR(50),
      action VARCHAR(255),
      description TEXT,
      metadata TEXT,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_type (type),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  const result2 = await executeQuery(createActivitiesSQL);
  if (result2.success) {
      console.log('✅ activities table ensured');
  } else {
      console.error('❌ Failed to ensure activities table:', result2.error);
  }

  process.exit();
};

fixMissingTables();
