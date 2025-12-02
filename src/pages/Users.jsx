import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCheck,
} from 'react-icons/fa'
import { useApi, useMutation } from '../hooks/useApi'
import { API_ENDPOINTS } from '../utils/constants'
import apiClient from '../utils/api'
import Sidebar from '../components/Sidebar'
import { addActivity } from '../utils/activity'

function Users() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [updatingRole, setUpdatingRole] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
  })

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

  // Mutations
  const { execute: createUser, loading: creating } = useMutation(
    API_ENDPOINTS.USERS.CREATE
  )

  // Check authentication and role
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      navigate('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // Check if user is super admin
      if (parsedUser.role?.name !== 'Super admin') {
        toast.error('Access denied. Super admin access required.')
        navigate('/dashboard')
        return
      }
    } catch (e) {
      console.error('Error parsing user data:', e)
      navigate('/login')
    }
  }, [navigate])

  // Fetch data on mount
  useEffect(() => {
    if (user?.role?.name === 'Super admin') {
      console.log('Fetching users and roles...')
      fetchUsers().catch((err) => {
        console.error('Error fetching users:', err)
        toast.error('Failed to load users. Please check if backend is running.')
      })
      fetchRoles().catch((err) => {
        console.error('Error fetching roles:', err)
        toast.error('Failed to load roles. Please check if backend is running.')
      })
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    try {
      await createUser(formData)
      toast.success('User created successfully')
      
      // Log activity (fire-and-forget, don't block on error)
      const roleName = roles.find(r => r.id === parseInt(formData.role_id))?.role_name || 'Unknown'
      addActivity('create', `Created new user: ${formData.name} (${formData.email}) with role: ${roleName}`, {
        userEmail: formData.email,
        userName: formData.name,
        roleName: roleName,
      }).catch(err => console.error('Failed to log create activity:', err))
      
      setShowAddModal(false)
      setFormData({ name: '', email: '', password: '', role_id: '' })
      fetchUsers()
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to create user'
      toast.error(errorMessage)
    }
  }

  const handleEditRole = async (userId, newRoleId) => {
    setUpdatingRole(true)
    try {
      console.log('Updating role for user:', userId, 'to role:', newRoleId)
      
      // Get user info before update for activity log
      const userToUpdate = users.find(u => u.id === userId)
      const oldRoleName = userToUpdate?.role_name || 'Unknown'
      const newRoleName = roles.find(r => r.id === newRoleId)?.role_name || 'Unknown'
      
      // Use apiClient directly for dynamic URL
      const response = await apiClient({
        method: 'PUT',
        url: API_ENDPOINTS.USERS.UPDATE_ROLE(userId),
        data: { role_id: newRoleId },
      })
      
      console.log('Role update response:', response.data)
      
      toast.success('User role updated successfully')
      
      // Log activity (fire-and-forget, don't block on error)
      if (userToUpdate) {
        addActivity('edit', `Updated role for ${userToUpdate.name} (${userToUpdate.email}): ${oldRoleName} → ${newRoleName}`, {
          userId: userId,
          userName: userToUpdate.name,
          userEmail: userToUpdate.email,
          oldRole: oldRoleName,
          newRole: newRoleName,
        }).catch(err => console.error('Failed to log edit activity:', err))
      }
      
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Error updating role:', error)
      console.error('Error response:', error.response)
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to update user role'
      toast.error(errorMessage)
    } finally {
      setUpdatingRole(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
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

  const users = usersData?.users || []
  const roles = rolesData?.roles || []

  // Debug logging
  useEffect(() => {
    console.log('Users data:', usersData)
    console.log('Roles data:', rolesData)
    console.log('Users array:', users)
    console.log('Loading:', usersLoading)
    console.log('Error:', usersError)
  }, [usersData, rolesData, users, usersLoading, usersError])

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
            onClick={() => setShowAddModal(true)}
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
                        {editingUser?.id === userItem.id ? (
                          <select
                            value={editingUser.role_id}
                            onChange={(e) =>
                              setEditingUser({
                                ...editingUser,
                                role_id: parseInt(e.target.value),
                              })
                            }
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                            disabled={updatingRole}
                          >
                            {roles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.role_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {userItem.role_name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(userItem.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingUser?.id === userItem.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditRole(userItem.id, editingUser.role_id)}
                              disabled={updatingRole}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              title="Save"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              disabled={updatingRole}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              title="Cancel"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                setEditingUser({
                                  id: userItem.id,
                                  role_id: userItem.role_id,
                                })
                              }
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Role"
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
                        )}
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Add New User</h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setFormData({ name: '', email: '', password: '', role_id: '' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    disabled={rolesLoading}
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.role_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setFormData({ name: '', email: '', password: '', role_id: '' })
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

