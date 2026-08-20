require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { initDb, readData, saveData } = require('./db');
const { JWT_SECRET, authenticateToken, authorizeRoles } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database
initDb();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

/* ==========================================================================
   AUTHENTICATION ROUTES
   ========================================================================== */

/**
 * POST /api/auth/login
 * Public login endpoint
 */
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both email and password.'
    });
  }

  const db = readData();
  const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email address or credentials.'
    });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid password. Please verify and try again.'
    });
  }

  // Generate JWT token (expires in 24 hours)
  const tokenPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || 'General',
    designation: user.designation || 'Staff',
    employeeId: user.employeeId || 'EMP-000'
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

  return res.status(200).json({
    success: true,
    message: 'Authentication successful. Welcome to HUMINEXA!',
    data: {
      token,
      user: tokenPayload
    }
  });
});

/**
 * GET /api/auth/me
 * Returns current authenticated user
 */
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const db = readData();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User account not found.'
    });
  }

  const { password, ...safeUser } = user;
  return res.status(200).json({
    success: true,
    message: 'User profile fetched successfully.',
    data: safeUser
  });
});

/* ==========================================================================
   DASHBOARD KPI & METRICS
   ========================================================================== */

/**
 * GET /api/dashboard
 * Aggregated analytics and metrics for the dashboard
 */
app.get('/api/dashboard', authenticateToken, (req, res) => {
  const db = readData();
  const today = new Date().toISOString().split('T')[0];

  const employees = db.employees || [];
  const attendance = db.attendance || [];
  const leaves = db.leaves || [];
  const leads = db.leads || [];
  const announcements = db.announcements || [];
  const activities = db.activities || [];

  // HR KPIs
  const totalEmployees = employees.length;
  const todayAttendance = attendance.filter(a => a.date === today);
  const presentToday = todayAttendance.filter(a => ['Present', 'Late', 'Work From Home'].includes(a.status)).length;
  const onLeaveToday = leaves.filter(l => l.status === 'Approved' && today >= l.startDate && today <= l.endDate).length;
  
  // Attendance calculation
  const totalTrackedToday = todayAttendance.length;
  const attendancePercentage = totalEmployees > 0 
    ? Math.round((presentToday / totalEmployees) * 100)
    : 0;

  // CRM KPIs
  const activeLeadsList = leads.filter(l => !['Won', 'Lost'].includes(l.stage));
  const totalActiveLeads = activeLeadsList.length;
  const totalPipelineValue = activeLeadsList.reduce((sum, lead) => sum + (Number(lead.estimatedValue) || 0), 0);
  const wonLeadsValue = leads.filter(l => l.stage === 'Won').reduce((sum, l) => sum + (Number(l.estimatedValue) || 0), 0);

  // Breakdown charts
  const attendanceBreakdown = {
    present: todayAttendance.filter(a => a.status === 'Present').length,
    late: todayAttendance.filter(a => a.status === 'Late').length,
    wfh: todayAttendance.filter(a => a.status === 'Work From Home').length,
    halfDay: todayAttendance.filter(a => a.status === 'Half Day').length,
    absent: Math.max(0, totalEmployees - presentToday - onLeaveToday)
  };

  const stagesList = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
  const leadsByStage = {};
  stagesList.forEach(stage => {
    leadsByStage[stage] = leads.filter(l => l.stage === stage).length;
  });

  // Recent feeds
  const recentLeaves = [...leaves].reverse().slice(0, 5);
  const recentLeads = [...leads].reverse().slice(0, 5);
  const recentAnnouncements = [...announcements].reverse().slice(0, 4);
  const recentActivities = [...activities].reverse().slice(0, 5);

  // Birthdays / Anniversaries this month
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const upcomingEvents = employees
    .filter(e => e.birthDate && e.birthDate.split('-')[1] === currentMonth)
    .map(e => ({
      name: e.name,
      department: e.department,
      date: e.birthDate,
      type: 'Birthday'
    }))
    .slice(0, 4);

  return res.status(200).json({
    success: true,
    message: 'Dashboard metrics loaded.',
    data: {
      kpi: {
        totalEmployees,
        presentToday,
        onLeaveToday,
        attendancePercentage,
        totalActiveLeads,
        totalPipelineValue,
        wonLeadsValue
      },
      charts: {
        attendanceBreakdown,
        leadsByStage
      },
      recentLeaves,
      recentLeads,
      recentAnnouncements,
      recentActivities,
      upcomingEvents
    }
  });
});

/* ==========================================================================
   HRMS: EMPLOYEE MANAGEMENT
   ========================================================================== */

/**
 * GET /api/employees
 */
