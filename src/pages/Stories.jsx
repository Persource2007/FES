import { useEffect, useState } from 'react'
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
import { addActivity } from '../utils/activity'
import {
  canManageStoryCategories,
  canManageReaderAccess,
  canPostStories,
  canViewStories,
} from '../utils/permissions'

function Stories() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('categories') // 'categories' or 'reader-access'
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [selectedReader, setSelectedReader] = useState(null)
  const [showReaderAccessModal, setShowReaderAccessModal] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  })

  // Reader access form state
  const [readerAccessData, setReaderAccessData] = useState({
    category_ids: [],
  })

  const canManageCategories = canManageStoryCategories(user)
  const canManageAccess = canManageReaderAccess(user)
  const canPost = canPostStories(user)
  const canView = canViewStories(user)

  // Fetch categories
  const {
    data: categoriesData,
    loading: categoriesLoading,
    error: categoriesError,
    execute: fetchCategories,
  } = useApi(API_ENDPOINTS.STORY_CATEGORIES.LIST, { immediate: false })

  // Fetch readers with access (Super admin only)
  const {
    data: readersData,
    loading: readersLoading,
    error: readersError,
    execute: fetchReaders,
  } = useApi(API_ENDPOINTS.STORY_CATEGORIES.READERS, { immediate: false })

  // Mutations
  const { execute: createCategory, loading: creating } = useMutation(
    API_ENDPOINTS.STORY_CATEGORIES.CREATE
  )
  const { execute: updateCategory, loading: updating } = useMutation(
    API_ENDPOINTS.STORY_CATEGORIES.UPDATE(0)
  )

  const [categories, setCategories] = useState([])
  const [readers, setReaders] = useState([])
  const [readerStories, setReaderStories] = useState([])
  const [approvedStories, setApprovedStories] = useState([])
  const [editingStory, setEditingStory] = useState(null)
  const [deleteStoryConfirm, setDeleteStoryConfirm] = useState(null)
  const [readerStoriesLoading, setReaderStoriesLoading] = useState(false)
  const [approvedStoriesLoading, setApprovedStoriesLoading] = useState(false)

  // Reader story submission state (moved to top level to follow Rules of Hooks)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [storyFormData, setStoryFormData] = useState({
    category_id: '',
    title: '',
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

  const fetchReaderCategories = async () => {
    if (!user) return
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.STORY_CATEGORIES.READER_CATEGORIES(user.id)
      )
      if (response.data.success) {
        // Store in local state for reader view
        setCategories(response.data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching reader categories:', error)
      toast.error('Failed to load categories')
    }
  }

  // Fetch reader stories
  const fetchReaderStories = async () => {
    if (!user) return
    setReaderStoriesLoading(true)
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.STORIES.READER_STORIES(user.id)
      )
      if (response.data.success) {
        setReaderStories(response.data.stories || [])
      }
    } catch (error) {
      console.error('Error fetching reader stories:', error)
      toast.error('Failed to load your stories')
    } finally {
      setReaderStoriesLoading(false)
    }
  }

  // Fetch approved stories (for admin)
  const fetchApprovedStories = async () => {
    if (!user) return
    setApprovedStoriesLoading(true)
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.STORIES.APPROVED_STORIES(user.id)
      )
      if (response.data.success) {
        setApprovedStories(response.data.stories || [])
      }
    } catch (error) {
      console.error('Error fetching approved stories:', error)
      toast.error('Failed to load approved stories')
    } finally {
      setApprovedStoriesLoading(false)
    }
  }

  // Fetch data on mount
  useEffect(() => {
    if (user) {
      const canManage = canManageStoryCategories(user)
      const canPost = canPostStories(user)
      const canManageAccess = canManageReaderAccess(user)
      
      if (canManage) {
        fetchCategories()
        if (canManageAccess) {
          fetchReaders()
        }
        fetchApprovedStories()
      } else if (canPost) {
        // Fetch categories accessible by this reader
        fetchReaderCategories()
        fetchReaderStories()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (categoriesData?.success) {
      setCategories(categoriesData.categories || [])
    }
  }, [categoriesData])

  useEffect(() => {
    if (readersData?.success) {
      setReaders(readersData.readers || [])
    }
  }, [readersData])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleAddCategory = async () => {
    try {
      const response = await createCategory(formData)
      if (response?.success) {
        toast.success('Category created successfully')
        setShowAddModal(false)
        setFormData({ name: '', description: '', is_active: true })
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
    setFormData({
      name: category.name,
      description: category.description || '',
      is_active: category.is_active,
    })
    setShowAddModal(true)
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return

    try {
      const response = await apiClient.put(
        API_ENDPOINTS.STORY_CATEGORIES.UPDATE(editingCategory.id),
        formData
      )
      if (response.data.success) {
        toast.success('Category updated successfully')
        setShowAddModal(false)
        setEditingCategory(null)
        setFormData({ name: '', description: '', is_active: true })
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

  const handleOpenReaderAccess = (reader) => {
    setSelectedReader(reader)
    setReaderAccessData({
      category_ids: reader.categories?.map((cat) => cat.id) || [],
    })
    setShowReaderAccessModal(true)
  }

  const handleUpdateReaderAccess = async () => {
    if (!selectedReader) return

    try {
      const response = await apiClient.put(
        API_ENDPOINTS.STORY_CATEGORIES.UPDATE_READER_ACCESS(selectedReader.id),
        readerAccessData
      )
      if (response?.data?.success) {
        toast.success('Reader access updated successfully')
        setShowReaderAccessModal(false)
        setSelectedReader(null)
        setReaderAccessData({ category_ids: [] })
        fetchReaders()
        addActivity(
          'edit',
          `Updated category access for reader: ${selectedReader.name}`
        )
      }
    } catch (error) {
      console.error('Error updating reader access:', error)
      toast.error(
        error.response?.data?.message || 'Failed to update reader access'
      )
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  }

  const handleToggleCategoryCheck = (categoryId) => {
    setReaderAccessData((prev) => {
      const categoryIds = prev.category_ids || []
      if (categoryIds.includes(categoryId)) {
        return {
          ...prev,
          category_ids: categoryIds.filter((id) => id !== categoryId),
        }
      } else {
        return {
          ...prev,
          category_ids: [...categoryIds, categoryId],
        }
      }
    })
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
    if (!storyFormData.category_id || !storyFormData.title || !storyFormData.content.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const response = await submitStory({
        category_id: parseInt(storyFormData.category_id),
        title: storyFormData.title,
        content: storyFormData.content,
        user_id: user.id,
      })
      if (response?.success) {
        toast.success('Story submitted successfully! It will be reviewed by an administrator.')
        setStoryFormData({ category_id: '', title: '', content: '' })
        setShowSubmitForm(false)
        setSelectedCategory(null)
        addActivity('create', `Submitted story: ${storyFormData.title}`)
        // Refresh reader stories list
        if (readerTab === 'my-stories') {
          fetchReaderStories()
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
  const [readerTab, setReaderTab] = useState('submit') // 'submit' or 'my-stories'

  // Story edit form state (for admin)
  const [editStoryForm, setEditStoryForm] = useState({
    title: '',
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
        setEditStoryForm({ title: '', content: '', category_id: '' })
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
                {readerTab === 'submit' && !showSubmitForm && (
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
                      setReaderTab('submit')
                      setShowSubmitForm(false)
                    }}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      readerTab === 'submit'
                        ? 'border-slate-700 text-slate-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Submit Story
                  </button>
                  <button
                    onClick={() => {
                      setReaderTab('my-stories')
                      fetchReaderStories()
                    }}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      readerTab === 'my-stories'
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
            {readerTab === 'submit' ? (
              showSubmitForm ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">
                      Submit New Story
                    </h2>
                    <button
                      onClick={() => {
                        setShowSubmitForm(false)
                        setStoryFormData({ category_id: '', title: '', content: '' })
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
                        disabled={submitting || !storyFormData.category_id || !storyFormData.title || !storyFormData.content.trim()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaCheck />
                        {submitting ? 'Submitting...' : 'Submit for Review'}
                      </button>
                      <button
                        onClick={() => {
                          setShowSubmitForm(false)
                          setStoryFormData({ category_id: '', title: '', content: '' })
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
            ) : readerTab === 'my-stories' ? (
              // My Stories tab
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  My Stories
                </h2>
                {readerStoriesLoading ? (
                  <p className="text-gray-500">Loading your stories...</p>
                ) : readerStories.length === 0 ? (
                  <p className="text-gray-500">You haven't submitted any stories yet.</p>
                ) : (
                  <div className="space-y-4">
                    {readerStories.map((story) => (
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
                                <span>Submitted {formatDate(story.created_at)}</span>
                              </div>
                              {story.published_at && (
                                <div className="flex items-center gap-1">
                                  <FaCheck className="text-gray-400" />
                                  <span>Published {formatDate(story.published_at)}</span>
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
                    setFormData({ name: '', description: '', is_active: true })
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
                {canManageAccess && (
                  <button
                    onClick={() => setActiveTab('reader-access')}
                    className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                      activeTab === 'reader-access'
                        ? 'border-slate-700 text-slate-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Reader Access
                  </button>
                )}
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                category.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {category.is_active ? 'Active' : 'Inactive'}
                            </span>
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

          {/* Reader Access Tab */}
          {activeTab === 'reader-access' && (
            <div className="bg-white rounded-lg shadow">
              {readersLoading ? (
                <div className="p-8 text-center text-gray-500">
                  Loading readers...
                </div>
              ) : readers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No readers found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reader
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Accessible Categories
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {readers.map((reader) => (
                        <tr key={reader.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <FaUsers className="text-slate-600" />
                              <div>
                                <div className="font-medium text-gray-900">
                                  {reader.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {reader.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {reader.categories && reader.categories.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {reader.categories.map((cat) => (
                                  <span
                                    key={cat.id}
                                    className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded"
                                  >
                                    {cat.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">
                                No access
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleOpenReaderAccess(reader)}
                              className="text-slate-600 hover:text-slate-800 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                              Manage Access
                            </button>
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
                  You haven't approved any stories yet.
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
                            <div className="flex items-center gap-1">
                              <FaClock className="text-gray-400" />
                              <span>Published {formatDate(story.published_at)}</span>
                            </div>
                          </div>
                          <p className="text-gray-700 mt-2">{story.content}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingStory(story)
                              setEditStoryForm({
                                title: story.title,
                                content: story.content,
                                category_id: story.category_id,
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
                    setEditStoryForm({ title: '', content: '', category_id: '' })
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
                  disabled={!editStoryForm.title.trim() || !editStoryForm.content.trim() || !editStoryForm.category_id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaCheck />
                  Update Story
                </button>
                <button
                  onClick={() => {
                    setEditingStory(null)
                    setEditStoryForm({ title: '', content: '', category_id: '' })
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
                    setFormData({ name: '', description: '', is_active: true })
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
                    setFormData({ name: '', description: '', is_active: true })
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

      {/* Reader Access Modal */}
      {showReaderAccessModal && selectedReader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Manage Access for {selectedReader.name}
                </h2>
                <button
                  onClick={() => {
                    setShowReaderAccessModal(false)
                    setSelectedReader(null)
                    setReaderAccessData({ category_ids: [] })
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Select the categories this reader can post stories to:
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {categories
                  .filter((cat) => cat.is_active)
                  .map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={readerAccessData.category_ids.includes(
                          category.id
                        )}
                        onChange={() =>
                          handleToggleCategoryCheck(category.id)
                        }
                        className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {category.name}
                        </div>
                        {category.description && (
                          <div className="text-sm text-gray-500">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleUpdateReaderAccess}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800"
                >
                  <FaCheck />
                  Save Access
                </button>
                <button
                  onClick={() => {
                    setShowReaderAccessModal(false)
                    setSelectedReader(null)
                    setReaderAccessData({ category_ids: [] })
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
    </div>
  )
}

export default Stories

