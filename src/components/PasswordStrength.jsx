import PropTypes from 'prop-types'

/**
 * Password Strength Indicator Component
 * 
 * Displays a visual indicator of password strength based on various criteria.
 * 
 * @param {string} password - The password to evaluate
 */
const PasswordStrength = ({ password }) => {
  if (!password) return null

  // Calculate password strength
  const calculateStrength = (pwd) => {
    let strength = 0
    let feedback = []

    // Length check
    if (pwd.length >= 8) {
      strength += 1
    } else {
      feedback.push('At least 8 characters')
    }

    // Lowercase check
    if (/[a-z]/.test(pwd)) {
      strength += 1
    } else {
      feedback.push('Lowercase letter')
    }

    // Uppercase check
    if (/[A-Z]/.test(pwd)) {
      strength += 1
    } else {
      feedback.push('Uppercase letter')
    }

    // Number check
    if (/\d/.test(pwd)) {
      strength += 1
    } else {
      feedback.push('Number')
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      strength += 1
    } else {
      feedback.push('Special character')
    }

    return { strength, feedback }
  }

  const { strength, feedback } = calculateStrength(password)

  // Determine strength level and color
  const getStrengthInfo = (strengthValue) => {
    if (strengthValue <= 1) {
      return { label: 'Very Weak', color: 'bg-red-500', width: '20%' }
    } else if (strengthValue === 2) {
      return { label: 'Weak', color: 'bg-orange-500', width: '40%' }
    } else if (strengthValue === 3) {
      return { label: 'Fair', color: 'bg-yellow-500', width: '60%' }
    } else if (strengthValue === 4) {
      return { label: 'Good', color: 'bg-blue-500', width: '80%' }
    } else {
      return { label: 'Strong', color: 'bg-green-500', width: '100%' }
    }
  }

  const strengthInfo = getStrengthInfo(strength)

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">
          Password Strength:
        </span>
        <span
          className={`text-xs font-semibold ${
            strength <= 2
              ? 'text-red-600'
              : strength === 3
              ? 'text-yellow-600'
              : strength === 4
              ? 'text-blue-600'
              : 'text-green-600'
          }`}
        >
          {strengthInfo.label}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`${strengthInfo.color} h-1.5 rounded-full transition-all duration-300`}
          style={{ width: strengthInfo.width }}
        ></div>
      </div>
      {feedback.length > 0 && password.length > 0 && (
        <p className="mt-1.5 text-xs text-gray-500">
          Add: {feedback.slice(0, 2).join(', ')}
        </p>
      )}
    </div>
  )
}

PasswordStrength.propTypes = {
  password: PropTypes.string,
}

export default PasswordStrength

