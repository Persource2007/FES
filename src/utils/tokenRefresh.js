import apiClient from './api'
import { API_ENDPOINTS } from './constants'

/**
 * Token Refresh Utility
 * 
 * Manages OAuth token refresh proactively on the frontend.
 * Works in conjunction with backend middleware for a hybrid approach.
 */

// Storage keys
const TOKEN_EXPIRY_KEY = 'token_expires_at'
const TOKEN_EXPIRY_IN_KEY = 'token_expires_in'
const REFRESH_IN_PROGRESS_KEY = 'token_refresh_in_progress'

// Configuration
const REFRESH_THRESHOLD_SECONDS = 300 // 5 minutes before expiry
const CHECK_INTERVAL_MS = 60000 // Check every 1 minute
const MIN_REFRESH_INTERVAL_MS = 30000 // Minimum 30 seconds between refresh attempts

/**
 * Get token expiry information from localStorage
 * @returns {{expiresAt: number, expiresIn: number} | null}
 */
export const getTokenExpiry = () => {
  const expiresAt = localStorage.getItem(TOKEN_EXPIRY_KEY)
  const expiresIn = localStorage.getItem(TOKEN_EXPIRY_IN_KEY)
  
  if (!expiresAt || !expiresIn) {
    return null
  }
  
  return {
    expiresAt: parseInt(expiresAt, 10),
    expiresIn: parseInt(expiresIn, 10),
  }
}

/**
 * Store token expiry information
 * @param {string} expiresAt - ISO date string
 * @param {number} expiresIn - Seconds until expiry
 */
export const setTokenExpiry = (expiresAt, expiresIn) => {
  // Convert ISO string to timestamp
  const expiresAtTimestamp = new Date(expiresAt).getTime()
  const expiresInSeconds = Math.max(0, expiresIn)
  
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAtTimestamp.toString())
  localStorage.setItem(TOKEN_EXPIRY_IN_KEY, expiresInSeconds.toString())
  
  console.log('[TokenRefresh] Stored token expiry:', {
    expiresAt: new Date(expiresAtTimestamp).toISOString(),
    expiresIn: expiresInSeconds,
    expiresInMinutes: Math.floor(expiresInSeconds / 60),
  })
}

/**
 * Clear token expiry information
 */
export const clearTokenExpiry = () => {
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_IN_KEY)
  localStorage.removeItem(REFRESH_IN_PROGRESS_KEY)
}

/**
 * Check if token needs refresh
 * @returns {boolean}
 */
export const shouldRefreshToken = () => {
  const expiry = getTokenExpiry()
  
  if (!expiry) {
    return false // No expiry info, let backend handle it
  }
  
  const now = Date.now()
  const timeUntilExpiry = expiry.expiresAt - now
  const needsRefresh = timeUntilExpiry <= (REFRESH_THRESHOLD_SECONDS * 1000)
  
  if (needsRefresh) {
    console.log('[TokenRefresh] Token needs refresh:', {
      expiresAt: new Date(expiry.expiresAt).toISOString(),
      timeUntilExpiry: Math.floor(timeUntilExpiry / 1000),
      seconds: Math.floor(timeUntilExpiry / 1000),
    })
  }
  
  return needsRefresh
}

/**
 * Check if token is expired
 * @returns {boolean}
 */
export const isTokenExpired = () => {
  const expiry = getTokenExpiry()
  
  if (!expiry) {
    return false // No expiry info, let backend handle it
  }
  
  const now = Date.now()
  const isExpired = expiry.expiresAt <= now
  
  if (isExpired) {
    console.log('[TokenRefresh] Token is expired:', {
      expiresAt: new Date(expiry.expiresAt).toISOString(),
      now: new Date(now).toISOString(),
    })
  }
  
  return isExpired
}

