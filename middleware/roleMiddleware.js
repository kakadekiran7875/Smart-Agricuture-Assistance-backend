/**
 * Role-Based Access Control (RBAC) Middleware
 * Smart Agriculture Assistant Backend
 */

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role || 'farmer';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

export default requireRole;

