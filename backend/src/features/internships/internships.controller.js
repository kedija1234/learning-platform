import * as internshipsService from './internships.service.js';

/**
 * Controller to list all internships (supports search and pagination)
 * GET /api/internships
 */
export async function list(req, res, next) {
  try {
    const { page, limit, search } = req.query;
    const studentId = req.user?.role === 'student' ? req.user.id : null;

    const result = await internshipsService.listInternships({
      page,
      limit,
      search,
      studentId,
    });

    res.status(200).json({
      success: true,
      data: result.internships,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to retrieve single internship details
 * GET /api/internships/:id
 */
export async function getById(req, res, next) {
  try {
    const studentId = req.user?.role === 'student' ? req.user.id : null;
    const internship = await internshipsService.getInternshipById(req.params.id, studentId);

    res.status(200).json({
      success: true,
      data: { internship },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for coordinators to create a new internship posting
 * POST /api/internships
 */
export async function create(req, res, next) {
  try {
    const internship = await internshipsService.createInternship(
      req.user.id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Internship posting created successfully',
      data: { internship },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for coordinators to update an internship posting
 * PUT /api/internships/:id
 */
export async function update(req, res, next) {
  try {
    const internship = await internshipsService.updateInternship(
      req.params.id,
      req.user.id,
      req.user.role,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Internship updated successfully',
      data: { internship },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for coordinators to delete an internship posting
 * DELETE /api/internships/:id
 */
export async function remove(req, res, next) {
  try {
    const result = await internshipsService.deleteInternship(
      req.params.id,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for students to apply for an internship
 * POST /api/internships/:id/apply
 */
export async function apply(req, res, next) {
  try {
    const application = await internshipsService.applyToInternship(
      req.params.id,
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: { application },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for students to view their application history
 * GET /api/internships/applications/me
 */
export async function getMyApplications(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await internshipsService.getStudentApplications(
      req.user.id,
      { page, limit }
    );

    res.status(200).json({
      success: true,
      data: result.applications,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for coordinators to view all applications for an internship
 * GET /api/internships/:id/applications
 */
export async function getApplications(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const result = await internshipsService.getInternshipApplications(
      req.params.id,
      req.user.id,
      req.user.role,
      { page, limit, status }
    );

    res.status(200).json({
      success: true,
      data: result.applications,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for coordinators to accept or reject an application
 * PUT /api/internships/:id/applications/:applicationId/status
 */
export async function updateStatus(req, res, next) {
  try {
    const application = await internshipsService.updateApplicationStatus(
      req.params.id,
      req.params.applicationId,
      req.user.id,
      req.user.role,
      req.body
    );

    res.status(200).json({
      success: true,
      message: `Application ${application.status} successfully`,
      data: { application },
    });
  } catch (error) {
    next(error);
  }
}

export default {
  list,
  getById,
  create,
  update,
  remove,
  apply,
  getMyApplications,
  getApplications,
  updateStatus,
};
