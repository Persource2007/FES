import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
} from 'react-icons/fa'
import { useApi } from '../hooks/useApi'
import { API_ENDPOINTS } from '../utils/constants'
import apiClient from '../utils/api'
import Sidebar from '../components/Sidebar'
import { addActivity } from '../utils/activity'
// Removed permission imports - all authenticated users have access
import { formatDateSimple } from '../utils/dateFormat'

function Users() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [updatingRole, setUpdatingRole] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(null)

  // Fetch users
  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
    execute: fetchUsers,
  } = useApi(API_ENDPOINTS.USERS.LIST, { immediate: false })

  // Fetch roles
  const {
    data: rolesData,
    loading: rolesLoading,
    error: rolesError,
    execute: fetchRoles,
  } = useApi(API_ENDPOINTS.USERS.ROLES, { immediate: false })

  // Fetch organizations
  const {
    data: organizationsData,
    loading: organizationsLoading,
    error: organizationsError,
    execute: fetchOrganizations,
  } = useApi(API_ENDPOINTS.ORGANIZATIONS.LIST, { immediate: false })


  // Check authentication and role
  // Support both OAuth (oauth_user) and old local login (user)
  useEffect(() => {
    const oauthUserData = localStorage.getItem('oauth_user')
    const oldUserData = localStorage.getItem('user')
    const userData = oauthUserData || oldUserData
    
    if (!userData) {
      navigate('/')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // All authenticated users can access - no permission checks
    } catch (e) {
      console.error('Error parsing user data:', e)
      navigate('/')
    }
  }, [navigate])

  // Fetch data on mount
  useEffect(() => {
    if (user) {
      console.log('Fetching users and roles...')
      fetchUsers().catch((err) => {
        console.error('Error fetching users:', err)
        toast.error('Failed to load users. Please check if backend is running.')
      })
      fetchRoles().catch((err) => {
        console.error('Error fetching roles:', err)
        toast.error('Failed to load roles. Please check if backend is running.')
      })
      fetchOrganizations().catch((err) => {
        console.error('Error fetching organizations:', err)
        toast.error('Failed to load organizations. Please check if backend is running.')
      })
    }
  }, [user])


  const handleEditUser = (userItem) => {
    navigate(`/dashboard/users/${userItem.id}/edit`)
  }

  const handleToggleUserStatus = async (userId, currentStatus) => {
    setTogglingStatus(userId)
    
    // Optimistically update the UI
    const user = users.find(u => u.id === userId)
    const originalStatus = user?.is_active
    const newStatus = !currentStatus
    
    // Update local state immediately
    setUsers(prevUsers =>
      prevUsers.map(u =>
        u.id === userId ? { ...u, is_active: newStatus } : u
      )
    )

    try {
      const response = await apiClient.patch(
        API_ENDPOINTS.USERS.TOGGLE_STATUS(userId)
      )
      if (response.data.success) {
        toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`)
        fetchUsers() // Refresh to get server state
        if (user) {
          addActivity('edit', `${newStatus ? 'Activated' : 'Deactivated'} user: ${user.name} (${user.email})`)
        }
      } else {
        // Revert on failure
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u.id === userId ? { ...u, is_active: originalStatus } : u
          )
        )
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      // Revert on error
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? { ...u, is_active: originalStatus } : u
        )
      )
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to update user status'
      toast.error(errorMessage)
    } finally {
      setTogglingStatus(null)
    }
  }


  const handleLogout = async () => {
    try {
      // Import logoutOAuth dynamically to avoid circular dependencies
      const { logoutOAuth } = await import('../utils/oauthLogin')
      // Call BFF logout endpoint to destroy session on server
      // logoutOAuth() handles all localStorage cleanup
      await logoutOAuth()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Redirect to home page (using window.location for reliable logout redirect)
      window.location.href = '/'
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return

    try {
      console.log('Deleting user:', deleteConfirm.id)
      
      // Store user info for activity log before deletion
      const deletedUser = { ...deleteConfirm }
      
      // Use apiClient directly for dynamic URL
      const response = await apiClient({
        method: 'DELETE',
        url: API_ENDPOINTS.USERS.DELETE(deleteConfirm.id),
      })
      
      console.log('Delete response:', response.data)
      
      toast.success('User deleted successfully')
      
      // Log activity (fire-and-forget, don't block on error)
      addActivity('delete', `Deleted user: ${deletedUser.name} (${deletedUser.email})`, {
        userId: deletedUser.id,
        userName: deletedUser.name,
        userEmail: deletedUser.email,
        roleName: deletedUser.role_name,
      }).catch(err => console.error('Failed to log delete activity:', err))
      
      setDeleteConfirm(null)
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      console.error('Error response:', error.response)
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to delete user'
      toast.error(errorMessage)
    }
  }

  const [users, setUsers] = useState([])
  const roles = rolesData?.roles || []
  const organizations = organizationsData?.organizations || []

  // Update users when data changes
  useEffect(() => {
    if (usersData?.users) {
      setUsers(usersData.users)
    }
  }, [usersData])

  // Debug logging
  useEffect(() => {
    console.log('Users data:', usersData)
    console.log('Roles data:', rolesData)
    console.log('Organizations data:', organizationsData)
    console.log('Users array:', users)
    console.log('Loading:', usersLoading)
    console.log('Error:', usersError)
  }, [usersData, rolesData, organizationsData, users, usersLoading, usersError])

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
              <FaUsers className="text-2xl text-slate-700" />
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Add User Button */}
          <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard/users/new')}
            className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <FaPlus /> Add New User
          </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
          {usersError && (
            <div className="p-8 text-center text-red-500">
              Error loading users: {usersError}
            </div>
          )}
          {usersLoading ? (
            <div className="p-8 text-center text-gray-500">Loading users...</div>
          ) : usersError ? null : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No users found. Click "Add New User" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((userItem) => (
                    <tr key={userItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {userItem.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{userItem.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {userItem.role_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {userItem.organization_name ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {userItem.organization_name}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={userItem.is_active !== false}
                            onChange={(e) => {
                              e.stopPropagation()
                              handleToggleUserStatus(userItem.id, userItem.is_active !== false)
                            }}
                            disabled={togglingStatus === userItem.id}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 bg-red-600 peer-disabled:opacity-50"></div>
                        </label>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateSimple(userItem.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditUser(userItem)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit User"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(userItem)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      </main>


      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Delete User</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700">
                Are you sure you want to delete{' '}
                <span className="font-semibold">{deleteConfirm.name}</span> (
                {deleteConfirm.email})? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users

