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
    OAUTH_CALLBACK: '/api/auth/oauth/callback',
    ME: '/api/auth/me',
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
  // Organization endpoints
  ORGANIZATIONS: {
    LIST: '/api/organizations',
    CREATE: '/api/organizations',
    UPDATE: (id) => `/api/organizations/${id}`,
    TOGGLE_STATUS: (id) => `/api/organizations/${id}/toggle-status`,
    DELETE: (id) => `/api/organizations/${id}`,
  },
  // Story category endpoints
  STORY_CATEGORIES: {
    LIST: '/api/story-categories',
    CREATE: '/api/story-categories',
    UPDATE: (id) => `/api/story-categories/${id}`,
    TOGGLE_STATUS: (id) => `/api/story-categories/${id}/toggle-status`,
    DELETE: (id) => `/api/story-categories/${id}`,
    WRITERS: '/api/story-categories/writers',
    WRITER_CATEGORIES: (userId) => `/api/story-categories/writers/${userId}`,
    UPDATE_WRITER_ACCESS: (userId) => `/api/story-categories/writers/${userId}/access`,
  },
  // Story endpoints
  STORIES: {
    PUBLISHED: '/api/stories/published', // Public endpoint
    GET: (id) => `/api/stories/${id}`, // Public endpoint - get single story by ID (backward compatibility)
    GET_BY_SLUG: (slug) => `/api/stories/slug/${slug}`, // Public endpoint - get single story by slug
    CREATE: '/api/stories',
    PENDING: '/api/stories/pending',
    PENDING_COUNT: '/api/stories/pending/count',
    APPROVE: (id) => `/api/stories/${id}/approve`,
    REJECT: (id) => `/api/stories/${id}/reject`,
    WRITER_STORIES: (userId) => `/api/stories/writer/${userId}`,
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

