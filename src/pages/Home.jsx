import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FaMapMarkerAlt,
  FaFilter,
  FaNewspaper,
  FaBook,
  FaDownload,
  FaExternalLinkAlt,
} from 'react-icons/fa'
import apiClient from '../utils/api'
import { API_ENDPOINTS } from '../utils/constants'
import Header from '../components/Header'
import Footer from '../components/Footer'

function Home() {
  const [stories, setStories] = useState([])
  const [categories, setCategories] = useState([])
  const [regions, setRegions] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStories()
    fetchCategories()
    fetchRegions()
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

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.STORY_CATEGORIES.LIST)
      if (response.data.success) {
        setCategories(response.data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchRegions = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.REGIONS.LIST)
      if (response.data.success) {
        setRegions(response.data.regions || [])
      }
    } catch (error) {
      console.error('Error fetching regions:', error)
    }
  }

  // Filter stories based on selected category and region
  const filteredStories = stories.filter((story) => {
    const matchesCategory = !selectedCategory || story.category_id === parseInt(selectedCategory)
    const matchesRegion = !selectedRegion || story.region_id === parseInt(selectedRegion)
    return matchesCategory && matchesRegion
  })

  // Group stories by region for map markers
  const storiesByRegion = filteredStories.reduce((acc, story) => {
    if (story.region_name) {
      if (!acc[story.region_name]) {
        acc[story.region_name] = []
      }
      acc[story.region_name].push(story)
    }
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Masthead Banner */}
      <section className="relative w-full h-[500px] lg:h-[600px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/images/masthead-hero.jpg"
            alt="Commons in India - Natural landscape with river and mountains"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image doesn't exist yet
              e.target.style.display = 'none'
              e.target.parentElement.style.background = 'linear-gradient(to bottom right, #1e293b, #334155, #0f172a)'
            }}
          />
          {/* Overlay for better text readability with green tint */}
          <div className="absolute inset-0 bg-gradient-to-b from-green-900/50 via-green-800/40 to-green-900/60"></div>
        </div>
        
        {/* Content */}
        <div className="relative h-full flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="text-center max-w-4xl mx-auto text-white">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-lg">
                Commons in India: Stories of Impact and Local Heroes
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-slate-100 mb-8 drop-shadow-md">
                Discover the power of Commons and their profound impact on ecology and communities
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction to Commons */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-green-800 mb-6">
              What are Commons?
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              <p className="text-xl leading-relaxed">
                Commons are shared resources that belong to communities—natural resources like
                forests, water bodies, and grazing lands that are collectively managed and
                protected by local people. These resources are vital for ecological balance and
                community well-being.
              </p>
              <p className="text-lg leading-relaxed">
                In India, Commons play a crucial role in sustaining rural livelihoods, preserving
                biodiversity, and maintaining traditional knowledge systems. They represent a
                powerful model of community-driven conservation and sustainable resource management.
              </p>
              <p className="text-lg leading-relaxed">
                Through this platform, we celebrate the stories of local heroes who are protecting,
                restoring, and revitalizing Commons across India, showcasing their impact on both
                ecology and communities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-green-800 mb-4">
              Stories Across India
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Explore stories from different states and categories. Click on markers to view stories
              from each region.
            </p>
          </div>

          {/* Filter Controls */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center gap-2 text-gray-700">
                <FaFilter className="text-green-700" />
                <span className="font-medium">Filters:</span>
              </div>
              <div className="flex-1 w-full md:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-500"
                >
                  <option value="">All Categories</option>
                  {categories
                    .filter((cat) => cat.is_active)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex-1 w-full md:w-auto">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-500"
                >
                  <option value="">All States</option>
                  {regions
                    .filter((region) => region.is_active)
                    .map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="text-sm text-gray-600">
                Showing {filteredStories.length} story{filteredStories.length !== 1 ? 'ies' : ''}
              </div>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 h-96 lg:h-[600px]">
              {/* Map Container */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <FaMapMarkerAlt className="text-6xl text-green-700 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-green-800 mb-2">
                    Interactive India Map
                  </p>
                  <p className="text-gray-700 max-w-md mx-auto">
                    [Map will display clickable markers for each state with story counts]
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-4">
                    {Object.entries(storiesByRegion).map(([regionName, regionStories]) => (
                      <div
                        key={regionName}
                        className="bg-white px-4 py-2 rounded-lg shadow-sm border border-green-200 hover:border-green-400 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-green-600" />
                          <span className="font-medium text-green-800">{regionName}</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                            {regionStories.length}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {Object.keys(storiesByRegion).length > 0 && (
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4 text-center border-t-4 border-green-600">
                <div className="text-3xl font-bold text-green-800">{filteredStories.length}</div>
                <div className="text-sm text-gray-700 mt-1">Total Stories</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center border-t-4 border-green-600">
                <div className="text-3xl font-bold text-green-800">
                  {Object.keys(storiesByRegion).length}
                </div>
                <div className="text-sm text-gray-700 mt-1">States Covered</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center border-t-4 border-green-600">
                <div className="text-3xl font-bold text-green-800">
                  {new Set(filteredStories.map((s) => s.category_id)).size}
                </div>
                <div className="text-sm text-gray-700 mt-1">Categories</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center border-t-4 border-green-600">
                <div className="text-3xl font-bold text-green-800">
                  {new Set(filteredStories.map((s) => s.author_name)).size}
                </div>
                <div className="text-sm text-gray-700 mt-1">Contributors</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* News Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-green-800 mb-4">News & Updates</h2>
            <p className="text-xl text-gray-700">
              Stay informed about Commons, FES activities, and community initiatives
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Placeholder News Items */}
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 hover:border-green-300"
              >
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 h-48 flex items-center justify-center">
                  <FaNewspaper className="text-4xl text-green-600" />
                </div>
                <div className="p-6">
                  <div className="text-sm text-green-700 mb-2 font-medium">News Article</div>
                  <h3 className="text-xl font-semibold text-green-900 mb-3">
                    [News Title Placeholder]
                  </h3>
                  <p className="text-gray-700 mb-4">
                    [News excerpt placeholder. This will display a brief summary of the news
                    article...]
                  </p>
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 text-green-700 font-medium hover:text-green-800 transition-colors"
                  >
                    Read More <FaExternalLinkAlt className="text-sm" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/stories"
              className="inline-block bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors shadow-md hover:shadow-lg"
            >
              View All Stories
            </Link>
          </div>
        </div>
      </section>

      {/* Publications Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-green-800 mb-4">
              Featured Publications
            </h2>
            <p className="text-xl text-gray-700">
              Access reports, research papers, and publications about Commons
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Placeholder Publication Items */}
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 hover:border-green-300"
              >
                <div className="bg-gradient-to-br from-emerald-100 to-teal-100 h-48 flex items-center justify-center">
                  <FaBook className="text-4xl text-green-600" />
                </div>
                <div className="p-6">
                  <div className="text-sm text-green-700 mb-2 font-medium">Publication</div>
                  <h3 className="text-xl font-semibold text-green-900 mb-3">
                    [Publication Title Placeholder]
                  </h3>
                  <p className="text-gray-700 mb-4">
                    [Publication description placeholder. Brief summary of the publication
                    content...]
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">PDF, 2.5 MB</span>
                    <button className="inline-flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors text-sm font-medium">
                      <FaDownload className="text-sm" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Logos Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-green-800 mb-4">Our Partners</h2>
            <p className="text-xl text-gray-700">
              Organizations working with FES to protect and restore Commons
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
            {/* Placeholder Partner Logos */}
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="bg-green-50 rounded-lg p-6 h-32 flex items-center justify-center border border-green-200 hover:shadow-md hover:border-green-400 transition-all"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">Logo</div>
                  <div className="text-xs text-green-700">Partner {item}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Home
