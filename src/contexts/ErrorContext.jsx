import { createContext, useContext, useState, useEffect } from 'react'
import ErrorModal from '../components/ErrorModal'
import { setErrorCallback } from '../utils/errorHandler'

const ErrorContext = createContext()

export const useError = () => {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}

export const ErrorProvider = ({ children }) => {
  const [error, setError] = useState(null)

  // Register global error callback so API interceptor can use it
  useEffect(() => {
    setErrorCallback((errorData) => {
      setError(errorData)
    })
    
    return () => {
      setErrorCallback(null)
    }
  }, [])

  const showError = (message, title = 'Error', type = 'error') => {
    setError({ message, title, type })
  }

  const showSuccess = (message, title = 'Success') => {
    setError({ message, title, type: 'success' })
  }

  const showWarning = (message, title = 'Warning') => {
    setError({ message, title, type: 'warning' })
  }

  const showInfo = (message, title = 'Information') => {
    setError({ message, title, type: 'info' })
  }

  const closeError = () => {
    setError(null)
  }

  return (
    <ErrorContext.Provider value={{ showError, showSuccess, showWarning, showInfo, closeError }}>
      {children}
      <ErrorModal
        isOpen={!!error}
        onClose={closeError}
        title={error?.title}
        message={error?.message}
        type={error?.type}
      />
    </ErrorContext.Provider>
  )
}

