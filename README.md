# HUMINEXA — HRMS & CRM Management System

> **“Empowering People. Managing Growth.”**  
> *A full-stack, enterprise-grade Human Resource Management System (HRMS) & Customer Relationship Management (CRM) web application designed for business operations and academic project excellence.*

---

## 📌 1. Project Overview

**HUMINEXA** is a unified, production-ready full-stack business management application combining essential **Human Resource Management (HRMS)** and **Customer Relationship Management (CRM)** capabilities into a single modern dashboard interface.

Developed using **Node.js, Express.js, Vanilla JavaScript, HTML5, and CSS3**, HUMINEXA requires zero external paid databases or cloud dependencies for local demonstration, making it beginner-friendly to inspect, run, modify, present in viva examinations, and deploy for free to cloud platforms like **Render**.

---

## 🏗️ 2. Project Folder Structure

```
huminexa-hrms-crm/
├── package.json               # Node.js project metadata and dependencies
├── server.js                  # Express REST API server and routing engine
├── db.js                      # Atomic JSON database persistence layer
├── render.yaml                # Infrastructure configuration for 1-click Render deployment
├── .gitignore                 # Excludes node_modules, .env, and backups
├── README.md                  # Complete documentation and viva guide
├── middleware/
│   └── authMiddleware.js      # JWT authentication and Role-Based Access Control (RBAC)
├── data/
│   └── data.json              # Initial seed database (Employees, Leads, Attendance, etc.)
└── public/                    # Static Web Application Client
    ├── index.html             # High-converting SaaS login portal
    ├── dashboard.html         # Unified single-page application dashboard
    ├── css/
    │   └── style.css          # Design system, CSS variables, and dark mode stylesheet
    └── js/
        ├── api.js             # Centralized HTTP request client with JWT injection
        ├── auth.js            # Authentication state, login validation, and demo presets
        ├── ui.js              # Toasts, modals, confirmation engine, and theme manager
        ├── dashboard.js       # Chart.js analytics engine and KPI summary feeds
        └── app.js             # Navigation router, CRUD controllers, and Kanban board
```

---

## 🚀 3. Key Modules & Features

### 🏢 Human Resource Management (HRMS)
1. **Executive Operations Hub (Dashboard)**:
   - Real-time KPI cards: Total Staff, Present Today, On Leave, Monthly Attendance %, Pipeline Deals, Total Pipeline Value.
   - Interactive Chart.js visualizers: Today's Attendance breakdown doughnut & Leads by stage bar chart.
   - Live activity feeds, upcoming employee birthdays, and quick-action shortcuts.
2. **Employee Directory**:
   - Comprehensive employee registry with unique Employee ID (`EMP-xxx`), Department, Designation, Salary, and Status.
   - Instant search by name, email, or ID; filter by department and active status.
   - Add, edit, delete, and view comprehensive profile cards with automatic user account synchronization.
3. **Department Management**:
   - Create, edit, and organize functional units with assigned department heads.
   - Live calculation of active team member count per department.
   - Built-in data integrity checks: prevents accidental deletion if active employees are assigned.
4. **Attendance & Work Hours Ledger**:
   - Self-service daily Clock-In and Clock-Out buttons for employees with duplicate check-in prevention.
   - Automated work hours calculation and status assignment (`Present`, `Late`, `Work From Home`, `Half Day`, `Absent`).
   - HR managerial attendance ledger with date filters and manual record correction modal.
5. **Leave Management**:
   - Employee self-service leave submission with start/end date validation, automatic duration calculation, and justification.
   - Role-gated managerial review: HR/Admin can Approve or Reject requests with reviewer auditing.
6. **Bulletin Board & Official Announcements**:
   - High-visibility bulletin posts with priority tags (`Urgent`, `High`, `Normal`) and published date stamps.

### 💼 Customer Relationship Management (CRM)
1. **Account Companies**:
   - Registry of customer enterprise accounts with industry vertical, corporate email, phone, website, and status.
2. **Contact Directory**:
   - Decision-maker contact records connected to registered client companies.
3. **Sales Pipeline & Deals**:
   - Toggle seamlessly between **Tabular Grid View** and an **Interactive Kanban Pipeline Board**.
   - 7 standardized deal stages: `New`, `Contacted`, `Qualified`, `Proposal Sent`, `Negotiation`, `Won`, `Lost`.
   - HTML5 Drag-and-Drop support on Kanban columns with instant backend state update.
