import { forwardRef } from 'react'
import PropTypes from 'prop-types'

/**
 * Reusable Text Input Component
 * 
 * A flexible input component with validation, icons, and error display.
 * 
 * @param {string} type - Input type (text, email, password, etc.)
 * @param {string} name - Input name attribute
 * @param {string} value - Input value
 * @param {function} onChange - Change handler
 * @param {string} placeholder - Placeholder text
 * @param {string} label - Label text (optional)
 * @param {string} error - Error message to display
 * @param {object} icon - React icon component (optional)
 * @param {boolean} required - Whether field is required
 * @param {string} autoComplete - Autocomplete attribute
 * @param {boolean} disabled - Whether input is disabled
 * @param {string} className - Additional CSS classes
 */
const TextInput = forwardRef(
  (
    {
      type = 'text',
      name,
      value,
      onChange,
      placeholder,
      label,
      error,
      icon: Icon,
      required = false,
      autoComplete,
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    // Determine input styling based on error state
    const baseClasses =
      'appearance-none relative block w-full px-3 py-2.5 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 sm:text-sm'
    const normalClasses =
      'border-gray-300 focus:border-slate-600 focus:ring-slate-500'
    const errorClasses =
      'border-red-300 focus:border-red-500 focus:ring-red-500'
    const iconPadding = Icon ? 'pl-10' : 'pl-3'
    // Check if className includes pr-* for right padding (e.g., for password toggle)
    const hasRightAction = className.includes('pr-')
    const rightPadding = hasRightAction ? '' : ''
    const inputClasses = `${baseClasses} ${error ? errorClasses : normalClasses} ${iconPadding} ${className}`

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={name}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <Icon
                className={`h-5 w-5 ${
                  error ? 'text-red-500' : 'text-gray-500'
                } transition-colors`}
              />
            </div>
          )}
          <input
            ref={ref}
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            autoComplete={autoComplete}
            disabled={disabled}
            className={inputClasses}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${name}-error` : undefined}
            {...props}
          />
        </div>
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
)

TextInput.displayName = 'TextInput'

TextInput.propTypes = {
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  error: PropTypes.string,
  icon: PropTypes.elementType,
  required: PropTypes.bool,
  autoComplete: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
}

export default TextInput

