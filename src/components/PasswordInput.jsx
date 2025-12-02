import { useState } from 'react'
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'
import PropTypes from 'prop-types'

/**
 * Password Input Component with Toggle Visibility
 * 
 * A specialized password input with built-in show/hide toggle button.
 */
const PasswordInput = ({
  name,
  id,
  value,
  onChange,
  onBlur,
  placeholder = 'Enter your password',
  label = 'Password',
  error,
  required = false,
  autoComplete = 'current-password',
  disabled = false,
}) => {
  const [showPassword, setShowPassword] = useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  const baseClasses =
    'appearance-none relative block w-full px-3 py-2.5 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 sm:text-sm pl-10 pr-12'
  const normalClasses =
    'border-gray-300 focus:border-slate-600 focus:ring-slate-500'
  const errorClasses =
    'border-red-300 focus:border-red-500 focus:ring-red-500'
  const inputClasses = `${baseClasses} ${error ? errorClasses : normalClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id || name}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {/* Lock Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <FaLock
            className={`h-5 w-5 ${error ? 'text-red-500' : 'text-gray-500'} transition-colors`}
          />
        </div>
        
        {/* Password Input */}
        <input
          type={showPassword ? 'text' : 'password'}
          id={id || name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        
        {/* Password Toggle Button */}
        <button
          type="button"
          onClick={togglePasswordVisibility}
          disabled={disabled}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <FaEyeSlash className="h-5 w-5" />
          ) : (
            <FaEye className="h-5 w-5" />
          )}
        </button>
      </div>
      
      {/* Error Message */}
      {error && (
        <p
          id={`${name}-error`}
          className="mt-1.5 text-sm text-red-600 flex items-center"
          role="alert"
        >
          <span className="mr-1">⚠</span>
          {error}
        </p>
      )}
    </div>
  )
}

PasswordInput.propTypes = {
  name: PropTypes.string.isRequired,
  id: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  autoComplete: PropTypes.string,
  disabled: PropTypes.bool,
}

export default PasswordInput

