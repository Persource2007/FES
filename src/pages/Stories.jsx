import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  FaFolder,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCheck,
  FaUsers,
  FaLock,
  FaFileAlt,
  FaClock,
  FaBan,
} from 'react-icons/fa'
import { useApi, useMutation } from '../hooks/useApi'
import { API_ENDPOINTS } from '../utils/constants'
import apiClient from '../utils/api'
import Sidebar from '../components/Sidebar'
import LocationSelector from '../components/LocationSelector'
import { addActivity } from '../utils/activity'
import { formatDateTime, formatDateShort } from '../utils/dateFormat'
import { canManageStoryCategories, canPostStories } from '../utils/permissions'

function Stories() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('submit-story') // Default to submit story for all users


  // All authenticated users have access - no permission checks needed



  // Fetch organizations
  const {
    data: organizationsData,
    loading: organizationsLoading,
    error: organizationsError,
    execute: fetchOrganizations,
  } = useApi(API_ENDPOINTS.ORGANIZATIONS.LIST, { immediate: false })

  // Fetch regions for state dropdown
  const {
    data: regionsData,
    loading: regionsLoading,
    error: regionsError,
    execute: fetchRegions,
  } = useApi(API_ENDPOINTS.REGIONS.LIST, { immediate: false })


  const [categories, setCategories] = useState([])
  const organizations = organizationsData?.organizations || []
  const regions = regionsData?.regions || []
  const [writerStories, setWriterStories] = useState([])
  const [approvedStories, setApprovedStories] = useState([])
  const [editingStory, setEditingStory] = useState(null)
  const [deleteStoryConfirm, setDeleteStoryConfirm] = useState(null)
  const [unpublishStoryConfirm, setUnpublishStoryConfirm] = useState(null)
  const [writerStoriesLoading, setWriterStoriesLoading] = useState(false)
  const [approvedStoriesLoading, setApprovedStoriesLoading] = useState(false)
  const isFetchingApprovedStories = useRef(false)
  const [expandedStories, setExpandedStories] = useState(new Set()) // Track expanded stories for read more
  
  // Permission flags (computed from user object)
  const canManage = user ? canManageStoryCategories(user) : false
  // Note: All authenticated users can post stories (permission checks removed temporarily)

  // Writer story submission state (moved to top level to follow Rules of Hooks)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [storyFormData, setStoryFormData] = useState({
    category_id: '',
    title: '',
    subtitle: '',
    photo_url: '',
    quote: '',
    person_name: '',
    person_location: '',
    facilitator_name: '',
    facilitator_organization: '',
    state: '',
    city: '',
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

  // Story submission mutation (moved to top level)
  const { execute: submitStory, loading: submitting } = useMutation(
    API_ENDPOINTS.STORIES.CREATE
  )

  // Check authentication
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
    } catch (e) {
      console.error('Error parsing user data:', e)
      navigate('/')
    }
  }, [navigate])

  const fetchWriterCategories = async () => {
    if (!user) return
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.STORY_CATEGORIES.WRITER_CATEGORIES(user.id)
      )
      if (response.data.success) {
        // Store in local state for writer view
        setCategories(response.data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching writer categories:', error)
      toast.error('Failed to load categories')
    }
  }

  // Fetch reader stories
  const fetchWriterStories = async () => {
    if (!user) return
    setWriterStoriesLoading(true)
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.STORIES.WRITER_STORIES(user.id)
      )
      if (response.data.success) {
        setWriterStories(response.data.stories || [])
      }
    } catch (error) {
      console.error('Error fetching writer stories:', error)
      toast.error('Failed to load your stories')
    } finally {
      setWriterStoriesLoading(false)
    }
  }

  // Fetch all approved stories (for admin/editor)
  const fetchApprovedStories = useCallback(async (force = false) => {
    if (!user?.id) return
    // Prevent duplicate calls if already fetching
    if (isFetchingApprovedStories.current && !force) return
    isFetchingApprovedStories.current = true
    setApprovedStoriesLoading(true)
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.STORIES.ALL_APPROVED_STORIES,
        {
          params: {
            user_id: user.id
          }
        }
      )
      if (response.data.success) {
        setApprovedStories(response.data.stories || [])
      }
    } catch (error) {
      console.error('Error fetching approved stories:', error)
      toast.error('Failed to load approved stories')
    } finally {
      setApprovedStoriesLoading(false)
      isFetchingApprovedStories.current = false
    }
  }, [user?.id])

  // Fetch data on mount - All authenticated users can access story features
  useEffect(() => {
    if (user?.id) {
      // Always fetch categories and regions for story submission
      fetchWriterCategories() // This fetches categories accessible to the user
      fetchWriterStories() // Fetch user's own stories
      fetchRegions() // Needed for location selector
      
      // If user can manage stories, fetch admin data
      if (canManage) {
        fetchOrganizations()
        fetchApprovedStories()
      }
    }
    // fetchApprovedStories is stable via useCallback, so we don't need it in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, canManage])





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


  // Story submission handlers (moved to top level)
  const handleStoryInputChange = (e) => {
    const { name, value } = e.target
    // Handle latitude and longitude as numbers
    if (name === 'latitude' || name === 'longitude') {
      setStoryFormData((prev) => ({
        ...prev,
        [name]: value === '' ? '' : parseFloat(value),
      }))
    } else {
      setStoryFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSubmitStory = async () => {
    if (!storyFormData.category_id || !storyFormData.title || !storyFormData.content.trim() || !storyFormData.state_id) {
      toast.error('Please fill in all required fields (Category, Title, Location, Content)')
      return
    }

    try {
      const response = await submitStory({
        category_id: parseInt(storyFormData.category_id),
        title: storyFormData.title,
        subtitle: storyFormData.subtitle || null,
        photo_url: storyFormData.photo_url || null,
        quote: storyFormData.quote || null,
        person_name: storyFormData.person_name || null,
        person_location: storyFormData.person_location || null,
        facilitator_name: storyFormData.facilitator_name || null,
        facilitator_organization: storyFormData.facilitator_organization || null,
        state: storyFormData.state || null,
        city: storyFormData.city || null,
        state_id: storyFormData.state_id || null,
        state_name: storyFormData.state_name || null,
        district_id: storyFormData.district_id || null,
        district_name: storyFormData.district_name || null,
        sub_district_id: storyFormData.sub_district_id || null,
        sub_district_name: storyFormData.sub_district_name || null,
        block_id: storyFormData.block_id || null,
        block_name: storyFormData.block_name || null,
        panchayat_id: storyFormData.panchayat_id || null,
        panchayat_name: storyFormData.panchayat_name || null,
        village_id: storyFormData.village_id || null,
        village_name: storyFormData.village_name || null,
        latitude: storyFormData.latitude || null,
        longitude: storyFormData.longitude || null,
        content: storyFormData.content,
        user_id: user.id,
      })
      if (response?.success) {
        toast.success('Story submitted successfully! It will be reviewed by an administrator.')
        setStoryFormData({ 
          category_id: '', 
          title: '', 
          subtitle: '',
          photo_url: '',
          quote: '',
          person_name: '',
          person_location: '',
          facilitator_name: '',
          facilitator_organization: '',
          state: '',
          city: '',
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
          content: '' 
        })
        setShowSubmitForm(false)
        setSelectedCategory(null)
        addActivity('create', `Submitted story: ${storyFormData.title}`)
        // Refresh writer stories list if on my-stories tab
        if (activeTab === 'my-stories') {
          fetchWriterStories()
        }
      }
    } catch (error) {
      console.error('Error submitting story:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.category_id?.[0] ||
                          'Failed to submit story'
      toast.error(errorMessage)
    }
  }


  // Story edit form state (for admin)
  const [editStoryForm, setEditStoryForm] = useState({
    title: '',
    subtitle: '',
    photo_url: '',
    quote: '',
    person_name: '',
    person_location: '',
    facilitator_name: '',
    facilitator_organization: '',
    state: '',
    city: '',
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
    category_id: '',
  })

  const handleUpdateStory = async () => {
    if (!editingStory) return
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.STORIES.UPDATE(editingStory.id),
        {
          ...editStoryForm,
          admin_user_id: user.id,
        }
      )
      if (response.data.success) {
        toast.success('Story updated successfully')
        setEditingStory(null)
        setEditStoryForm({ 
          title: '', 
          subtitle: '',
          photo_url: '',
          quote: '',
          person_name: '',
          person_location: '',
          facilitator_name: '',
          facilitator_organization: '',
          state: '',
          city: '',
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
          category_id: '' 
        })
        fetchApprovedStories()
        addActivity('edit', `Updated story: ${editStoryForm.title}`)
      }
    } catch (error) {
      console.error('Error updating story:', error)
      toast.error(error.response?.data?.message || 'Failed to update story')
    }
  }

  const handleDeleteStory = async () => {
    if (!deleteStoryConfirm) return
    try {
      const response = await apiClient.delete(
        API_ENDPOINTS.STORIES.DELETE(deleteStoryConfirm.id),
        {
          data: { admin_user_id: user.id },
        }
      )
      if (response.data.success) {
        toast.success('Story deleted successfully')
        setDeleteStoryConfirm(null)
        fetchApprovedStories()
        addActivity('delete', `Deleted story: ${deleteStoryConfirm.title}`)
      }
    } catch (error) {
      console.error('Error deleting story:', error)
      toast.error(error.response?.data?.message || 'Failed to delete story')
    }
  }

  const handleUnpublishStory = (story) => {
    setUnpublishStoryConfirm(story)
  }

  const handleConfirmUnpublish = async () => {
    if (!unpublishStoryConfirm) return
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.STORIES.UPDATE(unpublishStoryConfirm.id),
        {
          status: 'pending',
          admin_user_id: user.id,
        }
      )
      if (response.data.success) {
        toast.success('Story unpublished successfully')
        setUnpublishStoryConfirm(null)
        fetchApprovedStories()
        addActivity('update', `Unpublished story: ${unpublishStoryConfirm.title}`)
      }
    } catch (error) {
      console.error('Error unpublishing story:', error)
      toast.error(error.response?.data?.message || 'Failed to unpublish story')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
    }
    return badges[status] || badges.draft
  }


  // Note: Story submission is now available to all authenticated users
  // All users see the unified interface with tabs

  // Category management view (for all authenticated users, with tabs based on permissions)
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 transition-all duration-200 ease-in-out">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="pl-14 sm:pl-14 lg:pl-8 pr-4 sm:pr-6 lg:pr-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Stories</h1>
            </div>
          </div>
        </header>

        {/* Tabs - Available to all authenticated users */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex gap-4">
              {/* Submit Story tab - Available to all users */}
              <button
                onClick={() => {
                  setActiveTab('submit-story')
                  if (!categories.length) {
                    fetchWriterCategories()
                  }
                }}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === 'submit-story'
                    ? 'border-slate-700 text-slate-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Submit Story
              </button>
              {/* My Stories tab - Available to all users */}
              <button
                onClick={() => {
                  setActiveTab('my-stories')
                  fetchWriterStories()
                }}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === 'my-stories'
                    ? 'border-slate-700 text-slate-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Stories
              </button>
              {/* Approved Stories tab - Only for users with manage permission */}
              {canManage && (
                <button
                  onClick={() => {
                    setActiveTab('approved-stories')
                    fetchApprovedStories()
                  }}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === 'approved-stories'
                      ? 'border-slate-700 text-slate-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Approved Stories
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Submit Story Tab - Available to all users */}
          {activeTab === 'submit-story' && (
            false && showSubmitForm ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">
                      Submit New Story
                    </h2>
                    <button
                      onClick={() => {
                        setShowSubmitForm(false)
                        setStoryFormData({ 
                          category_id: '', 
                          title: '', 
                          subtitle: '',
                          photo_url: '',
                          quote: '',
                          person_name: '',
                          person_location: '',
                          facilitator_name: '',
                          facilitator_organization: '',
                          state: '',
                          city: '',
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
                          content: '' 
                        })
                        setSelectedCategory(null)
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        name="category_id"
                        value={storyFormData.category_id}
                        onChange={(e) => {
                          const catId = e.target.value
                          setStoryFormData((prev) => ({ ...prev, category_id: catId }))
                          setSelectedCategory(
                            categories.find((cat) => cat.id === parseInt(catId))
                          )
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={storyFormData.title}
                        onChange={handleStoryInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                        placeholder="Enter story title"
                        maxLength={255}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subtitle
                      </label>
                      <input
                        type="text"
                        name="subtitle"
                        value={storyFormData.subtitle}
                        onChange={handleStoryInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                        placeholder="Enter story subtitle (optional)"
                        maxLength={255}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Photo URL
                      </label>
                      <input
                        type="url"
                        name="photo_url"
                        value={storyFormData.photo_url}
                        onChange={handleStoryInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                        placeholder="Enter photo URL (optional)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quote
                      </label>
                      <textarea
                        name="quote"
                        value={storyFormData.quote}
                        onChange={handleStoryInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                        placeholder="Enter quote from the person (optional)"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Person Name
                        </label>
                        <input
                          type="text"
                          name="person_name"
                          value={storyFormData.person_name}
                          onChange={handleStoryInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                          placeholder="Person's name (optional)"
                          maxLength={255}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Person Location
                        </label>
                        <input
                          type="text"
                          name="person_location"
                          value={storyFormData.person_location}
                          onChange={handleStoryInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                          placeholder="Person's location (optional)"
                          maxLength={255}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Facilitator Name
                        </label>
                        <input
                          type="text"
                          name="facilitator_name"
                          value={storyFormData.facilitator_name}
                          onChange={handleStoryInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                          placeholder="Facilitator name (optional)"
                          maxLength={255}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Facilitator Organization
                        </label>
                        <input
                          type="text"
                          name="facilitator_organization"
                          value={storyFormData.facilitator_organization}
                          onChange={handleStoryInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                          placeholder="Facilitator organization (optional)"
                          maxLength={255}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location *
                      </label>
                      <LocationSelector
                        selectedStateId={storyFormData.state_id}
                        selectedDistrictId={storyFormData.district_id}
                        selectedSubDistrictId={storyFormData.sub_district_id}
                        selectedBlockId={storyFormData.block_id}
                        selectedPanchayatId={storyFormData.panchayat_id}
                        selectedVillageId={storyFormData.village_id}
                        onStateChange={(id, name) => {
                          setStoryFormData(prev => ({
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
                          setStoryFormData(prev => ({
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
                          setStoryFormData(prev => ({
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
                          setStoryFormData(prev => ({
                            ...prev,
                            block_id: id,
                            block_name: name,
                          }))
                        }}
                        onPanchayatChange={(id, name) => {
                          setStoryFormData(prev => ({
                            ...prev,
                            panchayat_id: id,
                            panchayat_name: name,
                            village_id: '',
                            village_name: '',
                          }))
                        }}
                        onVillageChange={(id, name) => {
                          setStoryFormData(prev => ({
                            ...prev,
                            village_id: id,
                            village_name: name,
                          }))
                        }}
                      />
                    </div>

                    <div>
                      <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                          <strong>Note:</strong> If you enter latitude and longitude, the map will use these exact coordinates for pinpoint mapping. If left empty, the map will use the state center coordinates.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Latitude
                          </label>
                          <input
                            type="number"
                            name="latitude"
                            value={storyFormData.latitude}
                            onChange={handleStoryInputChange}
                            step="any"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                            placeholder="e.g., 28.6139"
                          />
                          <p className="mt-1 text-xs text-gray-500">Optional: Exact latitude for map pin</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Longitude
                          </label>
                          <input
                            type="number"
                            name="longitude"
                            value={storyFormData.longitude}
                            onChange={handleStoryInputChange}
                            step="any"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                            placeholder="e.g., 77.2090"
                          />
                          <p className="mt-1 text-xs text-gray-500">Optional: Exact longitude for map pin</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Content *
                      </label>
                      <textarea
                        name="content"
                        value={storyFormData.content}
                        onChange={handleStoryInputChange}
                        rows="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                        placeholder="Write your story here..."
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={handleSubmitStory}
                        disabled={submitting || !storyFormData.category_id || !storyFormData.title || !storyFormData.content.trim() || !storyFormData.state_id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaCheck />
                        {submitting ? 'Submitting...' : 'Submit for Review'}
                      </button>
                      <button
                        onClick={() => {
                          setShowSubmitForm(false)
                          setStoryFormData({ 
                            category_id: '', 
                            title: '', 
                            subtitle: '',
                            photo_url: '',
                            quote: '',
                            person_name: '',
                            person_location: '',
                            facilitator_name: '',
                            facilitator_organization: '',
                            state: '',
                            city: '',
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
                            description: '',
                            content: '' 
                          })
                          setSelectedCategory(null)
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Available Categories
                  </h2>
                  {categories.length === 0 ? (
                    <p className="text-gray-500">
                      No categories available. Contact your administrator.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <FaFolder className="text-slate-600" />
                            <h3 className="font-semibold text-gray-800">
                              {category.name}
                            </h3>
                          </div>
                          {category.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {category.description}
                            </p>
                          )}
                          <button
                            onClick={() => {
                              setSelectedCategory(category)
                              setStoryFormData((prev) => ({
                                ...prev,
                                category_id: category.id,
                              }))
                              navigate('/dashboard/stories/new')
                            }}
                            className="text-sm text-slate-600 hover:text-slate-800 font-medium"
                          >
                            Post Story →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
          )}

          {/* My Stories Tab - Available to all users */}
          {activeTab === 'my-stories' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                My Stories
              </h2>
              {writerStoriesLoading ? (
                <p className="text-gray-500">Loading your stories...</p>
              ) : writerStories.length === 0 ? (
                <p className="text-gray-500">You haven't submitted any stories yet.</p>
              ) : (
                <div className="space-y-4">
                  {writerStories.map((story) => (
                    <div
                      key={story.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {story.title}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(
                                story.status
                              )}`}
                            >
                              {story.status.charAt(0).toUpperCase() + story.status.slice(1)}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <FaFolder className="text-gray-400" />
                              <span>{story.category_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaClock className="text-gray-400" />
                              <span>Submitted {formatDateTime(story.created_at)}</span>
                            </div>
                            {story.published_at && (
                              <div className="flex items-center gap-1">
                                <FaCheck className="text-gray-400" />
                                <span>Published {formatDateTime(story.published_at)}</span>
                              </div>
                            )}
                          </div>
                          {story.rejection_reason && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                              <strong>Rejection Reason:</strong> {story.rejection_reason}
                            </div>
                          )}
                          <p className="text-gray-700 mt-2 line-clamp-3">
                            {story.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Approved Stories Tab - Only for users with manage permission */}
          {activeTab === 'approved-stories' && canManage && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {approvedStoriesLoading ? (
                <div className="p-8 text-center text-gray-500">
                  Loading approved stories...
                </div>
              ) : approvedStories.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No approved stories found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Author
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Published
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {approvedStories.map((story) => (
                        <tr key={story.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {story.title}
                            </div>
                            {story.subtitle && (
                              <div className="text-xs text-gray-500 mt-1">
                                {story.subtitle}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {story.author_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {story.category_name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500">
                              {[story.village_name, story.panchayat_name, story.block_name, story.district_name, story.state_name].filter(Boolean).join(', ') || <span className="text-gray-400">—</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {story.published_at ? (
                              <div className="text-sm text-gray-900">
                                <div>{formatDateShort(story.published_at)}</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {new Date(story.published_at).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: 'Asia/Kolkata',
                                  })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => navigate(`/dashboard/stories/${story.id}/edit`)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit Story"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleUnpublishStory(story)}
                                className="text-orange-600 hover:text-orange-900"
                                title="Unpublish Story"
                              >
                                <FaBan />
                              </button>
                              <button
                                onClick={() => setDeleteStoryConfirm(story)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Story"
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
          )}
        </div>
      </main>

      {/* Edit Story Modal - Removed: Now using StoryForm page */}
      {false && editingStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Edit Story</h2>
                <button
                  onClick={() => {
                    setEditingStory(null)
                    setEditStoryForm({ 
          title: '', 
          subtitle: '',
          photo_url: '',
          quote: '',
          person_name: '',
          person_location: '',
          facilitator_name: '',
          facilitator_organization: '',
          state: '',
          city: '',
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
          category_id: '' 
        })
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={editStoryForm.title}
                    onChange={(e) =>
                      setEditStoryForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                    placeholder="Story title"
                    maxLength={255}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={editStoryForm.category_id}
                    onChange={(e) =>
                      setEditStoryForm((prev) => ({
                        ...prev,
                        category_id: parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={editStoryForm.subtitle}
                    onChange={(e) =>
                      setEditStoryForm((prev) => ({ ...prev, subtitle: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                    placeholder="Story subtitle (optional)"
                    maxLength={255}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo URL
                  </label>
                  <input
                    type="url"
                    value={editStoryForm.photo_url}
                    onChange={(e) =>
                      setEditStoryForm((prev) => ({ ...prev, photo_url: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                    placeholder="Photo URL (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quote
                  </label>
                  <textarea
                    value={editStoryForm.quote}
                    onChange={(e) =>
                      setEditStoryForm((prev) => ({ ...prev, quote: e.target.value }))
                    }
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                    placeholder="Quote from the person (optional)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Person Name
                    </label>
                    <input
                      type="text"
                      value={editStoryForm.person_name}
                      onChange={(e) =>
                        setEditStoryForm((prev) => ({ ...prev, person_name: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                      placeholder="Person's name (optional)"
                      maxLength={255}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Person Location
                    </label>
                    <input
                      type="text"
                      value={editStoryForm.person_location}
                      onChange={(e) =>
                        setEditStoryForm((prev) => ({ ...prev, person_location: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                      placeholder="Person's location (optional)"
                      maxLength={255}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Facilitator Name
                    </label>
                    <input
                      type="text"
                      value={editStoryForm.facilitator_name}
                      onChange={(e) =>
                        setEditStoryForm((prev) => ({ ...prev, facilitator_name: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                      placeholder="Facilitator name (optional)"
                      maxLength={255}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Facilitator Organization
                    </label>
                    <input
                      type="text"
                      value={editStoryForm.facilitator_organization}
                      onChange={(e) =>
                        setEditStoryForm((prev) => ({ ...prev, facilitator_organization: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                      placeholder="Facilitator organization (optional)"
                      maxLength={255}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <LocationSelector
                    selectedStateId={editStoryForm.state_id}
                    selectedDistrictId={editStoryForm.district_id}
                    selectedSubDistrictId={editStoryForm.sub_district_id}
                    selectedBlockId={editStoryForm.block_id}
                    selectedPanchayatId={editStoryForm.panchayat_id}
                    selectedVillageId={editStoryForm.village_id}
                    onStateChange={(id, name) => {
                      setEditStoryForm(prev => ({
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
                      setEditStoryForm(prev => ({
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
                      setEditStoryForm(prev => ({
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
                      setEditStoryForm(prev => ({
                        ...prev,
                        block_id: id,
                        block_name: name,
                      }))
                    }}
                    onPanchayatChange={(id, name) => {
                      setEditStoryForm(prev => ({
                        ...prev,
                        panchayat_id: id,
                        panchayat_name: name,
                        village_id: '',
                        village_name: '',
                      }))
                    }}
                    onVillageChange={(id, name) => {
                      setEditStoryForm(prev => ({
                        ...prev,
                        village_id: id,
                        village_name: name,
                      }))
                    }}
                  />
                </div>
                <div>
                  <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> If you enter latitude and longitude, the map will use these exact coordinates for pinpoint mapping. If left empty, the map will use the state center coordinates.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        value={editStoryForm.latitude}
                        onChange={(e) =>
                          setEditStoryForm((prev) => ({ ...prev, latitude: e.target.value }))
                        }
                        step="any"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                        placeholder="e.g., 28.6139"
                      />
                      <p className="mt-1 text-xs text-gray-500">Optional: Exact latitude for map pin</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        value={editStoryForm.longitude}
                        onChange={(e) =>
                          setEditStoryForm((prev) => ({ ...prev, longitude: e.target.value }))
                        }
                        step="any"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                        placeholder="e.g., 77.2090"
                      />
                      <p className="mt-1 text-xs text-gray-500">Optional: Exact longitude for map pin</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content *
                  </label>
                  <textarea
                    value={editStoryForm.content}
                    onChange={(e) =>
                      setEditStoryForm((prev) => ({ ...prev, content: e.target.value }))
                    }
                    rows="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                    placeholder="Story content"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleUpdateStory}
                  disabled={!editStoryForm.title.trim() || !editStoryForm.content.trim() || !editStoryForm.category_id || !editStoryForm.state_id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaCheck />
                  Update Story
                </button>
                <button
                  onClick={() => {
                    setEditingStory(null)
                    setEditStoryForm({ 
          title: '', 
          subtitle: '',
          photo_url: '',
          quote: '',
          person_name: '',
          person_location: '',
          facilitator_name: '',
          facilitator_organization: '',
          state: '',
          city: '',
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
          content: '', 
          category_id: '' 
        })
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Story Confirmation Modal */}
      {deleteStoryConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Delete Story
              </h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{deleteStoryConfirm.title}"? This
                action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteStory}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteStoryConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unpublish Story Confirmation Modal */}
      {unpublishStoryConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Unpublish Story
              </h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to unpublish "{unpublishStoryConfirm.title}"? The story will be moved back to pending status for review.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmUnpublish}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Unpublish
                </button>
                <button
                  onClick={() => setUnpublishStoryConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}

export default Stories