app.get('/api/employees', authenticateToken, (req, res) => {
  const db = readData();
  let list = db.employees || [];

  const { search, department, status } = req.query;

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(e => 
      e.name.toLowerCase().includes(q) || 
      e.email.toLowerCase().includes(q) || 
      e.employeeId.toLowerCase().includes(q)
    );
  }

  if (department && department !== 'All') {
    list = list.filter(e => e.department.toLowerCase() === department.toLowerCase());
  }

  if (status && status !== 'All') {
    list = list.filter(e => e.status.toLowerCase() === status.toLowerCase());
  }

  return res.status(200).json({
    success: true,
    message: 'Employees retrieved successfully.',
    data: list
  });
});

/**
 * GET /api/employees/:id
 */
app.get('/api/employees/:id', authenticateToken, (req, res) => {
  const db = readData();
  const employee = (db.employees || []).find(e => e.id === req.params.id || e.employeeId === req.params.id);

  if (!employee) {
    return res.status(404).json({
      success: false,
      message: 'Employee record not found.'
    });
  }

  return res.status(200).json({
    success: true,
    data: employee
  });
});

/**
 * POST /api/employees
 */
app.post('/api/employees', authenticateToken, authorizeRoles('Admin', 'HR Manager'), (req, res) => {
  const db = readData();
  const { name, email, phone, department, designation, role, joiningDate, salary, status, address, birthDate } = req.body;

  if (!name || !email || !department || !designation) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields (Name, Email, Department, Designation).'
    });
  }

  // Prevent duplicate email check
  const duplicate = db.employees.find(e => e.email.toLowerCase() === email.trim().toLowerCase());
  if (duplicate) {
    return res.status(400).json({
      success: false,
      message: 'An employee with this email address already exists.'
    });
  }

  const newIdNum = (db.employees.length + 1).toString().padStart(3, '0');
  const employeeId = `EMP-${newIdNum}`;

  const newEmployee = {
    id: 'emp-' + Date.now(),
    employeeId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '+1 (555) 000-0000',
    department: department.trim(),
    designation: designation.trim(),
    role: role || 'Employee',
    joiningDate: joiningDate || new Date().toISOString().split('T')[0],
    salary: Number(salary) || 60000,
    status: status || 'Active',
    birthDate: birthDate || '1995-01-01',
    address: address ? address.trim() : 'San Francisco, CA'
  };

  db.employees.push(newEmployee);

  // If role is set, create login account if not exists
  const existingUser = db.users.find(u => u.email.toLowerCase() === newEmployee.email);
  if (!existingUser) {
    db.users.push({
      id: 'usr-' + Date.now(),
      name: newEmployee.name,
      email: newEmployee.email,
      password: bcrypt.hashSync('Employee@123', 10),
      role: newEmployee.role,
      designation: newEmployee.designation,
      department: newEmployee.department,
      employeeId: newEmployee.employeeId
    });
  }

  saveData(db);

  return res.status(201).json({
    success: true,
    message: 'Employee registered successfully.',
    data: newEmployee
  });
});

/**
 * PUT /api/employees/:id
 */
app.put('/api/employees/:id', authenticateToken, authorizeRoles('Admin', 'HR Manager'), (req, res) => {
  const db = readData();
  const index = db.employees.findIndex(e => e.id === req.params.id || e.employeeId === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found.'
    });
  }

  const current = db.employees[index];
  const { name, email, phone, department, designation, role, joiningDate, salary, status, address, birthDate } = req.body;

  // Check email collision
  if (email && email.toLowerCase() !== current.email.toLowerCase()) {
    const dup = db.employees.find(e => e.email.toLowerCase() === email.toLowerCase() && e.id !== current.id);
    if (dup) {
      return res.status(400).json({
        success: false,
        message: 'This email is already in use by another employee.'
      });
    }
  }

  const updatedEmployee = {
    ...current,
    name: name ? name.trim() : current.name,
    email: email ? email.trim().toLowerCase() : current.email,
    phone: phone !== undefined ? phone.trim() : current.phone,
    department: department ? department.trim() : current.department,
    designation: designation ? designation.trim() : current.designation,
    role: role || current.role,
    joiningDate: joiningDate || current.joiningDate,
    salary: salary !== undefined ? Number(salary) : current.salary,
    status: status || current.status,
    address: address !== undefined ? address.trim() : current.address,
    birthDate: birthDate || current.birthDate
  };

  db.employees[index] = updatedEmployee;

  // Sync associated user if email or name changes
  const userIdx = db.users.findIndex(u => u.employeeId === current.employeeId || u.email === current.email);
  if (userIdx !== -1) {
    db.users[userIdx].name = updatedEmployee.name;
    db.users[userIdx].email = updatedEmployee.email;
    db.users[userIdx].role = updatedEmployee.role;
    db.users[userIdx].department = updatedEmployee.department;
    db.users[userIdx].designation = updatedEmployee.designation;
  }

  saveData(db);

  return res.status(200).json({
    success: true,
    message: 'Employee record updated successfully.',
    data: updatedEmployee
  });
});

