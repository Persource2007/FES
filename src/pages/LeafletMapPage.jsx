import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FaFilter, FaSearch, FaMapMarkerAlt, FaTimes } from 'react-icons/fa'
import { generateSlug } from '../utils/slug'
import apiClient from '../utils/api'
import { API_ENDPOINTS } from '../utils/constants'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

// Hide Leaflet attribution and fix z-index for header dropdown
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    .leaflet-control-attribution {
      display: none !important;
    }
    .leaflet-container {
      z-index: 1 !important;
      height: 100% !important;
      width: 100% !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      display: block !important;
      background-color: #f0f0f0 !important;
      touch-action: none !important;
    }
    .leaflet-touch .leaflet-control-layers,
    .leaflet-touch .leaflet-bar {
      border: 2px solid rgba(0,0,0,0.2) !important;
      background-clip: padding-box !important;
    }
    .leaflet-touch .leaflet-bar a {
      width: 30px !important;
      height: 30px !important;
      line-height: 30px !important;
    }
    .leaflet-pane {
      z-index: 1 !important;
    }
    .leaflet-top, .leaflet-bottom {
      z-index: 2 !important;
    }
    .leaflet-map-pane {
      height: 100% !important;
      width: 100% !important;
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
  const [loading, setLoading] = useState(true)
  const [worldBorders, setWorldBorders] = useState(null)
  
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Map ref
  const mapRef = useRef(null)
  
  // Tooltip state for custom tooltip like India SVG map
  const [tooltip, setTooltip] = useState(null)
  const mapContainerRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)

  // Fetch data on mount
  useEffect(() => {
    fetchStories()
    fetchCategories()
    fetchWorldBorders()
  }, [])

  // Fix map sizing on mobile after data loads and container becomes visible
  useEffect(() => {
    if (!loading && mapContainerRef.current) {
      // Delay to ensure container is fully rendered and visible (especially on mobile)
      const timer = setTimeout(() => {
        // Check container dimensions
        const rect = mapContainerRef.current.getBoundingClientRect()
        console.log('Map container dimensions:', { width: rect.width, height: rect.height })
        
        // Ensure container has valid dimensions
        if (rect.width > 0 && rect.height > 0) {
          // Mark map as ready to render
          setMapReady(true)
          
          // Trigger resize event to invalidate map size
          window.dispatchEvent(new Event('resize'))
          
          // Also invalidate map directly if ref is available
          if (mapRef.current && mapRef.current.leafletElement) {
            mapRef.current.leafletElement.invalidateSize()
            console.log('Map size invalidated after container check')
          }
        } else {
          console.warn('Map container has invalid dimensions:', rect)
          // Retry after a longer delay
          setTimeout(() => {
            const retryRect = mapContainerRef.current?.getBoundingClientRect()
            if (retryRect && retryRect.width > 0 && retryRect.height > 0) {
              setMapReady(true)
            }
          }, 1000)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [loading])

  // Fetch world country borders from a reliable source
  const fetchWorldBorders = async () => {
    try {
      // Using Natural Earth data via GitHub
      const response = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      if (response.ok) {
        const data = await response.json()
        // Filter out India, neighboring countries, and disputed territories
        // Filter out India, neighboring countries, and disputed territories
        const excludeCountries = ['india', 'pakistan', 'china', 'nepal', 'bangladesh', 'myanmar', 'bhutan', 'siachen', 'aksai', 'kashmir', 'jammu', 'arunachal', 'tibet', 'sri lanka']
        const filteredData = {
          ...data,
          features: data.features.filter(f => {
            const props = f.properties || {}
            const name = (props.ADMIN || props.name || props.NAME || props.SOVEREIGNT || props.sovereignt || '').toLowerCase()
            return !excludeCountries.some(country => name.includes(country))
          })
        }
        setWorldBorders(filteredData)
      }
    } catch (error) {
      console.warn('Error fetching world borders:', error)
    }
  }

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

  // Removed auto-zoom functionality - user can manually zoom/pan the map

  // Create GeoJSON features for stories
  const createGeoJSONFeatures = () => {
    const features = []
    
    // Use story-specific lat/long if available, otherwise fall back to state center
    filteredStories.forEach((story) => {
      let lat, lon
      
      // Check if story has specific latitude and longitude
      if (story.latitude && story.longitude) {
        lat = parseFloat(story.latitude)
        lon = parseFloat(story.longitude)
      } else if (story.state_name) {
        // Fall back to state center if no specific coordinates
        const coords = STATE_COORDINATES[story.state_name]
        if (coords) {
          [lat, lon] = coords
        } else {
          // Skip if no state coordinates available
          return
        }
      } else {
        // Skip if no location data at all
        return
      }
      
      // Only add feature if we have valid coordinates
      if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
        features.push({
          type: 'Feature',
          properties: {
            storyId: story.id,
            title: story.title,
            state: story.state_name,
            category: story.category_name,
            slug: story.slug || generateSlug(story.title),
            story: story, // Include full story data for tooltip
          },
          geometry: {
            type: 'Point',
            coordinates: [lon, lat], // GeoJSON format: [longitude, latitude]
          },
        })
      }
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

  // Event handlers for GeoJSON - custom tooltip like India SVG map
  const onEachFeature = (feature, layer) => {
    if (feature.properties) {
      // Add click handler to show custom tooltip
      layer.on('click', (e) => {
        L.DomEvent.stopPropagation(e)
        const story = feature.properties.story
        if (story && mapContainerRef.current) {
          const containerRect = mapContainerRef.current.getBoundingClientRect()
          const x = e.originalEvent.clientX - containerRect.left
          const y = e.originalEvent.clientY - containerRect.top
          setTooltip({ story, x, y })
        }
      })
    }
  }
  
  // Component to handle map events for closing tooltip
  const MapEventHandler = () => {
    const map = useMap()
    useEffect(() => {
      const handleMapEvent = () => setTooltip(null)
      map.on('click', handleMapEvent)
      map.on('zoomstart', handleMapEvent)
      map.on('movestart', handleMapEvent)
      return () => {
        map.off('click', handleMapEvent)
        map.off('zoomstart', handleMapEvent)
        map.off('movestart', handleMapEvent)
      }
    }, [map])
    return null
  }

  // Component to handle map resize and invalidation (fixes mobile loading issues)
  const MapResizeHandler = () => {
    const map = useMap()
    useEffect(() => {
      // Invalidate size when component mounts (fixes mobile loading)
      // Use longer delay to ensure container is fully rendered, especially on mobile
      const timer = setTimeout(() => {
        const container = map.getContainer()
        const size = map.getSize()
        console.log('MapResizeHandler: Container info', {
          containerWidth: container.offsetWidth,
          containerHeight: container.offsetHeight,
          mapSize: size,
          viewport: map.getSize(),
        })
        
        map.invalidateSize()
        console.log('MapResizeHandler: Map size invalidated')
        
        // Double-check and invalidate again after a short delay (mobile fix)
        setTimeout(() => {
          map.invalidateSize()
          const newSize = map.getSize()
          console.log('MapResizeHandler: Map size invalidated (retry), new size:', newSize)
        }, 200)
      }, 500)

      // Handle window resize
      const handleResize = () => {
        map.invalidateSize()
      }
      window.addEventListener('resize', handleResize)

      // Handle orientation change on mobile
      const handleOrientationChange = () => {
        setTimeout(() => {
          map.invalidateSize()
          console.log('MapResizeHandler: Orientation changed, size invalidated')
        }, 500)
      }
      window.addEventListener('orientationchange', handleOrientationChange)

      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('orientationchange', handleOrientationChange)
      }
    }, [map])
    return null
  }

  const geoJSONData = createGeoJSONFeatures()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full">
          <div className="bg-white rounded-lg shadow-lg border border-gray-300 overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-0" style={{ minHeight: '400px' }}>
          {/* Filter Controls - Left Side */}
          <div className="w-full lg:w-80 xl:w-96 bg-white border border-gray-300 lg:border-r lg:border-b-0 border-b flex flex-col max-h-[500px] lg:max-h-[700px]">
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
          <div 
            className="flex-1 relative w-full h-[400px] sm:h-[500px] lg:h-[700px] min-h-[400px]" 
            ref={mapContainerRef}
            style={{ touchAction: 'none' }}
          >
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
                  <p className="text-gray-700">Loading map...</p>
                </div>
              </div>
            ) : !mapReady ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
                  <p className="text-gray-700">Initializing map...</p>
                </div>
              </div>
            ) : (
              <MapContainer
                key="leaflet-map"
                center={[22.0, 78.9629]} // Adjusted center to show all of India including Kashmir and Kanyakumari
                zoom={4.5}
                minZoom={4}
                maxZoom={19}
                style={{ 
                  height: '100%', 
                  width: '100%', 
                  display: 'block', 
                  touchAction: 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0
                }}
                ref={mapRef}
                attributionControl={false}
                scrollWheelZoom={true}
                touchZoom={true}
                dragging={true}
                doubleClickZoom={true}
                zoomControl={true}
                whenReady={(map) => {
                  // Ensure map is properly sized when ready (fixes mobile loading)
                  const leafletMap = map.target
                  
                  // Log map container info for debugging
                  const container = leafletMap.getContainer()
                  const containerRect = container.getBoundingClientRect()
                  const mapSize = leafletMap.getSize()
                  
                  console.log('Map whenReady - Container info:', {
                    containerWidth: container.offsetWidth,
                    containerHeight: container.offsetHeight,
                    clientWidth: container.clientWidth,
                    clientHeight: container.clientHeight,
                    boundingRect: containerRect,
                    mapSize: mapSize,
                    center: leafletMap.getCenter(),
                    zoom: leafletMap.getZoom(),
                  })
                  
                  // Invalidate size multiple times for mobile
                  setTimeout(() => {
                    leafletMap.invalidateSize()
                    console.log('Map ready and size invalidated (1st)')
                    
                    // Second invalidation for mobile
                    setTimeout(() => {
                      leafletMap.invalidateSize()
                      const newSize = leafletMap.getSize()
                      console.log('Map ready and size invalidated (2nd), new size:', newSize)
                      
                      // Force a view reset to ensure tiles load
                      leafletMap.setView(leafletMap.getCenter(), leafletMap.getZoom(), { animate: false })
                    }, 300)
                  }, 200)
                }}
              >
                 {/* CartoDB Voyager basemap: Provides a colorful yet clean background that highlights data overlays, similar to the Myna: State of India's Birds design style */}
                 <TileLayer
                   attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                   url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                   subdomains="abcd"
                   maxZoom={19}
                   minZoom={4}
                   errorTileUrl=""
                   crossOrigin={true}
                 />
                <StateZoomUpdater selectedState={selectedRegion} />
                <MapEventHandler />
                <MapResizeHandler />
                
                {/* World country borders */}
                {worldBorders && (
                  <GeoJSON
                    key="world-borders"
                    data={worldBorders}
                    style={() => ({
                      color: '#718096',
                      weight: 1,
                      opacity: 0.6,
                      fillColor: 'transparent',
                      fillOpacity: 0
                    })}
                  />
                )}
                
                
                {/* Story markers */}
                {geoJSONData.features.length > 0 && (
                  <GeoJSON
                    data={geoJSONData}
                    pointToLayer={pointToLayer}
                    onEachFeature={onEachFeature}
                  />
                )}
              </MapContainer>
            )}
            
            {/* Custom Tooltip - Same as India SVG Map */}
            {tooltip && tooltip.story && (() => {
              const containerHeight = mapContainerRef.current?.offsetHeight || 600
              const tooltipHeight = 180 // Approximate tooltip height
              const isNearBottom = tooltip.y > containerHeight - tooltipHeight - 50
              const showAbove = isNearBottom
              
              return (
              <div
                className="absolute bg-white rounded-lg shadow-xl z-[1000] pointer-events-auto"
                style={{
                  left: `${Math.min(Math.max(tooltip.x, 160), mapContainerRef.current?.offsetWidth - 160 || 160)}px`,
                  top: showAbove ? `${tooltip.y - tooltipHeight - 15}px` : `${tooltip.y + 15}px`,
                  transform: 'translateX(-50%)',
                  width: '320px',
                  maxWidth: '90vw',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Tooltip pointer pointing to marker */}
                <div
                  className="absolute"
                  style={{
                    left: '50%',
                    [showAbove ? 'bottom' : 'top']: '-8px',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    [showAbove ? 'borderTop' : 'borderBottom']: '8px solid white',
                    filter: `drop-shadow(0 ${showAbove ? '2px' : '-2px'} 2px rgba(0, 0, 0, 0.1))`,
                  }}
                />
                <div className="flex">
                  {/* Left Panel - Content */}
                  <div className="flex-1 p-3 pr-2">
                    {/* Title - Limited to 2 lines */}
                    <h3 className="text-sm font-bold text-black mb-1.5 line-clamp-2">
                      {tooltip.story.title}
                    </h3>
                    
                    {/* Category - Under title */}
                    {tooltip.story.category_name && (
                      <div className="mb-2">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                          {tooltip.story.category_name}
                        </span>
                      </div>
                    )}
                    
                    {/* Location with map pin icon */}
                    {(tooltip.story.village_name || tooltip.story.panchayat_name || tooltip.story.block_name || tooltip.story.district_name || tooltip.story.state_name) && (
                      <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-700">
                        <FaMapMarkerAlt className="text-xs text-gray-500 flex-shrink-0" />
                        <span className="line-clamp-1">
                          {[tooltip.story.village_name, tooltip.story.panchayat_name, tooltip.story.block_name, tooltip.story.district_name, tooltip.story.state_name].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    
                    {/* Description/Content */}
                    {tooltip.story.content && (
                      <p className="text-xs text-gray-700 mb-2 line-clamp-2">
                        {tooltip.story.content}
                      </p>
                    )}
                    
                    {/* Read more link */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        const slug = tooltip.story.slug || generateSlug(tooltip.story.title)
                        navigate(`/stories/${slug}`)
                        setTooltip(null)
                      }}
                      className="text-xs text-gray-700 hover:text-gray-900 font-medium flex items-center gap-1"
                    >
                      Read more <span>&gt;</span>
                    </button>
                  </div>
                  
                  {/* Right Panel */}
                  <div className="w-24 flex flex-col items-end p-3 pl-2">
                    {/* Close button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setTooltip(null)
                      }}
                      className="text-gray-400 hover:text-gray-600 mb-2"
                    >
                      <FaTimes className="text-base" />
                    </button>
                    
                    {/* Image placeholder */}
                    <div className="w-full aspect-square bg-gray-200 rounded-md overflow-hidden relative">
                      {tooltip.story.photo_url ? (
                        <img
                          src={tooltip.story.photo_url}
                          alt={tooltip.story.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            const placeholder = e.target.nextElementSibling
                            if (placeholder) {
                              placeholder.style.display = 'block'
                            }
                          }}
                        />
                      ) : null}
                      <img
                        src="/people/people1.png"
                        alt="Placeholder"
                        className="w-full h-full object-cover"
                        style={{ 
                          display: tooltip.story.photo_url ? 'none' : 'block'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              )
            })()}
          </div>
        </div>
      </div>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  )
}

export default LeafletMapPage

