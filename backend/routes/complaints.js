const express = require('express');
const router = express.Router();
const { Complaint } = require('../models/index');
const { protect, restrictTo, studentOnly } = require('../middleware/auth');

router.use(protect);

// GET /api/complaints/summary
router.get('/summary', async (req, res) => {
  try {
    const total      = await Complaint.countDocuments();
    const open       = await Complaint.countDocuments({ status: 'Open' });
    const urgent     = await Complaint.countDocuments({ status: 'Urgent' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved   = await Complaint.countDocuments({ status: 'Resolved' });
    res.json({ success: true, total, open, urgent, inProgress, resolved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/complaints?status=&category=&search=&page=
router.get('/', async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status)   query.status   = status;
    if (category) query.category = category;

    // Students only see their own complaints
    if (req.userType === 'student') {
      query.studentId = req.user._id;
    }

    let complaints = await Complaint.find(query)
      .populate('studentId', 'firstName lastName studentId roomNumber')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    if (search) {
      complaints = complaints.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.studentId && `${c.studentId.firstName} ${c.studentId.lastName}`.toLowerCase().includes(search.toLowerCase()))
      );
    }

    res.json({ success: true, complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/complaints
router.post('/', async (req, res) => {
  try {
    const { title, description, category, priority, assignedTo } = req.body;

    const studentId = req.userType === 'student' ? req.user._id : req.body.studentId;
    if (!studentId) return res.status(400).json({ success: false, message: 'Student ID required.' });

    const complaint = await Complaint.create({
      studentId, title, description, category, priority, assignedTo
    });

    const populated = await complaint.populate('studentId', 'firstName lastName studentId roomNumber');
    res.status(201).json({ success: true, complaint: populated });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const msgs = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: msgs.join('. ') });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/complaints/:id
router.put('/:id', async (req, res) => {
  try {
    // Students can only update their own complaints
    if (req.userType === 'student') {
      const complaint = await Complaint.findById(req.params.id);
      if (!complaint) return res.status(404).json({ success: false, message: 'Not found.' });
      if (complaint.studentId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    if (req.body.status === 'Resolved') {
      req.body.resolvedAt = new Date();
    }

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('studentId', 'firstName lastName studentId roomNumber');

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/complaints/:id
router.delete('/:id', async (req, res) => {
  try {
    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Complaint deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;