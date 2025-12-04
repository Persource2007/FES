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
    TOGGLE_STATUS: (id) => `/api/users/${id}/toggle-status`,
    DELETE: (id) => `/api/users/${id}`,
  },
  // Activity endpoints
  ACTIVITIES: {
    LIST: '/api/activities',
    CREATE: '/api/activities',
  },
  // Region endpoints
  REGIONS: {
    LIST: '/api/regions',
  },
  // Story category endpoints
  STORY_CATEGORIES: {
    LIST: '/api/story-categories',
    CREATE: '/api/story-categories',
    UPDATE: (id) => `/api/story-categories/${id}`,
    TOGGLE_STATUS: (id) => `/api/story-categories/${id}/toggle-status`,
    DELETE: (id) => `/api/story-categories/${id}`,
    READERS: '/api/story-categories/readers',
    READER_CATEGORIES: (userId) => `/api/story-categories/readers/${userId}`,
    UPDATE_READER_ACCESS: (userId) => `/api/story-categories/readers/${userId}/access`,
  },
  // Story endpoints
  STORIES: {
    PUBLISHED: '/api/stories/published', // Public endpoint
    GET: (id) => `/api/stories/${id}`, // Public endpoint - get single story
    CREATE: '/api/stories',
    PENDING: '/api/stories/pending',
    PENDING_COUNT: '/api/stories/pending/count',
    APPROVE: (id) => `/api/stories/${id}/approve`,
    REJECT: (id) => `/api/stories/${id}/reject`,
    READER_STORIES: (userId) => `/api/stories/reader/${userId}`,
    APPROVED_STORIES: (adminId) => `/api/stories/approved/${adminId}`,
    ALL_APPROVED_STORIES: '/api/stories/approved/all',
    UPDATE: (id) => `/api/stories/${id}`,
    DELETE: (id) => `/api/stories/${id}`,
  },
}

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
}

