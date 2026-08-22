# 🚀 HUMINEXA — Enterprise HRMS & CRM Management Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render%20Cloud-success?style=for-the-badge&logo=render)](https://huminexa-hrms-crm.onrender.com)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas%20Cloud-brightgreen?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/atlas)
[![Node.js](https://img.shields.io/badge/Runtime-Node.js%20v20+-darkgreen?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

> **HUMINEXA** is a cloud-native, full-stack Enterprise Web Application that seamlessly unifies **Human Resource Management (HRMS)** and **B2B Sales Pipeline Tracking (CRM)** into a single, high-performance dashboard.

Developed as a **12-Week Summer Internship Capstone Project** (Course Code: `22049`) for **Shivajirao S. Jondhle Polytechnic, Asangaon** (Department of Information Technology, Class IF-5K, Academic Year 2025–2026).

---

## 🌐 Live Cloud Deployment
* **Live Website URL:** [https://huminexa-hrms-crm.onrender.com](https://huminexa-hrms-crm.onrender.com)
* **Demo Admin Credentials:** `sajidmansurshaikh7@gmail.com` | `Admin@123`
* **Quick Demo Logins:** 1-click presets available for `Admin`, `HR Manager`, `Sales Executive`, and `Employee`.

---

## 🌟 Key Features

### 👥 1. Workforce Management (HRMS)
* **Employee Directory:** Searchable staff roster with department filters, salary tracking, and automated EMP-ID generation.
* **Attendance Engine:** 1-Click self-service check-in/out with automated daily work-hour calculations (e.g. 8.58 hrs) and status badges.
* **Leave Management:** Multi-day leave requests (Sick/Casual/Paid) with duration computing and HR approve/reject matrix.
* **Company Bulletins:** Priority company announcements and broadcasts.

### 💼 2. B2B Sales Pipeline (CRM)
* **Deals Kanban Board:** Interactive 5-stage HTML5 drag-and-drop opportunity pipeline (New, Qualified, Proposal, Negotiation, Won) with real-time revenue summaries.
* **Corporate Accounts & Contacts:** B2B client profiles and key stakeholder address book with direct email/call links.
* **Customer Activity Timeline:** Chronological logging of client phone calls, meetings, follow-ups, and negotiation notes.

### 🔒 3. Cryptographic Security & RBAC
* **Stateless JWT Authorization:** 24-hour tamper-proof JSON Web Tokens (HMAC-SHA256).
* **Password Encryption:** 10-salt-round one-way cryptographic bcrypt hashing.
* **Role-Based Access Control (RBAC):** Middleware protecting 4 privilege tiers: Super Admin, HR Manager, Sales Executive, Employee.

### 📊 4. Real-Time Analytics
* Dynamic Chart.js 4.4 canvas charts displaying real-time Attendance Doughnut breakdowns and CRM Sales Pipeline funnels.

---

## 🏗️ 3-Tier System Architecture

```
+-----------------------------------------------------------------------------------+
|                        TIER 1: PRESENTATION LAYER (SPA)                           |
|  - Modern Semantic HTML5 + Responsive CSS3 Variables (Dark/Light Modes)           |
|  - Client-Side Controller Engine (Vanilla ES6+ JS: api.js, ui.js, auth.js, etc.)  |
|  - Interactive Visualizations (Chart.js 4.4 Canvas) & FontAwesome 6 Icons         |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / JSON Payloads
                                           | Authorization: Bearer <JWT>
                                           v
+-----------------------------------------------------------------------------------+
|                      TIER 2: APPLICATION LAYER (Node.js + Express)                |
|  - Express.js REST API Routers (/api/auth, /api/employees, /api/leads, etc.)      |
|  - Security Middlewares: authenticateToken & authorizeRoles (RBAC)                |
|  - CORS Policy Engine, Request Body Validation & Business Logic Enforcement       |
+------------------------------------------+----------------------------------------+
                                           | Real-Time Cloud Sync (mongodb driver)
                                           | Atomic Fallback Write Locks
                                           v
+-----------------------------------------------------------------------------------+
|                     TIER 3: DATA PERSISTENCE LAYER (MongoDB Atlas)                |
|  - MongoDB Atlas Cloud Database (huminexa_main_data collection)                   |
|  - Atomic Local JSON Cache Engine (data/data.json fallback)                       |
+-----------------------------------------------------------------------------------+
```

---

## 📁 Repository Structure

```
huminexa-hrms-crm/
├── data/
│   └── data.json              # Local persistent JSON database backup
├── public/
│   ├── css/
│   │   └── style.css          # Design system, CSS variables, dark/light themes
│   ├── js/
│   │   ├── api.js             # Centralized Fetch wrapper with automatic JWT injection
│   │   ├── ui.js              # Toast notifications, modal helpers, theme toggler
│   │   ├── auth.js            # Login & Self-Registration validation and role presets
│   │   ├── dashboard.js       # Live KPI metrics calculation & dynamic Chart.js instances
│   │   └── app.js             # Global search engine, SPA tab routing, and CRUD handlers
│   ├── index.html             # Public SaaS Landing Page with Top Navigation & Auth Modal
│   └── dashboard.html         # Unified Single Page Application dashboard container
├── db.js                      # Hybrid MongoDB Atlas cloud driver & atomic local JSON engine
├── server.js                  # Express.js REST API server with protected endpoint routers
├── package.json               # Project dependencies and deployment scripts
├── render.yaml                # Render Cloud Infrastructure configuration
└── README.md                  # Comprehensive documentation and project guide
```

---

## ⚡ Local Setup & Installation

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.0.0 or higher)
* Git

### Step-by-Step Run Instructions
```bash
# 1. Clone the repository
git clone https://github.com/Salaa2ma33/huminexa-hrms-crm.git

# 2. Navigate to project directory
cd huminexa-hrms-crm

# 3. Install dependencies
npm install

# 4. (Optional) Set your MongoDB Atlas URI in environment variables
# set MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority

# 5. Start the local server
node server.js
```

Open your browser and navigate to:
👉 **`http://localhost:3000`**

---

## 👥 Project Team (Group 2)
* **Sajid Mansur Shaikh** (Enrollment No: `24112090690` | Class: IF-5K)
* **Aayan Firoj Shaikh** (Enrollment No: `24112090680` | Class: IF-5K)
* **Institute:** Shivajirao S. Jondhle Polytechnic, Asangaon (Vighnaharata Trust)
* **Project Guide / Mentor:** Prof. Shruthi Nandargi
* **Head of Department (HOD):** Prof. Shweta Chanchlani
* **Principal:** Dr. Anwesh K. Virkunwar

---

## 📄 License
This project is open-source and available under the **MIT License**.
