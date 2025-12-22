import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  FaFolder,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
} from 'react-icons/fa'
import { useApi } from '../hooks/useApi'
import { API_ENDPOINTS } from '../utils/constants'
import apiClient from '../utils/api'
import Sidebar from '../components/Sidebar'
import { addActivity } from '../utils/activity'
import { logoutOAuth } from '../utils/oauthLogin'
import { canManageStoryCategories } from '../utils/permissions'

function Categories() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [togglingStatus, setTogglingStatus] = useState(null)

  // Fetch categories
  const {
    data: categoriesData,
    loading: categoriesLoading,
    error: categoriesError,
    execute: fetchCategories,
  } = useApi(API_ENDPOINTS.STORY_CATEGORIES.LIST, { immediate: false })

  const [categories, setCategories] = useState([])

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
    } catch (e) {
      console.error('Error parsing user data:', e)
      navigate('/')
    }
  }, [navigate])

  // Fetch data on mount
  useEffect(() => {
    if (user?.id) {
      fetchCategories({ params: { user_id: user.id } }).catch((err) => {
        console.error('Error fetching categories:', err)
        toast.error('Failed to load categories')
      })
    }
  }, [user?.id])

  // Update categories when data changes
  useEffect(() => {
    if (categoriesData?.categories) {
      setCategories(categoriesData.categories)
    }
  }, [categoriesData])

  const handleEditCategory = (category) => {
    navigate(`/dashboard/categories/${category.id}/edit`)
  }

  const handleToggleCategoryStatus = async (categoryId, newStatus) => {
    setTogglingStatus(categoryId)
    
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
        fetchCategories({ params: { user_id: user.id } }) // Refresh to get server state
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
    } finally {
      setTogglingStatus(null)
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
        fetchCategories({ params: { user_id: user.id } })
        addActivity('delete', `Deleted story category: ${deleteConfirm.name}`)
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to delete category'
      toast.error(errorMessage)
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

  const canManage = canManageStoryCategories(user)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="flex-1 transition-all duration-200 ease-in-out">
        {/* Top Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="pl-14 sm:pl-14 lg:pl-8 pr-4 sm:pr-6 lg:pr-8 py-4">
            <div className="flex items-center gap-3">
              <FaFolder className="text-2xl text-slate-700" />
              <h1 className="text-2xl font-bold text-gray-900">Story Categories</h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Add Category Button */}
          {canManage && (
            <div className="mb-6">
              <button
                onClick={() => navigate('/dashboard/categories/new')}
                className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <FaPlus /> Add New Category
              </button>
            </div>
          )}
          {/* Categories Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {categoriesError && (
              <div className="p-8 text-center text-red-500">
                Error loading categories: {categoriesError}
              </div>
            )}
            {categoriesLoading ? (
              <div className="p-8 text-center text-gray-500">Loading categories...</div>
            ) : categoriesError ? null : categories.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No categories found. {canManage && 'Click "Add New Category" to create one.'}
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
                      {canManage && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FaFolder className="text-slate-600" />
                            <div className="text-sm font-medium text-gray-900">
                              {category.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-md">
                            {category.description || <span className="text-gray-400">—</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {canManage ? (
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={category.is_active !== false}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  handleToggleCategoryStatus(category.id, !category.is_active)
                                }}
                                disabled={togglingStatus === category.id}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 bg-red-600 peer-disabled:opacity-50"></div>
                            </label>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              category.is_active !== false 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {category.is_active !== false ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </td>
                        {canManage && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEditCategory(category)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit Category"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(category)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        )}
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
              <h2 className="text-xl font-semibold text-gray-900">Delete Category</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700">
                Are you sure you want to delete{' '}
                <span className="font-semibold">{deleteConfirm.name}</span>? This action cannot be undone.
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
                onClick={handleDeleteCategory}
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

export default Categories

