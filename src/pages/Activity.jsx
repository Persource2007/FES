import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaHistory, FaUser, FaEdit, FaTrash, FaPlus } from 'react-icons/fa'
import Sidebar from '../components/Sidebar'
import { getActivities } from '../utils/activity'
import { formatRelativeTime } from '../utils/dateFormat'

function Activity() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activities, setActivities] = useState([])

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
        localStorage.removeItem('user')
        localStorage.removeItem('authToken')
        navigate('/login')
      }
    }
  }, [navigate])

  // Load activities from API
  useEffect(() => {
    const loadActivities = async () => {
      try {
        const loadedActivities = await getActivities()
        setActivities(loadedActivities)
      } catch (error) {
        console.error('Error loading activities:', error)
      }
    }
    
    loadActivities()
    
    // Refresh activities every 5 seconds to catch new activities
    const interval = setInterval(loadActivities, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'login':
        return FaUser
      case 'edit':
        return FaEdit
      case 'delete':
        return FaTrash
      case 'create':
        return FaPlus
      default:
        return FaHistory
    }
  }


  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="flex-1 transition-all duration-200 ease-in-out">
        {/* Top Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <FaHistory className="text-2xl text-slate-700" />
              <h1 className="text-2xl font-bold text-gray-900">Recent Activity</h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Activity Timeline</h2>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No activity to display yet.
                </p>
              ) : (
                activities.map((activity) => {
                  const Icon = getActivityIcon(activity.type)
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                        <Icon className="text-blue-600 text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Activity

