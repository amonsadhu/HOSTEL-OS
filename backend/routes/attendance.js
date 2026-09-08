const express = require('express');
const router = express.Router();
const { Attendance } = require('../models/index');
const Student = require('../models/Student');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

// GET /api/attendance/summary?date=
router.get('/summary', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const present  = await Attendance.countDocuments({ date, status: 'present' });
    const absent   = await Attendance.countDocuments({ date, status: 'absent' });
    const leave    = await Attendance.countDocuments({ date, status: 'leave' });
    const total    = await Student.countDocuments({ status: 'Active' });
    res.json({ success: true, date, present, absent, leave, total, unmarked: total - present - absent - leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance?date=YYYY-MM-DD&block=
router.get('/', async (req, res) => {
  try {
    const date  = req.query.date  || new Date().toISOString().slice(0, 10);
    const block = req.query.block || '';

    // Get all active students
    const studentQuery = { status: 'Active' };
    if (block) studentQuery.block = block;
    const students = await Student.find(studentQuery).select('firstName lastName studentId roomNumber block');

    // Get existing attendance records for this date
    const existingRecords = await Attendance.find({ date })
      .populate('studentId', 'firstName lastName studentId roomNumber block');

    // Build full list — create missing records with default 'absent'
    const records = await Promise.all(students.map(async (student) => {
      let record = existingRecords.find(r => r.studentId && r.studentId._id.toString() === student._id.toString());

      if (!record) {
        // Auto-create attendance record
        record = await Attendance.create({
          studentId: student._id,
          date,
          status: 'absent'
        });
        record.studentId = student;
      }
      return record;
    }));

    res.json({ success: true, date, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/attendance/:id  — update single record
router.put('/:id', restrictTo('super_admin', 'warden', 'staff'), async (req, res) => {
  try {
    const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('studentId', 'firstName lastName studentId roomNumber');
    if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });
    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/attendance/mark-all  — mark all students present/absent for a date
router.post('/mark-all', restrictTo('super_admin', 'warden', 'staff'), async (req, res) => {
  try {
    const { date, status } = req.body;
    await Attendance.updateMany({ date }, { status });
    res.json({ success: true, message: `All students marked ${status} for ${date}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/attendance/bulk-save
router.post('/bulk-save', restrictTo('super_admin', 'warden', 'staff'), async (req, res) => {
  try {
    const { date, records } = req.body;

    await Promise.all(records.map(r =>
      Attendance.findOneAndUpdate(
        { studentId: r.studentId, date },
        { status: r.status, checkIn: r.checkIn, checkOut: r.checkOut, markedBy: req.user._id },
        { upsert: true, new: true }
      )
    ));

    res.json({ success: true, message: `Attendance saved for ${date}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;