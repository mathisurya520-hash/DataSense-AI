/* ==========================================================================
   DataSense AI - Shared Navigation Shell & Layout Injector
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Load active canvas background structure if not present
  if (!document.getElementById('background-canvas-container')) {
    const bgContainer = document.createElement('div');
    bgContainer.id = 'background-canvas-container';
    document.body.prepend(bgContainer);
  }

  // Load Lucide Icons CDN script if not loaded
  if (!window.lucide) {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/lucide@latest';
    script.onload = () => lucide.createIcons();
    document.head.appendChild(script);
  }

  // Skip injecting sidebar/header for public page templates
  const path = window.location.pathname;
  if (path === '/' || path.endsWith('index.html') || path.endsWith('login.html')) {
    return;
  }

  const appLayout = document.getElementById('app-layout');
  if (!appLayout) return;

  // Set up container wrapper structure
  appLayout.className = 'app-container';
  if (localStorage.getItem('datasense_sidebar_collapsed') === 'true') {
    appLayout.classList.add('collapsed');
  }

  // Get active page file name
  const pageFile = path.substring(path.lastIndexOf('/') + 1);

  // 2. Build Sidebar Markup
  const sidebarHtml = `
    <aside class="sidebar">
      <div class="sidebar-logo">
        <i class="logo-icon" data-lucide="database"></i>
        <span class="logo-text">DataSense <span>AI</span></span>
      </div>
      <ul class="sidebar-menu">
        <li class="menu-item ${pageFile === 'dashboard.html' ? 'active' : ''}">
          <a href="/dashboard.html" class="menu-link">
            <i data-lucide="layout-dashboard"></i>
            <span>Dashboard</span>
          </a>
        </li>
        <li class="menu-item ${pageFile === 'sql-assistant.html' ? 'active' : ''}">
          <a href="/sql-assistant.html" class="menu-link">
            <i data-lucide="code-2"></i>
            <span>SQL Assistant</span>
          </a>
        </li>
        <li class="menu-item ${pageFile === 'csv-analyzer.html' ? 'active' : ''}">
          <a href="/csv-analyzer.html" class="menu-link">
            <i data-lucide="file-spreadsheet"></i>
            <span>CSV Analyzer</span>
          </a>
        </li>
        <li class="menu-item ${pageFile === 'analytics.html' ? 'active' : ''}">
          <a href="/analytics.html" class="menu-link">
            <i data-lucide="pie-chart"></i>
            <span>Analytics Center</span>
          </a>
        </li>
        <li class="menu-item ${pageFile === 'ai-insights.html' ? 'active' : ''}">
          <a href="/ai-insights.html" class="menu-link">
            <i data-lucide="brain-circuit"></i>
            <span>AI Insights</span>
          </a>
        </li>
        <li class="menu-item ${pageFile === 'predictions.html' ? 'active' : ''}">
          <a href="/predictions.html" class="menu-link">
            <i data-lucide="trending-up"></i>
            <span>Predictions</span>
          </a>
        </li>
        <li class="menu-item ${pageFile === 'report-generator.html' ? 'active' : ''}">
          <a href="/report-generator.html" class="menu-link">
            <i data-lucide="file-text"></i>
            <span>Report Generator</span>
          </a>
        </li>
        <li class="menu-item ${pageFile === 'settings.html' ? 'active' : ''}">
          <a href="/settings.html" class="menu-link">
            <i data-lucide="settings"></i>
            <span>Settings</span>
          </a>
        </li>
      </ul>
      <div class="sidebar-footer">
        <div class="profile-summary">
          <div class="profile-avatar flex-center">
            ${DataSenseState.getUsername().charAt(0).toUpperCase()}
          </div>
          <div class="profile-info">
            <div class="profile-name">${DataSenseState.getUsername()}</div>
            <div class="profile-role">Lead Analyst</div>
          </div>
        </div>
        <button id="logout-trigger" class="action-btn" title="Logout" style="width:32px; height:32px;">
          <i data-lucide="log-out" style="font-size:14px; margin:0;"></i>
        </button>
      </div>
    </aside>
  `;

  // Get dynamic breadcrumb title
  let breadcrumbTitle = 'Executive Portal';
  if (pageFile === 'dashboard.html') breadcrumbTitle = 'Dashboard Overview';
  else if (pageFile === 'sql-assistant.html') breadcrumbTitle = 'SQL Assistant Workspace';
  else if (pageFile === 'csv-analyzer.html') breadcrumbTitle = 'CSV Analyzer & Clean Studio';
  else if (pageFile === 'analytics.html') breadcrumbTitle = 'Interactive Analytics Center';
  else if (pageFile === 'ai-insights.html') breadcrumbTitle = 'AI Strategy Room';
  else if (pageFile === 'predictions.html') breadcrumbTitle = 'Predictive Forecasting Hub';
  else if (pageFile === 'report-generator.html') breadcrumbTitle = 'Custom Report Center';
  else if (pageFile === 'settings.html') breadcrumbTitle = 'Portal Settings';

  // 3. Build Header Navbar Markup
  const headerHtml = `
    <header class="app-header">
      <div style="display: flex; align-items: center; gap: 15px;">
        <button id="sidebar-toggle" class="action-btn" style="width: 36px; height: 36px;" title="Toggle Sidebar">
          <i data-lucide="menu"></i>
        </button>
        <h2 style="font-family: var(--font-title); font-size: 18px; font-weight:600; color: var(--text-primary); margin:0;">
          ${breadcrumbTitle}
        </h2>
      </div>
      
      <div class="header-search">
        <i data-lucide="search"></i>
        <input type="text" id="global-search-input" class="form-control" placeholder="Search datasets, SQL, forecasts..." style="height: 38px;">
      </div>

      <div class="header-actions">
        <button id="notif-btn" class="action-btn" title="Notifications">
          <i data-lucide="bell"></i>
          <span class="badge-dot"></span>
        </button>
        
        <div style="width: 1px; height: 24px; background: rgba(232, 223, 200, 0.15);"></div>
        
        <div class="flex-center" style="gap: 10px;">
          <div class="profile-avatar flex-center" style="width:36px; height:36px;">
            ${DataSenseState.getUsername().charAt(0).toUpperCase()}
          </div>
          <span style="font-size: 13px; font-weight:600; color: var(--text-secondary); cursor: pointer;" onclick="window.location.href='/settings.html'">
            ${DataSenseState.getUsername()}
          </span>
        </div>
      </div>
      
      <!-- Notifications Drawer -->
      <div class="notification-panel" id="notification-drawer">
        <div class="notification-header">
          <span>Alert Notifications</span>
          <a href="#" id="clear-notif-btn" style="font-size: 11px; color: var(--highlight-yellow);">Clear All</a>
        </div>
        <div class="notification-list" id="notification-items-container">
          <!-- Populated by JS -->
        </div>
      </div>
    </header>
  `;

  // 4. Inject layouts
  const mainShell = document.createElement('main');
  mainShell.className = 'app-main';
  
  // Reparent original child content elements to main content section
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'app-content';
  
  while (appLayout.firstChild) {
    contentWrapper.appendChild(appLayout.firstChild);
  }
  
  appLayout.innerHTML = sidebarHtml;
  mainShell.innerHTML = headerHtml;
  mainShell.appendChild(contentWrapper);
  appLayout.appendChild(mainShell);

  // 5. Setup Action Listeners
  const toggleBtn = document.getElementById('sidebar-toggle');
  toggleBtn.addEventListener('click', () => {
    appLayout.classList.toggle('collapsed');
    const isCollapsed = appLayout.classList.contains('collapsed');
    localStorage.setItem('datasense_sidebar_collapsed', isCollapsed);
  });

  const logoutBtn = document.getElementById('logout-trigger');
  logoutBtn.addEventListener('click', () => {
    DataSenseState.logout();
  });

  // Notification Drawer triggers
  const notifBtn = document.getElementById('notif-btn');
  const notifDrawer = document.getElementById('notification-drawer');
  
  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notifDrawer.style.display = notifDrawer.style.display === 'block' ? 'none' : 'block';
  });

  document.addEventListener('click', (e) => {
    if (notifDrawer.style.display === 'block' && !notifDrawer.contains(e.target) && e.target !== notifBtn) {
      notifDrawer.style.display = 'none';
    }
  });

  // Populate dynamic notifications
  populateNotifications();

  // Initialize Search Box Listener
  const searchInput = document.getElementById('global-search-input');
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim().toLowerCase();
      if (query) {
        handleGlobalSearch(query);
      }
    }
  });

  // Trigger Lucide SVG loader
  if (window.lucide) {
    lucide.createIcons();
  }
});

// Mock notification updates
function populateNotifications() {
  const container = document.getElementById('notification-items-container');
  if (!container) return;

  const defaultNotifications = [
    { title: 'AI Prediction Ready', desc: 'Q3 inventory forecasts successfully compiled.', time: '10 min ago', icon: 'trending-up' },
    { title: 'CSV Dataset Uploaded', desc: 'Dataset "SaaS_Quarterly_Sales" processed.', time: '1 hr ago', icon: 'file-spreadsheet' },
    { title: 'Data Cleaning Complete', desc: '82 null cells formatted inside CRM dataset.', time: '4 hrs ago', icon: 'check-circle' },
    { title: 'Audit Report Finalized', desc: 'PDF financial report exported for review.', time: 'Yesterday', icon: 'file-text' }
  ];

  container.innerHTML = defaultNotifications.map(notif => `
    <div class="notification-item">
      <div class="notif-icon flex-center">
        <i data-lucide="${notif.icon}" style="width: 14px; height: 14px;"></i>
      </div>
      <div class="notif-details">
        <div class="notif-title">${notif.title}</div>
        <div class="notif-desc">${notif.desc}</div>
        <div class="notif-time">${notif.time}</div>
      </div>
    </div>
  `).join('');
  
  if (window.lucide) lucide.createIcons();

  document.getElementById('clear-notif-btn').addEventListener('click', (e) => {
    e.preventDefault();
    container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted); font-size:12px;">No unread alerts</div>';
    const badge = document.querySelector('.badge-dot');
    if (badge) badge.style.display = 'none';
  });
}

// Simple redirect routes selector matching searches
function handleGlobalSearch(query) {
  DataSenseState.showToast(`Searching portal for "${query}"...`);
  if (query.includes('sql') || query.includes('select') || query.includes('query')) {
    window.location.href = '/sql-assistant.html';
  } else if (query.includes('csv') || query.includes('upload') || query.includes('clean') || query.includes('rows')) {
    window.location.href = '/csv-analyzer.html';
  } else if (query.includes('chart') || query.includes('analytics') || query.includes('visual') || query.includes('filter')) {
    window.location.href = '/analytics.html';
  } else if (query.includes('insight') || query.includes('summary') || query.includes('swot') || query.includes('audit')) {
    window.location.href = '/ai-insights.html';
  } else if (query.includes('forecast') || query.includes('predict') || query.includes('sales') || query.includes('growth')) {
    window.location.href = '/predictions.html';
  } else if (query.includes('report') || query.includes('pdf') || query.includes('download')) {
    window.location.href = '/report-generator.html';
  } else if (query.includes('setting') || query.includes('key') || query.includes('profile')) {
    window.location.href = '/settings.html';
  } else {
    window.location.href = '/dashboard.html';
  }
}
