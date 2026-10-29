**HostelOS — Hostel Management System**

A full-stack web application that digitizes and streamlines hostel administration — student registration, room allocation, fee management, complaint handling, attendance tracking, and notifications — through a centralized platform with separate Admin and Student portals.

Features

👨‍💼 Admin Portal
Dashboard — overview of students, rooms, fees, and complaints
Student Management — register, search, filter, view, delete, export CSV (auto-generated student IDs)
Room Allocation — block-wise room map (A–D), allocate students to available rooms
Fee Management — record payments, search by student/month, printable receipts, pending amount tracking
Complaint Handling — track, assign, update, and resolve student complaints
Attendance Tracking — daily register with Present / Absent / Leave marking
Notifications — send announcements to students via quick send or compose

🎓 Student Portal
Dashboard — room details, fee status, complaint summary
My Fees — payment history and demo payment portal (Card / UPI / Bank Transfer) with receipt
My Complaints — raise complaints and track resolution status
Notifications — view hostel announcements, filter by type, mark as read

🔐 Security
JWT-based authentication
bcrypt password hashing
Role-based access control (Super Admin / Warden / Staff / Student)
Rate limiting on API routes
Separate logins for admins and students

🛠️ Still building, still shipping. HostelOS is under active development, so expect new features, polish, and the occasional “wait, that wasn’t there yesterday!” moment.
