const express = require('express');
const router = express.Router();
const { Room } = require('../models/index');
const Student = require('../models/Student');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

// GET /api/rooms/summary
router.get('/summary', async (req, res) => {
  try {
    const total       = await Room.countDocuments();
    const occupied    = await Room.countDocuments({ status: 'occupied' });
    const available   = await Room.countDocuments({ status: 'available' });
    const maintenance = await Room.countDocuments({ status: 'maintenance' });
    res.json({ success: true, total, occupied, available, maintenance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/rooms?block=A
router.get('/', async (req, res) => {
  try {
    const { block, status } = req.query;
    const query = {};
    if (block)  query.block  = block;
    if (status) query.status = status;
    const rooms = await Room.find(query)
      .populate('occupants', 'firstName lastName studentId')
      .sort({ roomNumber: 1 });
    res.json({ success: true, rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/rooms/occupancy-by-block
router.get('/occupancy-by-block', async (req, res) => {
  try {
    const blocks = ['A', 'B', 'C', 'D'];
    const data = await Promise.all(blocks.map(async (block) => {
      const total    = await Room.countDocuments({ block });
      const occupied = await Room.countDocuments({ block, status: 'occupied' });
      return { block, total, occupied, percentage: total ? Math.round((occupied / total) * 100) : 0 };
    }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/rooms/:id
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('occupants', 'firstName lastName studentId email phone');
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
    res.json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/rooms
router.post('/', restrictTo('super_admin', 'warden'), async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/rooms/allocate
router.post('/allocate', restrictTo('super_admin', 'warden', 'staff'), async (req, res) => {
  try {
    const { studentId, roomId, fromDate, toDate, notes } = req.body;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });

    if (room.occupants.length >= room.capacity) {
      return res.status(400).json({ success: false, message: 'Room is already full.' });
    }

    // Add student to room
    room.occupants.push(studentId);
    await room.save();

    // Update student record
    await Student.findByIdAndUpdate(studentId, {
      roomId:      room._id,
      roomNumber:  room.roomNumber,
      block:       room.block,
      checkInDate: fromDate,
      status:      'Active'
    });

    res.json({ success: true, message: 'Room allocated successfully.', room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/rooms/:id
router.put('/:id', restrictTo('super_admin', 'warden'), async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
    res.json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/rooms/allocate/:studentId  — deallocate student from room
router.delete('/allocate/:studentId', restrictTo('super_admin', 'warden'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    // Remove student from room
    await Room.findByIdAndUpdate(student.roomId, {
      $pull: { occupants: student._id }
    });

    // Clear student room info
    await Student.findByIdAndUpdate(student._id, {
      roomId: null, roomNumber: 'Unassigned', block: null
    });

    res.json({ success: true, message: 'Student deallocated from room.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;