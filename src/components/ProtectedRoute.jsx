import { Navigate } from 'react-router-dom'

/**
 * Protected Route Component
 * 
 * Redirects to login if user is not authenticated.
 * Only allows access to dashboard and other protected routes when user is logged in.
 */
function ProtectedRoute({ children }) {
  // Check if user is logged in (has user data in localStorage)
  const user = localStorage.getItem('user')
  const authToken = localStorage.getItem('authToken')

  // If user is not authenticated, redirect to login
  // Note: authToken is optional if backend doesn't provide it
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If authenticated, render the protected component
  return children
}

export default ProtectedRoute

