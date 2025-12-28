import { executeQuery } from './src/utils/database.js';
import { hashPassword } from './src/utils/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const resetAdmin = async () => {
  try {
    console.log('🔄 Starting admin reset process...');

    const adminUsername = 'admin';
    const adminPassword = 'Admin@123'; // Đặt mật khẩu đủ mạnh để pass validatePassword
    const adminEmail = 'admin@example.com';

    // 1. Kiểm tra xem user admin đã tồn tại chưa
    const checkUser = await executeQuery(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [adminUsername, adminEmail]
    );

    if (checkUser.success && checkUser.data.length > 0) {
      console.log('⚠️ Admin user already exists. Updating password...');
      
      const hashedPassword = await hashPassword(adminPassword);
      
      // Cập nhật mật khẩu và đảm bảo quyền admin (sử dụng cột is_admin thay vì role)
      const updateResult = await executeQuery(
        `UPDATE users 
         SET password = ?, is_admin = TRUE, is_active = TRUE 
         WHERE username = ? OR email = ?`,
        [hashedPassword, adminUsername, adminEmail]
      );

      if (updateResult.success) {
        console.log('✅ Admin password updated successfully!');
      } else {
        console.error('❌ Failed to update admin password:', updateResult.error);
      }

    } else {
      console.log('🆕 Creating new admin user...');
      
      const hashedPassword = await hashPassword(adminPassword);
      
      const insertResult = await executeQuery(
        `INSERT INTO users (username, email, password, is_admin, is_active, balance, created_at) 
         VALUES (?, ?, ?, TRUE, TRUE, 999999, NOW())`,
        [adminUsername, adminEmail, hashedPassword]
      );

      if (insertResult.success) {
        console.log('✅ Admin user created successfully!');
      } else {
        console.error('❌ Failed to create admin user:', insertResult.error);
      }
    }

    console.log('------------------------------------------------');
    console.log('👤 Username:', adminUsername);
    console.log('🔑 Password:', adminPassword);
    console.log('------------------------------------------------');

  } catch (error) {
    console.error('❌ Error resetting admin:', error);
  }
};

resetAdmin();
