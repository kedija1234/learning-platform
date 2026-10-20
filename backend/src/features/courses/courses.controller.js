import * as coursesService from './courses.service.js';

/**
 * Controller to list courses with pagination and keyword search
 * GET /api/courses
 */
export async function getCourses(req, res, next) {
  try {
    const { page, limit, search, mentorId } = req.query;
    const result = await coursesService.listCourses({
      page,
      limit,
      search,
      mentorId,
    });

    res.status(200).json({
      success: true,
      data: result.courses,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to retrieve single course details, resources, and assignments
 * GET /api/courses/:id
 */
export async function getCourse(req, res, next) {
  try {
    const currentUserId = req.user ? req.user.id : null;
    const course = await coursesService.getCourseById(req.params.id, currentUserId);

    res.status(200).json({
      success: true,
      data: { course },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for creating a course (mentor/admin only)
 * POST /api/courses
 */
export async function createCourse(req, res, next) {
  try {
    const { title, description } = req.body;
    const course = await coursesService.createCourse({
      mentor_id: req.user.id,
      title,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to update a course
 * PUT /api/courses/:id
 */
export async function updateCourse(req, res, next) {
  try {
    const course = await coursesService.updateCourse(
      req.params.id,
      req.user.id,
      req.user.role,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to delete a course
 * DELETE /api/courses/:id
 */
export async function deleteCourse(req, res, next) {
  try {
    const result = await coursesService.deleteCourse(
      req.params.id,
      req.user.id,
      req.user.role
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to add a resource to a course
 * POST /api/courses/:id/resources
 */
export async function addResource(req, res, next) {
  try {
    const resource = await coursesService.addResource(
      req.params.id,
      req.user.id,
      req.user.role,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Resource added successfully',
      data: { resource },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to remove a resource from a course
 * DELETE /api/courses/:id/resources/:resourceId
 */
export async function deleteResource(req, res, next) {
  try {
    const result = await coursesService.deleteResource(
      req.params.id,
      req.params.resourceId,
      req.user.id,
      req.user.role
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to add an assignment to a course
 * POST /api/courses/:id/assignments
 */
export async function addAssignment(req, res, next) {
  try {
    const assignment = await coursesService.addAssignment(
      req.params.id,
      req.user.id,
      req.user.role,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: { assignment },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to remove an assignment from a course
 * DELETE /api/courses/:id/assignments/:assignmentId
 */
export async function deleteAssignment(req, res, next) {
  try {
    const result = await coursesService.deleteAssignment(
      req.params.id,
      req.params.assignmentId,
      req.user.id,
      req.user.role
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for students to enroll in a course
 * POST /api/courses/:id/enroll
 */
export async function enroll(req, res, next) {
  try {
    const enrollment = await coursesService.enrollStudent(
      req.params.id,
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Enrolled in course successfully',
      data: { enrollment },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to list courses the current student is enrolled in
 * GET /api/courses/enrolled/me
 */
export async function getEnrolled(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await coursesService.getEnrolledCourses(
      req.user.id,
      { page, limit }
    );

    res.status(200).json({
      success: true,
      data: result.courses,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for mentors to view enrolled students in a course
 * GET /api/courses/:id/students
 */
export async function getStudents(req, res, next) {
  try {
    const students = await coursesService.getCourseStudents(
      req.params.id,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: { students },
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  addResource,
  deleteResource,
  addAssignment,
  deleteAssignment,
  enroll,
  getEnrolled,
  getStudents,
};
