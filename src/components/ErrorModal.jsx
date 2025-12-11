import { useEffect } from 'react'
import { FaExclamationCircle, FaTimes, FaInfoCircle, FaCheckCircle } from 'react-icons/fa'

const ErrorModal = ({ isOpen, onClose, title, message, type = 'error' }) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Determine icon and colors based on type - using site-friendly green theme
  const getIconAndColors = () => {
    switch (type) {
      case 'success':
        return {
          icon: FaCheckCircle,
          iconColor: 'text-green-700',
          bgColor: 'bg-white',
          borderColor: 'border-green-300',
          titleColor: 'text-green-800',
          buttonColor: 'bg-green-700 hover:bg-green-800 text-white',
          borderTopColor: 'border-t-green-500'
        }
      case 'warning':
        return {
          icon: FaExclamationCircle,
          iconColor: 'text-amber-600',
          bgColor: 'bg-white',
          borderColor: 'border-amber-300',
          titleColor: 'text-amber-800',
          buttonColor: 'bg-amber-600 hover:bg-amber-700 text-white',
          borderTopColor: 'border-t-amber-500'
        }
      case 'info':
        return {
          icon: FaInfoCircle,
          iconColor: 'text-blue-600',
          bgColor: 'bg-white',
          borderColor: 'border-blue-300',
          titleColor: 'text-blue-800',
          buttonColor: 'bg-blue-700 hover:bg-blue-800 text-white',
          borderTopColor: 'border-t-blue-500'
        }
      default: // error
        return {
          icon: FaExclamationCircle,
          iconColor: 'text-red-600',
          bgColor: 'bg-white',
          borderColor: 'border-red-300',
          titleColor: 'text-red-800',
          buttonColor: 'bg-red-600 hover:bg-red-700 text-white',
          borderTopColor: 'border-t-red-500'
        }
    }
  }

  const { icon: Icon, iconColor, bgColor, borderColor, titleColor, buttonColor, borderTopColor } = getIconAndColors()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative ${bgColor} ${borderColor} ${borderTopColor} border-2 border-t-4 rounded-lg shadow-2xl max-w-md w-full transform transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-5 ${borderColor} border-b`}>
          <div className="flex items-center gap-3">
            <Icon className={`${iconColor} text-2xl`} />
            <h3 className={`${titleColor} font-semibold text-lg`}>
              {title || (type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : type === 'info' ? 'Information' : 'Success')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
            aria-label="Close"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-2 p-4 ${borderColor} border-t bg-gray-50 rounded-b-lg`}>
          <button
            onClick={onClose}
            className={`${buttonColor} px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorModal

