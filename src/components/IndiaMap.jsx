import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FaFilter, FaSearch, FaMapMarkerAlt } from 'react-icons/fa'
import { generateSlug } from '../utils/slug'
import apiClient from '../utils/api'
import { API_ENDPOINTS } from '../utils/constants'
import IndiaMapSVG from './IndiaMapSVG'

function IndiaMap({ 
  stories: externalStories, 
  categories: externalCategories, 
  regions: externalRegions, 
  storiesByRegion: externalStoriesByRegion, // Direct storiesByRegion prop (bypasses filtering)
  onStateClick: externalOnStateClick, 
  onStoryClick: externalOnStoryClick,
  showFilters = true, // Show filters by default
  focusedState = null, // For StoryDetail to focus on a specific state
}) {
  const navigate = useNavigate()
  
  // State for data
  const [stories, setStories] = useState(externalStories || [])
  const [categories, setCategories] = useState(externalCategories || [])
  const [regions, setRegions] = useState(externalRegions || [])
  const [loading, setLoading] = useState(!externalStories && !externalStoriesByRegion)
  
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  

  // Fetch data if not provided as props and filters are shown
  useEffect(() => {
    if (showFilters && !externalStoriesByRegion) {
      if (!externalStories) {
        fetchStories()
      }
      if (!externalCategories) {
        fetchCategories()
      }
      if (!externalRegions) {
        fetchRegions()
      }
    }
  }, [showFilters, externalStoriesByRegion])

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
      console.log('Categories response:', response.data)
      if (response.data.success) {
        setCategories(response.data.categories || [])
      } else {
        console.error('Categories API returned success=false:', response.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
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

  // Get unique states from stories for the filter dropdown (use state_name)
  const uniqueStates = [...new Set(stories.filter(s => s.state_name).map(s => s.state_name))].sort()

  // Filter stories based on selected category, state, and search query
  const filteredStories = stories.filter((story) => {
    const matchesCategory = !selectedCategory || story.category_id === parseInt(selectedCategory)
    // Filter by state name (use state_name)
    const matchesState = !selectedRegion || story.state_name === selectedRegion
    
    // Text search in title and content
    const matchesSearch = !searchQuery || 
      story.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.content?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCategory && matchesState && matchesSearch
  })

  // Handle search button click
  const handleSearch = (e) => {
    e.preventDefault()
    setSearchQuery(searchInput)
  }

  // Group stories by state for map markers
  // If externalStoriesByRegion is provided, use it directly (for StoryDetail)
  // Otherwise, filter and group stories by state_name
  const storiesByRegion = externalStoriesByRegion || filteredStories.reduce((acc, story) => {
    if (story.state_name) {
      if (!acc[story.state_name]) {
        acc[story.state_name] = []
      }
      acc[story.state_name].push(story)
    }
    return acc
  }, {})

  // Handle state click on map
  const handleStateClick = (stateName) => {
    // If external handler provided, use it
    if (externalOnStateClick) {
      externalOnStateClick(stateName)
    } else {
      // Otherwise, filter by state name directly
      setSelectedRegion(stateName)
    }
  }
  
  // Handle reset filters from map
  const handleResetFilters = () => {
    setSelectedCategory('')
    setSelectedRegion('')
    setSearchInput('')
    setSearchQuery('')
  }

  // Handle story click - navigate directly to story detail page
  const handleStoryClick = (story) => {
    if (externalOnStoryClick) {
      externalOnStoryClick(story)
    } else {
      // Navigate directly to story detail page
      const slug = story.slug || generateSlug(story.title)
      navigate(`/stories/${slug}`)
    }
  }
  

  return (
    <div className="w-full">
      {/* Map with Filters - Only show if showFilters is true */}
      {showFilters ? (
        <div className="bg-white rounded-lg shadow-lg border border-gray-300 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Filter Controls - Left Side */}
            <div className="w-full lg:w-80 xl:w-96 bg-gray-50 border-r border-gray-300 flex flex-col max-h-[600px]">
              {/* Filters Section - Compact */}
              <div className="p-4 border-b border-gray-300 flex-shrink-0">
                <form onSubmit={handleSearch} className="space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <FaFilter className="text-green-700 text-sm" />
                      <span className="font-medium text-sm">Filters</span>
                    </div>
                    {filteredStories.length > 0 && (
                      <div className="text-xs text-gray-600">
                        {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'} found
                      </div>
                    )}
                  </div>
                  
                  {/* Search Box */}
                  <div>
                    <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">
                      Search
                    </label>
                    <div className="relative">
                      <input
                        id="search"
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleSearch(e)
                          }
                        }}
                        placeholder="Search stories..."
                        className="w-full px-3 py-1.5 pl-8 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-600 focus:border-green-500"
                      />
                      <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                    </div>
                  </div>
                  
                  {/* Category Filter */}
                  <div>
                    <label htmlFor="category" className="block text-xs font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      id="category"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-600 focus:border-green-500"
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
                  
                  {/* State Filter */}
                  <div>
                    <label htmlFor="state" className="block text-xs font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <select
                      id="state"
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-600 focus:border-green-500"
                    >
                      <option value="">All States</option>
                      {uniqueStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Search Button and Reset */}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-3 py-1.5 bg-green-700 text-white rounded text-sm font-medium hover:bg-green-800 transition-colors flex items-center justify-center gap-1"
                    >
                      <FaSearch className="text-xs" />
                      Search
                    </button>
                    {(selectedCategory || selectedRegion || searchQuery) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('')
                          setSelectedRegion('')
                          setSearchInput('')
                          setSearchQuery('')
                        }}
                        className="px-3 py-1.5 text-xs text-green-700 hover:text-green-800 font-medium border border-green-300 rounded hover:bg-green-50 transition-colors"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Filtered Stories List - Shows more stories before scrolling */}
              <div className="flex-1 overflow-y-auto p-2">
                {filteredStories.length > 0 ? (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-700 mb-2">Stories</h3>
                    <div style={{ maxHeight: filteredStories.length > 4 ? '400px' : 'none', overflowY: filteredStories.length > 4 ? 'auto' : 'visible' }}>
                      {filteredStories.map((story, index) => {
                        const storySlug = story.slug || generateSlug(story.title)
                        return (
                          <div key={story.id}>
                            <Link
                              to={`/stories/${storySlug}`}
                              className="block py-2 hover:bg-gray-50 transition-colors"
                            >
                              <h4 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">
                                {story.title}
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                {story.category_name && (
                                  <span className="inline-block text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                    {story.category_name}
                                  </span>
                                )}
                                {story.state_name && (
                                  <span className="inline-block text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                    {story.state_name}
                                  </span>
                                )}
                              </div>
                            </Link>
                            {index < filteredStories.length - 1 && (
                              <div className="border-b border-gray-200"></div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    <FaMapMarkerAlt className="mx-auto mb-2 text-gray-400" />
                    <p>No stories found</p>
                    <p className="text-xs mt-1">Try adjusting your filters</p>
                  </div>
                )}
              </div>
            </div>

            {/* Map - Right Side */}
            <div className="flex-1 relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 h-96 lg:h-[600px]">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
                    <p className="text-gray-700">Loading map...</p>
                  </div>
                </div>
              ) : (
                <IndiaMapSVG
                  storiesByRegion={storiesByRegion}
                  onStateClick={handleStateClick}
                  onStoryClick={handleStoryClick}
                  focusedState={focusedState}
                  onResetFilters={handleResetFilters}
                  selectedStateFromFilter={selectedRegion}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
                <p className="text-gray-700">Loading map...</p>
              </div>
            </div>
          ) : (
            <IndiaMapSVG
              storiesByRegion={storiesByRegion}
              onStateClick={handleStateClick}
              onStoryClick={handleStoryClick}
              focusedState={focusedState}
              onResetFilters={handleResetFilters}
              selectedStateFromFilter={selectedRegion}
            />
          )}
        </>
      )}
      
    </div>
  )
}

export default IndiaMap
