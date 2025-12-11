// Global error handler that can be used from anywhere (including non-React code)
// This allows the API interceptor to trigger error modals

let errorCallback = null

export const setErrorCallback = (callback) => {
  errorCallback = callback
}

export const showError = (message, title = 'Error', type = 'error') => {
  if (errorCallback) {
    errorCallback({ message, title, type })
  } else {
    // Fallback to browser alert if context is not available
    console.error(`[Error] ${title}: ${message}`)
    alert(`${title}: ${message}`)
  }
}

export const showSuccess = (message, title = 'Success') => {
  if (errorCallback) {
    errorCallback({ message, title, type: 'success' })
  }
}

export const showWarning = (message, title = 'Warning') => {
  if (errorCallback) {
    errorCallback({ message, title, type: 'warning' })
  }
}

export const showInfo = (message, title = 'Information') => {
  if (errorCallback) {
    errorCallback({ message, title, type: 'info' })
  }
}