4. **Sales Activity Timeline**:
   - Chronological logging of sales interactions (`Call`, `Email`, `Meeting`, `Follow-up`, `Note`).
   - Tracking of target follow-up deadlines.

---

## 🔑 4. Demo Login Credentials

HUMINEXA comes pre-seeded with four role presets for immediate testing:

| User Role | Email | Password | System Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@huminexa.com` | `Admin@123` | **Full unrestricted access** to all HRMS & CRM modules. |
| **HR Manager** | `hr@huminexa.com` | `Hr@123` | Employees, Departments, Attendance, Leaves, Bulletins. |
| **Sales Executive** | `sales@huminexa.com` | `Sales@123` | Companies, Contacts, Leads (Kanban), Activities, Bulletins. |
| **Employee** | `employee@huminexa.com` | `Employee@123` | Personal profile, Clock In/Out, Leave application, Bulletins. |

> *Tip: On the login page, you can click any of the 4 quick demo buttons to automatically populate email and password!*

---

## 💻 5. Local Setup & Execution Guide

### Prerequisites
- [Node.js](https://nodejs.org/) version 18.0.0 or higher.

### Step-by-Step Instructions
1. Open your terminal / command prompt in the `huminexa-hrms-crm` directory:
   ```bash
   cd huminexa-hrms-crm
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   ```
   *(For active development with auto-reload, run `npm run dev`)*
4. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```
5. Sign in using any demo account (e.g. `admin@huminexa.com` / `Admin@123`).

---

## 📡 6. REST API Endpoint Summary

All API routes (except `/api/auth/login`) require the `Authorization: Bearer <JWT_TOKEN>` header.

| Method | Endpoint | Description | Role Privilege |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT | Public |
| `GET` | `/api/auth/me` | Fetch active user session | Authenticated |
| `GET` | `/api/dashboard` | Fetch aggregated KPIs & charts | Authenticated |
| `GET` | `/api/employees` | List employees with filters | Authenticated |
| `POST` | `/api/employees` | Register new employee | Admin, HR Manager |
| `PUT` | `/api/employees/:id` | Update employee record | Admin, HR Manager |
| `DELETE` | `/api/employees/:id` | Remove employee record | Admin, HR Manager |
| `GET` | `/api/departments` | List all departments | Authenticated |
| `POST` | `/api/departments` | Create department | Admin, HR Manager |
| `PUT` | `/api/departments/:id` | Update department | Admin, HR Manager |
| `DELETE` | `/api/departments/:id` | Delete department (if empty) | Admin, HR Manager |
| `GET` | `/api/attendance` | Fetch attendance ledger | Authenticated |
| `POST` | `/api/attendance/check-in` | Self clock-in | Authenticated |
| `PUT` | `/api/attendance/check-out` | Self clock-out | Authenticated |
| `POST` | `/api/attendance/mark` | Manual attendance logging | Admin, HR Manager |
| `GET` | `/api/leaves` | List leave requests | Authenticated |
| `POST` | `/api/leaves` | Submit leave request | Authenticated |
| `PUT` | `/api/leaves/:id/status` | Approve / Reject leave | Admin, HR Manager |
| `GET` | `/api/announcements` | List announcements | Authenticated |
| `POST` | `/api/announcements` | Publish announcement | Admin, HR Manager |
| `DELETE` | `/api/announcements/:id` | Delete announcement | Admin, HR Manager |
| `GET` | `/api/companies` | List client companies | Authenticated |
| `POST` | `/api/companies` | Register client company | Admin, Sales Executive |
| `PUT` | `/api/companies/:id` | Update company profile | Admin, Sales Executive |
| `DELETE` | `/api/companies/:id` | Delete company profile | Admin, Sales Executive |
| `GET` | `/api/contacts` | List business contacts | Authenticated |
| `POST` | `/api/contacts` | Add business contact | Admin, Sales Executive |
| `PUT` | `/api/contacts/:id` | Update contact record | Admin, Sales Executive |
| `DELETE` | `/api/contacts/:id` | Delete contact record | Admin, Sales Executive |
| `GET` | `/api/leads` | List sales opportunities | Authenticated |
| `POST` | `/api/leads` | Create new sales deal | Admin, Sales Executive |
| `PUT` | `/api/leads/:id` | Update deal details | Admin, Sales Executive |
| `PUT` | `/api/leads/:id/stage` | Fast update deal pipeline stage | Admin, Sales Executive |
| `DELETE` | `/api/leads/:id` | Remove sales deal | Admin, Sales Executive |
| `GET` | `/api/activities` | List customer interactions | Authenticated |
| `POST` | `/api/activities` | Log customer call/meeting | Admin, Sales Executive |

