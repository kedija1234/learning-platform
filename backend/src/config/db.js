import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Construct database connection configuration
// Compatible with both local MySQL and TiDB Cloud Serverless
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'learning_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// If DB_SSL is 'true', configure SSL options required by TiDB Cloud and cloud MySQL providers
if (process.env.DB_SSL === 'true') {
  dbConfig.ssl = {
    // Allows connecting to TiDB Cloud using system CA certificates
    rejectUnauthorized: false,
  };
}

export const pool = mysql.createPool(dbConfig);

/**
 * Tests connection to the database
 * @returns {Promise<boolean>} true if connection succeeds, throws if fails
 */
export async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
}

export default pool;
