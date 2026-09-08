const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let currentUser;
    if (decoded.role === 'student') {
      currentUser = await Student.findById(decoded.id);
    } else {
      currentUser = await Admin.findById(decoded.id);
    }

    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    if (!currentUser.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated.' });
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({ success: false, message: 'Password changed. Please log in again.' });
    }

    req.user = currentUser;
    req.userType = decoded.role === 'student' ? 'student' : 'admin';
    next();

  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (req.userType === 'student') {
      return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Access denied. Requires role: ${roles.join(' or ')}` });
    }
    next();
  };
};

const studentOnly = (req, res, next) => {
  if (req.userType !== 'student') {
    return res.status(403).json({ success: false, message: 'Access denied. Students only.' });
  }
  next();
};

module.exports = { protect, restrictTo, studentOnly };