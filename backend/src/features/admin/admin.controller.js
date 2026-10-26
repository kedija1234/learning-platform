import * as adminService from './admin.service.js';

export async function listUsers(req, res, next) {
  try {
    const { page, limit, search, role, is_active } = req.query;
    const result = await adminService.listUsers({ page, limit, search, role, is_active });
    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { is_active } = req.body;
    const adminUserId = req.user.id;

    const updatedUser = await adminService.updateUserStatus(targetUserId, is_active, adminUserId);
    res.status(200).json({
      success: true,
      message: `User account ${is_active ? 'reactivated' : 'deactivated'} successfully`,
      data: { user: updatedUser },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateRole(req, res, next) {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { role } = req.body;
    const adminUserId = req.user.id;

    const updatedUser = await adminService.updateUserRole(targetUserId, role, adminUserId);
    res.status(200).json({
      success: true,
      message: `User role successfully changed to ${role}`,
      data: { user: updatedUser },
    });
  } catch (err) {
    next(err);
  }
}

export async function getStats(req, res, next) {
  try {
    const stats = await adminService.getStats();
    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (err) {
    next(err);
  }
}
