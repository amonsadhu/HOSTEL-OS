const express = require('express');
const router = express.Router();
const {
  adminLogin, registerAdmin,
  studentLogin, changeStudentPassword,
  changeAdminPassword, getMe
} = require('../controllers/authController');
const { protect, restrictTo, studentOnly } = require('../middleware/auth');

// ── Admin Auth ─────────────────────────────────────────
router.post('/admin/login', adminLogin);

// Only existing super_admin can create new admins
router.post('/admin/register',
  protect,
  restrictTo('super_admin'),
  registerAdmin
);

router.post('/admin/change-password',
  protect,
  restrictTo('super_admin', 'warden', 'staff'),
  changeAdminPassword
);

// ── Student Auth ───────────────────────────────────────
router.post('/student/login', studentLogin);

router.post('/student/change-password',
  protect,
  studentOnly,
  changeStudentPassword
);

// ── Shared ─────────────────────────────────────────────
router.get('/me', protect, getMe);

module.exports = router;
