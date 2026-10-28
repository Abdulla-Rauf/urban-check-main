import { ApiResponse } from '../utils/apiResponse.js';

/**
 * Restricts access to specific role(s)
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role || req.admin?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return ApiResponse.error(
        res,
        'Forbidden: You do not possess the required privileges for this resource.',
        403
      );
    }

    next();
  };
};

/**
 * Restricts access based on specific permission(s)
 */
export const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    // If super_admin, grant full bypass
    if (req.user?.role === 'super_admin' || req.admin?.role === 'super_admin') {
      return next();
    }

    const userPermissions = (req.admin?.permissions || []).map((p) =>
      typeof p === 'string' ? p : p.name
    );

    const hasAll = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasAll) {
      return ApiResponse.error(
        res,
        'Forbidden: Missing required administrative permissions.',
        403
      );
    }

    next();
  };
};
