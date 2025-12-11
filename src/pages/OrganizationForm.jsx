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

function OrganizationForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    region_id: '',
  })

  // Fetch regions
  const {
    data: regionsData,
    loading: regionsLoading,
    execute: fetchRegions,
  } = useApi(API_ENDPOINTS.REGIONS.LIST, { immediate: false })

  // Fetch organizations (for edit mode)
  const {
    data: organizationsData,
    loading: organizationsLoading,
    execute: fetchOrganizations,
  } = useApi(API_ENDPOINTS.ORGANIZATIONS.LIST, { immediate: false })

  // Mutations
  const { execute: createOrganization } = useMutation(API_ENDPOINTS.ORGANIZATIONS.CREATE)

  const regions = regionsData?.regions || []
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
        toast.error('Access denied. You do not have permission to manage organizations.')
        navigate('/dashboard/organizations')
        return
      }

      // Fetch required data
      fetchRegions()

      // If editing, fetch organization data
      if (isEditMode) {
        fetchOrganizationData()
      }
    } catch (e) {
      console.error('Error parsing user data:', e)
      navigate('/')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, id, isEditMode])

  // Update form data when organizations load
  useEffect(() => {
    if (isEditMode && organizations.length > 0 && !formData.name) {
      const orgToEdit = organizations.find(o => o.id === parseInt(id))
      if (orgToEdit) {
        setFormData({
          name: orgToEdit.name || '',
          region_id: orgToEdit.region_id || '',
        })
      }
    }
  }, [organizations, id, isEditMode, formData.name])

  const fetchOrganizationData = async () => {
    setLoading(true)
    try {
      await fetchOrganizations()
      // Wait for organizations state to update
      setTimeout(() => {
        const orgToEdit = organizations.find(o => o.id === parseInt(id))
        if (orgToEdit) {
          setFormData({
            name: orgToEdit.name || '',
            region_id: orgToEdit.region_id || '',
          })
          setLoading(false)
        } else {
          // Try once more after a short delay
          setTimeout(() => {
            const org = organizations.find(o => o.id === parseInt(id))
            if (org) {
              setFormData({
                name: org.name || '',
                region_id: org.region_id || '',
              })
            } else {
              toast.error('Organization not found')
              navigate('/dashboard/organizations')
            }
            setLoading(false)
          }, 300)
        }
      }, 100)
    } catch (error) {
      console.error('Error fetching organization:', error)
      toast.error('Failed to load organization data')
      navigate('/dashboard/organizations')
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

    if (!formData.name.trim()) {
      toast.error('Organization name is required')
      return
    }

    if (!formData.region_id) {
      toast.error('Please select a region')
      return
    }

    setSaving(true)

    try {
      if (isEditMode) {
        // Update organization
        const updateData = {
          name: formData.name,
          region_id: parseInt(formData.region_id),
        }

        await apiClient.put(API_ENDPOINTS.ORGANIZATIONS.UPDATE(parseInt(id)), updateData)
        toast.success('Organization updated successfully')
        
        const regionName = regions.find(r => r.id === parseInt(formData.region_id))?.name || 'Unknown'
        addActivity('edit', `Updated organization: ${formData.name} in region: ${regionName}`, {
          organizationName: formData.name,
          regionName: regionName,
        }).catch(err => console.error('Failed to log activity:', err))
      } else {
        // Create organization
        const payload = {
          name: formData.name,
          region_id: parseInt(formData.region_id),
        }
        
        await createOrganization(payload)
        toast.success('Organization created successfully')
        
        const regionName = regions.find(r => r.id === parseInt(formData.region_id))?.name || 'Unknown'
        addActivity('create', `Created new organization: ${formData.name} in region: ${regionName}`, {
          organizationName: formData.name,
          regionName: regionName,
        }).catch(err => console.error('Failed to log activity:', err))
      }

      navigate('/dashboard/organizations')
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} organization:`, error)
      
      let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} organization`
      if (error.response?.data) {
        if (error.response.data.errors) {
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
              onClick={() => navigate('/dashboard/organizations')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <FaArrowLeft /> Back to Organizations
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Edit Organization' : 'Create New Organization'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isEditMode 
                ? 'Update organization information'
                : 'Add a new organization to the system'}
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder="Enter organization name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region/State *
                  </label>
                  <select
                    name="region_id"
                    value={formData.region_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
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

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/organizations')}
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
                    : (isEditMode ? 'Update Organization' : 'Create Organization')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default OrganizationForm

