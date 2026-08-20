const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_FILE_PATH = path.join(__dirname, 'data', 'data.json');

/**
 * Initialize and verify Database file
 */
function initDb() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let data;
  if (!fs.existsSync(DATA_FILE_PATH)) {
    console.log('[DB] data.json not found. Initializing seed data...');
    data = getInitialSeedData();
    saveData(data);
  } else {
    try {
      const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      data = JSON.parse(fileContent);
    } catch (err) {
      console.error('[DB Error] Corrupt data.json. Rebuilding from seed:', err);
      data = getInitialSeedData();
      saveData(data);
    }
  }

  // Ensure default demo credentials are appropriately hashed
  let modified = false;
  const defaultAccounts = [
    { email: 'admin@huminexa.com', pass: 'Admin@123', role: 'Admin', name: 'Alexander Vance' },
    { email: 'hr@huminexa.com', pass: 'Hr@123', role: 'HR Manager', name: 'Eleanor Sterling' },
    { email: 'sales@huminexa.com', pass: 'Sales@123', role: 'Sales Executive', name: 'Marcus Kane' },
    { email: 'employee@huminexa.com', pass: 'Employee@123', role: 'Employee', name: 'Sophia Bennett' }
  ];

  if (!data.users || data.users.length === 0) {
    data.users = [];
  }

  defaultAccounts.forEach(acc => {
    const existing = data.users.find(u => u.email.toLowerCase() === acc.email.toLowerCase());
    if (!existing) {
      data.users.push({
        id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        name: acc.name,
        email: acc.email,
        password: bcrypt.hashSync(acc.pass, 10),
        role: acc.role,
        designation: acc.role,
        department: 'General',
        employeeId: 'EMP-DEMO'
      });
      modified = true;
    } else {
      // If password is not a bcrypt hash or if we need to guarantee exact password
      const isMatch = bcrypt.compareSync(acc.pass, existing.password);
      if (!isMatch) {
        existing.password = bcrypt.hashSync(acc.pass, 10);
        modified = true;
      }
    }
  });

  if (modified) {
    saveData(data);
    console.log('[DB] Demo user credentials verified and synchronized.');
  }

  return data;
}

/**
 * Read data synchronously
 */
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE_PATH)) {
      return initDb();
    }
    const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[DB Read Error]', err);
    return initDb();
  }
}

/**
 * Write data atomically to avoid file corruption
 */
