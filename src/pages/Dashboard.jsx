import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaChartBar } from 'react-icons/fa'
import Sidebar from '../components/Sidebar'
import {
  canManageUsers,
  canManageStoryCategories,
  canPostStories,
} from '../utils/permissions'

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  // Load user data from localStorage on mount
  useEffect(() => {
    const userData = localStorage.getItem('user')
    const authToken = localStorage.getItem('authToken')

    // Redirect to login if not authenticated
    if (!userData || !authToken) {
      navigate('/login')
      return
    }

    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (e) {
        console.error('Error parsing user data:', e)
        // If parsing fails, clear invalid data and redirect
        localStorage.removeItem('user')
        localStorage.removeItem('authToken')
        navigate('/login')
      }
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  }

  const canManageUsersPermission = canManageUsers(user)
  const canManageCategoriesPermission = canManageStoryCategories(user)
  const canPostStoriesPermission = canPostStories(user)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="flex-1 transition-all duration-200 ease-in-out">
        {/* Top Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Card */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FaChartBar className="text-3xl text-slate-700" />
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  {user?.name ? `Welcome, ${user.name}!` : 'Welcome to Dashboard'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {user?.email || 'User email'}
                </p>
              </div>
            </div>
            <p className="text-gray-600">
              {canManageUsersPermission && canManageCategoriesPermission
                ? 'You have full administrative access to manage stories, users, and system settings.'
                : canPostStoriesPermission
                ? 'You can post stories to categories you have access to.'
                : 'This is your dashboard page. You can add your content here.'}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
