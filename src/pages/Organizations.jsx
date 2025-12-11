import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  FaBuilding,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
} from 'react-icons/fa'
import { useApi, useMutation } from '../hooks/useApi'
import { API_ENDPOINTS } from '../utils/constants'
import apiClient from '../utils/api'
import Sidebar from '../components/Sidebar'
import { addActivity } from '../utils/activity'
import { canManageUsers } from '../utils/permissions'
import { formatDateSimple } from '../utils/dateFormat'

function Organizations() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingOrganization, setEditingOrganization] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [updatingOrganization, setUpdatingOrganization] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    region_id: '',
  })

  // Fetch organizations
  const {
    data: organizationsData,
    loading: organizationsLoading,
    error: organizationsError,
    execute: fetchOrganizations,
  } = useApi(API_ENDPOINTS.ORGANIZATIONS.LIST, { immediate: false })

  // Fetch regions
  const {
    data: regionsData,
    loading: regionsLoading,
    error: regionsError,
    execute: fetchRegions,
  } = useApi(API_ENDPOINTS.REGIONS.LIST, { immediate: false })

  // Mutations
  const { execute: createOrganization, loading: creating } = useMutation(
    API_ENDPOINTS.ORGANIZATIONS.CREATE
  )

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

      // Check if user can manage users (super admin)
      if (!canManageUsers(parsedUser)) {
        if (!parsedUser.permissions || !Array.isArray(parsedUser.permissions)) {
          toast.error('Permissions not loaded. Please log out and log back in, or run the permissions SQL script.')
        } else {
          toast.error('Access denied. You do not have permission to manage organizations.')
        }
        navigate('/dashboard')
        return
      }
      } catch (e) {
        console.error('Error parsing user data:', e)
        navigate('/')
      }
  }, [navigate])

  // Fetch data on mount
  useEffect(() => {
    if (canManageUsers(user)) {
      fetchOrganizations().catch((err) => {
        console.error('Error fetching organizations:', err)
        console.error('Error response:', err.response)
        
        let errorMessage = 'Failed to load organizations'
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message
        } else if (err.message) {
          errorMessage = err.message
        }
        
        toast.error(errorMessage)
      })
      fetchRegions().catch((err) => {
        console.error('Error fetching regions:', err)
        console.error('Error response:', err.response)
        
        let errorMessage = 'Failed to load regions'
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message
        } else if (err.message) {
          errorMessage = err.message
        }
        
        toast.error(errorMessage)
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

  const handleAddOrganization = async (e) => {
    e.preventDefault()
    try {
      // Ensure region_id is an integer
      const payload = {
        name: formData.name,
        region_id: parseInt(formData.region_id),
      }
      
      await createOrganization(payload)
      toast.success('Organization created successfully')
      
      // Log activity
      const regionName = regions.find(r => r.id === parseInt(formData.region_id))?.name || 'Unknown'
      addActivity('create', `Created new organization: ${formData.name} in region: ${regionName}`, {
        organizationName: formData.name,
        regionName: regionName,
      }).catch(err => console.error('Failed to log create activity:', err))
      
      setShowAddModal(false)
      setFormData({ name: '', region_id: '' })
      fetchOrganizations()
    } catch (error) {
      console.error('Error creating organization:', error)
      console.error('Error response:', error.response)
      
      // Show more detailed error message
      let errorMessage = 'Failed to create organization'
      if (error.response?.data) {
        if (error.response.data.errors) {
          // Validation errors
          const errorDetails = Object.entries(error.response.data.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ')
          errorMessage = `Validation failed: ${errorDetails}`
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    }
  }

  const handleEditOrganization = (organization) => {
    setEditingOrganization(organization)
    setFormData({
      name: organization.name,
      region_id: organization.region_id || '',
    })
    setShowAddModal(true)
  }

  const handleToggleOrganizationStatus = async (organizationId, currentStatus) => {
    setTogglingStatus(organizationId)
    
    // Optimistically update the UI
    const organization = organizations.find(o => o.id === organizationId)
    const originalStatus = organization?.is_active
    const newStatus = !currentStatus
    
    // Update local state immediately
    setOrganizations(prevOrgs =>
      prevOrgs.map(o =>
        o.id === organizationId ? { ...o, is_active: newStatus } : o
      )
    )

    try {
      const response = await apiClient.patch(
        API_ENDPOINTS.ORGANIZATIONS.TOGGLE_STATUS(organizationId)
      )
      if (response.data.success) {
        toast.success(`Organization ${newStatus ? 'activated' : 'deactivated'} successfully`)
        fetchOrganizations() // Refresh to get server state
        if (organization) {
          addActivity('edit', `${newStatus ? 'Activated' : 'Deactivated'} organization: ${organization.name}`)
        }
      } else {
        // Revert on failure
        setOrganizations(prevOrgs =>
          prevOrgs.map(o =>
            o.id === organizationId ? { ...o, is_active: originalStatus } : o
          )
        )
      }
    } catch (error) {
      console.error('Error toggling organization status:', error)
      // Revert on error
      setOrganizations(prevOrgs =>
        prevOrgs.map(o =>
          o.id === organizationId ? { ...o, is_active: originalStatus } : o
        )
      )
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to update organization status'
      toast.error(errorMessage)
    } finally {
      setTogglingStatus(null)
    }
  }

  const handleUpdateOrganization = async (e) => {
    e.preventDefault()
    if (!editingOrganization) return

    setUpdatingOrganization(true)
    try {
      // Get organization info before update for activity log
      const organizationToUpdate = organizations.find(o => o.id === editingOrganization.id)
      const oldRegionName = organizationToUpdate?.region_name || 'None'
      const newRegionName = regions.find(r => r.id === parseInt(formData.region_id))?.name || 'None'

      // Ensure region_id is an integer
      const payload = {
        name: formData.name,
        region_id: parseInt(formData.region_id),
      }
      
      // Use apiClient directly for dynamic URL
      const response = await apiClient({
        method: 'PUT',
        url: API_ENDPOINTS.ORGANIZATIONS.UPDATE(editingOrganization.id),
        data: payload,
      })

      console.log('Organization update response:', response.data)

      toast.success('Organization updated successfully')

      // Log activity
      if (organizationToUpdate) {
        const changes = []
        if (oldRegionName !== newRegionName) {
          changes.push(`Region: ${oldRegionName} → ${newRegionName}`)
        }
        if (organizationToUpdate.name !== formData.name) {
          changes.push(`Name: ${organizationToUpdate.name} → ${formData.name}`)
        }
        addActivity('edit', `Updated organization ${organizationToUpdate.name}: ${changes.join(', ')}`, {
          organizationId: editingOrganization.id,
          organizationName: formData.name,
          oldRegion: oldRegionName,
          newRegion: newRegionName,
        }).catch(err => console.error('Failed to log edit activity:', err))
      }

      setEditingOrganization(null)
      setShowAddModal(false)
      setFormData({ name: '', region_id: '' })
      fetchOrganizations()
    } catch (error) {
      console.error('Error updating organization:', error)
      console.error('Error response:', error.response)
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to update organization'
      toast.error(errorMessage)
    } finally {
      setUpdatingOrganization(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  }

  const handleDeleteOrganization = async () => {
    if (!deleteConfirm) return

    try {
      console.log('Deleting organization:', deleteConfirm.id)
      
      // Store organization info for activity log before deletion
      const deletedOrganization = { ...deleteConfirm }
      
      // Use apiClient directly for dynamic URL
      const response = await apiClient({
        method: 'DELETE',
        url: API_ENDPOINTS.ORGANIZATIONS.DELETE(deleteConfirm.id),
      })
      
      console.log('Delete response:', response.data)
      
      toast.success('Organization deleted successfully')
      
      // Log activity
      addActivity('delete', `Deleted organization: ${deletedOrganization.name}`, {
        organizationId: deletedOrganization.id,
        organizationName: deletedOrganization.name,
        regionName: deletedOrganization.region_name,
      }).catch(err => console.error('Failed to log delete activity:', err))
      
      setDeleteConfirm(null)
      fetchOrganizations()
    } catch (error) {
      console.error('Error deleting organization:', error)
      console.error('Error response:', error.response)
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to delete organization'
      toast.error(errorMessage)
    }
  }

  const [organizations, setOrganizations] = useState([])
  const regions = regionsData?.regions || []

  // Update organizations when data changes
  useEffect(() => {
    if (organizationsData?.organizations) {
      setOrganizations(organizationsData.organizations)
    }
  }, [organizationsData])

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
              <FaBuilding className="text-2xl text-slate-700" />
              <h1 className="text-2xl font-bold text-gray-900">Organization Management</h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Add Organization Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <FaPlus /> Add New Organization
            </button>
          </div>

          {/* Organizations Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {organizationsError && (
              <div className="p-8 text-center text-red-500">
                Error loading organizations: {organizationsError}
              </div>
            )}
            {organizationsLoading ? (
              <div className="p-8 text-center text-gray-500">Loading organizations...</div>
            ) : organizationsError ? null : organizations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No organizations found. Click "Add New Organization" to create one.
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
                        Region/State
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
                    {organizations.map((organization) => (
                      <tr key={organization.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {organization.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {organization.region_name ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {organization.region_name}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={organization.is_active !== false}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleToggleOrganizationStatus(organization.id, organization.is_active !== false)
                              }}
                              disabled={togglingStatus === organization.id}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 bg-red-600 peer-disabled:opacity-50"></div>
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateSimple(organization.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditOrganization(organization)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Organization"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(organization)}
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

      {/* Add/Edit Organization Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingOrganization ? 'Edit Organization' : 'Add New Organization'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingOrganization(null)
                  setFormData({ name: '', region_id: '' })
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={editingOrganization ? handleUpdateOrganization : handleAddOrganization} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name
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
                    Region/State
                  </label>
                  <select
                    name="region_id"
                    value={formData.region_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    disabled={regionsLoading}
                  >
                    <option value="">Select a region</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
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
                    setEditingOrganization(null)
                    setFormData({ name: '', region_id: '' })
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || updatingOrganization}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {editingOrganization
                    ? updatingOrganization
                      ? 'Updating...'
                      : 'Update Organization'
                    : creating
                    ? 'Creating...'
                    : 'Create Organization'}
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
              <h2 className="text-xl font-semibold text-gray-900">Delete Organization</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700">
                Are you sure you want to delete{' '}
                <span className="font-semibold">{deleteConfirm.name}</span>?
                {deleteConfirm.region_name && (
                  <> This organization is in {deleteConfirm.region_name}.</>
                )}
                {' '}This action cannot be undone.
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
                onClick={handleDeleteOrganization}
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

export default Organizations

