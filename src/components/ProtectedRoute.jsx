import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { isOAuthLoggedIn, getOAuthUser } from '../utils/oauthLogin'

/**
 * Protected Route Component
 * 
 * Validates session with backend and redirects to login if not authenticated.
 * All authenticated users can access protected routes (no role-based restrictions).
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authenticated
 */
function ProtectedRoute({ children }) {
  const [isValidating, setIsValidating] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const validateSession = async () => {
      try {
        // Validate session with backend (checks cookie and database)
        const loggedIn = await isOAuthLoggedIn()
        
        if (loggedIn) {
          // Get user from localStorage (updated by isOAuthLoggedIn)
          const userData = getOAuthUser()
          setUser(userData)
          setIsAuthenticated(true)
        } else {
          // Session invalid - clear localStorage
          localStorage.removeItem('oauth_user')
          localStorage.removeItem('user')
          setIsAuthenticated(false)
        }
      } catch (error) {
        // Session validation failed - clear state
        console.error('Session validation failed:', error)
        localStorage.removeItem('oauth_user')
        localStorage.removeItem('user')
        setIsAuthenticated(false)
      } finally {
        setIsValidating(false)
      }
    }

    validateSession()
  }, [])

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating session...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, redirect to home
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />
  }

  // All authenticated users can access - no role-based restrictions
  return children
}

export default ProtectedRoute


