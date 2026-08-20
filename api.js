/**
 * HUMINEXA — Centralized API Communication Service
 * Handles HTTP requests, JWT header attachment, token expiration, and standardized responses.
 */

const API = (() => {
  const TOKEN_KEY = 'huminexa_auth_token';
  const USER_KEY = 'huminexa_auth_user';

  /**
   * Retrieve current JWT token from storage
   */
  const getToken = () => localStorage.getItem(TOKEN_KEY);

  /**
   * Save session token and user profile
   */
  const setSession = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  /**
   * Retrieve current stored user profile
   */
  const getUser = () => {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  };

  /**
   * Clear session and redirect to login
   */
  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  /**
   * Core request dispatcher
   */
  const request = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(endpoint, config);
      const data = await response.json().catch(() => ({
        success: false,
        message: `HTTP Server Error (${response.status})`
      }));

      // Handle unauthorized / expired tokens
      if (response.status === 401 || response.status === 403) {
        if (!endpoint.includes('/api/auth/login')) {
          console.warn('[API Auth Error] Session expired or unauthorized:', data.message);
          clearSession();
          if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
            window.location.href = 'index.html?session=expired';
          }
        }
      }

      return data;
    } catch (error) {
      console.error('[API Network Error]', error);
      return {
        success: false,
        message: 'Unable to connect to the server. Please check your network or server status.'
      };
    }
  };

  return {
    getToken,
    getUser,
    setSession,
    clearSession,

    get: (url, params = null) => {
      let finalUrl = url;
      if (params) {
        const qs = new URLSearchParams(params).toString();
        finalUrl += (url.includes('?') ? '&' : '?') + qs;
      }
      return request(finalUrl, { method: 'GET' });
    },

    post: (url, body = {}) => {
      return request(url, {
        method: 'POST',
        body: JSON.stringify(body)
      });
    },

    put: (url, body = {}) => {
      return request(url, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
    },

    delete: (url) => {
      return request(url, { method: 'DELETE' });
    }
  };
})();

// Attach to window object for global availability
window.API = API;
