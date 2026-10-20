import { Router } from 'express';
import * as submissionsController from './submissions.controller.js';
import {
  submitWorkValidator,
  gradeSubmissionValidator,
  submissionQueryValidator,
  idParamValidator,
} from './submissions.validation.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

// Router for /api/submissions
export const submissionsRouter = Router();

/**
 * @route   GET /api/submissions/me
 * @desc    View all submissions and grades for the authenticated student
 * @access  Private (student only)
 */
submissionsRouter.get(
  '/me',
  authenticateToken,
  requireRole('student'),
  submissionQueryValidator,
  validateRequest,
  submissionsController.getMySubmissions
);

/**
 * @route   GET /api/submissions/:id
 * @desc    View single submission details (student who submitted, course mentor, or admin)
 * @access  Private
 */
submissionsRouter.get(
  '/:id',
  authenticateToken,
  idParamValidator('id'),
  validateRequest,
  submissionsController.getSubmission
);

/**
 * @route   PUT /api/submissions/:id/grade
 * @desc    Grade a submission and provide feedback
 * @access  Private (course mentor, admin)
 */
submissionsRouter.put(
  '/:id/grade',
  authenticateToken,
  requireRole('mentor', 'admin'),
  idParamValidator('id'),
  gradeSubmissionValidator,
  validateRequest,
  submissionsController.grade
);

// Router for /api/assignments (assignment-specific submission endpoints)
export const assignmentSubmissionsRouter = Router();

/**
 * @route   POST /api/assignments/:assignmentId/submissions
 * @desc    Submit coursework for an assignment
 * @access  Private (enrolled student only)
 */
assignmentSubmissionsRouter.post(
  '/:assignmentId/submissions',
  authenticateToken,
  requireRole('student'),
  idParamValidator('assignmentId'),
  submitWorkValidator,
  validateRequest,
  submissionsController.submit
);

/**
 * @route   GET /api/assignments/:assignmentId/submissions/me
 * @desc    Get the authenticated student's submission for an assignment
 * @access  Private (student only)
 */
assignmentSubmissionsRouter.get(
  '/:assignmentId/submissions/me',
  authenticateToken,
  requireRole('student'),
  idParamValidator('assignmentId'),
  validateRequest,
  submissionsController.getMySubmissionForAssignment
);

/**
 * @route   GET /api/assignments/:assignmentId/submissions
 * @desc    Get all student submissions for an assignment
 * @access  Private (course mentor, admin)
 */
assignmentSubmissionsRouter.get(
  '/:assignmentId/submissions',
  authenticateToken,
  requireRole('mentor', 'admin'),
  idParamValidator('assignmentId'),
  submissionQueryValidator,
  validateRequest,
  submissionsController.getAssignmentSubmissions
);

export default {
  submissionsRouter,
  assignmentSubmissionsRouter,
};
