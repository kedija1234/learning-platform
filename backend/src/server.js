import app from './app.js';
import { testConnection } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

// Fail immediately if JWT_SECRET is missing
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
  console.error('\n[FATAL CONFIG ERROR] JWT_SECRET environment variable is missing.');
  console.error('Please configure JWT_SECRET in your .env file or environment before launching the server.\n');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify database connectivity before opening the HTTP port
    console.log('Testing database connection...');
    await testConnection();
    console.log('Database connected successfully.');
  } catch (error) {
    console.warn(`[WARNING] Database connection failed at startup: ${error.message}`);
    console.warn('The server will still start, but database-dependent endpoints will return errors.');
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} (http://localhost:${PORT})`);
    console.log(`Health check available at http://localhost:${PORT}/api/health`);
  });
}

startServer();
