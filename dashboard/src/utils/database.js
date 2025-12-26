import { neon } from '@netlify/neon';
import { databaseConfig } from '../configs/database.config.js';

// Use the connection string from config or env
const connectionString = databaseConfig.url || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ No DATABASE_URL provided!');
}

const sql = neon(connectionString);

// Test database connection
export const testConnection = async () => {
  try {
    await sql`SELECT 1`;
    console.log('✅ Database connected successfully (Neon HTTP)');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

const convertQuery = (query) => {
  let paramCount = 1;
  let pgQuery = query.replace(/\?/g, () => `$${paramCount++}`);
  pgQuery = pgQuery.replace(/`/g, '"');
  return pgQuery;
};

// Execute query with error handling
export const executeQuery = async (query, params = []) => {
  try {
    // Intercept DESCRIBE/SHOW COLUMNS
    if (query.trim().toUpperCase().startsWith('DESCRIBE ') || query.trim().toUpperCase().startsWith('SHOW COLUMNS FROM ')) {
      const tableName = query.replace(/DESCRIBE\s+|SHOW\s+COLUMNS\s+FROM\s+/i, '').replace(/["`;]/g, '').trim();
      const rows = await sql`
            SELECT column_name as "Field", 
                   data_type as "Type", 
                   is_nullable as "Null", 
                   column_default as "Default" 
            FROM information_schema.columns 
            WHERE table_name = ${tableName}
        `;
      return { success: true, data: rows };
    }

    let pgQuery = convertQuery(query);
    const isInsert = pgQuery.trim().match(/^insert\s/i);

    if (isInsert && !pgQuery.toLowerCase().includes('returning')) {
      pgQuery += ' RETURNING id';
    }

    // Replace AUTO_INCREMENT with SERIAL logic (basic text replacement for CREATE TABLE)
    if (pgQuery.trim().toUpperCase().startsWith('CREATE TABLE')) {
      pgQuery = pgQuery.replace(/INT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/gi, 'SERIAL PRIMARY KEY');
      pgQuery = pgQuery.replace(/DATETIME/gi, 'TIMESTAMP');
      pgQuery = pgQuery.replace(/ENGINE=InnoDB.*$/gim, ''); // Remove MySQL engine options
      pgQuery = pgQuery.replace(/\sON\s+UPDATE\s+CURRENT_TIMESTAMP/gi, ''); // Remove MySQL automatic update trigger
      pgQuery = pgQuery.replace(/ENUM\s*\([^)]+\)/gi, 'VARCHAR(255)'); // Replace ENUM with VARCHAR

      // Remove INDEX lines from CREATE TABLE (Postgres doesn't support them inline easily)
      // We will need to create them separately if needed, or rely on primary key index
      // This regex attempts to remove "INDEX idx_name (col)" lines
      pgQuery = pgQuery.replace(/,\s*INDEX\s+\w+\s+\([^)]+\)/gi, '');
      pgQuery = pgQuery.replace(/,\s*UNIQUE\s+KEY\s+\w+\s+\([^)]+\)/gi, '');
      // Clean up trailing comma if any
      pgQuery = pgQuery.replace(/,\s*\)/g, ')');
    }

    // Also handle ENUM in ALTER TABLE
    if (pgQuery.trim().toUpperCase().startsWith('ALTER TABLE')) {
      pgQuery = pgQuery.replace(/ENUM\s*\([^)]+\)/gi, 'VARCHAR(255)');
      pgQuery = pgQuery.replace(/DATETIME/gi, 'TIMESTAMP');
      pgQuery = pgQuery.replace(/\sON\s+UPDATE\s+CURRENT_TIMESTAMP/gi, '');
    }

    const rows = await sql(pgQuery, params);
    rows.affectedRows = rows.length;
    if (isInsert && rows.length > 0) {
      rows.insertId = rows[0].id;
    }

    return { success: true, data: rows };
  } catch (error) {
    console.error('Database query error:', error);
    // console.error('Query was:', query); 
    return { success: false, error: error.message };
  }
};

export const getConnection = async () => {
  return {
    execute: async (query, params = []) => {
      const result = await executeQuery(query, params);
      if (result.success) return [result.data, []];
      throw new Error(result.error);
    },
    query: async (query, params = []) => {
      const result = await executeQuery(query, params);
      if (result.success) return { rows: result.data, rowCount: result.data.length };
      throw new Error(result.error);
    },
    release: () => { },
  };
};

export const closePool = async () => {
  console.log('Database pool closed (no-op for Neon HTTP)');
};

export default {
  query: async (q, p) => {
    const res = await executeQuery(q, p);
    if (!res.success) throw new Error(res.error);
    return { rows: res.data, rowCount: res.data.length };
  },
  execute: async (q, p) => {
    const res = await executeQuery(q, p);
    if (!res.success) throw new Error(res.error);
    return [res.data, []];
  },
  end: closePool
};