/**
 * DELETE /api/employees/:id
 */
app.delete('/api/employees/:id', authenticateToken, authorizeRoles('Admin', 'HR Manager'), (req, res) => {
  const db = readData();
  const index = db.employees.findIndex(e => e.id === req.params.id || e.employeeId === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Employee not found.'
    });
  }

  const removed = db.employees.splice(index, 1)[0];
  // Remove linked user if present
  db.users = db.users.filter(u => u.email !== removed.email && u.employeeId !== removed.employeeId);

  saveData(db);

  return res.status(200).json({
    success: true,
    message: `Employee ${removed.name} deleted successfully.`
  });
});

/* ==========================================================================
   HRMS: DEPARTMENT MANAGEMENT
   ========================================================================== */

/**
 * GET /api/departments
 */
app.get('/api/departments', authenticateToken, (req, res) => {
  const db = readData();
  const departments = db.departments || [];
  const employees = db.employees || [];

  // Compute live employee count for each department
  const enriched = departments.map(d => {
    const count = employees.filter(e => e.department.toLowerCase() === d.name.toLowerCase()).length;
    return {
      ...d,
      employeeCount: count
    };
  });

  return res.status(200).json({
    success: true,
    data: enriched
  });
});

/**
 * POST /api/departments
 */
app.post('/api/departments', authenticateToken, authorizeRoles('Admin', 'HR Manager'), (req, res) => {
  const db = readData();
  const { name, head, description } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Department name is required.'
    });
  }

  const existing = db.departments.find(d => d.name.toLowerCase() === name.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'A department with this name already exists.'
    });
  }

  const newDept = {
    id: 'dept-' + Date.now(),
    name: name.trim(),
    head: head ? head.trim() : 'Unassigned',
    description: description ? description.trim() : '',
    createdAt: new Date().toISOString().split('T')[0]
  };

  db.departments.push(newDept);
  saveData(db);

  return res.status(201).json({
    success: true,
    message: 'Department created successfully.',
    data: newDept
  });
});

/**
 * PUT /api/departments/:id
 */
app.put('/api/departments/:id', authenticateToken, authorizeRoles('Admin', 'HR Manager'), (req, res) => {
  const db = readData();
  const index = db.departments.findIndex(d => d.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Department not found.'
    });
  }

  const current = db.departments[index];
  const { name, head, description } = req.body;

  if (name && name.toLowerCase() !== current.name.toLowerCase()) {
    const dup = db.departments.find(d => d.name.toLowerCase() === name.toLowerCase() && d.id !== current.id);
    if (dup) {
      return res.status(400).json({
        success: false,
        message: 'Another department already uses this name.'
      });
    }

    // Update department name in all attached employees
    db.employees.forEach(emp => {
      if (emp.department.toLowerCase() === current.name.toLowerCase()) {
        emp.department = name.trim();
      }
    });
  }

  const updatedDept = {
    ...current,
    name: name ? name.trim() : current.name,
    head: head !== undefined ? head.trim() : current.head,
    description: description !== undefined ? description.trim() : current.description
  };

  db.departments[index] = updatedDept;
  saveData(db);

  return res.status(200).json({
    success: true,
    message: 'Department updated successfully.',
    data: updatedDept
  });
});

/**
 * DELETE /api/departments/:id
 */
