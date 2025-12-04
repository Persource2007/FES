import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  FaBars,
  FaTimes,
  FaHome,
  FaUsers,
  FaFileAlt,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaHistory,
  FaBell,
  FaChevronDown,
  FaChevronUp,
  FaGlobe,
  FaInfoCircle,
} from 'react-icons/fa'
import {
  canManageUsers,
  canManageStoryCategories,
  canPostStories,
  canViewStories,
  canViewActivity,
} from '../utils/permissions'
import { useApi } from '../hooks/useApi'
import { API_ENDPOINTS } from '../utils/constants'

function Sidebar({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState({})
  const location = useLocation()
  const navigate = useNavigate()
  const [pendingCount, setPendingCount] = useState(0)
  const [showTranslateDropdown, setShowTranslateDropdown] = useState(false)
  const [showLanguageInfo, setShowLanguageInfo] = useState(false)

  // Fetch pending stories count for super admin
  const {
    data: pendingCountData,
    execute: fetchPendingCount,
  } = useApi(API_ENDPOINTS.STORIES.PENDING_COUNT, { immediate: false })

  useEffect(() => {
    if (user && canManageStoryCategories(user)) {
      fetchPendingCount()
      // Refresh count every 15 seconds
      const interval = setInterval(() => {
        fetchPendingCount()
      }, 15000)
      return () => clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    if (pendingCountData?.success) {
      setPendingCount(pendingCountData.count || 0)
    }
  }, [pendingCountData])

  // Google Translate initialization for dashboard pages
  useEffect(() => {
    // Define the callback function for Google Translate (for dashboard pages)
    // This will be called when the Google Translate script loads
    const sidebarTranslateInit = () => {
      // Check if element exists and Google Translate is available
      const element = document.getElementById('google_translate_element_sidebar')
      if (element && window.google && window.google.translate) {
        try {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,hi,te,ta,kn,ml,gu,pa,or,bn,mr,as,ur',
              layout: window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
              autoDisplay: false,
            },
            'google_translate_element_sidebar'
          )
          
          // Hide the default Google Translate widget after initialization
          setTimeout(() => {
            const googleWidget = document.querySelector('.goog-te-gadget')
            if (googleWidget) {
              googleWidget.style.display = 'none'
            }
          }, 500)
        } catch (e) {
          console.log('Google Translate initialization error:', e)
        }
      }
    }

    // Set up the callback (will be called by the script or manually)
    // Use a unique name to avoid conflicts with Header
    window.googleTranslateElementInitSidebar = sidebarTranslateInit

    // If Google Translate is already loaded, initialize immediately
    if (window.google && window.google.translate) {
      sidebarTranslateInit()
    } else {
      // Also set up the default callback in case script hasn't loaded yet
      // The script in index.html uses 'googleTranslateElementInit' as callback
      // We'll override it to handle both Header and Sidebar cases
      const originalCallback = window.googleTranslateElementInit
      window.googleTranslateElementInit = () => {
        // Call original if it exists (for Header)
        if (originalCallback && typeof originalCallback === 'function') {
          originalCallback()
        }
        // Also initialize sidebar version
        sidebarTranslateInit()
      }
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

  // Auto-expand Stories menu if on review page
  useEffect(() => {
    if (location.pathname === '/dashboard/stories/review') {
      setExpandedMenus((prev) => ({
        ...prev,
        '/dashboard/stories': true,
      }))
    }
  }, [location.pathname])

  const handleLogout = () => {
    onLogout()
    navigate('/login')
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

      return false
    }

    // Set cookie first (this is the most reliable method)
    const domain = window.location.hostname
    // Set cookie with proper expiration
    const expirationDate = new Date()
    expirationDate.setFullYear(expirationDate.getFullYear() + 1)
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${domain}; expires=${expirationDate.toUTCString()}`
    
    // Also set it without domain for localhost
    if (domain === 'localhost' || domain === '127.0.0.1') {
      document.cookie = `googtrans=/en/${langCode}; path=/; expires=${expirationDate.toUTCString()}`
    }

    // Try direct methods first
    const success = triggerTranslation()
    
    if (!success) {
      // If direct methods didn't work, reload page to apply cookie-based translation
      window.location.reload()
    }
  }

  // If user doesn't have permissions array, show all menu items (fallback for users logged in before permissions system)
  const hasPermissions = user?.permissions && Array.isArray(user.permissions)
  
  const toggleSubmenu = (menuKey) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }))
  }

  // Check if Stories menu should have submenu (for super admin)
  const canManageCategories = hasPermissions ? canManageStoryCategories(user) : true
  const storiesHasSubmenu = canManageCategories

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: FaHome,
      visible: true,
    },
    // Users menu - visible if user can manage users OR if permissions not set up yet
    ...((hasPermissions ? canManageUsers(user) : true)
      ? [
          {
            name: 'Users',
            path: '/dashboard/users',
            icon: FaUsers,
            visible: true,
          },
        ]
      : []),
    // Stories menu - visible if user can manage categories or view/post stories OR if permissions not set up yet
    ...((hasPermissions ? (canManageStoryCategories(user) || canViewStories(user) || canPostStories(user)) : true)
      ? [
          {
            name: 'Stories',
            path: '/dashboard/stories',
            icon: FaFileAlt,
            visible: true,
            hasSubmenu: storiesHasSubmenu,
            badge: canManageCategories && pendingCount > 0 ? pendingCount : null,
            submenu: canManageCategories
              ? [
                  {
                    name: 'Story Review',
                    path: '/dashboard/stories/review',
                    icon: FaBell,
                    badge: pendingCount > 0 ? pendingCount : null,
                  },
                ]
              : [],
          },
        ]
      : []),
    // Activity menu - visible if user can view activity OR if permissions not set up yet
    ...((hasPermissions ? canViewActivity(user) : true)
      ? [
          {
            name: 'Recent Activity',
            path: '/dashboard/activity',
            icon: FaHistory,
            visible: true,
          },
        ]
      : []),
  ]

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen)
  }

  const closeMobileSidebar = () => {
    setIsMobileOpen(false)
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-700 text-white rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-slate-800 text-white z-40
          transition-all duration-200 ease-in-out
          ${isOpen ? 'w-64' : 'w-16'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-xl
          flex flex-col
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-center p-4 border-b border-slate-700 h-16 flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center w-full rounded transition-colors group relative gap-2"
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={isOpen ? 'Click to collapse sidebar' : 'Click to expand sidebar'}
          >
            {isOpen ? (
              <>
                <img 
                  src="/images/fes-logo-white.svg" 
                  alt="FES Stories" 
                  className="h-8 w-auto flex-shrink-0"
                />
                <FaChevronLeft className="w-3 h-3 text-slate-400 flex-shrink-0 ml-auto" />
              </>
            ) : (
              <>
                <div 
                  className="h-8 w-8 flex-shrink-0 rounded-full bg-white p-1.5"
                  style={{
                    backgroundImage: 'url(/images/fes-logo-white.svg)',
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    clipPath: 'circle(50% at 50% 50%)'
                  }}
                  title="FES Stories"
                />
                <FaChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
              </>
            )}
          </button>
        </div>

        {/* User Info */}
        <div className={`p-4 border-b border-slate-700 overflow-hidden transition-all duration-200 flex-shrink-0 ${isOpen ? '' : 'px-2'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
                {user?.role && (
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                      canManageUsers(user)
                        ? 'bg-purple-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {user.role.name}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isExpanded = expandedMenus[item.path] || false
              const hasActiveSubmenu = item.submenu?.some((sub) => isActive(sub.path)) || false

              return (
                <li key={item.path}>
                  <div>
                    <div
                      className={`
                        flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center px-2'} py-2.5 rounded-lg
                        transition-all duration-150
                        relative
                        ${
                          isActive(item.path) || hasActiveSubmenu
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }
                        ${item.badge && item.badge > 0 ? 'bg-red-600/20' : ''}
                      `}
                    >
                      <Link
                        to={item.path}
                        onClick={closeMobileSidebar}
                        className={`flex items-center ${isOpen ? 'gap-3 flex-1 min-w-0' : 'justify-center'} w-full`}
                        title={!isOpen ? item.name : ''}
                      >
                        <Icon className={`${isOpen ? 'text-lg w-5 h-5' : 'text-xl w-6 h-6'} flex-shrink-0`} />
                        {isOpen && (
                          <>
                            <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                              {item.name}
                            </span>
                            {!item.hasSubmenu && item.badge && item.badge > 0 && (
                              <span className="flex-shrink-0 px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                                {item.badge > 99 ? '99+' : item.badge}
                              </span>
                            )}
                          </>
                        )}
                        {!isOpen && item.badge && item.badge > 0 && (
                          <span className="absolute top-1 right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-slate-800"></span>
                        )}
                      </Link>
                      {isOpen && item.hasSubmenu && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSubmenu(item.path)
                          }}
                          className="flex-shrink-0 p-1 hover:bg-slate-600 rounded transition-colors"
                          aria-label={isExpanded ? 'Collapse submenu' : 'Expand submenu'}
                        >
                          {isExpanded ? (
                            <FaChevronUp className="w-3 h-3" />
                          ) : (
                            <FaChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      )}
                      {isOpen && item.hasSubmenu && item.badge && item.badge > 0 && (
                        <span className="flex-shrink-0 px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </div>
                    {/* Submenu */}
                    {item.hasSubmenu && item.submenu && isOpen && isExpanded && (
                      <ul className="ml-4 mt-1 space-y-1 border-l-2 border-slate-700 pl-2">
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon
                          return (
                            <li key={subItem.path}>
                              <Link
                                to={subItem.path}
                                onClick={closeMobileSidebar}
                                className={`
                                  flex items-center gap-3 px-3 py-2 rounded-lg
                                  transition-all duration-150
                                  ${
                                    isActive(subItem.path)
                                      ? 'bg-slate-700 text-white shadow-sm'
                                      : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                                  }
                                `}
                              >
                                <SubIcon className="text-base flex-shrink-0 w-4 h-4" />
                                <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                                  {subItem.name}
                                </span>
                                {subItem.badge && subItem.badge > 0 && (
                                  <span className="flex-shrink-0 px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                                    {subItem.badge > 99 ? '99+' : subItem.badge}
                                  </span>
                                )}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Language Selector and Logout Button */}
        <div className="p-4 border-t border-slate-700 flex-shrink-0 space-y-2">
          {/* Language Selector */}
          <div className="relative">
            <div className={`flex items-center ${isOpen ? 'gap-1' : 'justify-center'}`}>
              <button
                onClick={() => setShowTranslateDropdown(!showTranslateDropdown)}
                className={`
                  ${isOpen ? 'flex-1 flex items-center gap-3 px-3' : 'flex items-center justify-center px-2'} py-2.5 rounded-lg
                  text-slate-300 hover:bg-slate-700 hover:text-white
                  transition-all duration-150 w-full
                `}
                title={!isOpen ? 'Language' : ''}
              >
                <FaGlobe className={`${isOpen ? 'text-lg w-5 h-5' : 'text-xl w-6 h-6'} flex-shrink-0`} />
                {isOpen && (
                  <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis notranslate">
                    Language
                  </span>
                )}
              </button>
              {isOpen && (
                <button
                  onClick={() => setShowLanguageInfo(!showLanguageInfo)}
                  onMouseEnter={() => setShowLanguageInfo(true)}
                  onMouseLeave={() => setShowLanguageInfo(false)}
                  className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors relative"
                  title="Language translation info"
                >
                  <FaInfoCircle className="text-sm" />
                  {showLanguageInfo && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-700 text-white text-xs rounded-lg p-3 shadow-lg z-50 notranslate">
                      <p className="mb-1 font-semibold">Translation Notice</p>
                      <p className="text-slate-300">
                        The logo in the sidebar might be compromised due to Google's policy to display their translation banner.
                      </p>
                      <div className="absolute bottom-0 left-4 transform translate-y-full">
                        <div className="border-4 border-transparent border-t-slate-700"></div>
                      </div>
                    </div>
                  )}
                </button>
              )}
            </div>
            
            {showTranslateDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowTranslateDropdown(false)}
                ></div>
                <div className={`
                  absolute bottom-full left-0 mb-2 w-56 bg-slate-700 rounded-lg shadow-lg border border-slate-600 py-2 z-20 max-h-80 overflow-y-auto notranslate
                  ${isOpen ? '' : 'hidden'}
                `}>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-600 hover:text-white transition-colors notranslate"
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Hidden Google Translate Element for dashboard pages */}
          <div id="google_translate_element_sidebar" style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}></div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center px-2'} py-2.5 rounded-lg
              text-red-400 hover:bg-slate-700 hover:text-red-300
              transition-all duration-150
            `}
            title={!isOpen ? 'Logout' : ''}
          >
            <FaSignOutAlt className={`${isOpen ? 'text-lg w-5 h-5' : 'text-xl w-6 h-6'} flex-shrink-0`} />
            {isOpen && (
              <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Spacer */}
      <div
        className={`
          hidden lg:block
          transition-all duration-200 ease-in-out
          ${isOpen ? 'w-64' : 'w-16'}
        `}
      />
    </>
  )
}

export default Sidebar

