// ⚠️ dotenv MUST be the very first line before any other require
require('dotenv').config();

const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const app = express();

// ════════════════════════════════════════
//  MIDDLEWARE
// ════════════════════════════════════════

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:8080',
    'https://hostel-os-1.onrender.com'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Try again later.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' }
});

//app.use('/api', limiter);
//app.use('/api/auth', authLimiter);

// ════════════════════════════════════════
//  ROUTES
// ════════════════════════════════════════
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/students', require('./routes/students'));

app.use('/api/rooms',         require('./routes/rooms'));
app.use('/api/fees',          require('./routes/fees'));
app.use('/api/complaints',    require('./routes/complaints'));
app.use('/api/attendance',    require('./routes/attendance'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'HostelOS API is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// ════════════════════════════════════════
//  DATABASE + START
// ════════════════════════════════════════
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 HostelOS API running on http://localhost:${PORT}`);
      console.log(`📦 Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;

