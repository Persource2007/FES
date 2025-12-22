import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaGlobe, FaTachometerAlt } from 'react-icons/fa'
import { initiateOAuthLogin, isOAuthLoggedIn, getOAuthUser, logoutOAuth, exchangeCodeForToken, getUserInfo } from '../utils/oauthLogin'
import { useError } from '../contexts/ErrorContext'
import OAuthCodeModal from './OAuthCodeModal'

function Header() {
  const location = useLocation()
  const { showError, showWarning } = useError()
  const [showTranslateDropdown, setShowTranslateDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [oauthUser, setOAuthUser] = useState(null)
  const [isOAuthAuthenticated, setIsOAuthAuthenticated] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingCode, setProcessingCode] = useState(null) // Track which code is being processed

  // Check OAuth login status on mount and when location changes
  useEffect(() => {
    let isMounted = true
    let lastCheckTime = 0
    const MIN_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes minimum between checks
    
    const checkOAuthStatus = async (force = false) => {
      // Throttle: Don't check if we've checked recently (unless forced)
      const now = Date.now()
      if (!force && (now - lastCheckTime) < MIN_CHECK_INTERVAL) {
        return
      }
      lastCheckTime = now
      
      try {
        // First check if we have user in localStorage
        const storedUser = getOAuthUser()
        
        // If we have a stored user, use it (no need to call API)
        if (storedUser) {
          if (isMounted) {
            setOAuthUser(storedUser)
            setIsOAuthAuthenticated(true)
          }
          return
        }
        
        // Only call API if we don't have stored user
        // If no stored user but we have a session cookie, try to fetch user info
        console.log('No oauth_user in localStorage, checking session...')
        try {
          const user = await getUserInfo()
          if (isMounted && user) {
            setOAuthUser(user)
            setIsOAuthAuthenticated(true)
          }
        } catch (error) {
          console.log('Failed to fetch user info:', error.message)
          // If fetch fails, check if it's a 401 (session invalid)
          if (isMounted) {
            if (error.response?.status === 401) {
              setIsOAuthAuthenticated(false)
              setOAuthUser(null)
            }
          }
        }
      } catch (error) {
        // Session expired or not found
        console.error('OAuth status check error:', error)
        if (isMounted) {
          setIsOAuthAuthenticated(false)
          setOAuthUser(null)
        }
      }
    }
    
    // Check on mount
    checkOAuthStatus(true)
    
    // Check when tab becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only check if we don't have a stored user
        if (!getOAuthUser()) {
          checkOAuthStatus(true)
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Periodic check only if no stored user (every 5 minutes instead of 30 seconds)
    // This is a fallback for cases where localStorage might be cleared
    const interval = setInterval(() => {
      if (!getOAuthUser()) {
        checkOAuthStatus(false)
      }
    }, 5 * 60 * 1000) // 5 minutes
    
    return () => {
      isMounted = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [location])

  const handleOAuthLogin = async () => {
    try {
      setIsProcessing(true)
      
      // First, check if we have a stored user (no API call needed)
      const storedUser = getOAuthUser()
      if (storedUser) {
        setOAuthUser(storedUser)
        setIsOAuthAuthenticated(true)
        setIsProcessing(false)
        return // Already have user info, no need to check session
      }
      
      // Only check session if we don't have stored user
      // This handles cases where user has expired token but refresh token is still valid
      try {
        const loggedIn = await isOAuthLoggedIn()
        if (loggedIn) {
          // Session is valid (or was successfully refreshed)
          const user = getOAuthUser() || await getUserInfo()
          setOAuthUser(user)
          setIsOAuthAuthenticated(true)
          setIsProcessing(false)
          return // Already logged in, no need to go through OAuth flow
        }
      } catch (error) {
        // Session check failed - will proceed to OAuth login
        console.log('No valid session found, proceeding to OAuth login')
      }
      
      // No valid session found - proceed with OAuth login
      // Clear any existing user data before starting a new login
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
      showError(
        error.message || 'OAuth login failed. Please try again.',
        'OAuth Login Failed'
      )
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
      
      // Clear any existing user data before processing new code
      localStorage.removeItem('oauth_user')
      
      // Exchange code for tokens via BFF - returns user info and sets session cookie
      const response = await exchangeCodeForToken(code)
      
      // BFF returns user info directly in response.data.user
      const user = response?.user || response?.data?.user
      
      // Verify we got user info
      if (!user) {
        throw new Error('No user information received from server')
      }
      
      setOAuthUser(user)
      setIsOAuthAuthenticated(true)
      
      // Stay on current page after successful login (no redirect)
    } catch (error) {
      console.error('Error processing OAuth code:', error)
      
      // Clear user data on error
      localStorage.removeItem('oauth_user')
      setOAuthUser(null)
      setIsOAuthAuthenticated(false)
      
      const errorMessage = error.response?.data?.message
        || error.message 
        || 'Unknown error'
      
      // Determine error type based on message
      let errorTitle = 'Login Failed'
      let errorType = 'error'
      
      if (errorMessage.includes('no role') || errorMessage.includes('role') || error.response?.status === 403) {
        errorTitle = 'Access Denied'
        errorType = 'warning'
        showWarning(
          'Your account does not have a role assigned. Please contact an administrator to assign you a role.',
          errorTitle
        )
      } else if (errorMessage.includes('not exist') || errorMessage.includes('not found')) {
        errorTitle = 'User Not Found'
        showError(
          'The user account does not exist. Please contact an administrator.',
          errorTitle
        )
      } else {
        showError(
          `${errorMessage}\n\nCheck the browser console for more details.`,
          errorTitle
        )
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

  const handleOAuthLogout = async () => {
    await logoutOAuth()
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
          <nav className="hidden lg:flex items-center space-x-6">
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
            <Link
              to="/leaflet-map"
              className={`font-medium transition-colors ${
                isActive('/leaflet-map')
                  ? 'text-green-800 font-semibold border-b-2 border-green-700'
                  : 'text-gray-700 hover:text-green-700'
              }`}
            >
              Leaflet Map
            </Link>
            
            {/* Custom Language Selector */}
            <div className="relative notranslate">
              <button
                onClick={() => setShowTranslateDropdown(!showTranslateDropdown)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-green-700 transition-colors font-medium"
                aria-label="Select Language"
              >
                <FaGlobe className="text-lg" />
                <span className="notranslate">Language</span>
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
                    {oauthUser.name || oauthUser.email || 'User'}
                  </p>
                  {oauthUser.role && (
                    <p className="text-xs text-gray-600">Role: {oauthUser.role.name || oauthUser.role_name}</p>
                  )}
                </div>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors font-medium shadow-md hover:shadow-lg text-sm"
                >
                  <FaTachometerAlt className="text-sm" />
                  Dashboard
                </Link>
                <button
                  onClick={handleOAuthLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md hover:shadow-lg text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={handleOAuthLogin}
                disabled={isProcessing}
                className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Login'}
              </button>
            )}
          </nav>

          {/* Mobile menu button */}
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden text-gray-700 p-2"
            aria-label="Toggle mobile menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {showMobileMenu ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/stories"
                onClick={() => setShowMobileMenu(false)}
                className={`px-4 py-2 font-medium transition-colors ${
                  isActive('/stories')
                    ? 'text-green-800 font-semibold border-l-4 border-green-700 bg-green-50'
                    : 'text-gray-700 hover:text-green-700 hover:bg-gray-50'
                }`}
              >
                Stories
              </Link>
              <Link
                to="/leaflet-map"
                onClick={() => setShowMobileMenu(false)}
                className={`px-4 py-2 font-medium transition-colors ${
                  isActive('/leaflet-map')
                    ? 'text-green-800 font-semibold border-l-4 border-green-700 bg-green-50'
                    : 'text-gray-700 hover:text-green-700 hover:bg-gray-50'
                }`}
              >
                Leaflet Map
              </Link>
              
              {/* Mobile Language Selector */}
              <div className="relative notranslate">
                <button
                  onClick={() => setShowTranslateDropdown(!showTranslateDropdown)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-gray-700 hover:text-green-700 transition-colors font-medium hover:bg-gray-50"
                  aria-label="Select Language"
                >
                  <FaGlobe className="text-lg" />
                  <span className="notranslate">Language</span>
                </button>
                
                {showTranslateDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowTranslateDropdown(false)}
                    ></div>
                    <div className="absolute left-0 right-0 mt-2 mx-4 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20 max-h-80 overflow-y-auto notranslate">
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

              <Link
                to="/oauth"
                onClick={() => setShowMobileMenu(false)}
                className={`px-4 py-2 font-medium transition-colors ${
                  isActive('/oauth')
                    ? 'text-green-800 font-semibold border-l-4 border-green-700 bg-green-50'
                    : 'text-gray-700 hover:text-green-700 hover:bg-gray-50'
                }`}
              >
                OAuth
              </Link>

              {isOAuthAuthenticated && oauthUser ? (
                <div className="px-4 py-2 space-y-3 border-t border-gray-200 pt-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {oauthUser.name || oauthUser.email || 'User'}
                    </p>
                    {oauthUser.role && (
                      <p className="text-xs text-gray-600">Role: {oauthUser.role.name || oauthUser.role_name}</p>
                    )}
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center justify-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors font-medium shadow-md hover:shadow-lg text-sm w-full"
                  >
                    <FaTachometerAlt className="text-sm" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setShowMobileMenu(false)
                      handleOAuthLogout()
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md hover:shadow-lg text-sm w-full"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="px-4">
                  <button
                    onClick={() => {
                      setShowMobileMenu(false)
                      handleOAuthLogin()
                    }}
                    disabled={isProcessing}
                    className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full"
                  >
                    {isProcessing ? 'Processing...' : 'Login'}
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
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

