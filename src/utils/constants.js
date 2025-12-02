// API Base URL from environment variables
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
  },
  // User endpoints
  USERS: {
    LIST: '/api/users',
    CREATE: '/api/users',
    ROLES: '/api/users/roles',
    UPDATE_ROLE: (id) => `/api/users/${id}/role`,
    DELETE: (id) => `/api/users/${id}`,
  },
  // Activity endpoints
  ACTIVITIES: {
    LIST: '/api/activities',
    CREATE: '/api/activities',
  },
  // Add more endpoint categories as needed
  // STORIES: {
  //   LIST: '/stories',
  //   DETAIL: (id) => `/stories/${id}`,
  //   CREATE: '/stories',
  //   UPDATE: (id) => `/stories/${id}`,
  //   DELETE: (id) => `/stories/${id}`,
  // },
}

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
}

