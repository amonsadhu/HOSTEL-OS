const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

// ── Helper: sign JWT ──────────────────────────────────────
const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// ── Helper: send token response ───────────────────────────
const sendTokenResponse = (user, statusCode, res, userType) => {
  const token = signToken(user._id, userType === 'student' ? 'student' : user.role);
  const userData = user.toObject();
  delete userData.password;

  res.status(statusCode).json({
    success: true,
    token,
    userType,
    user: userData
  });
};

// ════════════════════════════════════════
//  ADMIN AUTH
// ════════════════════════════════════════

/**
 * POST /api/auth/admin/login
 * Body: { email, password }
 */
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find admin and include password field (select: false by default)
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!admin.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated.' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    sendTokenResponse(admin, 200, res, 'admin');

  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

/**
 * POST /api/auth/admin/register
 * Protected: super_admin only
 * Body: { name, email, password, role, phone }
 */
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Admin with this email already exists.' });
    }

    const admin = await Admin.create({ name, email, password, role, phone });
    const adminData = admin.toObject();
    delete adminData.password;

    res.status(201).json({ success: true, message: 'Admin created successfully.', user: adminData });

  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ════════════════════════════════════════
//  STUDENT AUTH
// ════════════════════════════════════════

/**
 * POST /api/auth/student/login
 * Body: { email, password }
 */
exports.studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const student = await Student.findOne({ email }).select('+password');
    if (!student || !(await student.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!student.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    // Update last login
    student.lastLogin = new Date();
    await student.save({ validateBeforeSave: false });

    sendTokenResponse(student, 200, res, 'student');

  } catch (err) {
    console.error('Student login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

/**
 * POST /api/auth/student/change-password
 * Protected: student only
 * Body: { currentPassword, newPassword }
 */
exports.changeStudentPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const student = await Student.findById(req.user._id).select('+password');
    if (!(await student.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    student.password = newPassword;
    student.passwordChangedAt = new Date();
    student.firstLogin = false;
    await student.save();

    sendTokenResponse(student, 200, res, 'student');

  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * GET /api/auth/me
 * Protected: any logged-in user
 */
exports.getMe = async (req, res) => {
  res.status(200).json({ success: true, userType: req.userType, user: req.user });
};

/**
 * POST /api/auth/admin/change-password
 * Protected: admin only
 */
exports.changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.user._id).select('+password');
    if (!(await admin.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    admin.password = newPassword;
    admin.passwordChangedAt = new Date();
    await admin.save();
    sendTokenResponse(admin, 200, res, 'admin');
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
