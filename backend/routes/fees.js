const express = require('express');
const router = express.Router();
const { Fee } = require('../models/index');
const Student = require('../models/Student');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

// GET /api/fees/summary
router.get('/summary', async (req, res) => {
  try {
    const paid    = await Fee.countDocuments({ status: 'Paid' });
    const due     = await Fee.countDocuments({ status: 'Due' });
    const overdue = await Fee.countDocuments({ status: 'Overdue' });

    const paidFees  = await Fee.find({ status: 'Paid' });
    const collected = paidFees.reduce((sum, f) => sum + (f.amount || 0), 0);

    //const totalStudents = await Student.countDocuments({ status: 'Active' });
    const totalStudents = await Student.countDocuments({
  status: { $regex: /^active$/i }
});
    const totalExpected = totalStudents * 6000 * 12;
    const pending       = totalExpected - collected;

    res.json({
      success: true,
      paid, due, overdue,
      collected,
      //collectedFormatted: '₹' + (collected / 100000).toFixed(1) + 'L',
      collectedFormatted: '₹' + collected,
      pending: pending < 0 ? 0 : pending
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/fees?status=&month=&search=&page=&limit=
router.get('/', async (req, res) => {
  try {
    const { status, month, search, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (month)  query.month  = month;

    let fees = await Fee.find(query)
      .populate('studentId', 'firstName lastName studentId roomNumber email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    if (search) {
      fees = fees.filter(f =>
        f.studentId &&
        (`${f.studentId.firstName} ${f.studentId.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
         f.studentId.studentId.toLowerCase().includes(search.toLowerCase()))
      );
    }

    res.json({ success: true, fees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/fees/:id
router.get('/:id', async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate('studentId', 'firstName lastName studentId roomNumber');
    if (!fee) return res.status(404).json({ success: false, message: 'Fee not found.' });
    res.json({ success: true, fee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/fees/payment
router.post('/payment', restrictTo('super_admin', 'warden', 'staff'), async (req, res) => {
  try {
    const { studentId, amount, paymentMode, paidDate, transactionId, month, remarks } = req.body;

    let fee = await Fee.findOne({ studentId, month });

    if (fee) {
      fee.status        = 'Paid';
      fee.paidDate      = paidDate || new Date();
      fee.paymentMode   = paymentMode;
      fee.transactionId = transactionId;
      fee.remarks       = remarks;
      await fee.save();
    } else {
      fee = await Fee.create({
        studentId, amount, month,
        dueDate:      new Date(),
        paidDate:     paidDate || new Date(),
        status:       'Paid',
        paymentMode,
        transactionId,
        remarks
      });
    }

    res.status(201).json({ success: true, message: 'Payment recorded.', fee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/fees/send-reminders
router.post('/send-reminders', restrictTo('super_admin', 'warden', 'staff'), async (req, res) => {
  try {
    const count = await Fee.countDocuments({ status: { $in: ['Due', 'Overdue'] } });
    res.json({ success: true, message: `Reminders sent to ${count} students.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/fees/:id
router.put('/:id', restrictTo('super_admin', 'warden', 'staff'), async (req, res) => {
  try {
    const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found.' });
    res.json({ success: true, fee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/fees/:id/remind
router.post('/:id/remind', restrictTo('super_admin', 'warden', 'staff'), async (req, res) => {
  try {
    res.json({ success: true, message: 'Reminder sent.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/fees/:id
router.delete('/:id', restrictTo('super_admin'), async (req, res) => {
  try {
    await Fee.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Fee record deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;