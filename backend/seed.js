// ⚠️ dotenv MUST load first
require('dotenv').config();

/**
 * SEED SCRIPT
 * Run: node seed.js
 * Seeds: 1 super_admin, 2 staff admins, 8 demo students, demo rooms
 */
const mongoose = require('mongoose');
const Admin    = require('./models/Admin');
const Student  = require('./models/Student');
const { Room } = require('./models/index');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hostelos';

// ── Demo Admins ─────────────────────────────────────────
const admins = [
  {
    name: 'Super Admin',
    email: 'admin@hostelos.com',
    password: 'Admin@123',
    role: 'super_admin',
    phone: '9999999999'
  },
  {
    name: 'Rajesh Warden',
    email: 'warden@hostelos.com',
    password: 'Warden@123',
    role: 'warden',
    phone: '9888888888'
  },
  {
    name: 'Sunita Staff',
    email: 'staff@hostelos.com',
    password: 'Staff@123',
    role: 'staff',
    phone: '9777777777'
  }
];

// ── Demo Students ───────────────────────────────────────
const students = [
  {
    studentId: 'STU0001',
    firstName: 'Arjun', lastName: 'Mehra',
    email: 'arjun.mehra@student.com', password: 'arjun3210',
    phone: '9876543210', course: 'B.Tech CSE', year: '3rd Year',
    gender: 'Male', roomNumber: 'A-204', block: 'A', status: 'Active'
  },
  {
    studentId: 'STU0002',
    firstName: 'Priya', lastName: 'Sharma',
    email: 'priya.sharma@student.com', password: 'priya3211',
    phone: '9876543211', course: 'B.Com', year: '2nd Year',
    gender: 'Female', roomNumber: 'B-112', block: 'B', status: 'Active'
  },
  {
    studentId: 'STU0003',
    firstName: 'Ravi', lastName: 'Kulkarni',
    email: 'ravi.kulkarni@student.com', password: 'ravi3212',
    phone: '9876543212', course: 'BBA', year: '1st Year',
    gender: 'Male', roomNumber: 'C-308', block: 'C', status: 'Active'
  },
  {
    studentId: 'STU0004',
    firstName: 'Sneha', lastName: 'Iyer',
    email: 'sneha.iyer@student.com', password: 'sneha3213',
    phone: '9876543213', course: 'B.Sc IT', year: '4th Year',
    gender: 'Female', roomNumber: 'A-106', block: 'A', status: 'Inactive'
  },
  {
    studentId: 'STU0005',
    firstName: 'Manav', lastName: 'Tiwari',
    email: 'manav.tiwari@student.com', password: 'manav3214',
    phone: '9876543214', course: 'MBA', year: '1st Year',
    gender: 'Male', roomNumber: 'D-201', block: 'D', status: 'Pending'
  },
  {
    studentId: 'STU0006',
    firstName: 'Anjali', lastName: 'Rao',
    email: 'anjali.rao@student.com', password: 'anjali3215',
    phone: '9876543215', course: 'B.Tech ECE', year: '2nd Year',
    gender: 'Female', roomNumber: 'B-305', block: 'B', status: 'Active'
  },
  {
    studentId: 'STU0007',
    firstName: 'Rohit', lastName: 'Das',
    email: 'rohit.das@student.com', password: 'rohit3216',
    phone: '9876543216', course: 'B.Arch', year: '3rd Year',
    gender: 'Male', roomNumber: 'C-110', block: 'C', status: 'Active'
  },
  {
    studentId: 'STU0008',
    firstName: 'Kiran', lastName: 'Patel',
    email: 'kiran.patel@student.com', password: 'kiran3217',
    phone: '9876543217', course: 'B.Tech ME', year: '1st Year',
    gender: 'Male', roomNumber: 'D-402', block: 'D', status: 'Pending'
  }
];

// ── Demo Rooms ──────────────────────────────────────────
const rooms = [
  { roomNumber:'A-101', block:'A', floor:1, type:'Single', monthlyRent:12000 },
  { roomNumber:'A-106', block:'A', floor:1, type:'Double', monthlyRent:10000 },
  { roomNumber:'A-204', block:'A', floor:2, type:'Double', monthlyRent:10000 },
  { roomNumber:'B-112', block:'B', floor:1, type:'Single', monthlyRent:12000 },
  { roomNumber:'B-305', block:'B', floor:3, type:'Double', monthlyRent:10000 },
  { roomNumber:'C-110', block:'C', floor:1, type:'Double', monthlyRent:9000 },
  { roomNumber:'C-308', block:'C', floor:3, type:'Single', monthlyRent:11000 },
  { roomNumber:'D-201', block:'D', floor:2, type:'Triple', monthlyRent:8000 },
  { roomNumber:'D-402', block:'D', floor:4, type:'Double', monthlyRent:9000 },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    // Drop entire database to clear all indexes and data cleanly
    await mongoose.connection.dropDatabase();
    console.log('🗑️  Dropped database');

    // Insert admins
    await Admin.create(admins);
    console.log(`👤 Seeded ${admins.length} admins`);

    // Insert students
    await Student.create(students);
    console.log(`🎓 Seeded ${students.length} students`);

    // Insert rooms
    await Room.create(rooms);
    console.log(`🏠 Seeded ${rooms.length} rooms`);

    // Print login credentials
    console.log('\n═══════════════════════════════════════');
    console.log('         DEMO LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════');
    console.log('\n🔑 ADMIN LOGINS:');
    admins.forEach(a => console.log(`   ${a.role}: ${a.email} / ${a.password}`));
    console.log('\n🎓 STUDENT LOGINS (sample):');
    students.slice(0,3).forEach(s => console.log(`   ${s.firstName} ${s.lastName}: ${s.email} / ${s.password}`));
    console.log('\n   ...and 5 more students. See seed.js for full list.');
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
