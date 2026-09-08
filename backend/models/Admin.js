const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * ADMIN SCHEMA
 * Collection: admins
 * Roles: super_admin | warden | staff
 */
const adminSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, 'Name is required'], trim: true
  },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Enter a valid email']
  },
  password: {
    type: String, required: [true, 'Password is required'],
    minlength: 6, select: false   // never returned in queries by default
  },
  role: {
    type: String,
    enum: ['super_admin', 'warden', 'staff'],
    default: 'staff'
  },
  phone: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  passwordChangedAt: Date
}, { timestamps: true });

// Hash password before save
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare plain password with hash
adminSchema.methods.comparePassword = async function (candidate) {
  return await bcrypt.compare(candidate, this.password);
};

// Was password changed after JWT was issued?
adminSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changed = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changed;
  }
  return false;
};

module.exports = mongoose.model('Admin', adminSchema);
