const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * STUDENT SCHEMA
 * Collection: students
 * Students can login using email + password (auto-generated on registration)
 */
const studentSchema = new mongoose.Schema({
  // ── Identity ─────────────────────────────────────────
  studentId: {
    type: String, unique: true,
    // Auto-generated: STU001, STU002, etc.
  },
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email: {
    type: String, required: true, unique: true,
    lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Enter a valid email']
  },
  password: {
    type: String, required: true, minlength: 6, select: false
  },
  phone:       { type: String, trim: true },
  dateOfBirth: { type: Date },
  gender:      { type: String, enum: ['Male', 'Female', 'Other'] },
  address:     { type: String },
  photo:       { type: String, default: null },

  // ── Academic ──────────────────────────────────────────
  course:  { type: String },   // e.g. B.Tech CSE
  year:    { type: String },   // e.g. 2nd Year
  college: { type: String },

  // ── Hostel ───────────────────────────────────────────
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  roomNumber: { type: String, default: 'Unassigned' },
  block:      { type: String, default: null },
  checkInDate:  { type: Date },
  checkOutDate: { type: Date },

  // ── Status ────────────────────────────────────────────
  status: {
    type: String,
    enum: ['Active', 'Pending', 'Inactive', 'CheckedOut'],
    default: 'Pending'
  },

  // ── Emergency Contact ─────────────────────────────────
  emergencyContact: {
    name:  String,
    phone: String,
    relation: String
  },

  // ── ID Proof ──────────────────────────────────────────
  idProof: {
    type:   { type: String },   // Aadhar, Passport, etc.
    number: String
  },

  // ── Auth ──────────────────────────────────────────────
  isActive:          { type: Boolean, default: true },
  lastLogin:         { type: Date, default: null },
  passwordChangedAt: Date,
  firstLogin:        { type: Boolean, default: true }  // force password change on first login

}, { timestamps: true });

// Auto-generate studentId before first save
studentSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  if (this.studentId) return next(); // already set (e.g. from seed), skip

  // Find the student with the highest studentId and increment from there
  const last = await mongoose.model('Student')
    .findOne({ studentId: { $exists: true } })
    .sort({ studentId: -1 })
    .select('studentId');

  let nextNum = 1;
  if (last && last.studentId) {
    const lastNum = parseInt(last.studentId.replace('STU', ''), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  this.studentId = 'STU' + String(nextNum).padStart(4, '0');
  next();
});

// Hash password before save
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Virtual: full name
studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Compare passwords
studentSchema.methods.comparePassword = async function (candidate) {
  return await bcrypt.compare(candidate, this.password);
};

studentSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changed = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changed;
  }
  return false;
};

module.exports = mongoose.model('Student', studentSchema);
