import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FaArrowLeft, FaSave } from 'react-icons/fa'
import { useApi, useMutation } from '../hooks/useApi'
import { API_ENDPOINTS } from '../utils/constants'
import apiClient from '../utils/api'
import Sidebar from '../components/Sidebar'
import { addActivity } from '../utils/activity'
import { logoutOAuth } from '../utils/oauthLogin'

function CategoryForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  })

  // Mutations
  const { execute: createCategory } = useMutation(API_ENDPOINTS.STORY_CATEGORIES.CREATE)

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

      // If editing, fetch category data
      if (isEditMode) {
        fetchCategoryData()
      }
    } catch (e) {
      console.error('Error parsing user data:', e)
      navigate('/')
    }
  }, [navigate, id, isEditMode])

  const fetchCategoryData = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get(API_ENDPOINTS.STORY_CATEGORIES.LIST)
      const categoryToEdit = response.data.categories?.find(c => c.id === parseInt(id))
      
      if (categoryToEdit) {
        setFormData({
          name: categoryToEdit.name || '',
          description: categoryToEdit.description || '',
          is_active: categoryToEdit.is_active !== undefined ? categoryToEdit.is_active : true,
        })
      } else {
        toast.error('Category not found')
        navigate('/dashboard/categories')
      }
    } catch (error) {
      console.error('Error fetching category:', error)
      toast.error('Failed to load category data')
      navigate('/dashboard/categories')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }


  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Please enter a category name')
      return
    }

    setSaving(true)

    try {
      if (isEditMode) {
        // Update category
        const payload = { ...formData, user_id: user.id }

        const response = await apiClient.put(
          API_ENDPOINTS.STORY_CATEGORIES.UPDATE(parseInt(id)),
          payload
        )
        
        if (response.data.success) {
          toast.success('Category updated successfully')
          addActivity('edit', `Updated story category: ${formData.name}`)
          navigate('/dashboard/categories')
        }
      } else {
        // Create category
        const payload = { ...formData, user_id: user.id }

        const response = await createCategory(payload)
        
        if (response?.success) {
          toast.success('Category created successfully')
          addActivity('create', `Created story category: ${formData.name}`)
          navigate('/dashboard/categories')
        }
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} category:`, error)
      
      // Show more detailed error message
      let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} category`
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
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/dashboard/categories')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <FaArrowLeft /> Back to Categories
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Edit Category' : 'Create New Category'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isEditMode 
                ? 'Update category information'
                : 'Create a new story category'}
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Category name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Category description (optional)"
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

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/categories')}
                  className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.name.trim()}
                  className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <FaSave />
                  {saving
                    ? (isEditMode ? 'Updating...' : 'Creating...')
                    : (isEditMode ? 'Update Category' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CategoryForm

