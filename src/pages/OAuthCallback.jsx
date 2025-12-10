import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { exchangeCodeForToken, getUserInfo } from '../utils/oauthLogin'

function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing') // processing, success, error
  const [error, setError] = useState(null)
  const [userInfo, setUserInfo] = useState(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get code and state from URL
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const errorParam = searchParams.get('error')

        // Check for error from OAuth server
        if (errorParam) {
          setStatus('error')
          setError({
            error: errorParam,
            error_description: searchParams.get('error_description') || 'Authorization was denied or failed.',
          })
          return
        }

        // Validate we have a code
        if (!code) {
          setStatus('error')
          setError({
            error: 'missing_code',
            error_description: 'No authorization code received from OAuth server.',
          })
          return
        }

        // Verify state (CSRF protection)
        const storedState = localStorage.getItem('oauth_state')
        if (state && storedState !== state) {
          setStatus('error')
          setError({
            error: 'invalid_state',
            error_description: 'State parameter mismatch. Possible CSRF attack.',
          })
          return
        }

        // Exchange code for token
        setStatus('processing')
        const tokenData = await exchangeCodeForToken(code)

        // Get user info
        const user = await getUserInfo()
        setUserInfo(user)
        setStatus('success')

        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/')
        }, 2000)
      } catch (err) {
        console.error('OAuth callback error:', err)
        setStatus('error')
        setError({
          error: err.response?.data?.error || 'unknown_error',
          error_description: err.response?.data?.error_description || err.message || 'An error occurred during authentication.',
        })
      }
    }

    handleCallback()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          {status === 'processing' && (
            <div className="text-center">
              <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Completing Login...</h2>
              <p className="text-gray-600">Please wait while we complete your authentication.</p>
            </div>
          )}

          {status === 'success' && userInfo && (
            <div className="text-center">
              <FaCheckCircle className="text-4xl text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Successful!</h2>
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Welcome, {userInfo.name || userInfo.preferred_username || 'User'}!</strong>
                </p>
                {userInfo.sub && (
                  <p className="text-xs text-gray-600">
                    User ID: <code className="bg-white px-2 py-1 rounded">{userInfo.sub}</code>
                  </p>
                )}
                {userInfo.email && (
                  <p className="text-xs text-gray-600 mt-1">
                    Email: <code className="bg-white px-2 py-1 rounded">{userInfo.email}</code>
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-4">Redirecting to home page...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <FaExclamationCircle className="text-4xl text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Failed</h2>
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium mb-2">
                  {error?.error || 'Unknown Error'}
                </p>
                <p className="text-xs text-red-700">
                  {error?.error_description || 'An error occurred during authentication.'}
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="mt-6 px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Go to Home
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default OAuthCallback

