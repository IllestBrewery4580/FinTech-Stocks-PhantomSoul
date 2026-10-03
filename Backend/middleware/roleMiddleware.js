export const requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
        });
      }
  
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'You do not have permission to access this resource',
        });
      }
  
      next();
    };
  };
  
  export const requireClient = requireRoles('client');
  
  export const requireEmployee = requireRoles(
    'advisor',
    'analyst',
    'compliance',
    'admin'
  );
  
  export const requireAdvisor = requireRoles(
    'advisor',
    'admin'
  );
  
  export const requireAnalyst = requireRoles(
    'analyst',
    'advisor',
    'admin'
  );
  
  export const requireCompliance = requireRoles(
    'compliance',
    'admin'
  );
  
  export const requireAdmin = requireRoles(
    'admin'
  );
