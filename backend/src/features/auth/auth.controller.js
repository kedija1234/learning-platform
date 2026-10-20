import * as authService from './auth.service.js';

/**
 * Controller for user registration
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const { first_name, last_name, email, password, role } = req.body;
    const result = await authService.registerUser({
      first_name,
      last_name,
      email,
      password,
      role,
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for user login
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for fetching current authenticated user profile
 * GET /api/auth/me
 */
export async function getMe(req, res, next) {
  try {
    const user = await authService.getUserById(req.user.id);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export default {
  register,
  login,
  getMe,
};
