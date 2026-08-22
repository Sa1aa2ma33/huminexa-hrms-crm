/**
 * HUMINEXA — Main Application Controller
 * Handles Navigation Routing, Role-Based Access, Module Controllers, Kanban Drag & Drop, and CRUD Modals.
 */

document.addEventListener('DOMContentLoaded', async () => {
  UI.initTheme();

  // Verify auth session
  const currentUser = API.getUser();
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }

  // Populate User Profile Header
  setupUserProfileHeader(currentUser);

  // Setup Role-based Sidebar Navigation
  setupSidebarNavigation(currentUser);

  // Initialize Global Event Listeners & UI Controls
  setupGlobalControls();

  // Load Initial Section (Dashboard)
  navigateToSection('dashboard');
});

/* ==========================================================================
   USER PROFILE & HEADER INITIALIZATION
   ========================================================================== */
function setupUserProfileHeader(user) {
  const nameEls = document.querySelectorAll('.user-info-name, #topbarUserName, #profileModalName');
  const roleEls = document.querySelectorAll('.user-info-role, #topbarUserRole, #profileModalRole');
  const avatarEls = document.querySelectorAll('.sidebar-avatar, .user-avatar-sm, #profileModalAvatar');

  const initials = UI.getInitials(user.name);

  nameEls.forEach(el => { if (el) el.textContent = user.name; });
  roleEls.forEach(el => { if (el) el.textContent = `${user.role} • ${user.department || ''}`; });
  avatarEls.forEach(el => { if (el) el.textContent = initials; });

  const emailEl = document.getElementById('profileModalEmail');
  const empIdEl = document.getElementById('profileModalEmpId');
  if (emailEl) emailEl.textContent = user.email;
  if (empIdEl) empIdEl.textContent = user.employeeId || 'EMP-001';
}

/* ==========================================================================
   ROLE-BASED SIDEBAR NAVIGATION
   ========================================================================== */
function setupSidebarNavigation(user) {
  const role = user.role;
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');

  // Permission Map
  const permissions = {
    'Admin': ['dashboard', 'employees', 'departments', 'attendance', 'leaves', 'announcements', 'companies', 'contacts', 'leads', 'activities'],
    'HR Manager': ['dashboard', 'employees', 'departments', 'attendance', 'leaves', 'announcements'],
    'Sales Executive': ['dashboard', 'companies', 'contacts', 'leads', 'activities', 'announcements'],
    'Employee': ['dashboard', 'attendance', 'leaves', 'announcements']
  };

  const allowed = permissions[role] || permissions['Employee'];

  navItems.forEach(item => {
    const target = item.getAttribute('data-section');
    if (target && !allowed.includes(target)) {
      item.style.display = 'none';
    } else {
      item.style.display = 'flex';
      item.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToSection(target);
      });
    }
  });

  // Hide or show module headers based on visibility
  const hrmsHeader = document.getElementById('navHrmsHeader');
  const crmHeader = document.getElementById('navCrmHeader');

  if (hrmsHeader && role === 'Sales Executive') hrmsHeader.style.display = 'none';
  if (crmHeader && (role === 'HR Manager' || role === 'Employee')) crmHeader.style.display = 'none';
}

/**
 * Route / Switch Active Page Section
 */
function navigateToSection(sectionId) {
  // Update sidebar active class
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    if (item.getAttribute('data-section') === sectionId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Switch visible section container
  document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
  const targetSection = document.getElementById(`section-${sectionId}`);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Load Section Controller Data
  switch (sectionId) {
    case 'dashboard':
      Dashboard.load();
      break;
    case 'employees':
      EmployeesModule.load();
      break;
    case 'departments':
      DepartmentsModule.load();
      break;
    case 'attendance':
      AttendanceModule.load();
      break;
    case 'leaves':
      LeavesModule.load();
      break;
    case 'announcements':
      AnnouncementsModule.load();
      break;
    case 'companies':
      CompaniesModule.load();
      break;
    case 'contacts':
      ContactsModule.load();
      break;
    case 'leads':
      LeadsModule.load();
      break;
    case 'activities':
      ActivitiesModule.load();
      break;
  }

  // Close mobile sidebar if open
  document.querySelector('.sidebar').classList.remove('mobile-open');
}

/* ==========================================================================
   GLOBAL CONTROLS & EVENT LISTENERS
   ========================================================================== */
function setupGlobalControls() {
  // Desktop Sidebar Collapse Toggle
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebar = document.querySelector('.sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  // Mobile Hamburger Drawer Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }

  // Theme Toggle Button
  const themeBtn = document.getElementById('topbarThemeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      UI.toggleTheme();
      // Re-render dashboard charts to adapt to dark background
      if (document.getElementById('section-dashboard').classList.contains('active')) {
        Dashboard.load();
      }
    });
  }

  // Topbar Profile Dropdown Toggle
  const profileTrigger = document.getElementById('userProfileDropdownTrigger');
  const profileMenu = document.getElementById('userProfileDropdownMenu');
  if (profileTrigger && profileMenu) {
    profileTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle('show');
    });
    document.addEventListener('click', () => {
      profileMenu.classList.remove('show');
    });
  }

  // Modal Backdrop Click & Close Buttons
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        UI.closeModal(backdrop.id);
      }
    });
  });

  document.querySelectorAll('.modal-close-btn, [data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      if (modal) UI.closeModal(modal.id);
    });
  });

  // Global Quick Search Engine with Categorized Instant Results
  setupGlobalSearch();
}

/**
 * Global Search Controller with Live Categorized Popup Results
 */
