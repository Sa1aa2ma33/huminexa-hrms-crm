/**
 * HUMINEXA — Dashboard Controller & Charts Engine
 * Fetches aggregated metrics and renders Chart.js visualizations & KPI feeds.
 */

let attendanceChartInstance = null;
let leadsChartInstance = null;

const Dashboard = (() => {
  /**
   * Load and render full dashboard state
   */
  const load = async () => {
    const res = await API.get('/api/dashboard');
    if (!res.success || !res.data) {
      UI.toast('error', 'Dashboard Error', res.message || 'Failed to load dashboard data.');
      return;
    }

    const { kpi, charts, recentLeaves, recentLeads, recentAnnouncements, upcomingEvents } = res.data;

    // 1. Update KPI Cards
    updateKPI(kpi);

    // 2. Render Charts
    renderAttendanceChart(charts.attendanceBreakdown);
    renderLeadsChart(charts.leadsByStage);

    // 3. Render Dashboard Tables & Feeds
    renderRecentLeaves(recentLeaves);
    renderRecentLeads(recentLeads);
    renderAnnouncementsFeed(recentAnnouncements);
    renderUpcomingEvents(upcomingEvents);
  };

  /**
   * Update KPI Cards in the UI
   */
  const updateKPI = (kpi) => {
    const totalEmpEl = document.getElementById('kpiTotalEmployees');
    const presentTodayEl = document.getElementById('kpiPresentToday');
    const onLeaveEl = document.getElementById('kpiOnLeave');
    const activeLeadsEl = document.getElementById('kpiActiveLeads');
    const pipelineValueEl = document.getElementById('kpiPipelineValue');
    const attendanceRateEl = document.getElementById('kpiAttendanceRate');

    if (totalEmpEl) totalEmpEl.textContent = kpi.totalEmployees ?? 0;
    if (presentTodayEl) presentTodayEl.textContent = kpi.presentToday ?? 0;
    if (onLeaveEl) onLeaveEl.textContent = kpi.onLeaveToday ?? 0;
    if (activeLeadsEl) activeLeadsEl.textContent = kpi.totalActiveLeads ?? 0;
    if (pipelineValueEl) pipelineValueEl.textContent = UI.formatCurrency(kpi.totalPipelineValue ?? 0);
    if (attendanceRateEl) attendanceRateEl.textContent = `${kpi.attendancePercentage ?? 0}%`;
  };

  /**
   * Render Attendance Breakdown Doughnut Chart
   */
  const renderAttendanceChart = (data) => {
    const canvas = document.getElementById('attendanceChart');
    if (!canvas) return;

    if (attendanceChartInstance) {
      attendanceChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    const isDark = document.body.classList.contains('dark-mode');

    attendanceChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Present', 'Late', 'Work From Home', 'Half Day', 'Absent'],
        datasets: [{
          data: [
            data.present || 0,
            data.late || 0,
            data.wfh || 0,
            data.halfDay || 0,
            data.absent || 0
          ],
          backgroundColor: [
            '#10B981', // emerald
            '#F59E0B', // amber
            '#0EA5E9', // sky
            '#8B5CF6', // purple
            '#EF4444'  // red
          ],
          borderWidth: 2,
          borderColor: isDark ? '#1E293B' : '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 14,
              color: isDark ? '#94A3B8' : '#4B5563',
              font: { family: 'Inter', size: 12 }
            }
          }
        }
      }
    });
  };

  /**
   * Render Leads Pipeline Stage Bar Chart
   */
  const renderLeadsChart = (data) => {
    const canvas = document.getElementById('leadsStageChart');
    if (!canvas) return;

    if (leadsChartInstance) {
      leadsChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    const isDark = document.body.classList.contains('dark-mode');

    const labels = Object.keys(data);
    const counts = Object.values(data);

    leadsChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Deals Count',
          data: counts,
          backgroundColor: [
            '#818CF8',
            '#6366F1',
            '#0EA5E9',
            '#06B6D4',
            '#F59E0B',
            '#10B981',
            '#EF4444'
          ],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: isDark ? '#94A3B8' : '#6B7280',
              font: { family: 'Inter', size: 11 }
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: isDark ? '#94A3B8' : '#6B7280',
              font: { family: 'Inter', size: 11 }
            },
            grid: {
              color: isDark ? '#334155' : '#E2E8F0'
            }
          }
        }
      }
    });
  };

  /**
   * Populate Recent Leave Applications
   */
  const renderRecentLeaves = (leaves) => {
    const container = document.getElementById('dashRecentLeavesTable');
    if (!container) return;

    if (!leaves || leaves.length === 0) {
      container.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 24px; color: var(--text-muted);">No recent leave applications.</td></tr>`;
      return;
    }

    container.innerHTML = leaves.map(l => `
      <tr>
        <td>
          <strong>${UI.escapeHTML(l.employeeName)}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${UI.escapeHTML(l.employeeId)}</div>
        </td>
        <td>${UI.escapeHTML(l.leaveType)}</td>
        <td>${UI.formatDate(l.startDate)} - ${UI.formatDate(l.endDate)}</td>
        <td><strong>${l.totalDays} day(s)</strong></td>
        <td><span class="badge ${UI.getBadgeClass(l.status)}">${UI.escapeHTML(l.status)}</span></td>
      </tr>
    `).join('');
  };

  /**
   * Populate Recent CRM Leads
   */
  const renderRecentLeads = (leads) => {
    const container = document.getElementById('dashRecentLeadsTable');
    if (!container) return;

    if (!leads || leads.length === 0) {
      container.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 24px; color: var(--text-muted);">No active leads recorded.</td></tr>`;
      return;
    }

    container.innerHTML = leads.map(l => `
      <tr>
        <td>
          <strong>${UI.escapeHTML(l.title)}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${UI.escapeHTML(l.company)}</div>
        </td>
        <td>${UI.escapeHTML(l.contact)}</td>
        <td><strong style="color: var(--primary);">${UI.formatCurrency(l.estimatedValue)}</strong></td>
        <td><span class="badge ${UI.getBadgeClass(l.stage)}">${UI.escapeHTML(l.stage)}</span></td>
        <td>${UI.escapeHTML(l.assignedTo)}</td>
      </tr>
    `).join('');
  };

  /**
   * Populate Dashboard Announcements Widget
   */
  const renderAnnouncementsFeed = (announcements) => {
    const container = document.getElementById('dashAnnouncementsList');
    if (!container) return;

    if (!announcements || announcements.length === 0) {
      container.innerHTML = `<div style="padding: 16px; color: var(--text-muted); text-align: center;">No active bulletins.</div>`;
      return;
    }

    container.innerHTML = announcements.map(a => `
      <div style="padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h4 style="font-size: 0.92rem; font-weight: 600; color: var(--text-main);">${UI.escapeHTML(a.title)}</h4>
          <span class="badge ${UI.getBadgeClass(a.priority)}">${UI.escapeHTML(a.priority)}</span>
        </div>
        <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4;">${UI.escapeHTML(a.message)}</p>
        <div style="font-size: 0.72rem; color: var(--text-light); margin-top: 4px;">
          By ${UI.escapeHTML(a.author)} &bull; ${UI.formatDate(a.publishedDate)}
        </div>
      </div>
    `).join('');
  };

  /**
   * Populate Birthdays & Anniversaries Feed
   */
  const renderUpcomingEvents = (events) => {
    const container = document.getElementById('dashUpcomingEvents');
    if (!container) return;

    if (!events || events.length === 0) {
      container.innerHTML = `<div style="padding: 16px; color: var(--text-muted); text-align: center;">No upcoming celebrations this month.</div>`;
      return;
    }

    container.innerHTML = events.map(e => `
      <div style="display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--bg-surface-subtle); border-radius: var(--radius-md); margin-bottom: 8px;">
        <div class="avatar-initials" style="width: 32px; height: 32px; font-size: 0.75rem;">${UI.getInitials(e.name)}</div>
        <div style="flex: 1;">
          <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">${UI.escapeHTML(e.name)}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${UI.escapeHTML(e.department)}</div>
        </div>
        <span class="badge badge-present" style="font-size: 0.7rem;"><i class="fa-solid fa-cake-candles"></i> ${UI.formatDate(e.date)}</span>
      </div>
    `).join('');
  };

  return {
    load
  };
})();

window.Dashboard = Dashboard;
