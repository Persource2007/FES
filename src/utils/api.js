import axios from 'axios'
import { API_BASE_URL } from './constants'
import { showError, showWarning } from './errorHandler'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Send cookies with requests (for session management)
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Log request for debugging
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      data: config.data,
    })
    
    // Note: No need to add Authorization header anymore
    // Session cookie is sent automatically by browser via withCredentials: true
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor (e.g., for handling errors globally)
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Log error details for debugging
    console.error('API Error:', {
      message: error.message,
      response: error.response,
      request: error.request,
      config: error.config,
    })
    
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - session expired or invalid
      // Clear any local state
      localStorage.removeItem('user')
      localStorage.removeItem('oauth_user')
      
      // Only redirect to home if:
      // 1. Not already on home page or public pages
      // 2. Not a session check request (/api/auth/me)
      // 3. Not a logout request (let logout handle its own redirect)
      const currentPath = window.location.pathname
      const isPublicPage = ['/', '/stories', '/oauth'].some(path => 
        currentPath === path || currentPath.startsWith(path + '/')
      )
      const isSessionCheck = error.config?.url?.includes('/auth/me')
      const isLogoutRequest = error.config?.url?.includes('/auth/logout')
      
      // Show error message if not on public page and not checking session
      if (!isPublicPage && !isSessionCheck && !isLogoutRequest) {
        const errorMessage = error.response?.data?.message || 'Your session has expired. Please log in again.'
        showWarning(errorMessage, 'Session Expired')
        window.location.href = '/'
      }
    } else if (error.response?.status === 403) {
      // Forbidden - user doesn't have permission
      const errorMessage = error.response?.data?.message || 'You do not have permission to access this resource.'
      showWarning(errorMessage, 'Access Denied')
    } else if (error.response?.status >= 500) {
      // Server errors
      const errorMessage = error.response?.data?.message || 'A server error occurred. Please try again later.'
      showError(errorMessage, 'Server Error')
    }
    return Promise.reject(error)
  }
)

export default apiClient