function setupGlobalSearch() {
  const input = document.getElementById('globalSearchInput');
  const resultsContainer = document.getElementById('globalSearchResults');
  if (!input || !resultsContainer) return;

  let searchTimeout = null;

  // Keyboard shortcut Ctrl+K or / to focus search
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      input.focus();
      input.select();
    } else if (e.key === 'Escape') {
      closeSearch();
    }
  });

  input.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    // Also filter active page table if present
    const activeSection = document.querySelector('.page-section.active');
    if (activeSection) {
      const table = activeSection.querySelector('table tbody');
      if (table) {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
          row.style.display = row.textContent.toLowerCase().includes(query.toLowerCase()) ? '' : 'none';
        });
      }
    }

    if (query.length < 2) {
      closeSearch();
      return;
    }

    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 180);
  });

  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2) {
      performSearch(input.value.trim());
    }
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !resultsContainer.contains(e.target)) {
      closeSearch();
    }
  });

  function closeSearch() {
    resultsContainer.classList.remove('show');
    resultsContainer.innerHTML = '';
  }

  async function performSearch(query) {
    const q = query.toLowerCase();
    resultsContainer.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.85rem;"><i class="fa-solid fa-spinner fa-spin"></i> Searching records...</div>';
    resultsContainer.classList.add('show');

    try {
      // Fetch datasets concurrently
      const [empRes, compRes, contRes, leadRes, deptRes] = await Promise.all([
        API.get('/api/employees'),
        API.get('/api/companies'),
        API.get('/api/contacts'),
        API.get('/api/leads'),
        API.get('/api/departments')
      ]);

      const employees = (empRes.success && empRes.data ? empRes.data : []).filter(e => 
        (e.name && e.name.toLowerCase().includes(q)) ||
        (e.email && e.email.toLowerCase().includes(q)) ||
        (e.department && e.department.toLowerCase().includes(q)) ||
        (e.designation && e.designation.toLowerCase().includes(q)) ||
        (e.employeeId && e.employeeId.toLowerCase().includes(q))
      );

      const companies = (compRes.success && compRes.data ? compRes.data : []).filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.industry && c.industry.toLowerCase().includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q))
      );

      const contacts = (contRes.success && contRes.data ? contRes.data : []).filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q))
      );

      const leads = (leadRes.success && leadRes.data ? leadRes.data : []).filter(l =>
        (l.title && l.title.toLowerCase().includes(q)) ||
        (l.company && l.company.toLowerCase().includes(q)) ||
        (l.stage && l.stage.toLowerCase().includes(q))
      );

      const departments = (deptRes.success && deptRes.data ? deptRes.data : []).filter(d =>
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.head && d.head.toLowerCase().includes(q))
      );

      const totalMatches = employees.length + companies.length + contacts.length + leads.length + departments.length;

      if (totalMatches === 0) {
        resultsContainer.innerHTML = `
          <div style="padding: 24px; text-align: center; color: var(--text-muted);">
            <i class="fa-solid fa-folder-open" style="font-size: 1.6rem; opacity: 0.5; margin-bottom: 8px;"></i>
            <div style="font-size: 0.88rem; font-weight: 600; color: var(--text-main);">No matching records found</div>
            <div style="font-size: 0.78rem; margin-top: 4px;">No records match "${UI.escapeHtml(query)}"</div>
          </div>
        `;
        return;
      }

      let html = '';

      // 1. EMPLOYEES
      if (employees.length > 0) {
        html += `<div class="search-category-title"><i class="fa-solid fa-users" style="color: var(--primary);"></i> Employees (${employees.length})</div>`;
        employees.slice(0, 3).forEach(emp => {
          html += `
            <div class="search-result-item" data-action="employee" data-emp-id="${emp.id}" data-name="${UI.escapeHtml(emp.name)}">
              <div class="search-result-icon"><i class="fa-solid fa-user"></i></div>
              <div class="search-result-info">
                <div class="search-result-primary">${UI.escapeHtml(emp.name)}</div>
                <div class="search-result-secondary">${UI.escapeHtml(emp.designation || 'Staff')} &bull; ${UI.escapeHtml(emp.department || '')}</div>
              </div>
              <span class="search-result-badge">${emp.employeeId || 'STAFF'}</span>
            </div>
          `;
        });
      }

      // 2. COMPANIES
      if (companies.length > 0) {
        html += `<div class="search-category-title"><i class="fa-solid fa-building" style="color: #0EA5E9;"></i> Companies (${companies.length})</div>`;
        companies.slice(0, 3).forEach(comp => {
          html += `
            <div class="search-result-item" data-action="company" data-name="${UI.escapeHtml(comp.name)}">
              <div class="search-result-icon" style="background: rgba(14, 165, 233, 0.12); color: #0EA5E9;"><i class="fa-solid fa-building"></i></div>
              <div class="search-result-info">
                <div class="search-result-primary">${UI.escapeHtml(comp.name)}</div>
                <div class="search-result-secondary">${UI.escapeHtml(comp.industry || 'Enterprise')} &bull; ${UI.escapeHtml(comp.city || 'Global')}</div>
              </div>
              <span class="search-result-badge">COMPANY</span>
            </div>
          `;
        });
      }

      // 3. CONTACTS
      if (contacts.length > 0) {
        html += `<div class="search-category-title"><i class="fa-solid fa-address-book" style="color: #10B981;"></i> Contacts (${contacts.length})</div>`;
        contacts.slice(0, 3).forEach(cont => {
          html += `
            <div class="search-result-item" data-action="contact" data-name="${UI.escapeHtml(cont.name)}">
              <div class="search-result-icon" style="background: rgba(16, 185, 129, 0.12); color: #10B981;"><i class="fa-solid fa-address-card"></i></div>
              <div class="search-result-info">
                <div class="search-result-primary">${UI.escapeHtml(cont.name)}</div>
                <div class="search-result-secondary">${UI.escapeHtml(cont.email || '')} &bull; ${UI.escapeHtml(cont.company || '')}</div>
              </div>
              <span class="search-result-badge">LEAD</span>
            </div>
          `;
        });
      }

      // 4. DEALS / LEADS
      if (leads.length > 0) {
        html += `<div class="search-category-title"><i class="fa-solid fa-chart-line" style="color: #F59E0B;"></i> Deals & Pipeline (${leads.length})</div>`;
        leads.slice(0, 3).forEach(lead => {
          html += `
            <div class="search-result-item" data-action="lead" data-title="${UI.escapeHtml(lead.title)}">
              <div class="search-result-icon" style="background: rgba(245, 158, 11, 0.12); color: #F59E0B;"><i class="fa-solid fa-file-invoice-dollar"></i></div>
              <div class="search-result-info">
                <div class="search-result-primary">${UI.escapeHtml(lead.title)}</div>
                <div class="search-result-secondary">${UI.escapeHtml(lead.company || '')} &bull; $${(lead.value || 0).toLocaleString()}</div>
              </div>
              <span class="search-result-badge">${lead.stage || 'DEAL'}</span>
            </div>
          `;
        });
      }

      // 5. DEPARTMENTS
      if (departments.length > 0) {
        html += `<div class="search-category-title"><i class="fa-solid fa-sitemap" style="color: #8B5CF6;"></i> Departments (${departments.length})</div>`;
        departments.slice(0, 3).forEach(dept => {
          html += `
            <div class="search-result-item" data-action="department" data-name="${UI.escapeHtml(dept.name)}">
              <div class="search-result-icon" style="background: rgba(139, 92, 246, 0.12); color: #8B5CF6;"><i class="fa-solid fa-sitemap"></i></div>
              <div class="search-result-info">
                <div class="search-result-primary">${UI.escapeHtml(dept.name)}</div>
                <div class="search-result-secondary">Head: ${UI.escapeHtml(dept.head || 'TBD')}</div>
              </div>
              <span class="search-result-badge">DEPT</span>
            </div>
          `;
        });
      }

      resultsContainer.innerHTML = html;

      // Attach click events on results
      resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const action = item.getAttribute('data-action');
          if (action === 'employee') {
            navigateToSection('employees');
            const empSearch = document.getElementById('empSearchInput');
            if (empSearch) {
              empSearch.value = item.getAttribute('data-name');
              EmployeesModule.load();
            }
          } else if (action === 'company') {
            navigateToSection('companies');
            const compSearch = document.getElementById('companySearchInput');
            if (compSearch) {
              compSearch.value = item.getAttribute('data-name');
              CompaniesModule.load();
            }
          } else if (action === 'contact') {
            navigateToSection('contacts');
            const contSearch = document.getElementById('contactSearchInput');
            if (contSearch) {
              contSearch.value = item.getAttribute('data-name');
              ContactsModule.load();
            }
          } else if (action === 'lead') {
            navigateToSection('leads');
          } else if (action === 'department') {
            navigateToSection('departments');
          }
          closeSearch();
        });
      });

    } catch (err) {
      console.error('[Global Search Error]', err);
      resultsContainer.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--danger); font-size: 0.85rem;">Search encountered an error.</div>';
    }
  }
}

