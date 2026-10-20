import { Router } from 'express';
import * as coursesController from './courses.controller.js';
import {
  courseValidator,
  resourceValidator,
  assignmentValidator,
  courseListQueryValidator,
  idParamValidator,
} from './courses.validation.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/courses
 * @desc    Browse courses with pagination and keyword search
 * @access  Private
 */
router.get(
  '/',
  authenticateToken,
  courseListQueryValidator,
  validateRequest,
  coursesController.getCourses
);

/**
 * @route   GET /api/courses/enrolled/me
 * @desc    Get courses enrolled by the authenticated student
 * @access  Private (student role)
 */
router.get(
  '/enrolled/me',
  authenticateToken,
  courseListQueryValidator,
  validateRequest,
  coursesController.getEnrolled
);

/**
 * @route   GET /api/courses/:id
 * @desc    Get course details, resources, assignments, and enrollment status
 * @access  Private
 */
router.get(
  '/:id',
  authenticateToken,
  idParamValidator('id'),
  validateRequest,
  coursesController.getCourse
);

/**
 * @route   POST /api/courses
 * @desc    Create a new course
 * @access  Private (mentor, admin)
 */
router.post(
  '/',
  authenticateToken,
  requireRole('mentor', 'admin'),
  courseValidator,
  validateRequest,
  coursesController.createCourse
);

/**
 * @route   PUT /api/courses/:id
 * @desc    Update course details
 * @access  Private (course owner or admin)
 */
router.put(
  '/:id',
  authenticateToken,
  requireRole('mentor', 'admin'),
  idParamValidator('id'),
  courseValidator,
  validateRequest,
  coursesController.updateCourse
);

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete course and cascaded dependencies
 * @access  Private (course owner or admin)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireRole('mentor', 'admin'),
  idParamValidator('id'),
  validateRequest,
  coursesController.deleteCourse
);

/**
 * @route   POST /api/courses/:id/enroll
 * @desc    Enroll authenticated student into a course
 * @access  Private (student only)
 */
router.post(
  '/:id/enroll',
  authenticateToken,
  requireRole('student'),
  idParamValidator('id'),
  validateRequest,
  coursesController.enroll
);

/**
 * @route   POST /api/courses/:id/resources
 * @desc    Add a resource to a course
 * @access  Private (course owner or admin)
 */
router.post(
  '/:id/resources',
  authenticateToken,
  requireRole('mentor', 'admin'),
  idParamValidator('id'),
  resourceValidator,
  validateRequest,
  coursesController.addResource
);

/**
 * @route   DELETE /api/courses/:id/resources/:resourceId
 * @desc    Remove a resource from a course
 * @access  Private (course owner or admin)
 */
router.delete(
  '/:id/resources/:resourceId',
  authenticateToken,
  requireRole('mentor', 'admin'),
  idParamValidator('id'),
  idParamValidator('resourceId'),
  validateRequest,
  coursesController.deleteResource
);

/**
 * @route   POST /api/courses/:id/assignments
 * @desc    Add an assignment to a course
 * @access  Private (course owner or admin)
 */
router.post(
  '/:id/assignments',
  authenticateToken,
  requireRole('mentor', 'admin'),
  idParamValidator('id'),
  assignmentValidator,
  validateRequest,
  coursesController.addAssignment
);

/**
 * @route   DELETE /api/courses/:id/assignments/:assignmentId
 * @desc    Remove an assignment from a course
 * @access  Private (course owner or admin)
 */
router.delete(
  '/:id/assignments/:assignmentId',
  authenticateToken,
  requireRole('mentor', 'admin'),
  idParamValidator('id'),
  idParamValidator('assignmentId'),
  validateRequest,
  coursesController.deleteAssignment
);

/**
 * @route   GET /api/courses/:id/students
 * @desc    Get enrolled students and their progress for a course
 * @access  Private (course owner or admin)
 */
router.get(
  '/:id/students',
  authenticateToken,
  requireRole('mentor', 'admin'),
  idParamValidator('id'),
  validateRequest,
  coursesController.getStudents
);

export default router;
