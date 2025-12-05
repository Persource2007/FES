import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaFilter, FaSearch, FaTimes, FaMapMarkerAlt } from 'react-icons/fa'
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
  
  // Modal state for story details
  const [selectedStory, setSelectedStory] = useState(null)

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

  // Filter stories based on selected category, region, and search query
  const filteredStories = stories.filter((story) => {
    const matchesCategory = !selectedCategory || story.category_id === parseInt(selectedCategory)
    const matchesRegion = !selectedRegion || story.region_id === parseInt(selectedRegion)
    
    // Text search in title and content
    const matchesSearch = !searchQuery || 
      story.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.content?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCategory && matchesRegion && matchesSearch
  })

  // Handle search button click
  const handleSearch = (e) => {
    e.preventDefault()
    setSearchQuery(searchInput)
  }

  // Group stories by region for map markers
  // If externalStoriesByRegion is provided, use it directly (for StoryDetail)
  // Otherwise, filter and group stories
  const storiesByRegion = externalStoriesByRegion || filteredStories.reduce((acc, story) => {
    if (story.region_name) {
      if (!acc[story.region_name]) {
        acc[story.region_name] = []
      }
      acc[story.region_name].push(story)
    }
    return acc
  }, {})

  // Handle state click on map
  const handleStateClick = (stateName) => {
    // If external handler provided, use it
    if (externalOnStateClick) {
      externalOnStateClick(stateName)
    } else {
      // Otherwise, filter by region internally
      const region = regions.find((r) => r.name === stateName)
      if (region) {
        setSelectedRegion(region.id.toString())
      }
    }
  }

  // Handle story click - show modal instead of navigating
  const handleStoryClick = (story) => {
    if (externalOnStoryClick) {
      externalOnStoryClick(story)
    } else {
      // Show modal with story details
      setSelectedStory(story)
    }
  }
  
  // Truncate content for modal preview
  const truncateContent = (content, maxLength = 200) => {
    if (!content) return ''
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength).trim() + '...'
  }

  return (
    <div className="w-full">
      {/* Filter Controls - Only show if showFilters is true */}
      {showFilters && (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex items-center gap-2 text-gray-700 mb-4">
            <FaFilter className="text-green-700" />
            <span className="font-medium">Filters:</span>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* Search Box */}
            <div className="flex-1 w-full md:w-auto">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Stories
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
                  placeholder="Search by title or content..."
                  className="w-full md:w-80 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-500"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="flex-1 w-full md:w-auto">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
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
            
            {/* Region Filter */}
            <div className="flex-1 w-full md:w-auto">
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                id="region"
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
            
            {/* Search Button */}
            <div className="w-full md:w-auto">
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition-colors flex items-center justify-center gap-2"
              >
                <FaSearch />
                Search
              </button>
            </div>
          </div>
          
          {/* Results Count and Reset */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
            </div>
            {(selectedCategory || selectedRegion || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('')
                  setSelectedRegion('')
                  setSearchInput('')
                  setSearchQuery('')
                }}
                className="text-sm text-green-700 hover:text-green-800 font-medium px-3 py-1 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        </form>
      </div>
      )}

      {/* Map */}
      {showFilters ? (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 h-96 lg:h-[600px]">
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
              />
            )}
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
            />
          )}
        </>
      )}
      
      {/* Story Detail Modal */}
      {selectedStory && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedStory(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FaMapMarkerAlt className="text-gray-400 text-sm" />
                    <span className="text-sm text-gray-600">
                      {selectedStory.region_name || 'Unknown Location'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedStory.title}
                  </h2>
                  {selectedStory.category_name && (
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                      {selectedStory.category_name}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedStory(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl ml-4"
                >
                  <FaTimes />
                </button>
              </div>
              
              {/* Content */}
              <div className="mb-4">
                <p className="text-gray-700 leading-relaxed">
                  {truncateContent(selectedStory.content)}
                </p>
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {selectedStory.author_name && (
                    <span>By {selectedStory.author_name}</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    const slug = `${selectedStory.id}-${generateSlug(selectedStory.title)}`
                    navigate(`/stories/${slug}`)
                    setSelectedStory(null)
                  }}
                  className="text-gray-700 font-medium hover:text-gray-900 transition-colors flex items-center gap-1"
                >
                  Read more <span>&gt;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IndiaMap
