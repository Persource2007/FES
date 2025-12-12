import { useEffect, useRef } from 'react'
import {
  initializeTokenExpiry,
  shouldRefreshToken,
  isTokenExpired,
  refreshToken,
  clearTokenExpiry,
} from '../utils/tokenRefresh'

/**
 * useTokenRefresh Hook
 * 
 * Manages proactive token refresh:
 * - Initializes token expiry on mount
 * - Periodically checks if token needs refresh
 * - Refreshes token when user returns to tab (Visibility API)
 * - Handles token expiry proactively
 */
export const useTokenRefresh = (enabled = true) => {
  const intervalRef = useRef(null)
  const visibilityHandlerRef = useRef(null)

  useEffect(() => {
    if (!enabled) {
      return
    }

    // Initialize token expiry on mount
    const init = async () => {
      const success = await initializeTokenExpiry()
      if (success) {
        // Check if token needs immediate refresh
        if (shouldRefreshToken() || isTokenExpired()) {
          console.log('[useTokenRefresh] Token needs immediate refresh on mount')
          await refreshToken()
        }
      }
    }

    init()

    // Set up periodic token refresh check
    intervalRef.current = setInterval(async () => {
      if (shouldRefreshToken() || isTokenExpired()) {
        console.log('[useTokenRefresh] Periodic check: Token needs refresh')
        await refreshToken()
      }
    }, 60000) // Check every 1 minute

    // Handle visibility change (user returns to tab)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[useTokenRefresh] Tab became visible, checking token...')
        
        // Refresh token expiry info first
        const success = await initializeTokenExpiry()
        
        if (success && (shouldRefreshToken() || isTokenExpired())) {
          console.log('[useTokenRefresh] Token needs refresh after tab visibility')
          await refreshToken()
        }
      }
    }

    visibilityHandlerRef.current = handleVisibilityChange
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (visibilityHandlerRef.current) {
        document.removeEventListener('visibilitychange', visibilityHandlerRef.current)
      }
    }
  }, [enabled])

  // Return refresh function for manual use
  return {
    refreshToken: async () => {
      return await refreshToken()
    },
    clearTokenExpiry,
  }
}

