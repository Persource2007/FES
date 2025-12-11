import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  FaFileAlt,
  FaCheck,
  FaTimes,
  FaUser,
  FaFolder,
  FaClock,
  FaExclamationCircle,
} from 'react-icons/fa'
import { useApi, useMutation } from '../hooks/useApi'
import { API_ENDPOINTS } from '../utils/constants'
import apiClient from '../utils/api'
import Sidebar from '../components/Sidebar'
import { addActivity } from '../utils/activity'
import { canManageStoryCategories } from '../utils/permissions'
import { formatDateTime } from '../utils/dateFormat'

function StoryReview() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [stories, setStories] = useState([])
  const [selectedStory, setSelectedStory] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  // Fetch pending stories
  const {
    data: storiesData,
    loading: storiesLoading,
    execute: fetchPendingStories,
  } = useApi(API_ENDPOINTS.STORIES.PENDING, { immediate: false })

  // Mutations
  const { execute: approveStory, loading: approving } = useMutation(
    API_ENDPOINTS.STORIES.APPROVE(0)
  )
  const { execute: rejectStory, loading: rejecting } = useMutation(
    API_ENDPOINTS.STORIES.REJECT(0)
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

      // Check if user can manage story categories
      if (!canManageStoryCategories(parsedUser)) {
        toast.error('Access denied. You do not have permission to review stories.')
        navigate('/dashboard')
        return
      }
    } catch (e) {
      console.error('Error parsing user data:', e)
      navigate('/')
    }
  }, [navigate])

  // Fetch pending stories
  useEffect(() => {
    if (user && canManageStoryCategories(user)) {
      fetchPendingStories()
      // Refresh every 10 seconds to check for new stories
      const interval = setInterval(() => {
        fetchPendingStories()
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    if (storiesData?.success) {
      setStories(storiesData.stories || [])
    }
  }, [storiesData])

  const handleApprove = async (story) => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.STORIES.APPROVE(story.id),
        { admin_user_id: user.id }
      )
      if (response.data?.success) {
        toast.success('Story approved and published successfully!')
        fetchPendingStories()
        addActivity('edit', `Approved story: ${story.title}`)
      }
    } catch (error) {
      console.error('Error approving story:', error)
      toast.error(error.response?.data?.message || 'Failed to approve story')
    }
  }

  const handleReject = async () => {
    if (!selectedStory) return

    try {
      const response = await apiClient.post(
        API_ENDPOINTS.STORIES.REJECT(selectedStory.id),
        {
          admin_user_id: user.id,
          rejection_reason: rejectionReason,
        }
      )
      if (response.data?.success) {
        toast.success('Story rejected successfully')
        setShowRejectModal(false)
        setSelectedStory(null)
        setRejectionReason('')
        fetchPendingStories()
        addActivity('delete', `Rejected story: ${selectedStory.title}`)
      }
    } catch (error) {
      console.error('Error rejecting story:', error)
      toast.error(error.response?.data?.message || 'Failed to reject story')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  }


  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 transition-all duration-200 ease-in-out">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  Story Review
                </h1>
                {stories.length > 0 && (
                  <span className="px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded-full flex items-center gap-2">
                    <FaExclamationCircle />
                    {stories.length} Pending
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {storiesLoading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">Loading pending stories...</p>
            </div>
          ) : stories.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <FaCheck className="text-4xl text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                No Pending Stories
              </h2>
              <p className="text-gray-500">
                All stories have been reviewed. Check back later for new submissions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Prominent notification banner */}
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <FaExclamationCircle className="text-red-600 text-2xl" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">
                      {stories.length} Story{stories.length !== 1 ? 'ies' : ''} Pending Review
                    </h3>
                    <p className="text-red-700 text-sm">
                      Please review and approve or reject the submitted stories.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stories list */}
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FaFileAlt className="text-slate-600" />
                        <h2 className="text-xl font-semibold text-gray-900">
                          {story.title}
                        </h2>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                          Pending
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 ml-8">
                        <div className="flex items-center gap-1">
                          <FaUser className="text-gray-400" />
                          <span>{story.author_name}</span>
                          <span className="text-gray-400">({story.author_email})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaFolder className="text-gray-400" />
                          <span>{story.category_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaClock className="text-gray-400" />
                          <span>Submitted {formatDateTime(story.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-8 mb-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {story.content}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-8">
                    <button
                      onClick={() => handleApprove(story)}
                      disabled={approving}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FaCheck />
                      {approving ? 'Approving...' : 'Approve & Publish'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStory(story)
                        setShowRejectModal(true)
                      }}
                      disabled={rejecting}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FaTimes />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Reject Modal */}
      {showRejectModal && selectedStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Reject Story
                </h2>
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setSelectedStory(null)
                    setRejectionReason('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                Are you sure you want to reject "{selectedStory.title}"?
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
                  placeholder="Provide a reason for rejection..."
                  maxLength={500}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={rejecting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {rejecting ? 'Rejecting...' : 'Reject Story'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setSelectedStory(null)
                    setRejectionReason('')
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

export default StoryReview

