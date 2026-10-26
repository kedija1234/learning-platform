import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import pool from '../src/config/db.js';

dotenv.config();

async function createAdmin() {
  console.log('\n======================================================');
  console.log('  UniLink Platform — Admin Provisioning Script');
  console.log('======================================================\n');

  if (process.env.DB_SSL === 'true') {
    console.log('[INFO] Connecting to secure live database (DB_SSL=true, TLS enabled).\n');
  } else {
    console.log('[INFO] Connecting to local database (DB_SSL=false/unset).\n');
  }

  let email = process.env.ADMIN_EMAIL || process.env.FIRST_ADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD || process.env.FIRST_ADMIN_PASSWORD;
  let firstName = process.env.ADMIN_FIRST_NAME || 'System';
  let lastName = process.env.ADMIN_LAST_NAME || 'Administrator';

  let rl;
  // If either email or password is not provided via environment variables, prompt interactively
  if (!email || !password) {
    rl = readline.createInterface({ input, output });

    if (!email) {
      email = await rl.question('Enter Admin Email Address: ');
    }

    if (!process.env.ADMIN_FIRST_NAME) {
      const fnInput = await rl.question('Enter First Name [System]: ');
      if (fnInput.trim()) firstName = fnInput.trim();
    }

    if (!process.env.ADMIN_LAST_NAME) {
      const lnInput = await rl.question('Enter Last Name [Administrator]: ');
      if (lnInput.trim()) lastName = lnInput.trim();
    }

    if (!password) {
      password = await rl.question('Enter Admin Password (min 12 characters): ');
    }

    rl.close();
  }

  email = (email || '').trim().toLowerCase();
  password = (password || '').trim();

  // Validation: Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    console.error('\n[VALIDATION ERROR] Invalid email address format: "' + email + '"\n');
    await pool.end();
    process.exit(1);
  }

  // Validation: Password length must be at least 12 characters
  if (!password || password.length < 12) {
    console.error('\n[SECURITY ERROR] Password rejected: Password must be at least 12 characters long.\n');
    await pool.end();
    process.exit(1);
  }

  try {
    // Check if user already exists
    const [existing] = await pool.query(
      'SELECT id, email, role, is_active FROM users WHERE email = ?',
      [email]
    );

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    if (existing.length > 0) {
      const existingUser = existing[0];
      console.log(`\nUser with email "${email}" already exists (Role: ${existingUser.role}, ID: ${existingUser.id}).`);
      console.log('Promoting to administrator, updating password, and ensuring account is active...');

      await pool.query(
        `UPDATE users
         SET role = 'admin',
             password_hash = ?,
             is_active = TRUE,
             first_name = ?,
             last_name = ?
         WHERE id = ?`,
        [passwordHash, firstName, lastName, existingUser.id]
      );

      console.log(`\n[SUCCESS] Successfully updated account ID ${existingUser.id} (${email}) to active Admin.`);
    } else {
      const [result] = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
         VALUES (?, ?, ?, ?, 'admin', TRUE)`,
        [firstName, lastName, email, passwordHash]
      );

      console.log(`\n[SUCCESS] Successfully created initial Admin account (ID: ${result.insertId}, Email: ${email}).`);
    }

    console.log('[SECURITY NOTE] Admin credentials should never be committed to git or shared publicly.\n');
  } catch (err) {
    console.error('\n[DATABASE ERROR] Failed to create admin account:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

createAdmin();
