import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASS || '';
  const database = process.env.DB_NAME || 'learning_platform';
  const isSSL = process.env.DB_SSL === 'true';

  console.log(`Connecting to MySQL server at ${host}:${port} as ${user}...`);

  // Step 1: Connect without selecting database to ensure database exists
  // For SSL connections like TiDB Cloud, rejectUnauthorized: false is standard
  const initialConnectionConfig = {
    host,
    port,
    user,
    password,
    ssl: isSSL ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true,
  };

  let connection;
  try {
    connection = await mysql.createConnection(initialConnectionConfig);

    // Create database if it does not already exist (never deletes existing database)
    console.log(`Ensuring database '${database}' exists...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );

    // Switch to target database
    await connection.query(`USE \`${database}\`;`);
    console.log(`Using database '${database}'.`);

    // Step 2: Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Applying schema (CREATE TABLE IF NOT EXISTS)...');
    await connection.query(schemaSql);

    console.log('Database initialized successfully. No existing data was dropped.');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initializeDatabase();
