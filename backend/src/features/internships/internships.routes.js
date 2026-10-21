import { Router } from 'express';
import * as internshipsController from './internships.controller.js';
import {
  createInternshipValidator,
  updateInternshipValidator,
  listInternshipsQueryValidator,
  updateApplicationStatusValidator,
  idParamValidator,
} from './internships.validation.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/internships
 * @desc    Browse internship listings with pagination and search
 * @access  Private
 */
router.get(
  '/',
  authenticateToken,
  listInternshipsQueryValidator,
  validateRequest,
  internshipsController.list
);

/**
 * @route   GET /api/internships/applications/me
 * @desc    Get all internship applications submitted by the logged-in student
 * @access  Private (student role only)
 * Note: Must be defined before /:id to avoid matching "applications" as an ID param
 */
router.get(
  '/applications/me',
  authenticateToken,
  requireRole('student'),
  listInternshipsQueryValidator,
  validateRequest,
  internshipsController.getMyApplications
);

/**
 * @route   POST /api/internships
 * @desc    Create a new internship posting
 * @access  Private (coordinator or admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireRole('coordinator', 'admin'),
  createInternshipValidator,
  validateRequest,
  internshipsController.create
);

/**
 * @route   GET /api/internships/:id
 * @desc    Get single internship details (includes student application status if student)
 * @access  Private
 */
router.get(
  '/:id',
  authenticateToken,
  idParamValidator('id'),
  validateRequest,
  internshipsController.getById
);

/**
 * @route   PUT /api/internships/:id
 * @desc    Update internship details
 * @access  Private (owning coordinator or admin only)
 */
router.put(
  '/:id',
  authenticateToken,
  requireRole('coordinator', 'admin'),
  idParamValidator('id'),
  updateInternshipValidator,
  validateRequest,
  internshipsController.update
);

/**
 * @route   DELETE /api/internships/:id
 * @desc    Delete an internship posting
 * @access  Private (owning coordinator or admin only)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireRole('coordinator', 'admin'),
  idParamValidator('id'),
  validateRequest,
  internshipsController.remove
);

/**
 * @route   POST /api/internships/:id/apply
 * @desc    Submit an application for an internship
 * @access  Private (student only)
 */
router.post(
  '/:id/apply',
  authenticateToken,
  requireRole('student'),
  idParamValidator('id'),
  validateRequest,
  internshipsController.apply
);

/**
 * @route   GET /api/internships/:id/applications
 * @desc    View all student applicants for an internship
 * @access  Private (owning coordinator or admin only)
 */
router.get(
  '/:id/applications',
  authenticateToken,
  requireRole('coordinator', 'admin'),
  idParamValidator('id'),
  validateRequest,
  internshipsController.getApplications
);

/**
 * @route   PUT /api/internships/:id/applications/:applicationId/status
 * @desc    Accept or reject a student application with notification
 * @access  Private (owning coordinator or admin only)
 */
router.put(
  '/:id/applications/:applicationId/status',
  authenticateToken,
  requireRole('coordinator', 'admin'),
  idParamValidator('id'),
  idParamValidator('applicationId'),
  updateApplicationStatusValidator,
  validateRequest,
  internshipsController.updateStatus
);

export default router;
