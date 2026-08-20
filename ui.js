/**
 * HUMINEXA — User Interface Utilities & Component Engine
 * Includes Toast Notifications, Modals, Confirmation Dialogs, Theme Controller, and Formatters.
 */

const UI = (() => {
  const THEME_KEY = 'huminexa_theme_preference';

  /**
   * Initialize Theme Preference
   */
  const initTheme = () => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  /**
   * Toggle Dark / Light Mode
   */
  const toggleTheme = () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    toast('info', 'Theme Updated', `Switched to ${isDark ? 'Dark' : 'Light'} mode.`);
    return isDark;
  };

  /**
   * Display a floating Toast Notification
   * @param {'success'|'error'|'warning'|'info'} type 
   * @param {string} title 
   * @param {string} message 
   * @param {number} duration 
   */
  const toast = (type = 'info', title = '', message = '', duration = 4000) => {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = {
      success: 'fa-solid fa-circle-check',
      error: 'fa-solid fa-circle-xmark',
      warning: 'fa-solid fa-triangle-exclamation',
      info: 'fa-solid fa-circle-info'
    };

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;
    toastEl.innerHTML = `
      <i class="${icons[type] || icons.info} toast-icon"></i>
      <div class="toast-content">
        <div class="toast-title">${escapeHTML(title || type.toUpperCase())}</div>
        <div class="toast-message">${escapeHTML(message)}</div>
      </div>
      <i class="fa-solid fa-xmark toast-close"></i>
    `;

    const closeBtn = toastEl.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      toastEl.remove();
    });

    container.appendChild(toastEl);

    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.style.opacity = '0';
        toastEl.style.transform = 'translateX(50px)';
        toastEl.style.transition = 'all 0.3s ease';
        setTimeout(() => toastEl.remove(), 300);
      }
    }, duration);
  };

  /**
   * Open a Modal Dialog by Element ID
   */
  const openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  };

  /**
   * Close a Modal Dialog by Element ID
   */
  const closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      // If no other modals are open, restore body overflow
      if (!document.querySelector('.modal-backdrop.show')) {
        document.body.style.overflow = '';
      }
    }
  };

  /**
   * Close all active modals
   */
  const closeAllModals = () => {
    document.querySelectorAll('.modal-backdrop.show').forEach(m => m.classList.remove('show'));
    document.body.style.overflow = '';
  };

  /**
   * Render custom confirmation modal
   */
  const confirm = (title, message, onConfirm, confirmBtnText = 'Confirm Delete', isDanger = true) => {
    let confirmModal = document.getElementById('globalConfirmModal');
    if (!confirmModal) {
      confirmModal = document.createElement('div');
      confirmModal.id = 'globalConfirmModal';
      confirmModal.className = 'modal-backdrop';
      confirmModal.innerHTML = `
        <div class="modal-container" style="max-width: 420px;">
          <div class="modal-header">
            <h3 class="modal-title" id="confirmTitle">Confirm Action</h3>
            <button class="modal-close-btn" id="confirmCloseBtn"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body">
            <p id="confirmMessage" style="color: var(--text-muted); font-size: 0.95rem;"></p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="confirmCancelBtn">Cancel</button>
            <button class="btn ${isDanger ? 'btn-danger' : 'btn-primary'}" id="confirmActionBtn">${confirmBtnText}</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmModal);
    }

    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    
    const actionBtn = document.getElementById('confirmActionBtn');
    actionBtn.className = `btn ${isDanger ? 'btn-danger' : 'btn-primary'}`;
    actionBtn.textContent = confirmBtnText;

    const cleanup = () => {
      closeModal('globalConfirmModal');
    };

    // Replace action button to remove old listeners
    const newActionBtn = actionBtn.cloneNode(true);
    actionBtn.parentNode.replaceChild(newActionBtn, actionBtn);

    newActionBtn.addEventListener('click', () => {
      cleanup();
      if (typeof onConfirm === 'function') onConfirm();
    });

    document.getElementById('confirmCancelBtn').onclick = cleanup;
    document.getElementById('confirmCloseBtn').onclick = cleanup;

    openModal('globalConfirmModal');
  };

  /**
   * Formatting Utilities
   */
  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return 'HX';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const escapeHTML = (str) => {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const getBadgeClass = (status) => {
    if (!status) return 'badge-normal';
    const clean = status.toLowerCase().replace(/\s+/g, '-');
    return `badge-${clean}`;
  };

  return {
    initTheme,
    toggleTheme,
    toast,
    openModal,
    closeModal,
    closeAllModals,
    confirm,
    formatCurrency,
    formatDate,
    getInitials,
    escapeHTML,
    getBadgeClass
  };
})();

window.UI = UI;