function saveData(data) {
  try {
    const tempFile = `${DATA_FILE_PATH}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE_PATH);
    return true;
  } catch (err) {
    console.error('[DB Write Error]', err);
    return false;
  }
}

/**
 * Fallback seed data in case file is fresh or recreated
 */
function getInitialSeedData() {
  return {
    users: [
      {
        id: "usr-admin-01",
        name: "Alexander Vance",
        email: "admin@huminexa.com",
        password: bcrypt.hashSync("Admin@123", 10),
        role: "Admin",
        designation: "Chief Technology Officer & Admin",
        department: "Executive Management",
        employeeId: "EMP-001"
      },
      {
        id: "usr-hr-02",
        name: "Eleanor Sterling",
        email: "hr@huminexa.com",
        password: bcrypt.hashSync("Hr@123", 10),
        role: "HR Manager",
        designation: "Head of People & Culture",
        department: "Human Resources",
        employeeId: "EMP-002"
      },
      {
        id: "usr-sales-03",
        name: "Marcus Kane",
        email: "sales@huminexa.com",
        password: bcrypt.hashSync("Sales@123", 10),
        role: "Sales Executive",
        designation: "Senior Enterprise Sales Lead",
        department: "Sales & Marketing",
        employeeId: "EMP-003"
      },
      {
        id: "usr-emp-04",
        name: "Sophia Bennett",
        email: "employee@huminexa.com",
        password: bcrypt.hashSync("Employee@123", 10),
        role: "Employee",
        designation: "Full-Stack Software Engineer",
        department: "Engineering",
        employeeId: "EMP-004"
      }
    ],
    departments: [
      {
        id: "dept-1",
        name: "Engineering",
        head: "Alexander Vance",
        description: "Software architecture, cloud platforms, DevOps, and quality assurance.",
        createdAt: "2024-01-15"
      },
      {
        id: "dept-2",
        name: "Human Resources",
        head: "Eleanor Sterling",
        description: "Talent acquisition, employee relations, payroll, and organizational development.",
        createdAt: "2024-01-15"
      },
      {
        id: "dept-3",
        name: "Sales & Marketing",
        head: "Marcus Kane",
        description: "B2B client acquisition, digital marketing campaigns, and customer success.",
        createdAt: "2024-01-15"
      },
      {
        id: "dept-4",
        name: "Finance & Operations",
        head: "Julian Price",
        description: "Financial planning, accounting compliance, supply chain, and general operations.",
        createdAt: "2024-02-01"
      }
    ],
    employees: [
      {
        id: "emp-1",
        employeeId: "EMP-001",
        name: "Alexander Vance",
        email: "admin@huminexa.com",
        phone: "+1 (555) 234-5671",
        department: "Engineering",
        designation: "Chief Technology Officer",
        role: "Admin",
        joiningDate: "2023-01-10",
        salary: 145000,
        status: "Active",
        birthDate: "1988-06-14",
        address: "742 Evergreen Terrace, San Francisco, CA"
      },
      {
        id: "emp-2",
        employeeId: "EMP-002",
        name: "Eleanor Sterling",
        email: "hr@huminexa.com",
        phone: "+1 (555) 345-6782",
        department: "Human Resources",
        designation: "Head of People & Culture",
        role: "HR Manager",
        joiningDate: "2023-03-01",
        salary: 98000,
        status: "Active",
        birthDate: "1992-09-22",
        address: "120 Oakridge Blvd, Austin, TX"
      },
      {
        id: "emp-3",
        employeeId: "EMP-003",
        name: "Marcus Kane",
        email: "sales@huminexa.com",
        phone: "+1 (555) 456-7893",
        department: "Sales & Marketing",
        designation: "Senior Enterprise Sales Lead",
        role: "Sales Executive",
        joiningDate: "2023-05-15",
        salary: 105000,
        status: "Active",
        birthDate: "1990-11-04",
        address: "45 Wall Street Ave, New York, NY"
      },
      {
        id: "emp-4",
        employeeId: "EMP-004",
        name: "Sophia Bennett",
        email: "employee@huminexa.com",
        phone: "+1 (555) 567-8904",
        department: "Engineering",
        designation: "Full-Stack Software Engineer",
        role: "Employee",
        joiningDate: "2023-08-20",
        salary: 88000,
        status: "Active",
        birthDate: "1995-04-18",
        address: "88 Pine Street, Seattle, WA"
      },
      {
        id: "emp-5",
        employeeId: "EMP-005",
        name: "Liam Gallagher",
        email: "liam.g@huminexa.com",
        phone: "+1 (555) 678-9015",
        department: "Engineering",
        designation: "DevOps Cloud Architect",
        role: "Employee",
        joiningDate: "2023-09-01",
        salary: 115000,
        status: "Active",
        birthDate: "1991-12-30",
        address: "303 Maple Rd, Denver, CO"
      },
      {
        id: "emp-6",
        employeeId: "EMP-006",
        name: "Clara Oswald",
        email: "clara.o@huminexa.com",
        phone: "+1 (555) 789-0126",
        department: "Sales & Marketing",
        designation: "Digital Marketing Specialist",
        role: "Sales Executive",
        joiningDate: "2023-11-12",
        salary: 72000,
        status: "Active",
        birthDate: "1996-07-09",
        address: "512 Sunset Plaza, Los Angeles, CA"
      },
      {
        id: "emp-7",
        employeeId: "EMP-007",
        name: "Julian Price",
        email: "julian.p@huminexa.com",
        phone: "+1 (555) 890-1237",
        department: "Finance & Operations",
        designation: "Senior Financial Analyst",
        role: "Employee",
        joiningDate: "2024-01-08",
        salary: 92000,
        status: "Active",
        birthDate: "1989-03-27",
        address: "19 Michigan Ave, Chicago, IL"
      },
      {
        id: "emp-8",
        employeeId: "EMP-008",
        name: "Chloe Zhao",
        email: "chloe.z@huminexa.com",
        phone: "+1 (555) 901-2348",
        department: "Human Resources",
        designation: "Talent Acquisition Associate",
        role: "Employee",
        joiningDate: "2024-02-14",
        salary: 65000,
        status: "Active",
        birthDate: "1997-08-15",
        address: "77 Beacon St, Boston, MA"
      }
    ],
    attendance: [
      {
        id: "att-1",
        employeeId: "EMP-001",
        employeeName: "Alexander Vance",
        date: "2026-08-20",
        checkIn: "08:55 AM",
        checkOut: "05:30 PM",
        workHours: "8.58",
        status: "Present",
        notes: "Completed sprint review"
      },
      {
        id: "att-2",
        employeeId: "EMP-002",
        employeeName: "Eleanor Sterling",
        date: "2026-08-20",
        checkIn: "09:02 AM",
        checkOut: "05:15 PM",
        workHours: "8.22",
        status: "Present",
        notes: "On-site HR orientation"
      },
      {
        id: "att-3",
        employeeId: "EMP-003",
        employeeName: "Marcus Kane",
        date: "2026-08-20",
        checkIn: "09:20 AM",
        checkOut: "--:--",
        workHours: "In Progress",
        status: "Late",
        notes: "Client meeting in morning"
      },
      {
        id: "att-4",
        employeeId: "EMP-004",
        employeeName: "Sophia Bennett",
        date: "2026-08-20",
        checkIn: "08:50 AM",
        checkOut: "--:--",
        workHours: "In Progress",
        status: "Work From Home",
        notes: "Remote development session"
      },
      {
        id: "att-5",
        employeeId: "EMP-005",
        employeeName: "Liam Gallagher",
        date: "2026-08-20",
        checkIn: "09:00 AM",
        checkOut: "05:00 PM",
        workHours: "8.00",
        status: "Present",
        notes: "Cloud pipeline deployment"
      },
      {
        id: "att-6",
        employeeId: "EMP-006",
        employeeName: "Clara Oswald",
        date: "2026-08-20",
        checkIn: "--:--",
        checkOut: "--:--",
        workHours: "0",
        status: "Absent",
        notes: "Approved emergency leave"
      }
    ],
    leaves: [
      {
        id: "lev-1",
        employeeId: "EMP-004",
        employeeName: "Sophia Bennett",
        leaveType: "Annual Leave",
        startDate: "2026-08-25",
        endDate: "2026-08-28",
        totalDays: 4,
        reason: "Family vacation and personal travel.",
        status: "Pending",
        appliedAt: "2026-08-19"
      },
      {
        id: "lev-2",
        employeeId: "EMP-006",
        employeeName: "Clara Oswald",
        leaveType: "Sick Leave",
        startDate: "2026-08-20",
        endDate: "2026-08-20",
        totalDays: 1,
        reason: "Severe migraine and medical appointment.",
        status: "Approved",
        appliedAt: "2026-08-19",
        reviewedBy: "Eleanor Sterling"
      },
      {
        id: "lev-3",
        employeeId: "EMP-005",
        employeeName: "Liam Gallagher",
        leaveType: "Casual Leave",
        startDate: "2026-09-01",
        endDate: "2026-09-02",
        totalDays: 2,
        reason: "Home relocation and utilities setup.",
        status: "Pending",
        appliedAt: "2026-08-18"
      },
      {
        id: "lev-4",
        employeeId: "EMP-007",
        employeeName: "Julian Price",
        leaveType: "Maternity/Paternity",
        startDate: "2026-07-01",
        endDate: "2026-07-15",
        totalDays: 15,
        reason: "Paternity leave for newborn child.",
        status: "Approved",
        appliedAt: "2026-06-20",
        reviewedBy: "Eleanor Sterling"
      },
      {
        id: "lev-5",
        employeeId: "EMP-008",
        employeeName: "Chloe Zhao",
        leaveType: "Unpaid Leave",
        startDate: "2026-08-10",
        endDate: "2026-08-14",
        totalDays: 5,
        reason: "Extended examination prep.",
        status: "Rejected",
        appliedAt: "2026-08-01",
        reviewedBy: "Eleanor Sterling"
      }
    ],
    announcements: [
      {
        id: "anc-1",
        title: "Annual Company Tech Summit 2026",
        message: "We are thrilled to announce our Annual Tech Summit scheduled for September 20th in Austin, TX. Keynote speakers, innovation awards, and team dinner included!",
        priority: "High",
        author: "Alexander Vance",
        publishedDate: "2026-08-18"
      },
      {
        id: "anc-2",
        title: "Updated Health Insurance Benefits Policy",
        message: "The Human Resources department has updated the employee healthcare policy with comprehensive dental, optical, and mental health wellness programs effective next month.",
        priority: "Urgent",
        author: "Eleanor Sterling",
        publishedDate: "2026-08-15"
      },
      {
        id: "anc-3",
        title: "Hybrid Work Model Best Practices & Guidelines",
        message: "Please review the updated guidelines for remote check-in hours and collaborative core meeting slots between 10:00 AM and 4:00 PM local time.",
        priority: "Normal",
        author: "Eleanor Sterling",
        publishedDate: "2026-08-10"
      }
    ],
    companies: [
      {
        id: "comp-1",
        name: "Apex Global Tech",
        industry: "Software & AI",
        website: "https://apexglobal.tech",
        phone: "+1 (800) 555-0199",
        email: "contact@apexglobal.tech",
        address: "100 Innovation Way, Silicon Valley, CA",
        status: "Active",
        revenue: "$12M"
      },
      {
        id: "comp-2",
        name: "Nova Horizon Ltd",
        industry: "Renewable Energy",
        website: "https://novahorizon.energy",
        phone: "+1 (800) 555-0245",
        email: "info@novahorizon.energy",
        address: "450 Windmill Parkway, Denver, CO",
        status: "Active",
        revenue: "$8.5M"
      },
      {
        id: "comp-3",
        name: "Quantum Enterprises",
        industry: "Financial Services & Fintech",
        website: "https://quantumenterprises.com",
        phone: "+1 (800) 555-0378",
        email: "hello@quantumenterprises.com",
        address: "12 Wall Street, New York, NY",
        status: "Active",
        revenue: "$34M"
      },
      {
        id: "comp-4",
        name: "Skyline Logistics Corp",
        industry: "Logistics & Supply Chain",
        website: "https://skylinelogistics.io",
        phone: "+1 (800) 555-0489",
        email: "dispatch@skylinelogistics.io",
        address: "88 Portside Blvd, Seattle, WA",
        status: "Active",
        revenue: "$19M"
      },
      {
        id: "comp-5",
        name: "Velocity Dynamics",
        industry: "Healthcare & Biotech",
        website: "https://velocitydynamics.bio",
        phone: "+1 (800) 555-0562",
        email: "sales@velocitydynamics.bio",
        address: "320 BioHealth Lane, Boston, MA",
        status: "Inactive",
        revenue: "$6.2M"
      }
    ],
    contacts: [
      {
        id: "cnt-1",
        name: "Dr. Aris Thorne",
        company: "Apex Global Tech",
        email: "aris.t@apexglobal.tech",
        phone: "+1 (555) 701-1122",
        jobTitle: "VP of Engineering",
        owner: "Marcus Kane"
      },
      {
        id: "cnt-2",
        name: "Samantha Wright",
        company: "Nova Horizon Ltd",
        email: "s.wright@novahorizon.energy",
        phone: "+1 (555) 702-2233",
        jobTitle: "Director of Procurement",
        owner: "Marcus Kane"
      },
      {
        id: "cnt-3",
        name: "David Sterling",
        company: "Quantum Enterprises",
        email: "dsterling@quantumenterprises.com",
        phone: "+1 (555) 703-3344",
        jobTitle: "Chief Operations Officer",
        owner: "Marcus Kane"
      },
      {
        id: "cnt-4",
        name: "Elena Rostova",
        company: "Skyline Logistics Corp",
        email: "elena.r@skylinelogistics.io",
        phone: "+1 (555) 704-4455",
        jobTitle: "Head of IT Infrastructure",
        owner: "Clara Oswald"
      },
      {
        id: "cnt-5",
        name: "Dr. Gregory House",
        company: "Velocity Dynamics",
        email: "ghouse@velocitydynamics.bio",
        phone: "+1 (555) 705-5566",
        jobTitle: "Chief Medical Officer",
        owner: "Clara Oswald"
      },
      {
        id: "cnt-6",
        name: "Patricia Adams",
        company: "Apex Global Tech",
        email: "padams@apexglobal.tech",
        phone: "+1 (555) 706-6677",
        jobTitle: "Procurement Lead",
        owner: "Marcus Kane"
      },
      {
        id: "cnt-7",
        name: "Vikram Patel",
        company: "Quantum Enterprises",
        email: "vpatel@quantumenterprises.com",
        phone: "+1 (555) 707-7788",
        jobTitle: "Enterprise Architect",
        owner: "Marcus Kane"
      },
      {
        id: "cnt-8",
        name: "Hannah Abbott",
        company: "Nova Horizon Ltd",
        email: "h.abbott@novahorizon.energy",
        phone: "+1 (555) 708-8899",
        jobTitle: "ESG Program Manager",
        owner: "Clara Oswald"
      }
    ],
    leads: [
      {
        id: "lead-1",
        title: "Cloud Infrastructure Modernization",
        company: "Apex Global Tech",
        contact: "Dr. Aris Thorne",
        source: "Website",
        estimatedValue: 75000,
        assignedTo: "Marcus Kane",
        expectedCloseDate: "2026-09-30",
        stage: "Negotiation",
        notes: "Discussing final MSA terms and multi-region failover SLA."
      },
      {
        id: "lead-2",
        title: "Enterprise HRMS Software Migration",
        company: "Quantum Enterprises",
        contact: "David Sterling",
        source: "Referral",
        estimatedValue: 120000,
        assignedTo: "Marcus Kane",
        expectedCloseDate: "2026-10-15",
        stage: "Proposal Sent",
        notes: "Full customized ERP + HR suite proposal presented to board."
      },
      {
        id: "lead-3",
        title: "Renewable Fleet Tracking Portal",
        company: "Nova Horizon Ltd",
        contact: "Samantha Wright",
        source: "LinkedIn",
        estimatedValue: 45000,
        assignedTo: "Marcus Kane",
        expectedCloseDate: "2026-09-15",
        stage: "Qualified",
        notes: "Demonstrated proof-of-concept; client verified IoT telemetry."
      },
      {
        id: "lead-4",
        title: "Automated Freight Dispatch System",
        company: "Skyline Logistics Corp",
        contact: "Elena Rostova",
        source: "Cold Outreach",
        estimatedValue: 68000,
        assignedTo: "Clara Oswald",
        expectedCloseDate: "2026-08-30",
        stage: "Won",
        notes: "Contract signed and initial deposit received."
      },
      {
        id: "lead-5",
        title: "AI Bio-Research Document Indexer",
        company: "Velocity Dynamics",
        contact: "Dr. Gregory House",
        source: "Webinar",
        estimatedValue: 35000,
        assignedTo: "Clara Oswald",
        expectedCloseDate: "2026-08-15",
        stage: "Lost",
        notes: "Project delayed due to internal budget reallocation."
      },
      {
        id: "lead-6",
        title: "Smart Energy Grid Analytics Module",
        company: "Nova Horizon Ltd",
        contact: "Hannah Abbott",
        source: "Website",
        estimatedValue: 52000,
        assignedTo: "Marcus Kane",
        expectedCloseDate: "2026-11-01",
        stage: "New",
        notes: "Inbound inquiry regarding carbon compliance analytics."
      },
      {
        id: "lead-7",
        title: "Real-Time Payment Security Gateway",
        company: "Quantum Enterprises",
        contact: "Vikram Patel",
        source: "Partner",
        estimatedValue: 95000,
        assignedTo: "Marcus Kane",
        expectedCloseDate: "2026-10-30",
        stage: "Contacted",
        notes: "Introductory discovery call completed; sending technical specs."
      },
      {
        id: "lead-8",
        title: "Microservices DevSecOps Pipeline",
        company: "Apex Global Tech",
        contact: "Patricia Adams",
        source: "Referral",
        estimatedValue: 88000,
        assignedTo: "Marcus Kane",
        expectedCloseDate: "2026-09-20",
        stage: "Proposal Sent",
        notes: "Security compliance matrix approved by infosec team."
      },
      {
        id: "lead-9",
        title: "Warehouse Sensor Network Expansion",
        company: "Skyline Logistics Corp",
        contact: "Elena Rostova",
        source: "Website",
        estimatedValue: 42000,
        assignedTo: "Clara Oswald",
        expectedCloseDate: "2026-11-15",
        stage: "Contacted",
        notes: "Requirement gathering session scheduled next Tuesday."
      },
      {
        id: "lead-10",
        title: "High-Performance Computing Cluster",
        company: "Apex Global Tech",
        contact: "Dr. Aris Thorne",
        source: "Partner",
        estimatedValue: 160000,
        assignedTo: "Marcus Kane",
        expectedCloseDate: "2026-12-10",
        stage: "New",
        notes: "Initial requirements scoping for GPU render farm management."
      }
    ],
    activities: [
      {
        id: "act-1",
        leadId: "lead-1",
        leadTitle: "Cloud Infrastructure Modernization",
        type: "Meeting",
        date: "2026-08-19 02:00 PM",
        description: "Executive pricing and SLA review with Dr. Aris Thorne.",
        status: "Completed",
        nextFollowUp: "2026-08-24"
      },
      {
        id: "act-2",
        leadId: "lead-2",
        leadTitle: "Enterprise HRMS Software Migration",
        type: "Email",
        date: "2026-08-18 11:30 AM",
        description: "Sent detailed commercial proposal and tier comparison deck.",
        status: "Completed",
        nextFollowUp: "2026-08-25"
      },
      {
        id: "act-3",
        leadId: "lead-3",
        leadTitle: "Renewable Fleet Tracking Portal",
        type: "Call",
        date: "2026-08-17 04:15 PM",
        description: "Followed up with Samantha Wright regarding hardware sensor integration.",
        status: "Completed",
        nextFollowUp: "2026-08-26"
      },
      {
        id: "act-4",
        leadId: "lead-7",
        leadTitle: "Real-Time Payment Security Gateway",
        type: "Follow-up",
        date: "2026-08-20 10:00 AM",
        description: "Sent architecture security whitepaper and benchmark figures.",
        status: "Completed",
        nextFollowUp: "2026-08-28"
      },
      {
        id: "act-5",
        leadId: "lead-4",
        leadTitle: "Automated Freight Dispatch System",
        type: "Note",
        date: "2026-08-16 03:00 PM",
        description: "Kickoff meeting scheduled with delivery engineering team for next month.",
        status: "Completed",
        nextFollowUp: "2026-09-01"
      }
    ]
  };
}

module.exports = {
  initDb,
  readData,
  saveData
};
