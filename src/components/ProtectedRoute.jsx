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
  // Check if user is logged in via OAuth (BFF pattern)
  // OAuth users are stored in 'oauth_user', old local login users in 'user'
  const oauthUserData = localStorage.getItem('oauth_user')
  const oldUserData = localStorage.getItem('user')

  // If no user data found, redirect to home (OAuth login is handled via Header)
  if (!oauthUserData && !oldUserData) {
    return <Navigate to="/" replace />
  }

  // Use OAuth user if available, otherwise fall back to old user
  const userData = oauthUserData || oldUserData

  // If super admin access is required, check permissions
  if (requireSuperAdmin) {
    try {
      const user = JSON.parse(userData)
      if (!canManageUsers(user)) {
        // Redirect to dashboard if user doesn't have permission
        return <Navigate to="/dashboard" replace />
      }
    } catch (e) {
      // If user data is invalid, redirect to home
      return <Navigate to="/" replace />
    }
  }

  // If authenticated (and has required permissions if needed), render the protected component
  return children
}

export default ProtectedRoute