/* ==========================================================================
   MODULE 1: EMPLOYEES MANAGEMENT
   ========================================================================== */
const EmployeesModule = (() => {
  let employeeList = [];

  const load = async () => {
    const search = document.getElementById('empSearchInput')?.value || '';
    const department = document.getElementById('empDeptFilter')?.value || 'All';
    const status = document.getElementById('empStatusFilter')?.value || 'All';

    const res = await API.get('/api/employees', { search, department, status });
    if (res.success) {
      employeeList = res.data || [];
      renderTable(employeeList);
      populateDeptDropdowns();
    }
  };

  const renderTable = (list) => {
    const tbody = document.getElementById('employeesTableBody');
    const countEl = document.getElementById('employeesTotalCount');
    if (!tbody) return;

    if (countEl) countEl.textContent = `${list.length} Records`;

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">
        <i class="fa-solid fa-users-slash empty-state-icon"></i>
        <div class="empty-state-title">No Employees Found</div>
        <p class="empty-state-text">Try adjusting your filters or register a new team member.</p>
      </td></tr>`;
      return;
    }

    const currentUser = API.getUser();
    const canManage = currentUser.role === 'Admin' || currentUser.role === 'HR Manager';

    tbody.innerHTML = list.map(emp => `
      <tr>
        <td><strong>${UI.escapeHTML(emp.employeeId)}</strong></td>
        <td>
          <div class="table-avatar-cell">
            <div class="avatar-initials">${UI.getInitials(emp.name)}</div>
            <div>
              <strong style="color: var(--text-main); display: block;">${UI.escapeHTML(emp.name)}</strong>
              <span style="font-size: 0.78rem; color: var(--text-muted);">${UI.escapeHTML(emp.email)}</span>
            </div>
          </div>
        </td>
        <td>${UI.escapeHTML(emp.department)}</td>
        <td>${UI.escapeHTML(emp.designation)}</td>
        <td>${UI.formatDate(emp.joiningDate)}</td>
        <td><span class="badge ${UI.getBadgeClass(emp.status)}">${UI.escapeHTML(emp.status)}</span></td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-sm btn-secondary" onclick="EmployeesModule.viewDetails('${emp.id}')" title="View Profile">
              <i class="fa-solid fa-eye"></i>
            </button>
            ${canManage ? `
              <button class="btn btn-sm btn-secondary" onclick="EmployeesModule.openEditModal('${emp.id}')" title="Edit Employee">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn btn-sm btn-secondary" style="color: var(--danger);" onclick="EmployeesModule.deleteEmployee('${emp.id}', '${UI.escapeHTML(emp.name)}')" title="Delete Employee">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  };

  const populateDeptDropdowns = async () => {
    const deptRes = await API.get('/api/departments');
    if (deptRes.success && deptRes.data) {
      const depts = deptRes.data;
      const filterSelect = document.getElementById('empDeptFilter');
      const modalSelect = document.getElementById('empFormDepartment');

      if (filterSelect && filterSelect.options.length <= 1) {
        filterSelect.innerHTML = '<option value="All">All Departments</option>' + 
          depts.map(d => `<option value="${UI.escapeHTML(d.name)}">${UI.escapeHTML(d.name)}</option>`).join('');
      }

      if (modalSelect) {
        modalSelect.innerHTML = depts.map(d => `<option value="${UI.escapeHTML(d.name)}">${UI.escapeHTML(d.name)}</option>`).join('');
      }
    }
  };

  const openAddModal = () => {
    const form = document.getElementById('employeeForm');
    if (form) form.reset();
    document.getElementById('empFormId').value = '';
    document.getElementById('employeeModalTitle').textContent = 'Register New Employee';
    UI.openModal('employeeModal');
  };

  const openEditModal = (id) => {
    const emp = employeeList.find(e => e.id === id);
    if (!emp) return;

    document.getElementById('empFormId').value = emp.id;
    document.getElementById('empFormName').value = emp.name;
    document.getElementById('empFormEmail').value = emp.email;
    document.getElementById('empFormPhone').value = emp.phone;
    document.getElementById('empFormDepartment').value = emp.department;
    document.getElementById('empFormDesignation').value = emp.designation;
    document.getElementById('empFormRole').value = emp.role;
    document.getElementById('empFormJoiningDate').value = emp.joiningDate;
    document.getElementById('empFormSalary').value = emp.salary;
    document.getElementById('empFormStatus').value = emp.status;
    document.getElementById('empFormAddress').value = emp.address || '';

    document.getElementById('employeeModalTitle').textContent = `Edit Employee: ${emp.name}`;
    UI.openModal('employeeModal');
  };

  const saveEmployee = async (e) => {
    e.preventDefault();
    const id = document.getElementById('empFormId').value;

    const payload = {
      name: document.getElementById('empFormName').value,
      email: document.getElementById('empFormEmail').value,
      phone: document.getElementById('empFormPhone').value,
      department: document.getElementById('empFormDepartment').value,
      designation: document.getElementById('empFormDesignation').value,
      role: document.getElementById('empFormRole').value,
      joiningDate: document.getElementById('empFormJoiningDate').value,
      salary: document.getElementById('empFormSalary').value,
      status: document.getElementById('empFormStatus').value,
      address: document.getElementById('empFormAddress').value
    };

    let res;
    if (id) {
      res = await API.put(`/api/employees/${id}`, payload);
    } else {
      res = await API.post('/api/employees', payload);
    }

    if (res.success) {
      UI.toast('success', 'Employee Saved', res.message);
      UI.closeModal('employeeModal');
      load();
    } else {
      UI.toast('error', 'Validation Error', res.message);
    }
  };

  const viewDetails = (id) => {
    const emp = employeeList.find(e => e.id === id);
    if (!emp) return;

    document.getElementById('viewEmpAvatar').textContent = UI.getInitials(emp.name);
    document.getElementById('viewEmpName').textContent = emp.name;
    document.getElementById('viewEmpDesignation').textContent = `${emp.designation} • ${emp.department}`;
    document.getElementById('viewEmpId').textContent = emp.employeeId;
    document.getElementById('viewEmpEmail').textContent = emp.email;
    document.getElementById('viewEmpPhone').textContent = emp.phone;
    document.getElementById('viewEmpDepartment').textContent = emp.department;
    document.getElementById('viewEmpJoiningDate').textContent = UI.formatDate(emp.joiningDate);
    document.getElementById('viewEmpSalary').textContent = UI.formatCurrency(emp.salary);
    document.getElementById('viewEmpStatus').innerHTML = `<span class="badge ${UI.getBadgeClass(emp.status)}">${emp.status}</span>`;
    document.getElementById('viewEmpAddress').textContent = emp.address || 'N/A';

    UI.openModal('employeeDetailModal');
  };

  const deleteEmployee = (id, name) => {
    UI.confirm('Delete Employee', `Are you sure you want to delete employee record for '${name}'? This action is permanent.`, async () => {
      const res = await API.delete(`/api/employees/${id}`);
      if (res.success) {
        UI.toast('success', 'Employee Deleted', res.message);
        load();
      } else {
        UI.toast('error', 'Error', res.message);
      }
    });
  };

  return {
    load,
    openAddModal,
    openEditModal,
    saveEmployee,
    viewDetails,
    deleteEmployee
  };
})();
window.EmployeesModule = EmployeesModule;

/* ==========================================================================
   MODULE 2: DEPARTMENTS MANAGEMENT
   ========================================================================== */
const DepartmentsModule = (() => {
  let deptList = [];

  const load = async () => {
    const res = await API.get('/api/departments');
    if (res.success) {
      deptList = res.data || [];
      renderGrid(deptList);
    }
  };

  const renderGrid = (list) => {
    const grid = document.getElementById('departmentsGrid');
    if (!grid) return;

    const currentUser = API.getUser();
    const canManage = currentUser.role === 'Admin' || currentUser.role === 'HR Manager';

    grid.innerHTML = list.map(d => `
      <div class="card" style="margin-bottom: 0;">
        <div class="card-header">
          <div class="card-title">
            <i class="fa-solid fa-sitemap" style="color: var(--primary);"></i>
            ${UI.escapeHTML(d.name)}
          </div>
          <span class="badge badge-normal">${d.employeeCount} Member(s)</span>
        </div>
        <div class="card-body">
          <p style="font-size: 0.85rem; color: var(--text-muted); min-height: 42px; margin-bottom: 16px;">
            ${UI.escapeHTML(d.description || 'General organizational division.')}
          </p>
          <div style="font-size: 0.8rem; color: var(--text-main); margin-bottom: 8px;">
            <strong>Department Head:</strong> ${UI.escapeHTML(d.head)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 16px;">
            Created on ${UI.formatDate(d.createdAt)}
          </div>
          ${canManage ? `
            <div style="display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid var(--border); padding-top: 12px;">
              <button class="btn btn-sm btn-secondary" onclick="DepartmentsModule.openEditModal('${d.id}')">
                <i class="fa-solid fa-pen"></i> Edit
              </button>
              <button class="btn btn-sm btn-secondary" style="color: var(--danger);" onclick="DepartmentsModule.deleteDept('${d.id}', '${UI.escapeHTML(d.name)}')">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  };

  const openAddModal = () => {
    document.getElementById('deptForm').reset();
    document.getElementById('deptFormId').value = '';
    document.getElementById('deptModalTitle').textContent = 'Create New Department';
    UI.openModal('deptModal');
  };

  const openEditModal = (id) => {
    const d = deptList.find(item => item.id === id);
    if (!d) return;

    document.getElementById('deptFormId').value = d.id;
    document.getElementById('deptFormName').value = d.name;
    document.getElementById('deptFormHead').value = d.head;
    document.getElementById('deptFormDescription').value = d.description || '';

    document.getElementById('deptModalTitle').textContent = `Edit Department: ${d.name}`;
    UI.openModal('deptModal');
  };

  const saveDept = async (e) => {
    e.preventDefault();
    const id = document.getElementById('deptFormId').value;
    const payload = {
      name: document.getElementById('deptFormName').value,
      head: document.getElementById('deptFormHead').value,
      description: document.getElementById('deptFormDescription').value
    };

    let res;
    if (id) {
      res = await API.put(`/api/departments/${id}`, payload);
    } else {
      res = await API.post('/api/departments', payload);
    }

    if (res.success) {
      UI.toast('success', 'Department Saved', res.message);
      UI.closeModal('deptModal');
      load();
    } else {
      UI.toast('error', 'Error', res.message);
    }
  };

  const deleteDept = (id, name) => {
    UI.confirm('Delete Department', `Are you sure you want to delete department '${name}'?`, async () => {
      const res = await API.delete(`/api/departments/${id}`);
      if (res.success) {
        UI.toast('success', 'Deleted', res.message);
        load();
      } else {
        UI.toast('error', 'Cannot Delete', res.message);
      }
    });
  };

  return {
    load,
    openAddModal,
    openEditModal,
    saveDept,
    deleteDept
  };
})();
window.DepartmentsModule = DepartmentsModule;

/* ==========================================================================
   MODULE 3: ATTENDANCE MANAGEMENT
   ========================================================================== */
const AttendanceModule = (() => {
  const load = async () => {
    const status = document.getElementById('attStatusFilter')?.value || 'All';
    const date = document.getElementById('attDateFilter')?.value || '';

    const res = await API.get('/api/attendance', { status, date });
    if (res.success) {
      renderTable(res.data || []);
      checkTodayClockStatus(res.data || []);
    }
  };

  const renderTable = (list) => {
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 32px; color: var(--text-muted);">No attendance records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(a => `
      <tr>
        <td><strong>${UI.formatDate(a.date)}</strong></td>
        <td><strong>${UI.escapeHTML(a.employeeName)}</strong> <span style="font-size: 0.75rem; color: var(--text-muted);">(${UI.escapeHTML(a.employeeId)})</span></td>
        <td><i class="fa-regular fa-clock" style="color: var(--success); margin-right: 4px;"></i> ${UI.escapeHTML(a.checkIn)}</td>
        <td><i class="fa-regular fa-clock" style="color: var(--danger); margin-right: 4px;"></i> ${UI.escapeHTML(a.checkOut)}</td>
        <td><strong>${UI.escapeHTML(a.workHours)}</strong> hrs</td>
        <td><span class="badge ${UI.getBadgeClass(a.status)}">${UI.escapeHTML(a.status)}</span></td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${UI.escapeHTML(a.notes || '--')}</td>
      </tr>
    `).join('');
  };

  const checkTodayClockStatus = (list) => {
    const today = new Date().toISOString().split('T')[0];
    const user = API.getUser();
    const todayRecord = list.find(a => a.employeeId === user.employeeId && a.date === today);

    const checkInBtn = document.getElementById('btnSelfCheckIn');
    const checkOutBtn = document.getElementById('btnSelfCheckOut');
    const statusBanner = document.getElementById('todayAttendanceStatus');

    if (checkInBtn && checkOutBtn && statusBanner) {
      if (!todayRecord) {
        checkInBtn.disabled = false;
        checkOutBtn.disabled = true;
        statusBanner.textContent = 'You have not checked in today yet.';
      } else if (todayRecord.checkOut === '--:--') {
        checkInBtn.disabled = true;
        checkOutBtn.disabled = false;
        statusBanner.textContent = `Checked in at ${todayRecord.checkIn} (${todayRecord.status}). Working in progress.`;
      } else {
        checkInBtn.disabled = true;
        checkOutBtn.disabled = true;
        statusBanner.textContent = `Shift completed today. Check-in: ${todayRecord.checkIn} | Check-out: ${todayRecord.checkOut}`;
      }
    }
  };

  const clockIn = async () => {
    const res = await API.post('/api/attendance/check-in');
    if (res.success) {
      UI.toast('success', 'Clock In Confirmed', res.message);
      load();
    } else {
      UI.toast('warning', 'Notice', res.message);
    }
  };

  const clockOut = async () => {
    const res = await API.put('/api/attendance/check-out');
    if (res.success) {
      UI.toast('success', 'Clock Out Confirmed', res.message);
      load();
    } else {
      UI.toast('warning', 'Notice', res.message);
    }
  };

  const openManualModal = async () => {
    const empRes = await API.get('/api/employees');
    if (empRes.success && empRes.data) {
      const select = document.getElementById('manualAttEmployee');
      select.innerHTML = empRes.data.map(e => `<option value="${e.employeeId}">${e.name} (${e.employeeId})</option>`).join('');
    }
    document.getElementById('manualAttDate').value = new Date().toISOString().split('T')[0];
    UI.openModal('manualAttendanceModal');
  };

  const saveManualAttendance = async (e) => {
    e.preventDefault();
    const payload = {
      employeeId: document.getElementById('manualAttEmployee').value,
      date: document.getElementById('manualAttDate').value,
      checkIn: document.getElementById('manualAttCheckIn').value,
      checkOut: document.getElementById('manualAttCheckOut').value,
      status: document.getElementById('manualAttStatus').value,
      notes: document.getElementById('manualAttNotes').value
    };

    const res = await API.post('/api/attendance/mark', payload);
    if (res.success) {
      UI.toast('success', 'Saved', res.message);
      UI.closeModal('manualAttendanceModal');
      load();
    } else {
      UI.toast('error', 'Error', res.message);
    }
  };

  return {
    load,
    clockIn,
    clockOut,
    openManualModal,
    saveManualAttendance
  };
})();
window.AttendanceModule = AttendanceModule;

/* ==========================================================================
   MODULE 4: LEAVE MANAGEMENT
   ========================================================================== */
const LeavesModule = (() => {
  const load = async () => {
    const status = document.getElementById('leaveStatusFilter')?.value || 'All';
    const type = document.getElementById('leaveTypeFilter')?.value || 'All';

    const res = await API.get('/api/leaves', { status, type });
    if (res.success) {
      renderTable(res.data || []);
    }
  };

  const renderTable = (list) => {
    const tbody = document.getElementById('leavesTableBody');
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 32px; color: var(--text-muted);">No leave requests found.</td></tr>`;
      return;
    }

    const currentUser = API.getUser();
    const canApprove = currentUser.role === 'Admin' || currentUser.role === 'HR Manager';

    tbody.innerHTML = list.map(l => `
      <tr>
        <td><strong>${UI.escapeHTML(l.employeeName)}</strong></td>
        <td>${UI.escapeHTML(l.leaveType)}</td>
        <td>${UI.formatDate(l.startDate)} &rarr; ${UI.formatDate(l.endDate)}</td>
        <td><strong>${l.totalDays} Day(s)</strong></td>
        <td style="max-width: 200px; font-size: 0.82rem; color: var(--text-muted);">${UI.escapeHTML(l.reason)}</td>
        <td><span class="badge ${UI.getBadgeClass(l.status)}">${UI.escapeHTML(l.status)}</span></td>
        <td>
          ${canApprove && l.status === 'Pending' ? `
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-sm btn-success" onclick="LeavesModule.updateStatus('${l.id}', 'Approved')"><i class="fa-solid fa-check"></i> Approve</button>
              <button class="btn btn-sm btn-danger" onclick="LeavesModule.updateStatus('${l.id}', 'Rejected')"><i class="fa-solid fa-xmark"></i> Reject</button>
            </div>
          ` : `<span style="font-size: 0.78rem; color: var(--text-light);">${l.reviewedBy ? 'Reviewed by ' + l.reviewedBy : '--'}</span>`}
        </td>
      </tr>
    `).join('');
  };

  const openApplyModal = () => {
    document.getElementById('leaveForm').reset();
    document.getElementById('leaveStartDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('leaveEndDate').value = new Date().toISOString().split('T')[0];
    UI.openModal('leaveModal');
  };

  const submitLeave = async (e) => {
    e.preventDefault();
    const payload = {
      leaveType: document.getElementById('leaveFormType').value,
      startDate: document.getElementById('leaveStartDate').value,
      endDate: document.getElementById('leaveEndDate').value,
      reason: document.getElementById('leaveReason').value
    };

    const res = await API.post('/api/leaves', payload);
    if (res.success) {
      UI.toast('success', 'Leave Submitted', res.message);
      UI.closeModal('leaveModal');
      load();
    } else {
      UI.toast('error', 'Validation Error', res.message);
    }
  };

  const updateStatus = async (id, status) => {
    const res = await API.put(`/api/leaves/${id}/status`, { status });
    if (res.success) {
      UI.toast('info', 'Status Updated', res.message);
      load();
    } else {
      UI.toast('error', 'Error', res.message);
    }
  };

  return {
    load,
    openApplyModal,
    submitLeave,
    updateStatus
  };
})();
window.LeavesModule = LeavesModule;

/* ==========================================================================
   MODULE 5: ANNOUNCEMENTS MANAGEMENT
   ========================================================================== */
const AnnouncementsModule = (() => {
  let list = [];

  const load = async () => {
    const res = await API.get('/api/announcements');
    if (res.success) {
      list = res.data || [];
      renderFeed(list);
    }
  };

  const renderFeed = (items) => {
    const container = document.getElementById('announcementsFeed');
    if (!container) return;

    const currentUser = API.getUser();
    const canManage = currentUser.role === 'Admin' || currentUser.role === 'HR Manager';

    if (items.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>No bulletin announcements at this time.</p></div>`;
      return;
    }

    container.innerHTML = items.map(a => `
      <div class="card" style="margin-bottom: 16px;">
        <div class="card-header">
          <div class="card-title">
            <i class="fa-solid fa-bullhorn" style="color: var(--primary);"></i>
            ${UI.escapeHTML(a.title)}
          </div>
          <span class="badge ${UI.getBadgeClass(a.priority)}">${UI.escapeHTML(a.priority)}</span>
        </div>
        <div class="card-body">
          <p style="font-size: 0.92rem; color: var(--text-main); line-height: 1.6; margin-bottom: 16px;">
            ${UI.escapeHTML(a.message)}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 12px;">
            <div>Published by <strong>${UI.escapeHTML(a.author)}</strong> on ${UI.formatDate(a.publishedDate)}</div>
            ${canManage ? `
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-sm btn-secondary" onclick="AnnouncementsModule.deleteAnnouncement('${a.id}')">
                  <i class="fa-solid fa-trash"></i> Delete
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');
  };

  const openAddModal = () => {
    document.getElementById('announcementForm').reset();
    UI.openModal('announcementModal');
  };

  const submitAnnouncement = async (e) => {
    e.preventDefault();
    const payload = {
      title: document.getElementById('ancTitle').value,
      message: document.getElementById('ancMessage').value,
      priority: document.getElementById('ancPriority').value
    };

    const res = await API.post('/api/announcements', payload);
    if (res.success) {
      UI.toast('success', 'Published', res.message);
      UI.closeModal('announcementModal');
      load();
    } else {
      UI.toast('error', 'Error', res.message);
    }
  };

  const deleteAnnouncement = (id) => {
    UI.confirm('Delete Bulletin', 'Are you sure you want to remove this announcement?', async () => {
      const res = await API.delete(`/api/announcements/${id}`);
      if (res.success) {
        UI.toast('success', 'Removed', res.message);
        load();
      }
    });
  };

  return {
    load,
    openAddModal,
    submitAnnouncement,
    deleteAnnouncement
  };
})();
window.AnnouncementsModule = AnnouncementsModule;

/* ==========================================================================
   MODULE 6: CRM COMPANIES
   ========================================================================== */
const CompaniesModule = (() => {
  let list = [];

  const load = async () => {
    const search = document.getElementById('companySearchInput')?.value || '';
    const status = document.getElementById('companyStatusFilter')?.value || 'All';

    const res = await API.get('/api/companies', { search, status });
    if (res.success) {
      list = res.data || [];
      renderTable(list);
    }
  };

  const renderTable = (items) => {
    const tbody = document.getElementById('companiesTableBody');
    if (!tbody) return;

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 32px; color: var(--text-muted);">No companies found.</td></tr>`;
      return;
    }

    const currentUser = API.getUser();
    const canManage = currentUser.role === 'Admin' || currentUser.role === 'Sales Executive';

    tbody.innerHTML = items.map(c => `
      <tr>
        <td><strong>${UI.escapeHTML(c.name)}</strong></td>
        <td>${UI.escapeHTML(c.industry)}</td>
        <td><a href="${UI.escapeHTML(c.website)}" target="_blank" rel="noreferrer">${UI.escapeHTML(c.website)}</a></td>
        <td>${UI.escapeHTML(c.phone)}</td>
        <td>${UI.escapeHTML(c.email)}</td>
        <td><span class="badge ${UI.getBadgeClass(c.status)}">${UI.escapeHTML(c.status)}</span></td>
        <td>
          ${canManage ? `
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-sm btn-secondary" onclick="CompaniesModule.openEditModal('${c.id}')"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-sm btn-secondary" style="color: var(--danger);" onclick="CompaniesModule.deleteCompany('${c.id}', '${UI.escapeHTML(c.name)}')"><i class="fa-solid fa-trash"></i></button>
            </div>
          ` : '--'}
        </td>
      </tr>
    `).join('');
  };

  const openAddModal = () => {
    document.getElementById('companyForm').reset();
    document.getElementById('compFormId').value = '';
    document.getElementById('companyModalTitle').textContent = 'Add Client Company';
    UI.openModal('companyModal');
  };

  const openEditModal = (id) => {
    const c = list.find(item => item.id === id);
    if (!c) return;

    document.getElementById('compFormId').value = c.id;
    document.getElementById('compName').value = c.name;
    document.getElementById('compIndustry').value = c.industry;
    document.getElementById('compWebsite').value = c.website;
    document.getElementById('compPhone').value = c.phone;
    document.getElementById('compEmail').value = c.email;
    document.getElementById('compAddress').value = c.address;
    document.getElementById('compStatus').value = c.status;

    document.getElementById('companyModalTitle').textContent = `Edit Company: ${c.name}`;
    UI.openModal('companyModal');
  };

  const saveCompany = async (e) => {
    e.preventDefault();
    const id = document.getElementById('compFormId').value;
    const payload = {
      name: document.getElementById('compName').value,
      industry: document.getElementById('compIndustry').value,
      website: document.getElementById('compWebsite').value,
      phone: document.getElementById('compPhone').value,
      email: document.getElementById('compEmail').value,
      address: document.getElementById('compAddress').value,
      status: document.getElementById('compStatus').value
    };

    let res;
    if (id) {
      res = await API.put(`/api/companies/${id}`, payload);
    } else {
      res = await API.post('/api/companies', payload);
    }

    if (res.success) {
      UI.toast('success', 'Company Saved', res.message);
      UI.closeModal('companyModal');
      load();
    } else {
      UI.toast('error', 'Error', res.message);
    }
  };

  const deleteCompany = (id, name) => {
    UI.confirm('Delete Company', `Are you sure you want to remove '${name}'?`, async () => {
      const res = await API.delete(`/api/companies/${id}`);
      if (res.success) {
        UI.toast('success', 'Deleted', res.message);
        load();
      }
    });
  };

  return {
    load,
    openAddModal,
    openEditModal,
    saveCompany,
    deleteCompany
  };
})();
window.CompaniesModule = CompaniesModule;

/* ==========================================================================
   MODULE 7: CRM CONTACTS
   ========================================================================== */
const ContactsModule = (() => {
  let list = [];

  const load = async () => {
    const search = document.getElementById('contactSearchInput')?.value || '';
    const res = await API.get('/api/contacts', { search });
    if (res.success) {
      list = res.data || [];
      renderTable(list);
      populateCompanyDropdown();
    }
  };

  const renderTable = (items) => {
    const tbody = document.getElementById('contactsTableBody');
    if (!tbody) return;

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 32px; color: var(--text-muted);">No contacts found.</td></tr>`;
      return;
    }

    const currentUser = API.getUser();
    const canManage = currentUser.role === 'Admin' || currentUser.role === 'Sales Executive';

    tbody.innerHTML = items.map(c => `
      <tr>
        <td><strong>${UI.escapeHTML(c.name)}</strong></td>
        <td><i class="fa-solid fa-building" style="color: var(--primary); margin-right: 6px;"></i> ${UI.escapeHTML(c.company)}</td>
        <td>${UI.escapeHTML(c.jobTitle)}</td>
        <td>${UI.escapeHTML(c.email)}</td>
        <td>${UI.escapeHTML(c.phone)}</td>
        <td>
          ${canManage ? `
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-sm btn-secondary" onclick="ContactsModule.openEditModal('${c.id}')"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-sm btn-secondary" style="color: var(--danger);" onclick="ContactsModule.deleteContact('${c.id}', '${UI.escapeHTML(c.name)}')"><i class="fa-solid fa-trash"></i></button>
            </div>
          ` : '--'}
        </td>
      </tr>
    `).join('');
  };

  const populateCompanyDropdown = async () => {
    const compRes = await API.get('/api/companies');
    if (compRes.success && compRes.data) {
      const select = document.getElementById('contactCompany');
      if (select) {
        select.innerHTML = compRes.data.map(c => `<option value="${UI.escapeHTML(c.name)}">${UI.escapeHTML(c.name)}</option>`).join('');
      }
    }
  };

  const openAddModal = () => {
    document.getElementById('contactForm').reset();
    document.getElementById('contactFormId').value = '';
    document.getElementById('contactModalTitle').textContent = 'Add New Contact';
    UI.openModal('contactModal');
  };

  const openEditModal = (id) => {
    const c = list.find(item => item.id === id);
    if (!c) return;

    document.getElementById('contactFormId').value = c.id;
    document.getElementById('contactName').value = c.name;
    document.getElementById('contactCompany').value = c.company;
    document.getElementById('contactJobTitle').value = c.jobTitle;
    document.getElementById('contactEmail').value = c.email;
    document.getElementById('contactPhone').value = c.phone;

    document.getElementById('contactModalTitle').textContent = `Edit Contact: ${c.name}`;
    UI.openModal('contactModal');
  };

  const saveContact = async (e) => {
    e.preventDefault();
    const id = document.getElementById('contactFormId').value;
    const payload = {
      name: document.getElementById('contactName').value,
      company: document.getElementById('contactCompany').value,
      jobTitle: document.getElementById('contactJobTitle').value,
      email: document.getElementById('contactEmail').value,
      phone: document.getElementById('contactPhone').value
    };

    let res;
    if (id) {
      res = await API.put(`/api/contacts/${id}`, payload);
    } else {
      res = await API.post('/api/contacts', payload);
    }

    if (res.success) {
      UI.toast('success', 'Contact Saved', res.message);
      UI.closeModal('contactModal');
      load();
    } else {
      UI.toast('error', 'Error', res.message);
    }
  };

  const deleteContact = (id, name) => {
    UI.confirm('Delete Contact', `Are you sure you want to remove '${name}'?`, async () => {
      const res = await API.delete(`/api/contacts/${id}`);
      if (res.success) {
        UI.toast('success', 'Deleted', res.message);
        load();
      }
    });
  };

  return {
    load,
    openAddModal,
    openEditModal,
    saveContact,
    deleteContact
  };
})();
window.ContactsModule = ContactsModule;

/* ==========================================================================
   MODULE 8: CRM LEADS & KANBAN PIPELINE
   ========================================================================== */
const LeadsModule = (() => {
  let leadsList = [];
  let currentView = 'table'; // 'table' or 'kanban'

  const stages = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

  const load = async () => {
    const search = document.getElementById('leadSearchInput')?.value || '';
    const stage = document.getElementById('leadStageFilter')?.value || 'All';

    const res = await API.get('/api/leads', { search, stage });
    if (res.success) {
      leadsList = res.data || [];
      if (currentView === 'table') {
        renderTable(leadsList);
      } else {
        renderKanban(leadsList);
      }
      populateDropdowns();
    }
  };

  const switchView = (viewType) => {
    currentView = viewType;
    const tableContainer = document.getElementById('leadsTableView');
    const kanbanContainer = document.getElementById('leadsKanbanView');
    const btnTable = document.getElementById('btnViewTable');
    const btnKanban = document.getElementById('btnViewKanban');

    if (viewType === 'table') {
      if (tableContainer) tableContainer.style.display = 'block';
      if (kanbanContainer) kanbanContainer.style.display = 'none';
      if (btnTable) btnTable.classList.add('btn-primary');
      if (btnTable) btnTable.classList.remove('btn-secondary');
      if (btnKanban) btnKanban.classList.add('btn-secondary');
      if (btnKanban) btnKanban.classList.remove('btn-primary');
      renderTable(leadsList);
    } else {
      if (tableContainer) tableContainer.style.display = 'none';
      if (kanbanContainer) kanbanContainer.style.display = 'flex';
      if (btnKanban) btnKanban.classList.add('btn-primary');
      if (btnKanban) btnKanban.classList.remove('btn-secondary');
      if (btnTable) btnTable.classList.add('btn-secondary');
      if (btnTable) btnTable.classList.remove('btn-primary');
      renderKanban(leadsList);
    }
  };

  const renderTable = (list) => {
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 32px; color: var(--text-muted);">No sales leads found.</td></tr>`;
      return;
    }

    const currentUser = API.getUser();
    const canManage = currentUser.role === 'Admin' || currentUser.role === 'Sales Executive';

    tbody.innerHTML = list.map(l => `
      <tr>
        <td>
          <strong>${UI.escapeHTML(l.title)}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted);"><i class="fa-solid fa-building"></i> ${UI.escapeHTML(l.company)}</div>
        </td>
        <td>${UI.escapeHTML(l.contact)}</td>
        <td><strong style="color: var(--primary);">${UI.formatCurrency(l.estimatedValue)}</strong></td>
        <td>
          ${canManage ? `
            <select class="form-control" style="padding: 4px 8px; font-size: 0.8rem;" onchange="LeadsModule.updateStage('${l.id}', this.value)">
              ${stages.map(s => `<option value="${s}" ${l.stage === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          ` : `<span class="badge ${UI.getBadgeClass(l.stage)}">${l.stage}</span>`}
        </td>
        <td>${UI.escapeHTML(l.assignedTo)}</td>
        <td>${UI.formatDate(l.expectedCloseDate)}</td>
        <td>
          ${canManage ? `
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-sm btn-secondary" onclick="LeadsModule.openEditModal('${l.id}')"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-sm btn-secondary" style="color: var(--danger);" onclick="LeadsModule.deleteLead('${l.id}', '${UI.escapeHTML(l.title)}')"><i class="fa-solid fa-trash"></i></button>
            </div>
          ` : '--'}
        </td>
      </tr>
    `).join('');
  };

  const renderKanban = (list) => {
    const kanbanContainer = document.getElementById('leadsKanbanView');
    if (!kanbanContainer) return;

    kanbanContainer.innerHTML = stages.map(stage => {
      const stageLeads = list.filter(l => l.stage === stage);
      const stageTotal = stageLeads.reduce((acc, l) => acc + (Number(l.estimatedValue) || 0), 0);

      return `
        <div class="kanban-column" data-stage="${stage}" ondragover="LeadsModule.onDragOver(event)" ondrop="LeadsModule.onDrop(event, '${stage}')">
          <div class="kanban-column-header">
            <div class="kanban-column-title">
              <span class="badge ${UI.getBadgeClass(stage)}" style="padding: 2px 6px;">${stage}</span>
            </div>
            <span class="kanban-count">${stageLeads.length}</span>
          </div>
          <div class="kanban-cards-list" id="kanbanList-${stage.replace(/\s+/g, '-')}">
            ${stageLeads.map(l => `
              <div class="kanban-card" draggable="true" ondragstart="LeadsModule.onDragStart(event, '${l.id}')">
                <div class="kanban-card-title">${UI.escapeHTML(l.title)}</div>
                <div class="kanban-card-company"><i class="fa-solid fa-building"></i> ${UI.escapeHTML(l.company)}</div>
                <div style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 6px;"><i class="fa-solid fa-user"></i> ${UI.escapeHTML(l.contact)}</div>
                <div class="kanban-card-footer">
                  <span class="kanban-value">${UI.formatCurrency(l.estimatedValue)}</span>
                  <button class="btn btn-sm btn-icon" onclick="LeadsModule.openEditModal('${l.id}')"><i class="fa-solid fa-pen"></i></button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  };

  const onDragStart = (e, leadId) => {
    e.dataTransfer.setData('text/plain', leadId);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = async (e, targetStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) {
      await updateStage(leadId, targetStage);
    }
  };

  const updateStage = async (id, stage) => {
    const res = await API.put(`/api/leads/${id}/stage`, { stage });
    if (res.success) {
      UI.toast('success', 'Pipeline Updated', res.message);
      load();
    } else {
      UI.toast('error', 'Error', res.message);
    }
  };

  const populateDropdowns = async () => {
    const compRes = await API.get('/api/companies');
    if (compRes.success && compRes.data) {
      const select = document.getElementById('leadCompany');
      if (select) {
        select.innerHTML = compRes.data.map(c => `<option value="${UI.escapeHTML(c.name)}">${UI.escapeHTML(c.name)}</option>`).join('');
      }
    }
  };

  const openAddModal = () => {
    document.getElementById('leadForm').reset();
    document.getElementById('leadFormId').value = '';
    document.getElementById('leadModalTitle').textContent = 'Create Sales Opportunity / Lead';
    UI.openModal('leadModal');
  };

  const openEditModal = (id) => {
    const l = leadsList.find(item => item.id === id);
    if (!l) return;

    document.getElementById('leadFormId').value = l.id;
    document.getElementById('leadTitle').value = l.title;
    document.getElementById('leadCompany').value = l.company;
    document.getElementById('leadContact').value = l.contact;
    document.getElementById('leadEstimatedValue').value = l.estimatedValue;
    document.getElementById('leadSource').value = l.source;
    document.getElementById('leadStage').value = l.stage;
    document.getElementById('leadCloseDate').value = l.expectedCloseDate;
    document.getElementById('leadNotes').value = l.notes || '';

    document.getElementById('leadModalTitle').textContent = `Edit Lead: ${l.title}`;
    UI.openModal('leadModal');
  };

  const saveLead = async (e) => {
    e.preventDefault();
    const id = document.getElementById('leadFormId').value;
    const payload = {
      title: document.getElementById('leadTitle').value,
      company: document.getElementById('leadCompany').value,
      contact: document.getElementById('leadContact').value,
      estimatedValue: document.getElementById('leadEstimatedValue').value,
      source: document.getElementById('leadSource').value,
      stage: document.getElementById('leadStage').value,
      expectedCloseDate: document.getElementById('leadCloseDate').value,
      notes: document.getElementById('leadNotes').value
    };

    let res;
    if (id) {
      res = await API.put(`/api/leads/${id}`, payload);
    } else {
      res = await API.post('/api/leads', payload);
    }

    if (res.success) {
      UI.toast('success', 'Lead Saved', res.message);
      UI.closeModal('leadModal');
      load();
    } else {
      UI.toast('error', 'Error', res.message);
    }
  };

  const deleteLead = (id, title) => {
    UI.confirm('Delete Lead', `Are you sure you want to delete lead '${title}'?`, async () => {
      const res = await API.delete(`/api/leads/${id}`);
      if (res.success) {
        UI.toast('success', 'Deleted', res.message);
        load();
      }
    });
  };

  return {
    load,
    switchView,
    openAddModal,
    openEditModal,
    saveLead,
    deleteLead,
    updateStage,
    onDragStart,
    onDragOver,
    onDrop
  };
})();
window.LeadsModule = LeadsModule;

/* ==========================================================================
   MODULE 9: CRM ACTIVITIES
   ========================================================================== */
const ActivitiesModule = (() => {
  const load = async () => {
    const res = await API.get('/api/activities');
    if (res.success) {
      renderFeed(res.data || []);
      populateLeadDropdown();
    }
  };

  const renderFeed = (items) => {
    const container = document.getElementById('activitiesFeed');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>No logged activities recorded.</p></div>`;
      return;
    }

    const typeIcons = {
      'Call': 'fa-solid fa-phone',
      'Email': 'fa-solid fa-envelope',
      'Meeting': 'fa-solid fa-handshake',
      'Follow-up': 'fa-solid fa-clock-rotate-left',
      'Note': 'fa-solid fa-sticky-note'
    };

    container.innerHTML = items.map(act => `
      <div class="card" style="margin-bottom: 14px;">
        <div class="card-body" style="padding: 16px 20px; display: flex; align-items: flex-start; gap: 16px;">
          <div class="stat-icon-wrapper stat-icon-indigo" style="width: 42px; height: 42px; font-size: 1.1rem;">
            <i class="${typeIcons[act.type] || 'fa-solid fa-bell'}"></i>
          </div>
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main);">${UI.escapeHTML(act.leadTitle)}</h4>
              <span class="badge badge-normal">${UI.escapeHTML(act.type)}</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 8px;">
              ${UI.escapeHTML(act.description)}
            </p>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: var(--text-light);">
              <span><i class="fa-regular fa-calendar"></i> Logged: ${UI.escapeHTML(act.date)}</span>
              ${act.nextFollowUp ? `<span><i class="fa-solid fa-bullseye"></i> Next Follow-up: <strong>${UI.formatDate(act.nextFollowUp)}</strong></span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  };

  const populateLeadDropdown = async () => {
    const leadsRes = await API.get('/api/leads');
    if (leadsRes.success && leadsRes.data) {
      const select = document.getElementById('actLeadId');
      if (select) {
        select.innerHTML = leadsRes.data.map(l => `<option value="${l.id}">${UI.escapeHTML(l.title)} (${UI.escapeHTML(l.company)})</option>`).join('');
      }
    }
  };

  const openAddModal = () => {
    document.getElementById('activityForm').reset();
    UI.openModal('activityModal');
  };

  const submitActivity = async (e) => {
    e.preventDefault();
    const payload = {
      leadId: document.getElementById('actLeadId').value,
      type: document.getElementById('actType').value,
      description: document.getElementById('actDescription').value,
      nextFollowUp: document.getElementById('actNextFollowUp').value
    };

    const res = await API.post('/api/activities', payload);
    if (res.success) {
      UI.toast('success', 'Activity Logged', res.message);
      UI.closeModal('activityModal');
      load();
    } else {
      UI.toast('error', 'Error', res.message);
    }
  };

  return {
    load,
    openAddModal,
    submitActivity
  };
})();
window.ActivitiesModule = ActivitiesModule;
