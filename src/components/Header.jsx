import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaGlobe } from 'react-icons/fa'

function Header() {
  const location = useLocation()
  const [showTranslateDropdown, setShowTranslateDropdown] = useState(false)

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

            <Link
              to="/login"
              className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              Login
            </Link>
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
    </header>
  )
}

export default Header

