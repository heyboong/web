import mysql from 'mysql2/promise';
import { databaseConfig } from '../configs/database.config.js';

// Create connection pool
const pool = mysql.createPool(databaseConfig);

// Test database connection
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    console.log(`📊 Connected to database: ${databaseConfig.database}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Execute query with error handling
export const executeQuery = async (query, params = []) => {
  try {
    const [results] = await pool.execute(query, params);
    return { success: true, data: results };
  } catch (error) {
    console.error('Database query error:', error);
    return { success: false, error: error.message };
  }
};

// Get a single connection for transactions
export const getConnection = async () => {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('Failed to get database connection:', error);
    throw error;
  }
};

// Close all connections (useful for graceful shutdown)
export const closePool = async () => {
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
};

export default pool;
