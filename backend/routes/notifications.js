const express = require('express');
const router = express.Router();
const { Notification } = require('../models/index');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

// GET /api/notifications/summary
router.get('/summary', async (req, res) => {
  try {
    const total     = await Notification.countDocuments();
    const scheduled = await Notification.countDocuments({ scheduledAt: { $gt: new Date() } });
    res.json({ success: true, total, scheduled });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/notifications?filter=
router.get('/', async (req, res) => {
  try {
    const { filter, page = 1, limit = 20 } = req.query;
    const query = {};
    if (filter && filter !== 'unread' && filter !== '') query.type = filter;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('sentBy', 'name');

    // Mark unread: notifications where current user not in readBy
    const withUnread = notifications.map(n => ({
      ...n.toObject(),
      isUnread: req.userType === 'student'
        ? !n.readBy.includes(req.user._id)
        : false
    }));

    // Filter unread if requested
    const result = filter === 'unread'
      ? withUnread.filter(n => n.isUnread)
      : withUnread;

    res.json({ success: true, notifications: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notifications/send
router.post('/send', restrictTo('super_admin', 'warden', 'staff'), async (req, res) => {
  try {
    const { title, message, type, channels, recipients, scheduledAt } = req.body;

    const notification = await Notification.create({
      title,
      message,
      type:        type || 'info',
      channels:    channels || ['push'],
      recipients:  recipients || 'all',
      sentBy:      req.user._id,
      scheduledAt: scheduledAt || null,
      sentAt:      new Date()
    });

    // In production: trigger email/SMS/push here based on channels[]
    // e.g. if channels.includes('email') → sendEmail(recipients, title, message)
    // e.g. if channels.includes('sms')   → sendSMS(recipients, message)

    res.status(201).json({ success: true, message: 'Notification sent.', notification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notifications/mark-all-read
router.post('/mark-all-read', async (req, res) => {
  try {
    // For student: add their ID to readBy of all notifications
    if (req.userType === 'student') {
      await Notification.updateMany(
        { readBy: { $ne: req.user._id } },
        { $push: { readBy: req.user._id } }
      );
    }
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: req.user._id } },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', restrictTo('super_admin'), async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;