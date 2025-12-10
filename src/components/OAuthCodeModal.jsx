import { useState } from 'react'
import { FaTimes, FaCopy, FaCheckCircle } from 'react-icons/fa'

function OAuthCodeModal({ isOpen, onClose, onSubmit }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!code.trim()) {
      setError('Please enter the authorization code')
      return
    }
    
    // Extract just the code value if user pasted URL or code with parameters
    let codeValue = code.trim()
    
    // First, if code contains &state=, split and take only the code part
    if (codeValue.includes('&state=')) {
      codeValue = codeValue.split('&state=')[0].trim()
    }
    // If it looks like a URL or contains & or =, try to extract the code parameter
    else if (codeValue.includes('code=') || codeValue.includes('&') || codeValue.includes('?')) {
      try {
        // If it's a full URL, parse it
        if (codeValue.startsWith('http://') || codeValue.startsWith('https://')) {
          const url = new URL(codeValue)
          const codeParam = url.searchParams.get('code')
          if (codeParam) {
            codeValue = codeParam
          }
        } else {
          // If it's just parameters like "code=xxx&state=yyy", parse it
          const params = new URLSearchParams(codeValue)
          const codeParam = params.get('code')
          if (codeParam) {
            codeValue = codeParam
          } else if (codeValue.includes('code=')) {
            // Try to extract manually if URLSearchParams doesn't work
            const match = codeValue.match(/code=([^&]+)/)
            if (match && match[1]) {
              codeValue = decodeURIComponent(match[1])
            }
          } else if (codeValue.includes('&')) {
            // If it's just "codeValue&something", take everything before first &
            codeValue = codeValue.split('&')[0].trim()
          }
        }
      } catch (e) {
        // If parsing fails, try to extract code manually
        const match = codeValue.match(/code=([^&]+)/)
        if (match && match[1]) {
          codeValue = decodeURIComponent(match[1])
        } else if (codeValue.includes('&')) {
          // If it's just "codeValue&something", take everything before first &
          codeValue = codeValue.split('&')[0].trim()
        }
        // If still no match, use the value as-is (might be just the code)
      }
    }
    
    if (!codeValue) {
      setError('Could not extract authorization code. Please paste just the code value.')
      return
    }
    
    // Only pass the code - state is already stored in localStorage from authorization
    onSubmit(codeValue, null)
    setCode('')
    setError('')
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setCode(text)
    } catch (e) {
      // Clipboard access failed, user can paste manually
      console.error('Failed to read clipboard:', e)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Enter Authorization Code</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Instructions:</strong>
            </p>
            <ol className="text-xs text-blue-700 list-decimal list-inside space-y-1">
              <li>Look at the URL in the popup window (geet.observatory.org.in)</li>
              <li>Copy the <code className="bg-white px-1 rounded">code</code> parameter value from the URL</li>
              <li>Paste it in the Authorization Code field below</li>
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Authorization Code *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value)
                    setError('')
                  }}
                  placeholder="Enter the authorization code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  title="Paste from clipboard"
                >
                  <FaCopy />
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <FaCheckCircle />
                Submit Code
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default OAuthCodeModal

