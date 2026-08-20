const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'huminexa_enterprise_secret_key_2026_secure!';

/**
 * Middleware to authenticate requests using JWT
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired authentication session. Please login again.'
      });
    }

    req.user = decodedUser;
    next();
  });
};

/**
 * Role-Based Access Control (RBAC) middleware generator
 * @param  {...string} allowedRoles Allowed user roles e.g. 'Admin', 'HR Manager'
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. User role is unidentified.'
      });
    }

    // Admin always has bypass privilege to all modules
    if (req.user.role === 'Admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
    });
  };
};

module.exports = {
  JWT_SECRET,
  authenticateToken,
  authorizeRoles
};
