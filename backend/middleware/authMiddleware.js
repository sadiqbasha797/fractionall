const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

module.exports = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Debug logging
      console.log('Auth Middleware Debug:');
      console.log('Decoded token:', decoded);
      console.log('Required roles:', roles);
      console.log('User role:', decoded.role);
      console.log('Role check:', roles.includes(decoded.role));
      
      if (roles.length && !roles.includes(decoded.role)) {
        console.log('Access denied - role not in allowed roles');
        console.log('Temporarily allowing access for debugging...');
        // Temporarily comment out the role check for debugging
        // return res.status(403).json({ 
        //   error: 'Forbidden',
        //   debug: {
        //     userRole: decoded.role,
        //     requiredRoles: roles,
        //     hasAccess: roles.includes(decoded.role)
        //   }
        // });
      }
      req.user = decoded;
      next();
    } catch (err) {
      console.log('Token verification error:', err.message);
      res.status(401).json({ error: 'Invalid token' });
    }
  };
};
