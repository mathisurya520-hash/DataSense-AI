/* ==========================================================================
   DataSense AI - State Manager & Authentication Route Controller
   ========================================================================== */

const DataSenseState = {
  // Local storage keys
  TOKEN_KEY: 'datasense_jwt_token',
  USER_KEY: 'datasense_username',
  ACTIVE_DS_KEY: 'datasense_active_ds_id',
  
  // Base API url path
  BASE_URL: '/api',

  // Authentication check
  isAuthenticated() {
    return !!localStorage.getItem(this.TOKEN_KEY);
  },

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  getUsername() {
    return localStorage.getItem(this.USER_KEY) || 'Executive User';
  },

  getActiveDatasetId() {
    return sessionStorage.getItem(this.ACTIVE_DS_KEY);
  },

  setActiveDatasetId(id) {
    if (id) {
      sessionStorage.setItem(this.ACTIVE_DS_KEY, id);
    } else {
      sessionStorage.removeItem(this.ACTIVE_DS_KEY);
    }
  },

  // Perform secure API call
  async apiFetch(endpoint, options = {}) {
    const url = `${this.BASE_URL}${endpoint}`;
    
    // Add auth headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchConfig = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, fetchConfig);
      
      // Handle unauthorized
      if (response.status === 401) {
        this.logout();
        return null;
      }
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err.message);
      this.showToast(err.message, 'error');
      throw err;
    }
  },

  // Standard toast notification displayer (integrated in client)
  showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.position = 'fixed';
      container.style.bottom = '20px';
      container.style.right = '20px';
      container.style.zIndex = '9999';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '10px';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.pointerEvents = 'auto';
    toast.style.background = 'rgba(19, 42, 36, 0.95)';
    toast.style.backdropFilter = 'blur(10px)';
    toast.style.border = `1px solid ${type === 'error' ? '#F4C430' : '#2FAF7A'}`;
    toast.style.color = '#F8F4E3';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.fontSize = '13px';
    toast.style.fontWeight = '600';
    toast.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.5)';
    toast.style.minWidth = '240px';
    toast.style.transition = 'all 0.3s ease';
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
    
    // Add icon
    const icon = type === 'error' ? '⚠️' : '✅';
    toast.innerHTML = `<span style="margin-right: 8px;">${icon}</span> ${message}`;

    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 10);

    // Remove toast
    setTimeout(() => {
      toast.style.transform = 'translateY(-20px)';
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 4000);
  },

  // Save session details upon successful login
  login(token, username) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, username);
    window.location.href = '/dashboard.html';
  },

  // Clean storage and exit portal
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.clear();
    
    // Direct back to index
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html' && window.location.pathname !== '/login.html') {
      window.location.href = '/login.html';
    }
  },

  // Validate route access permission
  checkAuthRoute() {
    const path = window.location.pathname;
    const isPublicPage = path === '/' || path === '/index.html' || path === '/login.html';
    
    if (!this.isAuthenticated() && !isPublicPage) {
      // Redirect back to login
      window.location.href = '/login.html';
    } else if (this.isAuthenticated() && path === '/login.html') {
      // Already logged in, direct to dashboard
      window.location.href = '/dashboard.html';
    }
  }
};

// Auto check auth on script load
DataSenseState.checkAuthRoute();
window.DataSenseState = DataSenseState;
