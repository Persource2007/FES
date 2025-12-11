import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FaArrowLeft, FaSave } from 'react-icons/fa'
import { useApi, useMutation } from '../hooks/useApi'
import { API_ENDPOINTS } from '../utils/constants'
import apiClient from '../utils/api'
import Sidebar from '../components/Sidebar'
import { addActivity } from '../utils/activity'
import { canManageUsers } from '../utils/permissions'

function UserForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
    organization_id: '',
  })

  // Fetch roles
  const {
    data: rolesData,
    loading: rolesLoading,
    execute: fetchRoles,
  } = useApi(API_ENDPOINTS.USERS.ROLES, { immediate: false })

  // Fetch organizations
  const {
    data: organizationsData,
    loading: organizationsLoading,
    execute: fetchOrganizations,
  } = useApi(API_ENDPOINTS.ORGANIZATIONS.LIST, { immediate: false })

  // Mutations
  const { execute: createUser } = useMutation(API_ENDPOINTS.USERS.CREATE)

  const roles = rolesData?.roles || []
  const organizations = organizationsData?.organizations || []

  // Check authentication and permissions
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

      if (!canManageUsers(parsedUser)) {
        toast.error('Access denied. You do not have permission to manage users.')
        navigate('/dashboard/users')
        return
      }

      // Fetch required data
      fetchRoles()
      fetchOrganizations()

      // If editing, fetch user data
      if (isEditMode) {
        fetchUserData()
      }
    } catch (e) {
      console.error('Error parsing user data:', e)
      navigate('/')
    }
  }, [navigate, id, isEditMode])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get(API_ENDPOINTS.USERS.LIST)
      const userToEdit = response.data.users?.find(u => u.id === parseInt(id))
      
      if (userToEdit) {
        setFormData({
          name: userToEdit.name || '',
          email: userToEdit.email || '',
          password: '',
          role_id: userToEdit.role_id || '',
          organization_id: userToEdit.organization_id || '',
        })
      } else {
        toast.error('User not found')
        navigate('/dashboard/users')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      toast.error('Failed to load user data')
      navigate('/dashboard/users')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate that role_id is selected
    if (!formData.role_id || formData.role_id === '' || formData.role_id === null) {
      toast.error('Please select a role for the user')
      return
    }

    // Validate role_id is a valid integer
    const roleId = parseInt(formData.role_id)
    if (isNaN(roleId) || roleId <= 0) {
      toast.error('Please select a valid role')
      return
    }

    // Validate that organization_id is selected
    if (!formData.organization_id || formData.organization_id === '' || formData.organization_id === null) {
      toast.error('Please select an organization for the user')
      return
    }

    // Validate organization_id is a valid integer
    const organizationId = parseInt(formData.organization_id)
    if (isNaN(organizationId) || organizationId <= 0) {
      toast.error('Please select a valid organization')
      return
    }

    // For edit mode, password is optional
    if (!isEditMode && !formData.password) {
      toast.error('Password is required for new users')
      return
    }

    setSaving(true)

    try {
      if (isEditMode) {
        // Update user
        const updateData = {
          name: formData.name,
          email: formData.email,
          role_id: formData.role_id,
          organization_id: formData.organization_id,
        }
        
        // Only include password if provided
        if (formData.password) {
          updateData.password = formData.password
        }

        await apiClient({
          method: 'PUT',
          url: API_ENDPOINTS.USERS.UPDATE_ROLE(parseInt(id)),
          data: updateData,
        })
        toast.success('User updated successfully')
        
        const roleName = roles.find(r => r.id === roleId)?.role_name || 'Unknown'
        const orgName = organizations.find(o => o.id === parseInt(formData.organization_id))?.name || 'Unknown'
        addActivity('edit', `Updated user: ${formData.name} (${formData.email})`, {
          userEmail: formData.email,
          userName: formData.name,
          roleName: roleName,
          organizationName: orgName,
        }).catch(err => console.error('Failed to log activity:', err))
      } else {
        // Create user
        await createUser(formData)
        toast.success('User created successfully')
        
        const roleName = roles.find(r => r.id === roleId)?.role_name || 'Unknown'
        const orgName = organizations.find(o => o.id === parseInt(formData.organization_id))?.name || 'Unknown'
        addActivity('create', `Created new user: ${formData.name} (${formData.email}) with role: ${roleName} in organization: ${orgName}`, {
          userEmail: formData.email,
          userName: formData.name,
          roleName: roleName,
          organizationName: orgName,
        }).catch(err => console.error('Failed to log activity:', err))
      }

      navigate('/dashboard/users')
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        `Failed to ${isEditMode ? 'update' : 'create'} user`
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/dashboard/users')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <FaArrowLeft /> Back to Users
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Edit User' : 'Create New User'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isEditMode 
                ? 'Update user information and permissions'
                : 'Add a new user to the system'}
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder="Enter user name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password {isEditMode ? '(leave blank to keep current)' : '*'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!isEditMode}
                    minLength={isEditMode ? 0 : 1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder={isEditMode ? "Enter new password (optional)" : "Enter password"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization *
                  </label>
                  <select
                    name="organization_id"
                    value={formData.organization_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    disabled={organizationsLoading}
                  >
                    <option value="">Select an organization</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} {org.region_name ? `(${org.region_name})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-sm text-gray-500">
                    Users will automatically get access to categories assigned to their organization's region. Region will be set automatically from the organization.
                  </p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/users')}
                  className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <FaSave />
                  {saving
                    ? (isEditMode ? 'Updating...' : 'Creating...')
                    : (isEditMode ? 'Update User' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default UserForm

