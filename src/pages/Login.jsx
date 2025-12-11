import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useMutation } from '../hooks/useApi'
import { API_ENDPOINTS } from '../utils/constants'
import LoginForm from '../components/LoginForm'
import { addActivity } from '../utils/activity'

/**
 * Login Page Component
 * 
 * Wraps the LoginForm component and handles API integration.
 * Can be used with or without API calls.
 */
function Login() {
  const navigate = useNavigate()
  const { execute: login, loading } = useMutation(API_ENDPOINTS.AUTH.LOGIN)

  /**
   * Handle form submission with API integration
   */
  const handleSubmit = async (formData) => {
    try {
      console.log('Login attempt started:', formData.email)
      
      // Call the login API
      const response = await login({
        email: formData.email,
        password: formData.password,
      })

      console.log('Login response received:', response)

      // Check if login was successful
      if (response && response.success && response.user) {
        console.log('Login successful, storing data and navigating...')
        
        // Store token if provided, otherwise create a session token
        if (response.token) {
          localStorage.setItem('authToken', response.token)
        } else {
          // Create a session token if backend doesn't provide one
          localStorage.setItem('authToken', 'session_' + Date.now())
        }
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(response.user))
        
        // Log login activity (fire-and-forget, don't block on error)
        addActivity('login', `Logged in as ${response.user.name} (${response.user.email})`, {
          userId: response.user.id,
          userName: response.user.name,
          userEmail: response.user.email,
          roleName: response.user.role?.name || 'Unknown',
        }).catch(err => console.error('Failed to log login activity:', err))
        
        console.log('User data stored:', response.user)
        console.log('Showing toast...')
        
        // Show success message
        toast.success(response.message || 'Welcome! You have logged in successfully.')
        
        // Redirect to home page instead of dashboard
        console.log('Login successful, redirecting to home...')
        try {
          navigate('/', { replace: true })
          console.log('Navigate called successfully')
        } catch (navError) {
          console.error('Navigation error:', navError)
          // Fallback to window.location
          window.location.href = '/'
        }
      } else {
        console.error('Login response invalid:', response)
        // Handle case where response doesn't indicate success
        throw new Error(response?.message || 'Login failed. Please check your credentials.')
      }
    } catch (error) {
      // Log the full error for debugging
      console.error('Login error:', error)
      console.error('Error response:', error.response)
      console.error('Error message:', error.message)
      
      // Extract error message from API response
      let errorMessage = 'Invalid credentials. Please check your email and password and try again.'
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || errorMessage
      } else if (error.request) {
        // Request was made but no response received (network error)
        errorMessage = 'Network error: Could not connect to the server. Please check if the backend is running on http://localhost:8000'
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage
      }
      
      // Throw error to be caught by LoginForm
      throw new Error(errorMessage)
    }
  }

  return <LoginForm onSubmit={handleSubmit} isLoading={loading} />
}

export default Login

