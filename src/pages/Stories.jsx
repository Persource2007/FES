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
} from 'react-icons/fa'
import { useApi, useMutation } from '../hooks/useApi'
import { API_ENDPOINTS } from '../utils/constants'
import apiClient from '../utils/api'
import Sidebar from '../components/Sidebar'
import LocationSelector from '../components/LocationSelector'
import { addActivity } from '../utils/activity'
import { formatDateTime } from '../utils/dateFormat'
import {
  canManageStoryCategories,
  canPostStories,
  canViewStories,
} from '../utils/permissions'

function Stories() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('categories')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    organization_ids: [],
  })


  const canManageCategories = canManageStoryCategories(user)
  const canPost = canPostStories(user)
  const canView = canViewStories(user)

  // Fetch categories with user_id for organization filtering
  const fetchCategories = async () => {
    if (!user?.id) return
    setCategoriesLoading(true)
    try {
      const response = await apiClient.get(API_ENDPOINTS.STORY_CATEGORIES.LIST, {
        params: { user_id: user.id }
      })
      if (response.data.success) {
        setCategories(response.data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setCategoriesLoading(false)
    }
  }


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

  // Mutations
  const { execute: createCategory, loading: creating } = useMutation(
    API_ENDPOINTS.STORY_CATEGORIES.CREATE
  )
  const { execute: updateCategory, loading: updating } = useMutation(
    API_ENDPOINTS.STORY_CATEGORIES.UPDATE(0)
  )

  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const organizations = organizationsData?.organizations || []
  const regions = regionsData?.regions || []
  const [writerStories, setWriterStories] = useState([])
  const [approvedStories, setApprovedStories] = useState([])
  const [editingStory, setEditingStory] = useState(null)
  const [deleteStoryConfirm, setDeleteStoryConfirm] = useState(null)
  const [writerStoriesLoading, setWriterStoriesLoading] = useState(false)
  const [approvedStoriesLoading, setApprovedStoriesLoading] = useState(false)
  const isFetchingApprovedStories = useRef(false)
  const [expandedStories, setExpandedStories] = useState(new Set()) // Track expanded stories for read more

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
    content: '',
  })

  // Story submission mutation (moved to top level)
  const { execute: submitStory, loading: submitting } = useMutation(
    API_ENDPOINTS.STORIES.CREATE
  )

  // Check authentication
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      navigate('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch (e) {
      console.error('Error parsing user data:', e)
      navigate('/login')
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

  // Fetch data on mount
  useEffect(() => {
    if (user?.id) {
      const canManage = canManageStoryCategories(user)
      const canPost = canPostStories(user)
      if (canManage) {
        fetchCategories()
        fetchOrganizations()
        fetchRegions()
        fetchApprovedStories()
      } else if (canPost) {
        // Fetch categories accessible by this writer
        fetchWriterCategories()
        fetchWriterStories()
        fetchRegions()
      }
    }
    // fetchApprovedStories is stable via useCallback, so we don't need it in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Check if user is Editor
  // User object has role.name, not role_name directly
  const isEditor = user?.role?.name === 'Editor' || user?.role_name === 'Editor'
  
  // Debug: Log editor status (remove in production)
  useEffect(() => {
    if (showAddModal) {
      console.log('Modal opened - isEditor:', isEditor, 'user:', user, 'role:', user?.role, 'role.name:', user?.role?.name, 'role_name:', user?.role_name)
    }
  }, [showAddModal, isEditor, user])
  
  // Auto-set organization when creating new category (not editing) for Editors
  useEffect(() => {
    if (isEditor && user?.organization_id && !editingCategory && showAddModal) {
      setFormData(prev => ({
        ...prev,
        organization_ids: [user.organization_id]
      }))
    }
  }, [isEditor, user?.organization_id, editingCategory, showAddModal])


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleAddCategory = async () => {
    try {
      // For Editors, ensure organization_ids includes their organization
      const payload = { ...formData, user_id: user.id }
      if (isEditor && user?.organization_id) {
        payload.organization_ids = [user.organization_id]
      }
      
      const response = await createCategory(payload)
      if (response?.success) {
        toast.success('Category created successfully')
        setShowAddModal(false)
        setFormData({ name: '', description: '', is_active: true, organization_ids: [] })
        fetchCategories()
        addActivity('create', `Created story category: ${formData.name}`)
      }
    } catch (error) {
      console.error('Error creating category:', error)
      console.error('Error response:', error.response)
      console.error('Error data:', error.response?.data)
      
      // Show more detailed error message
      let errorMessage = 'Failed to create category'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.errors) {
        // Show validation errors
        const errors = error.response.data.errors
        const firstError = Object.values(errors)[0]
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    }
  }

  const handleEditCategory = (category) => {
    setEditingCategory(category)
    // Get organization IDs from category.organizations if available
    let organizationIds = category.organizations ? category.organizations.map(o => o.id) : []
    
    // For Editors, force organization to their organization
    if (isEditor && user?.organization_id) {
      organizationIds = [user.organization_id]
    }
    
    // Ensure organizations are loaded when editing
    if (organizations.length === 0 && !organizationsLoading) {
      fetchOrganizations()
    }
    
    setFormData({
      name: category.name,
      description: category.description || '',
      is_active: category.is_active,
      organization_ids: organizationIds,
    })
    setShowAddModal(true)
  }

  const handleToggleCategoryStatus = async (categoryId, newStatus) => {
    // Optimistically update the UI
    const category = categories.find(c => c.id === categoryId)
    const originalStatus = category?.is_active
    
    // Update local state immediately
    setCategories(prevCategories =>
      prevCategories.map(cat =>
        cat.id === categoryId ? { ...cat, is_active: newStatus } : cat
      )
    )

    try {
      const response = await apiClient.patch(
        API_ENDPOINTS.STORY_CATEGORIES.TOGGLE_STATUS(categoryId)
      )
      if (response.data.success) {
        toast.success(`Category ${newStatus ? 'activated' : 'deactivated'} successfully`)
        fetchCategories() // Refresh to get server state
        if (category) {
          addActivity('edit', `${newStatus ? 'Activated' : 'Deactivated'} story category: ${category.name}`)
        }
      } else {
        // Revert on failure
        setCategories(prevCategories =>
          prevCategories.map(cat =>
            cat.id === categoryId ? { ...cat, is_active: originalStatus } : cat
          )
        )
      }
    } catch (error) {
      console.error('Error toggling category status:', error)
      // Revert on error
      setCategories(prevCategories =>
        prevCategories.map(cat =>
          cat.id === categoryId ? { ...cat, is_active: originalStatus } : cat
        )
      )
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to update category status'
      toast.error(errorMessage)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return

    try {
      // For Editors, ensure organization_ids includes their organization
      const payload = { ...formData }
      if (isEditor && user?.organization_id) {
        payload.organization_ids = [user.organization_id]
      }
      payload.user_id = user.id
      
      const response = await apiClient.put(
        API_ENDPOINTS.STORY_CATEGORIES.UPDATE(editingCategory.id),
        payload
      )
      if (response.data.success) {
        toast.success('Category updated successfully')
        setShowAddModal(false)
        setEditingCategory(null)
        setFormData({ name: '', description: '', is_active: true, organization_ids: [] })
        fetchCategories()
        addActivity('edit', `Updated story category: ${formData.name}`)
      }
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error(error.response?.data?.message || 'Failed to update category')
    }
  }

  const handleDeleteCategory = async () => {
    if (!deleteConfirm) return

    try {
      const response = await apiClient.delete(
        API_ENDPOINTS.STORY_CATEGORIES.DELETE(deleteConfirm.id)
      )
      if (response.data.success) {
        toast.success('Category deleted successfully')
        setDeleteConfirm(null)
        fetchCategories()
        addActivity('delete', `Deleted story category: ${deleteConfirm.name}`)
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error(error.response?.data?.message || 'Failed to delete category')
    }
  }


  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  }


  // Story submission handlers (moved to top level)
  const handleStoryInputChange = (e) => {
    const { name, value } = e.target
    setStoryFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
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
          content: '' 
        })
        setShowSubmitForm(false)
        setSelectedCategory(null)
        addActivity('create', `Submitted story: ${storyFormData.title}`)
        // Refresh writer stories list
        if (writerTab === 'my-stories') {
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

  // Reader story tab state
  const [writerTab, setWriterTab] = useState('submit') // 'submit' or 'my-stories'

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

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
    }
    return badges[status] || badges.draft
  }


  // Render reader story submission view if user can post but not manage categories
  if (canPost && !canManageCategories) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar user={user} onLogout={handleLogout} />
        <main className="flex-1 transition-all duration-200 ease-in-out">
          <header className="bg-white shadow-sm sticky top-0 z-30">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Stories</h1>
                {writerTab === 'submit' && !showSubmitForm && (
                  <button
                    onClick={() => setShowSubmitForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <FaPlus /> Submit New Story
                  </button>
                )}
              </div>
              {/* Tabs */}
              <div className="mt-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => {
                      setWriterTab('submit')
                      setShowSubmitForm(false)
                    }}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      writerTab === 'submit'
                        ? 'border-slate-700 text-slate-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Submit Story
                  </button>
                  <button
                    onClick={() => {
                      setWriterTab('my-stories')
                      fetchWriterStories()
                    }}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      writerTab === 'my-stories'
                        ? 'border-slate-700 text-slate-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    My Stories
                  </button>
                </nav>
              </div>
            </div>
          </header>
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {writerTab === 'submit' ? (
              showSubmitForm ? (
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
                  {categoriesLoading ? (
                    <p className="text-gray-500">Loading categories...</p>
                  ) : categories.length === 0 ? (
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
                              setShowSubmitForm(true)
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
            ) : writerTab === 'my-stories' ? (
              // My Stories tab
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
            ) : null}
          </div>
        </main>
      </div>
    )
  }

  // Category management view (for users with manage_story_categories permission)
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 transition-all duration-200 ease-in-out">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Stories</h1>
              {canManageCategories && activeTab === 'categories' && (
                <button
                  onClick={() => {
                    setEditingCategory(null)
                    setFormData({ name: '', description: '', is_active: true, organization_ids: [] })
                    setShowAddModal(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <FaPlus /> Add Category
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Tabs */}
        {canManageCategories && (
          <div className="bg-white border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === 'categories'
                      ? 'border-slate-700 text-slate-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Categories
                </button>
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
              </div>
            </div>
          </div>
        )}

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="bg-white rounded-lg shadow">
              {categoriesLoading ? (
                <div className="p-8 text-center text-gray-500">
                  Loading categories...
                </div>
              ) : categories.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No categories yet. Create your first category!
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
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Organizations
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categories.map((category) => (
                        <tr key={category.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <FaFolder className="text-slate-600" />
                              <span className="font-medium text-gray-900">
                                {category.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-500">
                              {category.description || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {category.organizations && category.organizations.length > 0 ? (
                                category.organizations.map((org) => (
                                  <span
                                    key={org.id}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                  >
                                    {org.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400 text-sm">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={category.is_active || false}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  handleToggleCategoryStatus(category.id, !category.is_active)
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 bg-red-600"></div>
                            </label>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditCategory(category)}
                                className="text-slate-600 hover:text-slate-800 p-2"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(category)}
                                className="text-red-600 hover:text-red-800 p-2"
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
          )}


          {/* Approved Stories Tab */}
          {activeTab === 'approved-stories' && (
            <div className="bg-white rounded-lg shadow">
              {approvedStoriesLoading ? (
                <div className="p-8 text-center text-gray-500">
                  Loading approved stories...
                </div>
              ) : approvedStories.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No approved stories found.
                </div>
              ) : (
                <div className="space-y-4 p-6">
                  {approvedStories.map((story) => (
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
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                              Published
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <FaUsers className="text-gray-400" />
                              <span>{story.author_name}</span>
                              <span className="text-gray-400">({story.author_email})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaFolder className="text-gray-400" />
                              <span>{story.category_name}</span>
                            </div>
                            {story.approver_name && (
                              <div className="flex items-center gap-1">
                                <FaCheck className="text-gray-400" />
                                <span>Approved by {story.approver_name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <FaClock className="text-gray-400" />
                              <span>Published {formatDateTime(story.published_at)}</span>
                            </div>
                          </div>
                          <p className="text-gray-700 mt-2 line-clamp-3">{story.content}</p>
                          
                          {/* Read More Section - Expandable for full story details */}
                          {expandedStories.has(story.id) ? (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <h4 className="font-semibold text-gray-900 mb-3">Full Story Details</h4>
                              <div className="space-y-3 text-sm">
                                {story.subtitle && (
                                  <div>
                                    <span className="font-medium text-gray-700">Subtitle:</span>
                                    <p className="text-gray-600 mt-1">{story.subtitle}</p>
                                  </div>
                                )}
                                {story.photo_url && (
                                  <div>
                                    <span className="font-medium text-gray-700">Photo:</span>
                                    <div className="mt-2">
                                      <img 
                                        src={story.photo_url} 
                                        alt={story.person_name || story.title || 'Story photo'} 
                                        className="max-w-md h-auto rounded-lg border border-gray-300"
                                        onError={(e) => {
                                          e.target.style.display = 'none'
                                          if (e.target.nextSibling) {
                                            e.target.nextSibling.style.display = 'block'
                                          }
                                        }}
                                      />
                                      <p className="text-gray-500 text-xs mt-1 break-all hidden">{story.photo_url}</p>
                                    </div>
                                  </div>
                                )}
                                {story.quote && (
                                  <div>
                                    <span className="font-medium text-gray-700">Quote:</span>
                                    <p className="text-gray-600 mt-1 italic">"{story.quote}"</p>
                                  </div>
                                )}
                                {(story.person_name || story.person_location) && (
                                  <div>
                                    <span className="font-medium text-gray-700">Person:</span>
                                    <p className="text-gray-600 mt-1">
                                      {story.person_name}
                                      {story.person_location && ` - ${story.person_location}`}
                                    </p>
                                  </div>
                                )}
                                {(story.facilitator_name || story.facilitator_organization) && (
                                  <div>
                                    <span className="font-medium text-gray-700">Facilitator:</span>
                                    <p className="text-gray-600 mt-1">
                                      {story.facilitator_name}
                                      {story.facilitator_organization && ` - ${story.facilitator_organization}`}
                                    </p>
                                  </div>
                                )}
                                {(story.village_name || story.panchayat_name || story.block_name || story.district_name || story.state_name) && (
                                  <div>
                                    <span className="font-medium text-gray-700">Location:</span>
                                    <p className="text-gray-600 mt-1">
                                      {[story.village_name, story.panchayat_name, story.block_name, story.district_name, story.state_name].filter(Boolean).join(', ')}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium text-gray-700">Content:</span>
                                  <p className="text-gray-600 mt-1 whitespace-pre-wrap">{story.content}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setExpandedStories(prev => {
                                    const newSet = new Set(prev)
                                    newSet.delete(story.id)
                                    return newSet
                                  })
                                }}
                                className="mt-4 text-sm text-slate-600 hover:text-slate-800 font-medium"
                              >
                                Read Less ↑
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setExpandedStories(prev => new Set(prev).add(story.id))
                              }}
                              className="mt-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
                            >
                              Read More ↓
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingStory(story)
                              setEditStoryForm({
                                title: story.title || '',
                                subtitle: story.subtitle || '',
                                photo_url: story.photo_url || '',
                                quote: story.quote || '',
                                person_name: story.person_name || '',
                                person_location: story.person_location || '',
                                facilitator_name: story.facilitator_name || '',
                                facilitator_organization: story.facilitator_organization || '',
                                state_id: story.state_id || '',
                                state_name: story.state_name || '',
                                district_id: story.district_id || '',
                                district_name: story.district_name || '',
                                sub_district_id: story.sub_district_id || '',
                                sub_district_name: story.sub_district_name || '',
                                block_id: story.block_id || '',
                                block_name: story.block_name || '',
                                panchayat_id: story.panchayat_id || '',
                                panchayat_name: story.panchayat_name || '',
                                village_id: story.village_id || '',
                                village_name: story.village_name || '',
                                content: story.content || '',
                                category_id: story.category_id || '',
                              })
                            }}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => setDeleteStoryConfirm(story)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Edit Story Modal */}
      {editingStory && (
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

      {/* Add/Edit Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingCategory(null)
                    setFormData({ name: '', description: '', is_active: true, organization_ids: [] })
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                    placeholder="Category name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                    placeholder="Category description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to Organizations
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                    {organizationsLoading ? (
                      <p className="text-sm text-gray-500">Loading organizations...</p>
                    ) : organizations.length === 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">No organizations available</p>
                        <button
                          type="button"
                          onClick={() => fetchOrganizations()}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Click to load organizations
                        </button>
                      </div>
                    ) : isEditor && user?.organization_id && organizations.find(o => o.id === user.organization_id) ? (
                      // Editor view: Show organization name clearly
                      <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={true}
                            disabled
                            readOnly
                            className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-600 cursor-not-allowed opacity-60"
                          />
                          <span className="text-sm text-gray-700 font-medium">
                            {organizations.find(o => o.id === user.organization_id).name}
                          </span>
                          <span className="text-xs text-gray-500">(Your Organization)</span>
                        </div>
                      </div>
                    ) : !isEditor ? (
                      // Super Admin view: Show all organizations with checkboxes
                      <div className="space-y-2">
                        {organizations
                          .filter(org => org.is_active)
                          .map((org) => {
                            const isChecked = formData.organization_ids.includes(org.id)
                            
                            return (
                              <label
                                key={org.id}
                                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData((prev) => ({
                                        ...prev,
                                        organization_ids: [...prev.organization_ids, org.id],
                                      }))
                                    } else {
                                      setFormData((prev) => ({
                                        ...prev,
                                        organization_ids: prev.organization_ids.filter(
                                          (id) => id !== org.id
                                        ),
                                      }))
                                    }
                                  }}
                                  className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-600"
                                />
                                <span className="text-sm text-gray-700">{org.name}</span>
                              </label>
                            )
                          })}
                      </div>
                    ) : null
                  }
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {isEditor 
                      ? 'As an Editor, you can only create categories for your assigned organization. This field is read-only for your organization.'
                      : 'Writers from selected organizations will automatically get access to this category'
                    }
                  </p>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-600"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={
                    editingCategory ? handleUpdateCategory : handleAddCategory
                  }
                  disabled={creating || updating || !formData.name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaCheck />
                  {editingCategory ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingCategory(null)
                    setFormData({ name: '', description: '', is_active: true, organization_ids: [] })
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Delete Category
              </h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{deleteConfirm.name}"? This
                action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteCategory}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
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

