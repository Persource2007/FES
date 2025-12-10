import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaGlobe } from 'react-icons/fa'
import { initiateOAuthLogin, isOAuthLoggedIn, getOAuthUser, logoutOAuth, exchangeCodeForToken, getUserInfo } from '../utils/oauthLogin'
import OAuthCodeModal from './OAuthCodeModal'

function Header() {
  const location = useLocation()
  const [showTranslateDropdown, setShowTranslateDropdown] = useState(false)
  const [oauthUser, setOAuthUser] = useState(null)
  const [isOAuthAuthenticated, setIsOAuthAuthenticated] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingCode, setProcessingCode] = useState(null) // Track which code is being processed

  // Check OAuth login status on mount and when location changes
  useEffect(() => {
    const checkOAuthStatus = () => {
      const loggedIn = isOAuthLoggedIn()
      setIsOAuthAuthenticated(loggedIn)
      if (loggedIn) {
        const user = getOAuthUser()
        setOAuthUser(user)
      } else {
        setOAuthUser(null)
      }
    }
    
    checkOAuthStatus()
    // Check periodically in case token expires
    const interval = setInterval(checkOAuthStatus, 5000)
    return () => clearInterval(interval)
  }, [location])

  const handleOAuthLogin = async () => {
    try {
      setIsProcessing(true)
      
      // Clear any existing tokens before starting a new login
      // This prevents using stale tokens if the new login fails
      localStorage.removeItem('oauth_access_token')
      localStorage.removeItem('oauth_refresh_token')
      localStorage.removeItem('oauth_user')
      
      const code = await initiateOAuthLogin((onCodeSubmit) => {
        // This callback is called when we need manual code entry
        setShowCodeModal(true)
        // Store the submit callback
        window.oauthCodeSubmitCallback = onCodeSubmit
      })
      
      // If we got the code automatically, process it
      if (code) {
        await processOAuthCode(code)
      }
    } catch (error) {
      console.error('OAuth login error:', error)
      alert(`OAuth login failed: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const processOAuthCode = async (code) => {
    // Prevent processing the same code twice
    if (processingCode === code) {
      console.warn('Code already being processed, skipping duplicate call')
      return
    }
    
    try {
      setProcessingCode(code)
      setIsProcessing(true)
      
      // Clear any existing tokens before processing new code
      localStorage.removeItem('oauth_access_token')
      localStorage.removeItem('oauth_refresh_token')
      localStorage.removeItem('oauth_user')
      
      // Exchange code for token
      const tokenData = await exchangeCodeForToken(code)
      
      // Verify we got a token before proceeding
      if (!tokenData || !tokenData.access_token) {
        throw new Error('No access token received from server')
      }
      
      // Get user info
      const user = await getUserInfo()
      
      // Verify we got user info
      if (!user) {
        throw new Error('No user information received')
      }
      
      setOAuthUser(user)
      setIsOAuthAuthenticated(true)
      // State is already updated, no need to reload the page
    } catch (error) {
      console.error('Error processing OAuth code:', error)
      
      // Clear tokens on error to prevent using stale data
      localStorage.removeItem('oauth_access_token')
      localStorage.removeItem('oauth_refresh_token')
      localStorage.removeItem('oauth_user')
      setOAuthUser(null)
      setIsOAuthAuthenticated(false)
      
      const errorMessage = error.response?.data?.error_description 
        || error.response?.data?.error 
        || error.message 
        || 'Unknown error'
      
      // More specific error message for invalid_grant
      if (error.response?.data?.error === 'invalid_grant') {
        alert(`Login failed: Invalid authorization code.\n\nThis usually means:\n- The code has already been used\n- The code has expired\n- Please try logging in again to get a fresh code.\n\nError: ${errorMessage}`)
      } else {
        alert(`Failed to complete login: ${errorMessage}\n\nCheck the browser console for more details.`)
      }
    } finally {
      setIsProcessing(false)
      setProcessingCode(null)
    }
  }

  const handleCodeSubmit = async (code, state) => {
    setShowCodeModal(false)
    if (window.oauthCodeSubmitCallback) {
      // The callback will resolve the promise in initiateOAuthLogin,
      // which will then call processOAuthCode in handleOAuthLogin
      // So we don't need to call processOAuthCode here
      window.oauthCodeSubmitCallback(code)
      delete window.oauthCodeSubmitCallback
    } else {
      // If there's no callback, process directly (fallback)
      await processOAuthCode(code)
    }
  }

  const handleOAuthLogout = () => {
    logoutOAuth()
    setOAuthUser(null)
    setIsOAuthAuthenticated(false)
    window.location.href = '/'
  }

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी (Hindi)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
    { code: 'ml', name: 'മലയാളം (Malayalam)' },
    { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'mr', name: 'मराठी (Marathi)' },
    { code: 'as', name: 'অসমীয়া (Assamese)' },
    { code: 'ur', name: 'اردو (Urdu)' },
  ]

  const changeLanguage = (langCode) => {
    setShowTranslateDropdown(false)
    
    // Function to trigger Google Translate
    const triggerTranslation = () => {
      // Method 1: Try to find and trigger the select element directly
      const selectField = document.querySelector('.goog-te-combo')
      if (selectField) {
        selectField.value = langCode
        selectField.dispatchEvent(new Event('change', { bubbles: true }))
        return true
      }

      // Method 2: Try to access via iframe
      const iframe = document.querySelector('iframe.goog-te-menu-frame')
      if (iframe && iframe.contentWindow) {
        try {
          const iframeDoc = iframe.contentWindow.document || iframe.contentDocument
          const select = iframeDoc.querySelector('select')
          if (select) {
            select.value = langCode
            select.dispatchEvent(new Event('change', { bubbles: true }))
            return true
          }
        } catch (e) {
          console.log('Cannot access iframe:', e)
        }
      }

      // Method 3: Use cookie-based approach (Google Translate stores language in cookie)
      const domain = window.location.hostname
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=${domain}`
      
      // Method 4: Trigger page reload to apply translation
      window.location.reload()
      return false
    }

    // Wait a bit for Google Translate to be fully initialized
    setTimeout(() => {
      if (!triggerTranslation()) {
        // If direct method didn't work, try reloading with cookie
        setTimeout(() => {
          window.location.reload()
        }, 100)
      }
    }, 200)
  }

  useEffect(() => {
    // Define the callback function for Google Translate
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,hi,te,ta,kn,ml,gu,pa,or,bn,mr,as,ur',
            layout: window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
            autoDisplay: false,
          },
          'google_translate_element'
        )
        
        // Hide the default Google Translate widget after initialization
        setTimeout(() => {
          const googleWidget = document.querySelector('.goog-te-gadget')
          if (googleWidget) {
            googleWidget.style.display = 'none'
          }
        }, 500)
      }
    }

    // If Google Translate is already loaded, initialize immediately
    if (window.google && window.google.translate) {
      window.googleTranslateElementInit()
    }

    // Continuously hide the default Google Translate widget
    const hideGoogleWidget = setInterval(() => {
      const googleWidget = document.querySelector('.goog-te-gadget')
      if (googleWidget) {
        googleWidget.style.display = 'none'
      }
    }, 500)

    return () => {
      clearInterval(hideGoogleWidget)
    }
  }, [])

  return (
    <header 
      className="bg-white border-b-2 border-green-200 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <img 
              src="/images/fes-logo.svg" 
              alt="FES Stories" 
              className="h-10 w-auto"
            />
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/stories"
              className={`font-medium transition-colors ${
                isActive('/stories')
                  ? 'text-green-800 font-semibold border-b-2 border-green-700'
                  : 'text-gray-700 hover:text-green-700'
              }`}
            >
              Stories
            </Link>
            
            {/* Custom Language Selector */}
            <div className="relative notranslate">
              <button
                onClick={() => setShowTranslateDropdown(!showTranslateDropdown)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-green-700 transition-colors font-medium"
                aria-label="Select Language"
              >
                <FaGlobe className="text-lg" />
                <span className="text-sm notranslate">Language</span>
              </button>
              
              {showTranslateDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowTranslateDropdown(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20 max-h-80 overflow-y-auto notranslate">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors notranslate"
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Hidden Google Translate Element - must be visible for it to work */}
            <div id="google_translate_element" style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}></div>

            <Link
              to="/oauth"
              className={`font-medium transition-colors ${
                isActive('/oauth')
                  ? 'text-green-800 font-semibold border-b-2 border-green-700'
                  : 'text-gray-700 hover:text-green-700'
              }`}
            >
              OAuth
            </Link>

            {isOAuthAuthenticated && oauthUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">
                    {oauthUser.name || oauthUser.preferred_username || 'User'}
                  </p>
                  {oauthUser.sub && (
                    <p className="text-xs text-gray-600">ID: {oauthUser.sub}</p>
                  )}
                </div>
                <button
                  onClick={handleOAuthLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md hover:shadow-lg text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={handleOAuthLogin}
                  disabled={isProcessing}
                  className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'OLogin'}
                </button>
                <Link
                  to="/login"
                  className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors font-medium shadow-md hover:shadow-lg"
                >
                  Login
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button className="md:hidden text-gray-700">
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <OAuthCodeModal
        isOpen={showCodeModal}
        onClose={() => {
          setShowCodeModal(false)
          if (window.oauthCodeSubmitCallback) {
            delete window.oauthCodeSubmitCallback
          }
        }}
        onSubmit={handleCodeSubmit}
      />
    </header>
  )
}

export default Header

