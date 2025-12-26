import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'read1',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  multipleStatements: true
};

export const apiConfig = {
  port: parseInt(process.env.API_PORT) || 2324,
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_key',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  uploadPath: './uploads',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

export default { databaseConfig, apiConfig };
