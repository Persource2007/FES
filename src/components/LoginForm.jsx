import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaEnvelope } from 'react-icons/fa'
import { toast } from 'react-toastify'
import TextInput from './TextInput'
import PasswordInput from './PasswordInput'
import Button from './Button'
import PropTypes from 'prop-types'

/**
 * Login Form Component
 * 
 * A professional, production-ready login form with validation,
 * password visibility toggle, and remember me functionality.
 * 
 * @param {function} onSubmit - Callback function when form is submitted
 * @param {boolean} isLoading - External loading state (optional)
 */
const LoginForm = ({ onSubmit, isLoading: externalLoading = false }) => {
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [loginError, setLoginError] = useState(null)

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail')
    if (rememberedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true,
      }))
    }
  }, [])

  /**
   * Validate email format
   */
  const validateEmail = (email) => {
    if (!email || email.trim() === '') {
      return 'Email is required'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address'
    }
    return null
  }

  /**
   * Validate password
   */
  const validatePassword = (password) => {
    if (!password || password.trim() === '') {
      return 'Password is required'
    }
    return null
  }

  /**
   * Validate form fields
   */
  const validateForm = () => {
    const newErrors = {}
    const emailError = validateEmail(formData.email)
    const passwordError = validatePassword(formData.password)

    if (emailError) newErrors.email = emailError
    if (passwordError) newErrors.password = passwordError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const fieldValue = type === 'checkbox' ? checked : value

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }))

    // Clear login error when user starts typing
    if (loginError) {
      setLoginError(null)
    }

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  /**
   * Handle input blur (no validation, just for accessibility)
   */
  const handleBlur = () => {
    // No validation on blur - validation only happens on submit
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form (only on submit)
    if (!validateForm()) {
      // Focus on first error field
      const firstErrorField = Object.keys(errors)[0] || 
        (formData.email ? 'password' : 'email')
      const errorElement = document.getElementById(firstErrorField)
      if (errorElement) {
        errorElement.focus()
      }
      return
    }

    setIsLoading(true)
    setLoginError(null) // Clear previous errors

    try {
      // Handle remember me functionality
      if (formData.rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email.trim())
      } else {
        localStorage.removeItem('rememberedEmail')
      }

      // If custom onSubmit is provided, use it
      if (onSubmit) {
        await onSubmit({
          ...formData,
          email: formData.email.trim(),
        })
        // If onSubmit succeeds, clear any previous errors
        setLoginError(null)
        // Don't clear form or reset here - let the parent component handle navigation
        // The form will be unmounted when navigation happens
        return // Exit early to prevent form clearing
      } else {
        // Default: just log the data
        console.log('Login form data:', {
          email: formData.email,
          password: '***',
          rememberMe: formData.rememberMe,
        })

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        toast.success('Login successful!')
      }

      // Clear form after successful submission (only if no custom onSubmit)
      setFormData({
        email: formData.rememberMe ? formData.email.trim() : '',
        password: '',
        rememberMe: formData.rememberMe,
      })
      setErrors({})
    } catch (error) {
      // Set error message to display on the page
      const errorMessage = error.message || 'Login failed. Please check your credentials and try again.'
      setLoginError(errorMessage)
      // Don't show toast here as it's already displayed in Login.jsx
    } finally {
      setIsLoading(false)
    }
  }

  const loading = isLoading || externalLoading

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Card Container */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-8 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-600 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Admin Login
            </h2>
            <p className="text-slate-300 text-sm">
              CMS Access Portal
            </p>
          </div>

          {/* Form Section */}
          <div className="px-8 py-8 bg-white">
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              {/* Email Input */}
              <div>
                <TextInput
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="admin@example.com"
                  label="Email Address"
                  icon={FaEnvelope}
                  error={errors.email}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div>
                <PasswordInput
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your password"
                  label="Password"
                  error={errors.password}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>

              {/* Login Error Message */}
              {loginError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 animate-fade-in">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400 mt-0.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-red-800">
                        {loginError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Remember Me */}
              <div className="flex items-center pt-1">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={loading}
                  className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded cursor-pointer disabled:opacity-50 transition-colors"
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 block text-sm text-gray-700 cursor-pointer disabled:opacity-50 select-none"
                >
                  Remember me
                </label>
              </div>

              {/* Submit Button */}
              <div>
                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading}
                  variant="primary"
                  size="lg"
                  className="w-full font-semibold"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  )
}

LoginForm.propTypes = {
  onSubmit: PropTypes.func,
  isLoading: PropTypes.bool,
}

export default LoginForm
