import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FaSearch,
  FaEnvelope,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaArrowRight,
  FaFolder,
  FaUser,
  FaClock,
} from 'react-icons/fa'
import apiClient from '../utils/api'
import { API_ENDPOINTS } from '../utils/constants'

function PublicStories() {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newsletterEmail, setNewsletterEmail] = useState('')
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

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const truncateContent = (content, maxLength = 150) => {
    if (!content) return ''
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + '...'
  }

  const handleNewsletterSubmit = (e) => {
    e.preventDefault()
    // TODO: Implement newsletter subscription
    alert('Newsletter subscription coming soon!')
    setNewsletterEmail('')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-slate-800">
                Stories from the Commons
              </span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="text-gray-700 hover:text-slate-800 font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                to="/stories"
                className="text-slate-800 font-semibold border-b-2 border-slate-800"
              >
                Stories
              </Link>
              <Link
                to="/about"
                className="text-gray-700 hover:text-slate-800 font-medium transition-colors"
              >
                About
              </Link>
              <Link
                to="/publications"
                className="text-gray-700 hover:text-slate-800 font-medium transition-colors"
              >
                Publications
              </Link>
              <Link
                to="/news"
                className="text-gray-700 hover:text-slate-800 font-medium transition-colors"
              >
                News
              </Link>
              <Link
                to="/contact"
                className="text-gray-700 hover:text-slate-800 font-medium transition-colors"
              >
                Contact
              </Link>
              <Link
                to="/login"
                className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors font-medium"
              >
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

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
                      onClick={() => setSelectedStory(story)}
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

      {/* Newsletter Section */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Join: our newsletter
          </h2>
          <p className="text-gray-600 mb-6">
            Duly updated with our latest research and community initiatives
          </p>
          <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto">
            <div className="flex gap-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter email address"
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
              >
                Subscribe
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              No extra filings are within 10 min of entry (600) of this
              subscription, but a valid list can be found on the site of this
            </p>
          </form>
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

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Explore</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-gray-300 hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/publications" className="text-gray-300 hover:text-white">
                    Publications
                  </Link>
                </li>
                <li>
                  <Link to="/news" className="text-gray-300 hover:text-white">
                    News
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-300 hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/partners" className="text-gray-300 hover:text-white">
                    Partners
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Research</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/blog" className="text-gray-300 hover:text-white">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/contact" className="text-gray-300 hover:text-white">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Share</h3>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <FaFacebook className="text-xl" />
                </a>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <FaTwitter className="text-xl" />
                </a>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin className="text-xl" />
                </a>
                <a
                  href="#"
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <FaInstagram className="text-xl" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Stories from the Commons. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicStories

