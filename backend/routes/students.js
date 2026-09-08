const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { protect, restrictTo, studentOnly } = require('../middleware/auth');

// All routes below require authentication
router.use(protect);

// ── GET all students (admin only) ──────────────────────
// GET /api/students?page=1&limit=20&search=&status=&block=
router.get('/', restrictTo('super_admin', 'warden', 'staff'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status, block } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName:  new RegExp(search, 'i') },
        { studentId: new RegExp(search, 'i') },
        { email:     new RegExp(search, 'i') },
        { roomNumber: new RegExp(search, 'i') }
      ];
    }
    if (status) query.status = status;
    if (block)  query.block  = block;

    const total    = await Student.countDocuments(query);
    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-password');

    res.json({
      success: true,
      total, page: Number(page),
      pages: Math.ceil(total / limit),
      students
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET student summary stats ─────────────────────────
// GET /api/students/summary
router.get('/summary', restrictTo('super_admin', 'warden', 'staff'), async (req, res) => {
  try {
    const [total, active, pending, inactive] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: 'Active' }),
      Student.countDocuments({ status: 'Pending' }),
      Student.countDocuments({ status: 'Inactive' })
    ]);
    res.json({ success: true, total, active, pending, inactive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST register new student (admin creates account) ─
// POST /api/students
router.post('/', restrictTo('super_admin', 'warden'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, course, year,
            gender, dateOfBirth, address, emergencyContact, idProof } = req.body;

    const existing = await Student.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Default password: first name + last 4 digits of phone (e.g. arjun1234)
    const defaultPassword = (firstName.toLowerCase()) + (phone ? phone.slice(-4) : '0000');

    const student = await Student.create({
      firstName, lastName, email, phone, course, year, gender,
      dateOfBirth, address, emergencyContact, idProof,
      password: defaultPassword,
      status: 'Pending'
    });

    const data = student.toObject();
    delete data.password;

    res.status(201).json({
      success: true,
      message: `Student registered. Default password: ${defaultPassword}`,
      student: data
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msgs = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: msgs.join('. ') });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET single student ────────────────────────────────
// GET /api/students/:id
router.get('/:id', async (req, res) => {
  try {
    // Students can only see their own profile
    if (req.userType === 'student' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const student = await Student.findById(req.params.id).populate('roomId').select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT update student ────────────────────────────────
// PUT /api/students/:id
router.put('/:id', async (req, res) => {
  try {
    // Students can only update their own non-sensitive fields
    if (req.userType === 'student' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    // Prevent role escalation
    const disallowed = ['password', 'studentId', 'status', 'roomId'];
    disallowed.forEach(f => delete req.body[f]);

    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    }).select('-password');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE student (super_admin only) ─────────────────
// DELETE /api/students/:id
router.delete('/:id', restrictTo('super_admin'), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, message: 'Student removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
