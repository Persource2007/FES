import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FaArrowLeft, FaSave } from 'react-icons/fa'
import { useApi, useMutation } from '../hooks/useApi'
import { API_ENDPOINTS } from '../utils/constants'
import apiClient from '../utils/api'
import Sidebar from '../components/Sidebar'
import LocationSelector from '../components/LocationSelector'
import { addActivity } from '../utils/activity'
import { logoutOAuth } from '../utils/oauthLogin'

function StoryForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    subtitle: '',
    photo_url: '',
    quote: '',
    person_name: '',
    person_location: '',
    facilitator_name: '',
    facilitator_organization: '',
    state_id: '',
    state_name: '',
    district_id: '',
    district_name: '',
    sub_district_id: '',
    sub_district_name: '',
    block_id: '',
    block_name: '',
    panchayat_id: '',
    panchayat_name: '',
    village_id: '',
    village_name: '',
    latitude: '',
    longitude: '',
    content: '',
  })

  // Fetch categories
  const {
    data: categoriesData,
    loading: categoriesLoading,
    execute: fetchCategories,
  } = useApi(API_ENDPOINTS.STORY_CATEGORIES.LIST, { immediate: false })

  // Mutations
  const { execute: createStory } = useMutation(API_ENDPOINTS.STORIES.CREATE)

  const categories = categoriesData?.categories || []

  // Check authentication
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

      // Fetch required data
      fetchCategories()

      // If editing, fetch story data
      if (isEditMode) {
        fetchStoryData()
      }
    } catch (e) {
      console.error('Error parsing user data:', e)
      navigate('/')
    }
  }, [navigate, id, isEditMode])


  const fetchStoryData = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get(API_ENDPOINTS.STORIES.ALL_APPROVED_STORIES, {
        params: {
          user_id: user?.id
        }
      })
      const storyToEdit = response.data.stories?.find(s => s.id === parseInt(id))
      
      if (storyToEdit) {
        // Helper function to safely get value (handle null, undefined, empty string)
        const getValue = (val) => {
          if (val === null || val === undefined || val === '') {
            return ''
          }
          return String(val).trim()
        }
        
        setFormData({
          category_id: getValue(storyToEdit.category_id),
          title: getValue(storyToEdit.title),
          subtitle: getValue(storyToEdit.subtitle),
          photo_url: getValue(storyToEdit.photo_url),
          quote: getValue(storyToEdit.quote),
          person_name: getValue(storyToEdit.person_name),
          person_location: getValue(storyToEdit.person_location),
          facilitator_name: getValue(storyToEdit.facilitator_name),
          facilitator_organization: getValue(storyToEdit.facilitator_organization),
          state_id: getValue(storyToEdit.state_id),
          state_name: getValue(storyToEdit.state_name),
          district_id: getValue(storyToEdit.district_id),
          district_name: getValue(storyToEdit.district_name),
          sub_district_id: getValue(storyToEdit.sub_district_id),
          sub_district_name: getValue(storyToEdit.sub_district_name),
          block_id: getValue(storyToEdit.block_id),
          block_name: getValue(storyToEdit.block_name),
          panchayat_id: getValue(storyToEdit.panchayat_id),
          panchayat_name: getValue(storyToEdit.panchayat_name),
          village_id: getValue(storyToEdit.village_id),
          village_name: getValue(storyToEdit.village_name),
          latitude: storyToEdit.latitude !== null && storyToEdit.latitude !== undefined ? String(storyToEdit.latitude) : '',
          longitude: storyToEdit.longitude !== null && storyToEdit.longitude !== undefined ? String(storyToEdit.longitude) : '',
          content: getValue(storyToEdit.content),
        })
      } else {
        toast.error('Story not found')
        navigate('/dashboard/stories')
      }
    } catch (error) {
      console.error('Error fetching story:', error)
      toast.error('Failed to load story data')
      navigate('/dashboard/stories')
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

    // Validate required fields - only state is mandatory
    if (!formData.state_id) {
      toast.error('Please select a state')
      return
    }

    setSaving(true)

    try {
      if (isEditMode) {
        // Update story
        const updateData = {
          ...formData,
          category_id: parseInt(formData.category_id),
          admin_user_id: user.id,
        }

        await apiClient.put(
          API_ENDPOINTS.STORIES.UPDATE(parseInt(id)),
          updateData
        )
        toast.success('Story updated successfully')
        addActivity('edit', `Updated story: ${formData.title}`)
      } else {
        // Create story
        const createData = {
          category_id: parseInt(formData.category_id),
          title: formData.title,
          subtitle: formData.subtitle || null,
          photo_url: formData.photo_url || null,
          quote: formData.quote || null,
          person_name: formData.person_name || null,
          person_location: formData.person_location || null,
          facilitator_name: formData.facilitator_name || null,
          facilitator_organization: formData.facilitator_organization || null,
          state_id: formData.state_id || null,
          state_name: formData.state_name || null,
          district_id: formData.district_id || null,
          district_name: formData.district_name || null,
          sub_district_id: formData.sub_district_id || null,
          sub_district_name: formData.sub_district_name || null,
          block_id: formData.block_id || null,
          block_name: formData.block_name || null,
          panchayat_id: formData.panchayat_id || null,
          panchayat_name: formData.panchayat_name || null,
          village_id: formData.village_id || null,
          village_name: formData.village_name || null,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          content: formData.content,
          user_id: user.id,
        }

        await createStory(createData)
        toast.success('Story submitted successfully! It will be reviewed by an administrator.')
        addActivity('create', `Submitted story: ${formData.title}`)
      }

      navigate('/dashboard/stories')
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        `Failed to ${isEditMode ? 'update' : 'create'} story`
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logoutOAuth()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      window.location.href = '/'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar user={user} onLogout={handleLogout} />
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
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <button
              onClick={() => navigate('/dashboard/stories')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <FaArrowLeft /> Back to Stories
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Story' : 'Create New Story'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isEditMode 
                ? 'Update story information and details'
                : 'Fill in the details to create a new story'}
            </p>
          </div>
        </header>

        {/* Form Content */}
        <div className="px-6 py-8">
          <div className="max-w-5xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-8 space-y-8">
                {/* Basic Information Section */}
                <div className="border-b border-gray-200 pb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                        disabled={categoriesLoading}
                      >
                        <option value="">Select a category</option>
                        {categories
                          .filter((cat) => cat.is_active)
                          .map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Photo URL
                      </label>
                      <input
                        type="url"
                        name="photo_url"
                        value={formData.photo_url}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      maxLength={255}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                      placeholder="Enter story title"
                    />
                  </div>
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      name="subtitle"
                      value={formData.subtitle}
                      onChange={handleInputChange}
                      maxLength={255}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                      placeholder="Enter story subtitle (optional)"
                    />
                  </div>
                </div>

                {/* Quote Section */}
                <div className="border-b border-gray-200 pb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Quote</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quote from Person
                    </label>
                    <textarea
                      name="quote"
                      value={formData.quote}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors resize-none"
                      placeholder="Enter quote from the person (optional)"
                    />
                  </div>
                </div>

                {/* Person Information Section */}
                <div className="border-b border-gray-200 pb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Person Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Person Name
                      </label>
                      <input
                        type="text"
                        name="person_name"
                        value={formData.person_name}
                        onChange={handleInputChange}
                        maxLength={255}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                        placeholder="Enter person's name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Person Location
                      </label>
                      <input
                        type="text"
                        name="person_location"
                        value={formData.person_location}
                        onChange={handleInputChange}
                        maxLength={255}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                        placeholder="Enter person's location"
                      />
                    </div>
                  </div>
                </div>

                {/* Facilitator Information Section */}
                <div className="border-b border-gray-200 pb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Facilitator Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Facilitator Name
                      </label>
                      <input
                        type="text"
                        name="facilitator_name"
                        value={formData.facilitator_name}
                        onChange={handleInputChange}
                        maxLength={255}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                        placeholder="Enter facilitator name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Facilitator Organization
                      </label>
                      <input
                        type="text"
                        name="facilitator_organization"
                        value={formData.facilitator_organization}
                        onChange={handleInputChange}
                        maxLength={255}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                        placeholder="Enter facilitator organization"
                      />
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div className="border-b border-gray-200 pb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">
                    Location <span className="text-red-500">*</span>
                    <span className="text-sm font-normal text-gray-500 ml-2">(State is required)</span>
                  </h2>
                  <LocationSelector
                  selectedStateId={formData.state_id}
                  selectedDistrictId={formData.district_id}
                  selectedSubDistrictId={formData.sub_district_id}
                  selectedBlockId={formData.block_id}
                  selectedPanchayatId={formData.panchayat_id}
                  selectedVillageId={formData.village_id}
                  preserveDownstreamValues={isEditMode}
                  onStateChange={(id, name) => {
                    setFormData(prev => ({
                      ...prev,
                      state_id: id,
                      state_name: name,
                      district_id: '',
                      district_name: '',
                      sub_district_id: '',
                      sub_district_name: '',
                      block_id: '',
                      block_name: '',
                      panchayat_id: '',
                      panchayat_name: '',
                      village_id: '',
                      village_name: '',
                    }))
                  }}
                  onDistrictChange={(id, name) => {
                    setFormData(prev => ({
                      ...prev,
                      district_id: id,
                      district_name: name,
                      sub_district_id: '',
                      sub_district_name: '',
                      block_id: '',
                      block_name: '',
                      panchayat_id: '',
                      panchayat_name: '',
                      village_id: '',
                      village_name: '',
                    }))
                  }}
                  onSubDistrictChange={(id, name) => {
                    setFormData(prev => ({
                      ...prev,
                      sub_district_id: id,
                      sub_district_name: name,
                      panchayat_id: '',
                      panchayat_name: '',
                      village_id: '',
                      village_name: '',
                    }))
                  }}
                  onBlockChange={(id, name) => {
                    setFormData(prev => ({
                      ...prev,
                      block_id: id,
                      block_name: name,
                    }))
                  }}
                  onPanchayatChange={(id, name) => {
                    setFormData(prev => ({
                      ...prev,
                      panchayat_id: id,
                      panchayat_name: name,
                      village_id: '',
                      village_name: '',
                    }))
                  }}
                  onVillageChange={(id, name) => {
                    setFormData(prev => ({
                      ...prev,
                      village_id: id,
                      village_name: name,
                    }))
                  }}
                />
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> If you enter latitude and longitude, the map will use these exact coordinates for pinpoint mapping. If left empty, the map will use the state center coordinates.
                    </p>
                  </div>
                </div>

                {/* Coordinates Section */}
                <div className="border-b border-gray-200 pb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Coordinates (Optional)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude
                      </label>
                      <input
                        type="number"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleInputChange}
                        step="any"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                        placeholder="e.g., 28.6139"
                      />
                      <p className="mt-1.5 text-xs text-gray-500">Exact latitude for map pin</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude
                      </label>
                      <input
                        type="number"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleInputChange}
                        step="any"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors"
                        placeholder="e.g., 77.2090"
                      />
                      <p className="mt-1.5 text-xs text-gray-500">Exact longitude for map pin</p>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="pb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Story Content</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      rows="12"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors resize-none"
                      placeholder="Write your story content here..."
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/stories')}
                    className="px-6 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                  >
                    <FaSave />
                    {saving
                      ? (isEditMode ? 'Updating...' : 'Creating...')
                      : (isEditMode ? 'Update Story' : 'Create Story')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default StoryForm

