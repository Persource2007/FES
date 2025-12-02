import { useState } from 'react'
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
} from 'react-icons/fa'

function Sidebar({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const isSuperAdmin = user?.role?.name === 'Super admin'
  const isReader = user?.role?.name === 'Reader'

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: FaHome,
      visible: true,
    },
    ...(isSuperAdmin
      ? [
          {
            name: 'Users',
            path: '/dashboard/users',
            icon: FaUsers,
            visible: true,
          },
          {
            name: 'Content',
            path: '/dashboard/content',
            icon: FaFileAlt,
            visible: true,
          },
          {
            name: 'Settings',
            path: '/dashboard/settings',
            icon: FaCog,
            visible: true,
          },
        ]
      : []),
    ...(isReader
      ? [
          {
            name: 'View News',
            path: '/dashboard/view-news',
            icon: FaFileAlt,
            visible: true,
          },
          {
            name: 'Publications',
            path: '/dashboard/publications',
            icon: FaFileAlt,
            visible: true,
          },
        ]
      : []),
    {
      name: 'Recent Activity',
      path: '/dashboard/activity',
      icon: FaHistory,
      visible: true,
    },
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
                      isSuperAdmin
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
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={closeMobileSidebar}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-150
                      ${
                        isActive(item.path)
                          ? 'bg-slate-700 text-white shadow-sm'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }
                    `}
                    title={!isOpen ? item.name : ''}
                  >
                    <Icon className="text-lg flex-shrink-0 w-5 h-5" />
                    {isOpen && (
                      <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.name}
                      </span>
                    )}
                  </Link>
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

