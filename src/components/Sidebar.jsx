import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  FaBars,
  FaTimes,
  FaHome,
  FaUsers,
  FaFileAlt,
  FaCog,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaHistory,
  FaBell,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa'
import {
  canManageUsers,
  canManageStoryCategories,
  canPostStories,
  canViewStories,
  canViewActivity,
  canManageSettings,
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
    // Settings menu - visible if user can manage settings OR if permissions not set up yet
    ...((hasPermissions ? canManageSettings(user) : true)
      ? [
          {
            name: 'Settings',
            path: '/dashboard/settings',
            icon: FaCog,
            visible: true,
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
        <div className="flex items-center justify-between p-4 border-b border-slate-700 h-16 flex-shrink-0">
          {isOpen ? (
            <h2 className="text-xl font-bold text-white whitespace-nowrap overflow-hidden">
              FES Stories
            </h2>
          ) : (
            <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold">FS</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center p-1.5 hover:bg-slate-700 rounded transition-colors flex-shrink-0 ml-2"
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <FaChevronLeft className="w-4 h-4" /> : <FaChevronRight className="w-4 h-4" />}
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
                        flex items-center gap-3 px-3 py-2.5 rounded-lg
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
                        className="flex items-center gap-3 flex-1 min-w-0"
                        title={!isOpen ? item.name : ''}
                      >
                        <Icon className="text-lg flex-shrink-0 w-5 h-5" />
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

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-700 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-red-400 hover:bg-slate-700 hover:text-red-300
              transition-all duration-150
            `}
            title={!isOpen ? 'Logout' : ''}
          >
            <FaSignOutAlt className="text-lg flex-shrink-0 w-5 h-5" />
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