---

## 🌐 7. Free Deployment Guide on Render

You can deploy HUMINEXA 100% free on **Render**:

### Step 1: Push Code to GitHub
1. Create a free account on [GitHub](https://github.com).
2. Create a new public repository named `huminexa-hrms-crm`.
3. In your terminal inside the project directory, run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of HUMINEXA HRMS & CRM platform"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/huminexa-hrms-crm.git
   git push -u origin main
   ```

### Step 2: Deploy Web Service on Render
1. Visit [Render](https://render.com/) and Sign In using your GitHub account.
2. Click **New +** &rarr; **Web Service**.
3. Select the `huminexa-hrms-crm` repository from your list.
4. Configure the settings:
   - **Name**: `huminexa-hrms-crm`
   - **Region**: Closest to your region (e.g., Singapore, Oregon, Frankfurt)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. In the **Environment Variables** section, add:
   - Key: `JWT_SECRET` &bull; Value: `a_secure_random_hex_string_key_2026`
6. Click **Create Web Service**.
7. Render will build and launch your live application at `https://huminexa-hrms-crm.onrender.com`.

---

## 🛠️ 8. Troubleshooting & Common Fixes

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **`Cannot find module 'express'`** | Dependencies not installed | Run `npm install` in the project root directory. |
| **`Port 3000 already in use`** | Another local app is using port 3000 | Set an alternative port before starting: `$env:PORT=4000; npm start` (PowerShell) or `PORT=4000 npm start` (Mac/Linux). |
| **`Invalid Token / Unauthorized`** | Browser localStorage holds expired JWT | Click "Sign Out" or clear browser localStorage, then log in again. |
| **Render restarts resets data** | Render Free Tier uses ephemeral storage | For internship viva, JSON storage works seamlessly. For permanent persistence across server restarts, connect a PostgreSQL cloud database (such as Supabase free tier). |

---

## 🎓 9. Viva Examination Quick Reference & Concept Explanations

Here are clear, simple explanations designed for viva defense:

### 1. What is an HRMS?
> **HRMS (Human Resource Management System)** is a software application designed to manage core employee data, attendance tracking, leave requests, department structures, and organizational notices throughout an employee's lifecycle.

### 2. What is a CRM?
> **CRM (Customer Relationship Management)** is a software platform designed to manage customer interactions, B2B company accounts, decision-maker contacts, sales opportunity pipelines (via Kanban stages), and communication activity histories to drive revenue growth.

### 3. Why combine HRMS and CRM in HUMINEXA?
> In modern enterprises, workforce operations (HR) and revenue generation (Sales) operate closely. Combining them into a single portal allows managers to view staff productivity and sales performance from a single unified dashboard with shared authentication.

### 4. How does Authentication with JWT work?
> When a user logs in with email and password, the server validates the credentials using `bcrypt.compare()`. If valid, the server signs a **JSON Web Token (JWT)** containing the user's ID, role, and name. The frontend stores this token in `localStorage` and attaches it in the `Authorization: Bearer <token>` header of every subsequent API call. The server verifies the token signature on each request without requiring session cookies.

### 5. What is Role-Based Access Control (RBAC)?
> RBAC restricts access to specific actions and views based on the user's role (`Admin`, `HR Manager`, `Sales Executive`, `Employee`). On the backend, `authorizeRoles()` middleware blocks unauthorized HTTP requests (returning HTTP 403). On the frontend, navigation links and action buttons are dynamically hidden or rendered based on the decoded token role.

### 6. Why use a JSON database for this diploma project?
> A JSON database (`data.json`) allows the entire project to run immediately on any computer with `npm install && npm start` without installing or configuring external SQL databases (like MySQL/PostgreSQL). It reads and writes data atomically with zero recurring cloud hosting costs.

### 7. Future Enhancements & Scope
- Connecting to a cloud PostgreSQL/Supabase database for enterprise scaling.
- Automated PDF generation for employee pay slips and sales quotes.
- Email integration (via Nodemailer) for automated leave approval alerts and sales reminders.
- Biometric hardware integration for physical attendance kiosk devices.
