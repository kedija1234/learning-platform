import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_12345_local_testing_only';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generates a signed JWT authentication token
 * @param {Object} payload - User identification payload
 * @returns {string} Signed JWT string
 */
export function generateToken(payload) {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Registers a new user account
 */
export async function registerUser({ first_name, last_name, email, password, role = 'student' }) {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check if email is already registered
  const [existing] = await pool.query(
    'SELECT id FROM users WHERE email = ?',
    [normalizedEmail]
  );

  if (existing.length > 0) {
    const error = new Error('An account with this email address already exists');
    error.statusCode = 409;
    throw error;
  }

  // 2. Hash password with bcrypt
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // 3. Insert new user record
  const assignedRole = role || 'student';
  const [result] = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
     VALUES (?, ?, ?, ?, ?, TRUE)`,
    [first_name.trim(), last_name.trim(), normalizedEmail, passwordHash, assignedRole]
  );

  const newUserId = result.insertId;

  // 4. Construct user profile without sensitive password hash
  const user = {
    id: newUserId,
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    email: normalizedEmail,
    role: assignedRole,
    is_active: true,
  };

  // 5. Generate authentication token
  const token = generateToken(user);

  return { token, user };
}

/**
 * Authenticates user credentials and returns session token
 */
export async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Retrieve user from database
  const [rows] = await pool.query(
    `SELECT id, first_name, last_name, email, password_hash, role, is_active, created_at
     FROM users WHERE email = ?`,
    [normalizedEmail]
  );

  if (rows.length === 0) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const user = rows[0];

  // 2. Verify account is active
  if (!user.is_active) {
    const error = new Error('Your account has been deactivated. Please contact an administrator.');
    error.statusCode = 403;
    throw error;
  }

  // 3. Validate password with bcrypt
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // 4. Build user profile object (excluding password_hash)
  const userProfile = {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role,
    is_active: Boolean(user.is_active),
    created_at: user.created_at,
  };

  // 5. Generate token
  const token = generateToken(userProfile);

  return { token, user: userProfile };
}

/**
 * Retrieves user profile by ID
 */
export async function getUserById(id) {
  const [rows] = await pool.query(
    `SELECT id, first_name, last_name, email, role, is_active, created_at
     FROM users WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const user = rows[0];
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role,
    is_active: Boolean(user.is_active),
    created_at: user.created_at,
  };
}

export default {
  generateToken,
  registerUser,
  loginUser,
  getUserById,
};