app.delete('/api/departments/:id', authenticateToken, authorizeRoles('Admin', 'HR Manager'), (req, res) => {
  const db = readData();
  const dept = db.departments.find(d => d.id === req.params.id);

  if (!dept) {
    return res.status(404).json({
      success: false,
      message: 'Department not found.'
    });
  }

  // Prevent deletion if department has active employees
  const attachedEmployees = db.employees.filter(e => e.department.toLowerCase() === dept.name.toLowerCase());
  if (attachedEmployees.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete department '${dept.name}'. It currently has ${attachedEmployees.length} assigned employee(s). Reassign them first.`
    });
  }

  db.departments = db.departments.filter(d => d.id !== req.params.id);
  saveData(db);

  return res.status(200).json({
    success: true,
    message: `Department '${dept.name}' deleted successfully.`
  });
});

/* ==========================================================================
   HRMS: ATTENDANCE MANAGEMENT
   ========================================================================== */

/**
 * Helper to get formatted 12-hour time string
 */
function getCurrentTimeString() {
  const d = new Date();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

/**
 * GET /api/attendance
 */
app.get('/api/attendance', authenticateToken, (req, res) => {
  const db = readData();
  let list = db.attendance || [];

  const { date, status, employeeId } = req.query;

  // If logged-in user is regular employee, filter to their records unless Admin/HR
  if (req.user.role === 'Employee' && !req.user.role.includes('Admin') && !req.user.role.includes('HR')) {
    list = list.filter(a => a.employeeId === req.user.employeeId);
  } else if (employeeId) {
    list = list.filter(a => a.employeeId === employeeId);
  }

  if (date) {
    list = list.filter(a => a.date === date);
  }

  if (status && status !== 'All') {
    list = list.filter(a => a.status.toLowerCase() === status.toLowerCase());
  }

  // Sort descending by date
  list.sort((a, b) => new Date(b.date) - new Date(a.date));

  return res.status(200).json({
    success: true,
    data: list
  });
});

/**
 * POST /api/attendance/check-in
 */
app.post('/api/attendance/check-in', authenticateToken, (req, res) => {
  const db = readData();
  const today = new Date().toISOString().split('T')[0];
  const userEmpId = req.user.employeeId || 'EMP-001';

  // Check if already checked in today
  const existing = db.attendance.find(a => a.employeeId === userEmpId && a.date === today);
  if (existing) {
    return res.status(400).json({
      success: false,
      message: `You have already checked in today at ${existing.checkIn}.`
    });
  }

  const checkInTime = getCurrentTimeString();
  const currentHour = new Date().getHours();
  let status = 'Present';
  if (currentHour >= 10) {
    status = 'Late';
  }

  const newRecord = {
    id: 'att-' + Date.now(),
    employeeId: userEmpId,
    employeeName: req.user.name,
    date: today,
    checkIn: checkInTime,
    checkOut: '--:--',
    workHours: 'In Progress',
    status,
    notes: req.body.notes || 'Self check-in'
  };

  db.attendance.push(newRecord);
  saveData(db);

  return res.status(201).json({
    success: true,
    message: `Checked in successfully at ${checkInTime}.`,
    data: newRecord
  });
});

/**
 * PUT /api/attendance/check-out
 */
app.put('/api/attendance/check-out', authenticateToken, (req, res) => {
  const db = readData();
  const today = new Date().toISOString().split('T')[0];
  const userEmpId = req.user.employeeId || 'EMP-001';

  const record = db.attendance.find(a => a.employeeId === userEmpId && a.date === today);
  if (!record) {
    return res.status(400).json({
      success: false,
      message: 'No check-in record found for today. Please check in first.'
    });
  }

  if (record.checkOut !== '--:--') {
    return res.status(400).json({
      success: false,
      message: `You have already checked out today at ${record.checkOut}.`
    });
  }

  const checkOutTime = getCurrentTimeString();
  record.checkOut = checkOutTime;

  // Calculate approximate hours
  record.workHours = '8.00'; // Standard working block
  if (req.body.notes) {
    record.notes = req.body.notes;
  }

  saveData(db);

  return res.status(200).json({
    success: true,
    message: `Checked out successfully at ${checkOutTime}.`,
    data: record
  });
});

/**
 * POST /api/attendance/mark
 * Admin / HR Manager manual marking
 */
app.post('/api/attendance/mark', authenticateToken, authorizeRoles('Admin', 'HR Manager'), (req, res) => {
  const db = readData();
  const { employeeId, date, checkIn, checkOut, status, notes } = req.body;

  if (!employeeId || !date || !status) {
    return res.status(400).json({
      success: false,
      message: 'Employee, Date, and Attendance Status are required.'
    });
  }

  const employee = db.employees.find(e => e.employeeId === employeeId || e.id === employeeId);
  const empName = employee ? employee.name : 'Staff Member';

  // Check if entry for employee and date exists
  const existingIdx = db.attendance.findIndex(a => a.employeeId === employeeId && a.date === date);

  let workHours = '8.00';
  if (status === 'Absent') workHours = '0';
  else if (status === 'Half Day') workHours = '4.00';

  if (existingIdx !== -1) {
    db.attendance[existingIdx] = {
      ...db.attendance[existingIdx],
      checkIn: checkIn || db.attendance[existingIdx].checkIn || '09:00 AM',
      checkOut: checkOut || db.attendance[existingIdx].checkOut || '05:00 PM',
      status,
      workHours,
      notes: notes || db.attendance[existingIdx].notes
    };
  } else {
    db.attendance.push({
      id: 'att-' + Date.now(),
      employeeId,
      employeeName: empName,
      date,
      checkIn: checkIn || (status === 'Absent' ? '--:--' : '09:00 AM'),
      checkOut: checkOut || (status === 'Absent' ? '--:--' : '05:00 PM'),
      workHours,
      status,
      notes: notes || 'Manual entry by HR'
    });
  }

  saveData(db);

  return res.status(200).json({
    success: true,
    message: 'Attendance record saved successfully.'
  });
});

/* ==========================================================================
   HRMS: LEAVE MANAGEMENT
   ========================================================================== */

/**
 * GET /api/leaves
 */
app.get('/api/leaves', authenticateToken, (req, res) => {
  const db = readData();
  let list = db.leaves || [];

  // Employee only sees their own leaves
  if (req.user.role === 'Employee') {
    list = list.filter(l => l.employeeId === req.user.employeeId);
  }

  const { status, type } = req.query;
  if (status && status !== 'All') {
    list = list.filter(l => l.status.toLowerCase() === status.toLowerCase());
  }
  if (type && type !== 'All') {
    list = list.filter(l => l.leaveType.toLowerCase() === type.toLowerCase());
  }

  list.sort((a, b) => new Date(b.appliedAt || b.startDate) - new Date(a.appliedAt || a.startDate));

  return res.status(200).json({
    success: true,
    data: list
  });
});

/**
 * POST /api/leaves
 */
app.post('/api/leaves', authenticateToken, (req, res) => {
  const db = readData();
  const { leaveType, startDate, endDate, reason } = req.body;

  if (!leaveType || !startDate || !endDate || !reason) {
    return res.status(400).json({
      success: false,
      message: 'All fields (Leave Type, Start Date, End Date, Reason) are required.'
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    return res.status(400).json({
      success: false,
      message: 'End date cannot be earlier than start date.'
    });
  }

  // Calculate day difference (inclusive)
  const diffTime = Math.abs(end - start);
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const newLeave = {
    id: 'lev-' + Date.now(),
    employeeId: req.user.employeeId || 'EMP-001',
    employeeName: req.user.name,
    leaveType,
    startDate,
    endDate,
    totalDays,
    reason: reason.trim(),
    status: 'Pending',
    appliedAt: new Date().toISOString().split('T')[0]
  };

  db.leaves.push(newLeave);
  saveData(db);

  return res.status(201).json({
    success: true,
    message: 'Leave application submitted successfully.',
    data: newLeave
  });
});

/**
 * PUT /api/leaves/:id/status
 */
app.put('/api/leaves/:id/status', authenticateToken, authorizeRoles('Admin', 'HR Manager'), (req, res) => {
  const db = readData();
  const leave = db.leaves.find(l => l.id === req.params.id);

  if (!leave) {
    return res.status(404).json({
      success: false,
      message: 'Leave request not found.'
    });
  }

  const { status } = req.body;
  if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Status must be Approved, Rejected, or Pending.'
    });
  }

  leave.status = status;
  leave.reviewedBy = req.user.name;
  leave.reviewedAt = new Date().toISOString().split('T')[0];

  saveData(db);

  return res.status(200).json({
    success: true,
    message: `Leave request status updated to ${status}.`,
    data: leave
  });
});

/* ==========================================================================
   HRMS: ANNOUNCEMENTS
   ========================================================================== */

/**
 * GET /api/announcements
 */
app.get('/api/announcements', authenticateToken, (req, res) => {
  const db = readData();
  const announcements = (db.announcements || []).sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
  return res.status(200).json({
    success: true,
    data: announcements
  });
});

/**
 * POST /api/announcements
 */
app.post('/api/announcements', authenticateToken, authorizeRoles('Admin', 'HR Manager'), (req, res) => {
  const db = readData();
  const { title, message, priority } = req.body;

  if (!title || !message) {
    return res.status(400).json({
      success: false,
      message: 'Title and announcement message are required.'
    });
  }

  const newAnnouncement = {
    id: 'anc-' + Date.now(),
    title: title.trim(),
    message: message.trim(),
    priority: priority || 'Normal',
    author: req.user.name,
    publishedDate: new Date().toISOString().split('T')[0]
  };

  db.announcements.push(newAnnouncement);
  saveData(db);

  return res.status(201).json({
    success: true,
    message: 'Announcement published successfully.',
    data: newAnnouncement
  });
});

/**
 * PUT /api/announcements/:id
 */
app.put('/api/announcements/:id', authenticateToken, authorizeRoles('Admin', 'HR Manager'), (req, res) => {
  const db = readData();
  const index = db.announcements.findIndex(a => a.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found.'
    });
  }

  const current = db.announcements[index];
  const { title, message, priority } = req.body;

  db.announcements[index] = {
    ...current,
    title: title ? title.trim() : current.title,
    message: message ? message.trim() : current.message,
    priority: priority || current.priority
  };

  saveData(db);

  return res.status(200).json({
    success: true,
    message: 'Announcement updated successfully.',
    data: db.announcements[index]
  });
});

/**
 * DELETE /api/announcements/:id
 */
app.delete('/api/announcements/:id', authenticateToken, authorizeRoles('Admin', 'HR Manager'), (req, res) => {
  const db = readData();
  const index = db.announcements.findIndex(a => a.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found.'
    });
  }

  db.announcements.splice(index, 1);
  saveData(db);

  return res.status(200).json({
    success: true,
    message: 'Announcement deleted successfully.'
  });
});

/* ==========================================================================
   CRM: COMPANY MANAGEMENT
   ========================================================================== */

/**
 * GET /api/companies
 */
app.get('/api/companies', authenticateToken, (req, res) => {
  const db = readData();
  let list = db.companies || [];

  const { search, industry, status } = req.query;

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }
  if (industry && industry !== 'All') {
    list = list.filter(c => c.industry.toLowerCase() === industry.toLowerCase());
  }
  if (status && status !== 'All') {
    list = list.filter(c => c.status.toLowerCase() === status.toLowerCase());
  }

  return res.status(200).json({
    success: true,
    data: list
  });
});

/**
 * POST /api/companies
 */
app.post('/api/companies', authenticateToken, authorizeRoles('Admin', 'Sales Executive'), (req, res) => {
  const db = readData();
  const { name, industry, website, phone, email, address, status, revenue } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Company name and email are required.'
    });
  }

  const newCompany = {
    id: 'comp-' + Date.now(),
    name: name.trim(),
    industry: industry ? industry.trim() : 'Technology',
    website: website ? website.trim() : 'https://example.com',
    phone: phone ? phone.trim() : '+1 (800) 000-0000',
    email: email.trim().toLowerCase(),
    address: address ? address.trim() : 'New York, NY',
    status: status || 'Active',
    revenue: revenue ? revenue.trim() : '$1M+'
  };

  db.companies.push(newCompany);
  saveData(db);

  return res.status(201).json({
    success: true,
    message: 'Company profile created successfully.',
    data: newCompany
  });
});

/**
 * PUT /api/companies/:id
 */
app.put('/api/companies/:id', authenticateToken, authorizeRoles('Admin', 'Sales Executive'), (req, res) => {
  const db = readData();
  const index = db.companies.findIndex(c => c.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Company not found.'
    });
  }

  const current = db.companies[index];
  const { name, industry, website, phone, email, address, status, revenue } = req.body;

  db.companies[index] = {
    ...current,
    name: name ? name.trim() : current.name,
    industry: industry ? industry.trim() : current.industry,
    website: website !== undefined ? website.trim() : current.website,
    phone: phone !== undefined ? phone.trim() : current.phone,
    email: email ? email.trim().toLowerCase() : current.email,
    address: address !== undefined ? address.trim() : current.address,
    status: status || current.status,
    revenue: revenue !== undefined ? revenue.trim() : current.revenue
  };

  saveData(db);

  return res.status(200).json({
    success: true,
    message: 'Company updated successfully.',
    data: db.companies[index]
  });
});

/**
 * DELETE /api/companies/:id
 */
app.delete('/api/companies/:id', authenticateToken, authorizeRoles('Admin', 'Sales Executive'), (req, res) => {
  const db = readData();
  const index = db.companies.findIndex(c => c.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Company not found.'
    });
  }

  db.companies.splice(index, 1);
  saveData(db);

  return res.status(200).json({
    success: true,
    message: 'Company deleted successfully.'
  });
});

/* ==========================================================================
   CRM: CONTACT MANAGEMENT
   ========================================================================== */

/**
 * GET /api/contacts
 */
app.get('/api/contacts', authenticateToken, (req, res) => {
  const db = readData();
  let list = db.contacts || [];

  const { search, company } = req.query;

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }

  if (company && company !== 'All') {
    list = list.filter(c => c.company.toLowerCase() === company.toLowerCase());
  }

  return res.status(200).json({
    success: true,
    data: list
  });
});

/**
 * POST /api/contacts
 */
app.post('/api/contacts', authenticateToken, authorizeRoles('Admin', 'Sales Executive'), (req, res) => {
  const db = readData();
  const { name, company, email, phone, jobTitle, owner } = req.body;

  if (!name || !company || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name, Company, and Email are required.'
    });
  }

  // Ensure selected company exists
  const companyExists = db.companies.some(c => c.name.toLowerCase() === company.trim().toLowerCase());
  if (!companyExists) {
    // Optionally create or accept
  }

  const newContact = {
    id: 'cnt-' + Date.now(),
    name: name.trim(),
    company: company.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '+1 (555) 000-0000',
    jobTitle: jobTitle ? jobTitle.trim() : 'Representative',
    owner: owner ? owner.trim() : req.user.name
  };

  db.contacts.push(newContact);
  saveData(db);

  return res.status(201).json({
    success: true,
    message: 'Contact added successfully.',
    data: newContact
  });
});

/**
 * PUT /api/contacts/:id
 */
app.put('/api/contacts/:id', authenticateToken, authorizeRoles('Admin', 'Sales Executive'), (req, res) => {
  const db = readData();
  const index = db.contacts.findIndex(c => c.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Contact not found.'
    });
  }

  const current = db.contacts[index];
  const { name, company, email, phone, jobTitle, owner } = req.body;

  db.contacts[index] = {
    ...current,
    name: name ? name.trim() : current.name,
    company: company ? company.trim() : current.company,
    email: email ? email.trim().toLowerCase() : current.email,
    phone: phone !== undefined ? phone.trim() : current.phone,
    jobTitle: jobTitle ? jobTitle.trim() : current.jobTitle,
    owner: owner || current.owner
  };

  saveData(db);

  return res.status(200).json({
    success: true,
    message: 'Contact updated successfully.',
    data: db.contacts[index]
  });
});

/**
 * DELETE /api/contacts/:id
 */
app.delete('/api/contacts/:id', authenticateToken, authorizeRoles('Admin', 'Sales Executive'), (req, res) => {
  const db = readData();
  const index = db.contacts.findIndex(c => c.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Contact not found.'
    });
  }

  db.contacts.splice(index, 1);
  saveData(db);

  return res.status(200).json({
    success: true,
    message: 'Contact removed successfully.'
  });
});

/* ==========================================================================
   CRM: LEADS & PIPELINE MANAGEMENT
   ========================================================================== */

/**
 * GET /api/leads
 */
app.get('/api/leads', authenticateToken, (req, res) => {
  const db = readData();
  let list = db.leads || [];

  const { search, stage, assignedTo } = req.query;

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(l => 
      l.title.toLowerCase().includes(q) || 
      l.company.toLowerCase().includes(q) || 
      l.contact.toLowerCase().includes(q)
    );
  }

  if (stage && stage !== 'All') {
    list = list.filter(l => l.stage.toLowerCase() === stage.toLowerCase());
  }

  if (assignedTo && assignedTo !== 'All') {
    list = list.filter(l => l.assignedTo.toLowerCase() === assignedTo.toLowerCase());
  }

  return res.status(200).json({
    success: true,
    data: list
  });
});

/**
 * POST /api/leads
 */
app.post('/api/leads', authenticateToken, authorizeRoles('Admin', 'Sales Executive'), (req, res) => {
  const db = readData();
  const { title, company, contact, source, estimatedValue, assignedTo, expectedCloseDate, stage, notes } = req.body;

  if (!title || !company) {
    return res.status(400).json({
      success: false,
      message: 'Lead title and Company name are required.'
    });
  }

  const newLead = {
    id: 'lead-' + Date.now(),
    title: title.trim(),
    company: company.trim(),
    contact: contact ? contact.trim() : 'Primary Contact',
    source: source || 'Website',
    estimatedValue: Number(estimatedValue) || 0,
    assignedTo: assignedTo || req.user.name,
    expectedCloseDate: expectedCloseDate || new Date().toISOString().split('T')[0],
    stage: stage || 'New',
    notes: notes ? notes.trim() : ''
  };

  db.leads.push(newLead);

  // Auto-log initial lead creation activity
  db.activities.push({
    id: 'act-' + Date.now(),
    leadId: newLead.id,
    leadTitle: newLead.title,
    type: 'Note',
    date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    description: `Lead created under stage '${newLead.stage}' by ${req.user.name}.`,
    status: 'Completed',
    nextFollowUp: newLead.expectedCloseDate
  });

  saveData(db);

  return res.status(201).json({
    success: true,
    message: 'Lead created successfully.',
    data: newLead
  });
});

/**
 * PUT /api/leads/:id
 */
app.put('/api/leads/:id', authenticateToken, authorizeRoles('Admin', 'Sales Executive'), (req, res) => {
  const db = readData();
  const index = db.leads.findIndex(l => l.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Lead not found.'
    });
  }

  const current = db.leads[index];
  const { title, company, contact, source, estimatedValue, assignedTo, expectedCloseDate, stage, notes } = req.body;

  db.leads[index] = {
    ...current,
    title: title ? title.trim() : current.title,
    company: company ? company.trim() : current.company,
    contact: contact !== undefined ? contact.trim() : current.contact,
    source: source || current.source,
    estimatedValue: estimatedValue !== undefined ? Number(estimatedValue) : current.estimatedValue,
    assignedTo: assignedTo || current.assignedTo,
    expectedCloseDate: expectedCloseDate || current.expectedCloseDate,
    stage: stage || current.stage,
    notes: notes !== undefined ? notes.trim() : current.notes
  };

  saveData(db);

  return res.status(200).json({
    success: true,
    message: 'Lead updated successfully.',
    data: db.leads[index]
  });
});

/**
 * PUT /api/leads/:id/stage
 * Rapid update for Kanban drag & drop or quick stage changes
 */
app.put('/api/leads/:id/stage', authenticateToken, authorizeRoles('Admin', 'Sales Executive'), (req, res) => {
  const db = readData();
  const lead = db.leads.find(l => l.id === req.params.id);

  if (!lead) {
    return res.status(404).json({
      success: false,
      message: 'Lead not found.'
    });
  }

  const { stage } = req.body;
  const validStages = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
  if (!validStages.includes(stage)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid lead stage specified.'
    });
  }

  const oldStage = lead.stage;
  lead.stage = stage;

  // Add activity log for pipeline movement
  db.activities.push({
    id: 'act-' + Date.now(),
    leadId: lead.id,
    leadTitle: lead.title,
    type: 'Follow-up',
    date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    description: `Pipeline stage changed from ${oldStage} to ${stage} by ${req.user.name}.`,
    status: 'Completed',
    nextFollowUp: lead.expectedCloseDate
  });

  saveData(db);

  return res.status(200).json({
    success: true,
    message: `Lead moved to stage ${stage}.`,
    data: lead
  });
});

/**
 * DELETE /api/leads/:id
 */
app.delete('/api/leads/:id', authenticateToken, authorizeRoles('Admin', 'Sales Executive'), (req, res) => {
  const db = readData();
  const index = db.leads.findIndex(l => l.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Lead not found.'
    });
  }

  db.leads.splice(index, 1);
  // Clean up activities
  db.activities = db.activities.filter(a => a.leadId !== req.params.id);

  saveData(db);

  return res.status(200).json({
    success: true,
    message: 'Lead deleted successfully.'
  });
});

/* ==========================================================================
   CRM: OPPORTUNITIES & ACTIVITIES
   ========================================================================== */

/**
 * GET /api/activities
 */
app.get('/api/activities', authenticateToken, (req, res) => {
  const db = readData();
  let list = db.activities || [];

  const { leadId } = req.query;
  if (leadId) {
    list = list.filter(a => a.leadId === leadId);
  }

  // Sort by date newest first
  list.sort((a, b) => new Date(b.date) - new Date(a.date));

  return res.status(200).json({
    success: true,
    data: list
  });
});

/**
 * POST /api/activities
 */
app.post('/api/activities', authenticateToken, authorizeRoles('Admin', 'Sales Executive'), (req, res) => {
  const db = readData();
  const { leadId, type, description, status, nextFollowUp } = req.body;

  if (!leadId || !description) {
    return res.status(400).json({
      success: false,
      message: 'Related lead and activity description are required.'
    });
  }

  const lead = db.leads.find(l => l.id === leadId);
  const leadTitle = lead ? lead.title : 'General Lead';

  const newActivity = {
    id: 'act-' + Date.now(),
    leadId,
    leadTitle,
    type: type || 'Follow-up',
    date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    description: description.trim(),
    status: status || 'Completed',
    nextFollowUp: nextFollowUp || ''
  };

  db.activities.push(newActivity);
  saveData(db);

  return res.status(201).json({
    success: true,
    message: 'Activity logged successfully.',
    data: newActivity
  });
});

/* ==========================================================================
   STATIC FALLBACK & 404 HANDLER
   ========================================================================== */

// Catch-all route to serve dashboard for SPA routes or fallback to login
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint '${req.method} ${req.originalUrl}' not found.`
    });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  🚀 HUMINEXA HRMS & CRM Management System`);
  console.log(`  🌐 Server running at: http://localhost:${PORT}`);
  console.log(`  🔑 Default Admin: admin@huminexa.com | Admin@123`);
  console.log(`=======================================================`);
});