/**
 * Refresh token by calling /api/auth/me
 * 
 * The backend middleware will automatically refresh the token if needed:
 * - If token is expired but refresh token is valid → Refreshes automatically
 * - If refresh token is expired → Returns 401 (user needs to login)
 * - If token is still valid → Returns current token info
 * 
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const refreshToken = async () => {
  // Prevent concurrent refresh attempts
  const lastRefreshAttempt = localStorage.getItem(REFRESH_IN_PROGRESS_KEY)
  if (lastRefreshAttempt) {
    const timeSinceLastAttempt = Date.now() - parseInt(lastRefreshAttempt, 10)
    if (timeSinceLastAttempt < MIN_REFRESH_INTERVAL_MS) {
      console.log('[TokenRefresh] Refresh already in progress, skipping')
      return { success: false, error: 'Refresh already in progress' }
    }
  }
  
  // Mark refresh as in progress
  localStorage.setItem(REFRESH_IN_PROGRESS_KEY, Date.now().toString())
  
  try {
    console.log('[TokenRefresh] Attempting to refresh token...')
    
    // Call /api/auth/me - backend middleware will:
    // 1. Check if token is expired
    // 2. If expired but refresh token exists → Automatically refresh it
    // 3. If refresh token is expired → Return 401
    const response = await apiClient.get(API_ENDPOINTS.AUTH.ME)
    
    // Update token expiry from response
    if (response.data?.success && response.data?.token) {
      const { expires_at, expires_in } = response.data.token
      setTokenExpiry(expires_at, expires_in)
      
      console.log('[TokenRefresh] Token refreshed successfully:', {
        expiresAt: expires_at,
        expiresIn: expires_in,
        expiresInMinutes: Math.floor(expires_in / 60),
      })
      
      return {
        success: true,
        data: response.data,
      }
    }
    
    // If response doesn't have token info, still consider it successful
    // Backend might have refreshed it silently (though this shouldn't happen)
    console.log('[TokenRefresh] Token refresh completed (no expiry info in response)')
    return { success: true }
    
  } catch (error) {
    console.error('[TokenRefresh] Token refresh failed:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    })
    
    // If refresh fails with 401, it means:
    // - Refresh token expired/invalid → User needs to login again
    // - Session not found → User needs to login again
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message || 'Token expired or invalid'
      console.warn('[TokenRefresh] Refresh token expired or invalid - user needs to login:', errorMessage)
      clearTokenExpiry()
      return {
        success: false,
        error: errorMessage,
      }
    }
    
    // Other errors (network, server errors, etc.)
    return {
      success: false,
      error: error.message || 'Token refresh failed',
    }
  } finally {
    // Clear refresh in progress flag after a delay
    setTimeout(() => {
      localStorage.removeItem(REFRESH_IN_PROGRESS_KEY)
    }, MIN_REFRESH_INTERVAL_MS)
  }
}

/**
 * Update token expiry from /api/auth/me response
 * Call this after successful API calls that return token info
 * @param {Object} response - API response with token info
 */
export const updateTokenExpiryFromResponse = (response) => {
  if (response?.data?.token) {
    const { expires_at, expires_in } = response.data.token
    if (expires_at && expires_in !== undefined) {
      setTokenExpiry(expires_at, expires_in)
    }
  }
}

/**
 * Initialize token expiry from current session
 * Call this on app mount or after login
 * 
 * This function handles the case where:
 * - Token is expired but refresh token is valid → Backend refreshes automatically
 * - Token is valid → Returns current expiry
 * - Refresh token is expired → Returns 401, user needs to login
 * 
 * @returns {Promise<boolean>} - Returns true if token expiry was successfully retrieved
 */
export const initializeTokenExpiry = async () => {
  try {
    console.log('[TokenRefresh] Initializing token expiry from session...')
    
    // Call /api/auth/me - backend middleware will:
    // 1. Check if token is expired
    // 2. If expired but refresh token exists → Automatically refresh it
    // 3. If refresh token is expired → Return 401
    const response = await apiClient.get(API_ENDPOINTS.AUTH.ME)
    
    if (response.data?.success && response.data?.token) {
      const { expires_at, expires_in } = response.data.token
      setTokenExpiry(expires_at, expires_in)
      
      console.log('[TokenRefresh] Token expiry initialized successfully:', {
        expiresAt: expires_at,
        expiresIn: expires_in,
        expiresInMinutes: Math.floor(expires_in / 60),
      })
      
      return true
    }
    
    console.warn('[TokenRefresh] Response successful but no token info in response')
    return false
  } catch (error) {
    // Handle different error scenarios
    if (error.response?.status === 401) {
      // 401 means:
      // - Refresh token expired/invalid → User needs to login again
      // - Session not found → User needs to login again
      console.warn('[TokenRefresh] Session expired or invalid - user needs to login:', {
        message: error.response?.data?.message || 'Unauthorized',
      })
      clearTokenExpiry()
      return false
    }
    
    // Other errors (network, server errors, etc.)
    console.error('[TokenRefresh] Failed to initialize token expiry:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    })
    
    // Don't clear expiry on network errors - might be temporary
    // Only clear on 401 (authentication failure)
    return false
  }
}

