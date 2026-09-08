const mongoose = require('mongoose');

// ════════════════════════════════════════
//  ROOM
// ════════════════════════════════════════
const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  block:      { type: String, required: true, enum: ['A','B','C','D'] },
  floor:      { type: Number, default: 1 },
  type:       { type: String, enum: ['Single','Double','Triple'], default: 'Double' },
  ac:         { type: Boolean, default: false },
  monthlyRent: { type: Number, default: 8000 },
  capacity:   { type: Number, default: 2 },
  occupants:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  status: {
    type: String,
    enum: ['available','occupied','maintenance'],
    default: 'available'
  },
  amenities: [String]
}, { timestamps: true });

// Auto-set capacity and status
roomSchema.pre('save', function (next) {
  const cap = this.type === 'Single' ? 1 : this.type === 'Double' ? 2 : 3;
  this.capacity = cap;
  this.status = this.occupants.length >= cap ? 'occupied'
              : this.status === 'maintenance' ? 'maintenance'
              : 'available';
  next();
});

// ════════════════════════════════════════
//  FEE
// ════════════════════════════════════════
const feeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  month:     { type: String, required: true },  // e.g. "May 2026"
  amount:    { type: Number, required: true },
  dueDate:   { type: Date,   required: true },
  paidDate:  { type: Date,   default: null },
  status: {
    type: String,
    enum: ['Paid','Due','Overdue'],
    default: 'Due'
  },
  paymentMode: {
    type: String,
    enum: ['UPI','Cash','Bank Transfer','Cheque','Card',''],
    default: ''
  },
  transactionId: { type: String, default: '' },
  remarks:       { type: String, default: '' },
  receiptNumber: { type: String, unique: true, sparse: true }
}, { timestamps: true });

// Auto-mark Overdue
feeSchema.pre('save', function (next) {
  if (this.status === 'Due' && this.dueDate < new Date()) {
    this.status = 'Overdue';
  }
  next();
});

// ════════════════════════════════════════
//  COMPLAINT
// ════════════════════════════════════════
const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, unique: true },
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['Maintenance','Electrical','Plumbing','Food','Cleanliness','Security','Other'],
    required: true
  },
  priority: {
    type: String, enum: ['Normal','Urgent'], default: 'Normal'
  },
  status: {
    type: String,
    enum: ['Open','Urgent','In Progress','Resolved'],
    default: 'Open'
  },
  assignedTo:      { type: String, default: '' },
  resolutionNotes: { type: String, default: '' },
  resolvedAt:      { type: Date, default: null }
}, { timestamps: true });

complaintSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  const count = await mongoose.model('Complaint').countDocuments();
  this.complaintId = 'CMP' + String(count + 1).padStart(3, '0');
  if (this.priority === 'Urgent') this.status = 'Urgent';
  next();
});

// ════════════════════════════════════════
//  ATTENDANCE
// ════════════════════════════════════════
const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date:      { type: String, required: true },  // "YYYY-MM-DD"
  status: {
    type: String,
    enum: ['present','absent','leave'],
    default: 'absent'
  },
  checkIn:  { type: String, default: '' },   // "HH:MM"
  checkOut: { type: String, default: '' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

// Compound unique: one record per student per day
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

// ════════════════════════════════════════
//  NOTIFICATION
// ════════════════════════════════════════
const notificationSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  message:  { type: String, required: true },
  type:     { type: String, enum: ['info','warning','alert','success'], default: 'info' },
  channels: [{ type: String, enum: ['push','email','sms'] }],
  recipients: { type: String, default: 'all' },  // "all", "block_A", or student ObjectId
  sentBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  readBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  scheduledAt: { type: Date, default: null },
  sentAt:      { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = {
  Room:         mongoose.model('Room', roomSchema),
  Fee:          mongoose.model('Fee', feeSchema),
  Complaint:    mongoose.model('Complaint', complaintSchema),
  Attendance:   mongoose.model('Attendance', attendanceSchema),
  Notification: mongoose.model('Notification', notificationSchema)
};
