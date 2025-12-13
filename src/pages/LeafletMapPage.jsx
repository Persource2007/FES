import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FaFilter, FaSearch, FaMapMarkerAlt } from 'react-icons/fa'
import { generateSlug } from '../utils/slug'
import apiClient from '../utils/api'
import { API_ENDPOINTS } from '../utils/constants'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

// Hide Leaflet attribution
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    .leaflet-control-attribution {
      display: none !important;
    }
  `
  document.head.appendChild(style)
}

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Accurate coordinates for Indian states (centers for markers)
const STATE_COORDINATES = {
  'Andhra Pradesh': [15.9129, 79.7400],
  'Arunachal Pradesh': [28.2180, 94.7278],
  'Assam': [26.2006, 92.9376],
  'Bihar': [25.0961, 85.3131],
  'Chhattisgarh': [21.2787, 81.8661],
  'Goa': [15.2993, 74.1240],
  'Gujarat': [23.0225, 72.5714],
  'Haryana': [29.0588, 76.0856],
  'Himachal Pradesh': [31.1048, 77.1734],
  'Jharkhand': [23.6102, 85.2799],
  'Karnataka': [15.3173, 75.7139],
  'Kerala': [10.8505, 76.2711],
  'Madhya Pradesh': [22.9734, 78.6569],
  'Maharashtra': [19.7515, 75.7139],
  'Manipur': [24.6637, 93.9063],
  'Meghalaya': [25.4670, 91.3662],
  'Mizoram': [23.1645, 92.9376],
  'Nagaland': [26.1584, 94.5624],
  'Odisha': [20.9517, 85.0985],
  'Punjab': [31.1471, 75.3412],
  'Rajasthan': [27.0238, 74.2179],
  'Sikkim': [27.5330, 88.5122],
  'Tamil Nadu': [11.1271, 78.6569],
  'Telangana': [18.1124, 79.0193],
  'Tripura': [23.9408, 91.9882],
  'Uttar Pradesh': [26.8467, 80.9462],
  'Uttarakhand': [30.0668, 79.0193],
  'West Bengal': [22.9868, 87.8550],
  'Delhi': [28.6139, 77.2090],
  'Jammu and Kashmir': [34.0837, 74.7973],
  'Ladakh': [34.1526, 77.5770],
  'Puducherry': [11.9416, 79.8083],
  'Andaman and Nicobar Islands': [11.7401, 92.6586],
  'Chandigarh': [30.7333, 76.7794],
  'Dadra and Nagar Haveli and Daman and Diu': [20.1809, 73.0169],
  'Lakshadweep': [10.5667, 72.6417],
}

// Component to handle zooming to state when state filter changes
function StateZoomUpdater({ selectedState }) {
  const map = useMap()
  const prevStateRef = useRef(null)
  
  useEffect(() => {
    // Only zoom if state filter has changed and a state is selected
    if (selectedState && selectedState !== prevStateRef.current) {
      prevStateRef.current = selectedState
      
      // Get coordinates for the selected state
      const coords = STATE_COORDINATES[selectedState]
      if (coords) {
        const [lat, lon] = coords
        // Zoom to state level (zoom 7 is good for state-level view)
        map.flyTo([lat, lon], 7, { duration: 1.5 })
      }
    } else if (!selectedState && prevStateRef.current) {
      // If state filter is cleared, zoom back to India overview
      prevStateRef.current = null
      map.flyTo([22.0, 78.9629], 4.5, { duration: 1.5 })
    }
  }, [selectedState, map])
  
  return null
}

function LeafletMapPage() {
  const navigate = useNavigate()
  
  // State for data
  const [stories, setStories] = useState([])
  const [categories, setCategories] = useState([])
  const [regions, setRegions] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Map ref
  const mapRef = useRef(null)

  // Fetch data on mount
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

  // Get unique states from stories for the filter dropdown
  const uniqueStates = [...new Set(stories.filter(s => s.state_name).map(s => s.state_name))].sort()

  // Filter stories based on selected category, state, and search query
  const filteredStories = stories.filter((story) => {
    const matchesCategory = !selectedCategory || story.category_id === parseInt(selectedCategory)
    const matchesState = !selectedRegion || story.state_name === selectedRegion
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
  const storiesByRegion = filteredStories.reduce((acc, story) => {
    if (story.state_name) {
      if (!acc[story.state_name]) {
        acc[story.state_name] = []
      }
      acc[story.state_name].push(story)
    }
    return acc
  }, {})

  // Removed auto-zoom functionality - user can manually zoom/pan the map

  // Handle state click on map
  const handleStateClick = (stateName) => {
    setSelectedRegion(stateName)
  }

  // Handle story click - navigate directly to story detail page
  const handleStoryClick = (story) => {
    const slug = story.slug || generateSlug(story.title)
    navigate(`/stories/${slug}`)
  }

  // Create GeoJSON features for stories
  const createGeoJSONFeatures = () => {
    const features = []
    
    Object.entries(storiesByRegion).forEach(([stateName, stateStories]) => {
      const coords = STATE_COORDINATES[stateName]
      if (!coords) return
      
      // Create a feature for each story in the state
      stateStories.forEach((story, index) => {
        // Offset markers slightly to avoid overlap
        const offset = index * 0.01
        const [lat, lon] = coords
        
        features.push({
          type: 'Feature',
          properties: {
            storyId: story.id,
            title: story.title,
            state: stateName,
            category: story.category_name,
            slug: story.slug || generateSlug(story.title),
          },
          geometry: {
            type: 'Point',
            coordinates: [lon + offset, lat + offset],
          },
        })
      })
    })
    
    return {
      type: 'FeatureCollection',
      features,
    }
  }

  // Style function for GeoJSON markers
  const pointToLayer = (feature, latlng) => {
    return L.marker(latlng, {
      icon: L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    })
  }

  // Event handlers for GeoJSON
  const onEachFeature = (feature, layer) => {
    if (feature.properties) {
      const { title, state, category, slug } = feature.properties
      
      // Add popup
      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">${title}</h3>
          <div style="margin-bottom: 8px;">
            ${category ? `<span style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-right: 4px;">${category}</span>` : ''}
            ${state ? `<span style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${state}</span>` : ''}
          </div>
          <a href="/stories/${slug}" style="color: #059669; text-decoration: none; font-size: 12px; font-weight: 500;">Read more →</a>
        </div>
      `
      layer.bindPopup(popupContent)
      
      // Add click handler
      layer.on('click', () => {
        const story = filteredStories.find(s => s.id === feature.properties.storyId)
        if (story) {
          handleStoryClick(story)
        }
      })
    }
  }

  const geoJSONData = createGeoJSONFeatures()

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full">
          <div className="bg-white rounded-lg shadow-lg border border-gray-300 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Filter Controls - Left Side */}
          <div className="w-full lg:w-80 xl:w-96 bg-white border-r border-gray-300 flex flex-col max-h-[700px]">
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

            {/* Filtered Stories List */}
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
          <div className="flex-1 relative h-96 lg:h-[700px]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
                  <p className="text-gray-700">Loading map...</p>
                </div>
              </div>
            ) : (
              <MapContainer
                center={[22.0, 78.9629]} // Adjusted center to show all of India including Kashmir and Kanyakumari
                zoom={4.5}
                minZoom={4}
                maxZoom={19}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
                attributionControl={false}
              >
                 <TileLayer
                   attribution=""
                   url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                 />
                <StateZoomUpdater selectedState={selectedRegion} />
                {geoJSONData.features.length > 0 && (
                  <GeoJSON
                    data={geoJSONData}
                    pointToLayer={pointToLayer}
                    onEachFeature={onEachFeature}
                  />
                )}
              </MapContainer>
            )}
          </div>
        </div>
      </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default LeafletMapPage

