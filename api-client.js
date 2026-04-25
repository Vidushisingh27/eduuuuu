(function attachEdunovaApi(globalScope) {
  const SESSION_KEY = 'edunova-auth-session';
  const DEFAULT_BASE_URL = (() => {
    if (globalScope.EDUNOVA_API_BASE_URL && String(globalScope.EDUNOVA_API_BASE_URL).trim()) {
      return String(globalScope.EDUNOVA_API_BASE_URL).trim();
    }

    if (typeof window !== 'undefined' && window.location?.origin && window.location.origin.startsWith('http')) {
      const { hostname, port, protocol } = window.location;
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
      if (isLocal && port && port !== '5000') {
        return `${protocol}//${hostname}:5000`;
      }

      return window.location.origin;
    }

    return 'http://localhost:5000';
  })();

  function getBaseUrl() {
    const configured = globalScope.localStorage.getItem('edunova-api-base-url');
    const rawBase = String(configured || DEFAULT_BASE_URL).replace(/\/$/, '');

    try {
      const parsed = new URL(rawBase);
      const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      if (isLocal && parsed.port && parsed.port !== '5000') {
        parsed.port = '5000';
      }
      return parsed.toString().replace(/\/$/, '');
    } catch {
      return rawBase;
    }
  }

  function getSession() {
    try {
      return JSON.parse(globalScope.localStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function saveSession(payload) {
    globalScope.localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  }

  function clearSession() {
    globalScope.localStorage.removeItem(SESSION_KEY);
  }

  async function request(path, options = {}) {
    const session = getSession();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (session?.token) {
      headers.Authorization = `Bearer ${session.token}`;
    }

    let response;
    try {
      response = await fetch(`${getBaseUrl()}${path}`, {
        ...options,
        headers,
      });
    } catch {
      throw new Error(`Cannot connect to API at ${getBaseUrl()}. Start backend with: npm start`);
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = {
        success: false,
        message: 'Invalid JSON response from server',
      };
    }

    if (!response.ok || payload.success === false) {
      const errorMessage = payload?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return payload;
  }

  const api = {
    getBaseUrl,
    getSession,
    saveSession,
    clearSession,
    request,

    register(data) {
      return request('/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    login(data) {
      return request('/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    logout() {
      return request('/logout', {
        method: 'POST',
      });
    },

    getCourses(search = '') {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      return request(`/courses${query}`);
    },

    getCourseById(courseId) {
      return request(`/courses/${courseId}`);
    },

    getLessonsByCourse(courseId) {
      return request(`/lessons/${courseId}`);
    },

    saveProgress(data) {
      return request('/progress', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getProgress(userId) {
      return request(`/progress/${userId}`);
    },

    getSettings(userId) {
      return request(`/settings/${userId}`);
    },

    saveSettings(data) {
      return request('/settings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getNotifications(userId) {
      return request(`/notifications/${userId}`);
    },

    getLeaderboard(limit = 20) {
      return request(`/leaderboard?limit=${encodeURIComponent(limit)}`);
    },

    chat(data) {
      return request('/chat', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    askJameel(data) {
      return api.chat(data);
    },

    getCategories() {
      return request('/api/categories');
    },

    getTopics(category) {
      return request(`/api/topics/${encodeURIComponent(category)}`);
    },

    getNotes(topic) {
      return request(`/api/notes/${encodeURIComponent(topic)}`);
    },

    createNote(data) {
      return request('/api/notes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    updateNote(noteId, data) {
      return request(`/api/notes/${encodeURIComponent(noteId)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  };

  globalScope.EdunovaAPI = api;
})(window);
