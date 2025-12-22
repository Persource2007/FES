import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FaArrowRight,
  FaUser,
  FaClock,
} from 'react-icons/fa'
import apiClient from '../utils/api'
import { API_ENDPOINTS } from '../utils/constants'
import { formatDate } from '../utils/dateFormat'
import { generateSlug } from '../utils/slug'
import Header from '../components/Header'
import Footer from '../components/Footer'

function PublicStories() {
  const navigate = useNavigate()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStory, setSelectedStory] = useState(null)

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(API_ENDPOINTS.STORIES.PUBLISHED)
      if (response.data.success) {
        setStories(response.data.stories || [])
      }
    } catch (error) {
      console.error('Error fetching stories:', error)
    } finally {
      setLoading(false)
    }
  }

  const truncateContent = (content, maxLength = 150) => {
    if (!content) return ''
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + '...'
  }


  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1">

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Stories from the Commons
          </h1>
          <h2 className="text-2xl font-semibold text-slate-700 mb-2">
            Community chronicles
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Powerful narratives of local heroes and their environmental struggles
          </p>
        </div>
      </section>

      {/* Stories Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Loading stories...</p>
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No stories published yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                        {story.category_name}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2">
                      {story.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <FaUser className="text-gray-400" />
                        <span>{story.author_name}</span>
                      </div>
                      {story.published_at && (
                        <div className="flex items-center gap-1">
                          <FaClock className="text-gray-400" />
                          <span>{formatDate(story.published_at)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {truncateContent(story.content)}
                    </p>
                    <button
                      onClick={() => {
                        const slug = story.slug || generateSlug(story.title)
                        navigate(`/stories/${slug}`)
                      }}
                      className="flex items-center gap-2 text-slate-700 font-medium hover:text-slate-900 transition-colors"
                    >
                      Read more
                      <FaArrowRight className="text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>


      {/* Story Detail Modal */}
      {selectedStory && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedStory(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full">
                    {selectedStory.category_name}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedStory(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                {selectedStory.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-1">
                  <FaUser className="text-gray-400" />
                  <span>{selectedStory.author_name}</span>
                </div>
                {selectedStory.published_at && (
                  <div className="flex items-center gap-1">
                    <FaClock className="text-gray-400" />
                    <span>{formatDate(selectedStory.published_at)}</span>
                  </div>
                )}
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedStory.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      </main>
      <Footer />
    </div>
  )
}

export default PublicStories

