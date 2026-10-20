import * as submissionsService from './submissions.service.js';

/**
 * Controller for students submitting assignment work
 * POST /api/assignments/:assignmentId/submissions
 */
export async function submit(req, res, next) {
  try {
    const submission = await submissionsService.submitAssignment(
      req.params.assignmentId,
      req.user.id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Work submitted successfully',
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for student to view their own submission for a specific assignment
 * GET /api/assignments/:assignmentId/submissions/me
 */
export async function getMySubmissionForAssignment(req, res, next) {
  try {
    const submission = await submissionsService.getStudentSubmissionForAssignment(
      req.params.assignmentId,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for course mentors to view all submissions for an assignment
 * GET /api/assignments/:assignmentId/submissions
 */
export async function getAssignmentSubmissions(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await submissionsService.getAssignmentSubmissions(
      req.params.assignmentId,
      req.user.id,
      req.user.role,
      { page, limit }
    );

    res.status(200).json({
      success: true,
      data: result.submissions,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for student to view all their submissions across courses
 * GET /api/submissions/me
 */
export async function getMySubmissions(req, res, next) {
  try {
    const { page, limit, courseId } = req.query;
    const result = await submissionsService.getStudentSubmissions(
      req.user.id,
      { page, limit, courseId }
    );

    res.status(200).json({
      success: true,
      data: result.submissions,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for viewing a specific submission
 * GET /api/submissions/:id
 */
export async function getSubmission(req, res, next) {
  try {
    const submission = await submissionsService.getSubmissionById(
      req.params.id,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for mentors to grade a student submission
 * PUT /api/submissions/:id/grade
 */
export async function grade(req, res, next) {
  try {
    const submission = await submissionsService.gradeSubmission(
      req.params.id,
      req.user.id,
      req.user.role,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Submission graded successfully',
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
}

export default {
  submit,
  getMySubmissionForAssignment,
  getAssignmentSubmissions,
  getMySubmissions,
  getSubmission,
  grade,
};
