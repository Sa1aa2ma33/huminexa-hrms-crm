/**
 * HUMINEXA — Authentication & Session Manager
 * Handles login, demo accounts pre-population, credentials validation, and role redirection.
 */

document.addEventListener('DOMContentLoaded', () => {
  UI.initTheme();

  const isLoginPage = !!document.getElementById('loginForm');
  const token = API.getToken();

  // If on login page and already authenticated, redirect to dashboard
  if (isLoginPage) {
    if (token) {
      window.location.href = 'dashboard.html';
      return;
    }
    setupAuthTabs();
    setupLoginForm();
    setupRegisterForm();
    setupDemoButtons();
    setupThemeToggle();
  } else {
    // If on dashboard page and no token exists, redirect to login
    if (!token) {
      window.location.href = 'index.html';
    }
  }
});

/**
 * Configure Login Form Submission
 */
function setupLoginForm() {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('loginSubmitBtn');
  const errorAlert = document.getElementById('loginErrorAlert');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      showLoginError('Please enter both email and password.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showLoginError('Please provide a valid email format.');
      return;
    }

    // Set loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
    hideLoginError();

    const res = await API.post('/api/auth/login', { email, password });

    if (res.success && res.data && res.data.token) {
      API.setSession(res.data.token, res.data.user);
      UI.toast('success', 'Welcome Back!', `Logged in as ${res.data.user.name} (${res.data.user.role})`);
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 600);
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Sign In to Workspace <i class="fa-solid fa-arrow-right"></i>';
      showLoginError(res.message || 'Authentication failed. Please check your credentials.');
      UI.toast('error', 'Login Failed', res.message || 'Invalid email or password.');
    }
  });

  function showLoginError(msg) {
    if (errorAlert) {
      errorAlert.textContent = msg;
      errorAlert.style.display = 'block';
    }
  }

  function hideLoginError() {
    if (errorAlert) {
      errorAlert.style.display = 'none';
    }
  }
}

/**
 * Configure Auth Switcher Tabs (Sign In vs Create Account)
 */
function setupAuthTabs() {
  const tabSignIn = document.getElementById('tabSignInBtn');
  const tabSignUp = document.getElementById('tabSignUpBtn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const heading = document.getElementById('authHeading');
  const subheading = document.getElementById('authSubheading');
  const demoSection = document.querySelector('.demo-accounts');

  if (!tabSignIn || !tabSignUp) return;

  tabSignIn.addEventListener('click', () => {
    tabSignIn.className = 'btn btn-primary';
    tabSignIn.style.background = 'var(--primary)';
    tabSignIn.style.color = '#fff';

    tabSignUp.className = 'btn btn-outline';
    tabSignUp.style.background = 'transparent';
    tabSignUp.style.color = 'var(--text-muted)';

    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
    if (demoSection) demoSection.style.display = 'block';

    if (heading) heading.textContent = 'Sign In to Workspace';
    if (subheading) subheading.textContent = 'Access your unified HR management and sales pipeline platform.';
  });

  tabSignUp.addEventListener('click', () => {
    tabSignUp.className = 'btn btn-primary';
    tabSignUp.style.background = 'var(--primary)';
    tabSignUp.style.color = '#fff';

    tabSignIn.className = 'btn btn-outline';
    tabSignIn.style.background = 'transparent';
    tabSignIn.style.color = 'var(--text-muted)';

    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
    if (demoSection) demoSection.style.display = 'none';

    if (heading) heading.textContent = 'Create Workspace Account';
    if (subheading) subheading.textContent = 'Register with your own email to start using HUMINEXA.';
  });
}

/**
 * Configure User Registration Form
 */
function setupRegisterForm() {
  const form = document.getElementById('registerForm');
  const nameInput = document.getElementById('regName');
  const emailInput = document.getElementById('regEmail');
  const passInput = document.getElementById('regPassword');
  const roleSelect = document.getElementById('regRole');
  const deptSelect = document.getElementById('regDept');
  const submitBtn = document.getElementById('regSubmitBtn');
  const errorAlert = document.getElementById('loginErrorAlert');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passInput.value.trim();
    const role = roleSelect ? roleSelect.value : 'Employee';
    const department = deptSelect ? deptSelect.value : 'Engineering';

    if (!name || !email || !password) {
      showError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';
    hideError();

    const res = await API.post('/api/auth/register', {
      name,
      email,
      password,
      role,
      department
    });

    if (res.success && res.data && res.data.token) {
      API.setSession(res.data.token, res.data.user);
      UI.toast('success', 'Account Created!', `Welcome to HUMINEXA, ${res.data.user.name}!`);
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 700);
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Create Account & Access Workspace <i class="fa-solid fa-rocket"></i>';
      showError(res.message || 'Registration failed. Please try again.');
      UI.toast('error', 'Registration Error', res.message || 'Unable to create account.');
    }
  });

  function showError(msg) {
    if (errorAlert) {
      errorAlert.textContent = msg;
      errorAlert.style.display = 'block';
    }
  }

  function hideError() {
    if (errorAlert) {
      errorAlert.style.display = 'none';
    }
  }
}

/**
 * Configure Quick Demo Login Account Buttons
 */
function setupDemoButtons() {
  const demoAccounts = {
    admin: { email: 'sajidmansurshaikh7@gmail.com', pass: 'Admin@123' },
    hr: { email: 'hr@huminexa.com', pass: 'Hr@123' },
    sales: { email: 'sales@huminexa.com', pass: 'Sales@123' },
    employee: { email: 'employee@huminexa.com', pass: 'Employee@123' }
  };

  document.querySelectorAll('[data-demo-role]').forEach(btn => {
    btn.addEventListener('click', () => {
      const roleKey = btn.getAttribute('data-demo-role');
      const acc = demoAccounts[roleKey];
      if (acc) {
        const emailInput = document.getElementById('email');
        const passInput = document.getElementById('password');
        if (emailInput && passInput) {
          emailInput.value = acc.email;
          passInput.value = acc.pass;
          UI.toast('info', 'Demo Filled', `Loaded ${btn.textContent.trim()} credentials.`);
        }
      }
    });
  });
}

/**
 * Configure Dark Mode Toggle on Login page
 */
function setupThemeToggle() {
  const themeToggle = document.getElementById('loginThemeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      UI.toggleTheme();
    });
  }
}

/**
 * Global User Logout Handler
 */
function handleLogout() {
  UI.confirm(
    'Sign Out',
    'Are you sure you want to log out from HUMINEXA?',
    () => {
      API.clearSession();
      UI.toast('info', 'Signed Out', 'You have been logged out.');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 400);
    },
    'Log Out',
    false
  );
}

window.handleLogout = handleLogout;
