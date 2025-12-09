import { Navigate } from 'react-router-dom'
import { canManageUsers } from '../utils/permissions'

/**
 * Protected Route Component
 * 
 * Redirects to login if user is not authenticated.
 * Only allows access to dashboard and other protected routes when user is logged in.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authenticated
 * @param {boolean} props.requireSuperAdmin - If true, only super admin (canManageUsers) can access
 */
function ProtectedRoute({ children, requireSuperAdmin = false }) {
  // Check if user is logged in (has user data in localStorage)
  const userData = localStorage.getItem('user')
  const authToken = localStorage.getItem('authToken')

  // If user is not authenticated, redirect to login
  // Note: authToken is optional if backend doesn't provide it
  if (!userData) {
    return <Navigate to="/login" replace />
  }

  // If super admin access is required, check permissions
  if (requireSuperAdmin) {
    try {
      const user = JSON.parse(userData)
      if (!canManageUsers(user)) {
        // Redirect to dashboard if user doesn't have permission
        return <Navigate to="/dashboard" replace />
      }
    } catch (e) {
      // If user data is invalid, redirect to login
      return <Navigate to="/login" replace />
    }
  }

  // If authenticated (and has required permissions if needed), render the protected component
  return children
}

export default ProtectedRoute


