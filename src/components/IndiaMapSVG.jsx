import { useState, useEffect, useRef } from 'react'
import { FaMapMarkerAlt, FaTimes, FaPlus, FaMinus } from 'react-icons/fa'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { geoBounds } from 'd3-geo'

// Utility function to convert state name to filename
const getStateFileName = (stateName) => {
  if (!stateName) return null
  return stateName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// State name mappings for variations
const STATE_NAME_MAPPINGS = {
  'Odisha': 'orissa',
  'Uttarakhand': 'uttaranchal',
  'Dadra and Nagar Haveli and Daman and Diu': 'd-dra-and-nagar-haveli-and-dam-n-and-diu',
  'Andaman and Nicobar Islands': 'andaman-and-nicobar',
}

// Accurate coordinates for Indian states (centers for markers) - normalized to SVG viewBox (0 0 1000 1000)
// Conversion: India bounds ~6.5°N-37°N (lat), ~68°E-97°E (lon)
// X = (longitude - 68) * (1000 / 29), Y = (37 - latitude) * (1000 / 30.5)
const STATE_COORDINATES = {
  'Andhra Pradesh': { x: 404, y: 691 }, // 15.9129°N, 79.7400°E
  'Arunachal Pradesh': { x: 921, y: 288 }, // 28.2179°N, 94.7278°E
  'Assam': { x: 860, y: 354 }, // 26.2006°N, 92.9376°E
  'Bihar': { x: 596, y: 390 }, // 25.0961°N, 85.3131°E
  'Chhattisgarh': { x: 479, y: 515 }, // 21.2787°N, 81.8661°E
  'Goa': { x: 211, y: 711 }, // 15.2993°N, 74.1240°E
  'Gujarat': { x: 110, y: 483 }, // 22.2587°N, 71.1924°E
  'Haryana': { x: 279, y: 260 }, // 29.0588°N, 76.0856°E
  'Himachal Pradesh': { x: 316, y: 193 }, // 31.1048°N, 77.1734°E
  'Jharkhand': { x: 595, y: 439 }, // 23.6102°N, 85.2799°E
  'Karnataka': { x: 266, y: 711 }, // 15.3173°N, 75.7139°E
  'Kerala': { x: 286, y: 857 }, // 10.8505°N, 76.2711°E
  'Madhya Pradesh': { x: 367, y: 460 }, // 22.9734°N, 78.6569°E
  'Maharashtra': { x: 266, y: 565 }, // 19.7515°N, 75.7139°E
  'Manipur': { x: 893, y: 404 }, // 24.6637°N, 93.9063°E
  'Meghalaya': { x: 806, y: 378 }, // 25.4670°N, 91.3662°E
  'Mizoram': { x: 860, y: 454 }, // 23.1645°N, 92.9376°E
  'Nagaland': { x: 916, y: 355 }, // 26.1584°N, 94.5624°E
  'Odisha': { x: 590, y: 525 }, // 20.9517°N, 85.0985°E
  'Punjab': { x: 253, y: 194 }, // 31.1471°N, 75.3412°E
  'Rajasthan': { x: 214, y: 327 }, // 27.0238°N, 74.2179°E
  'Sikkim': { x: 707, y: 312 }, // 27.5330°N, 88.5122°E
  'Tamil Nadu': { x: 367, y: 848 }, // 11.1271°N, 78.6569°E
  'Telangana': { x: 380, y: 618 }, // 18.1124°N, 79.0193°E
  'Tripura': { x: 827, y: 428 }, // 23.9408°N, 91.9882°E
  'Uttar Pradesh': { x: 446, y: 333 }, // 26.8467°N, 80.9462°E
  'Uttarakhand': { x: 380, y: 227 }, // 30.0668°N, 79.0193°E
  'West Bengal': { x: 685, y: 460 }, // 22.9868°N, 87.8550°E
  'Andaman and Nicobar Islands': { x: 950, y: 900 }, // Approximate
  'Chandigarh': { x: 280, y: 260 }, // Approximate - near Haryana
  'Dadra and Nagar Haveli and Daman and Diu': { x: 150, y: 550 }, // Approximate - near Gujarat
  'Delhi': { x: 280, y: 280 }, // Approximate - near Haryana
  'Jammu and Kashmir': { x: 300, y: 100 }, // Approximate
  'Ladakh': { x: 280, y: 80 }, // Approximate
  'Lakshadweep': { x: 100, y: 850 }, // Approximate
  'Puducherry': { x: 370, y: 850 }, // Approximate - near Tamil Nadu
}

function IndiaMapSVG({ storiesByRegion, onStateClick, onStoryClick, focusedState: externalFocusedState, onResetFilters, selectedStateFromFilter }) {
  const [tooltip, setTooltip] = useState(null)
  const tooltipTimeoutRef = useRef(null)
  const [geoData, setGeoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedState, setExpandedState] = useState(null) // State showing individual story markers
  const [zoomState, setZoomState] = useState({ center: [77.5, 22], zoom: 1 })
  const [stateSizes, setStateSizes] = useState({}) // Store calculated state sizes
  
  // Use external focusedState if provided, otherwise use expandedState
  const activeFocusedState = externalFocusedState || expandedState
  const [projectionConfig, setProjectionConfig] = useState({
    center: [77.5, 22], // Approximate center of India
    scale: 650, // Reduced scale for smaller default map
  })
  
  // Calculate state sizes from GeoJSON data
  useEffect(() => {
    if (geoData && geoData.features) {
      const sizes = {}
      geoData.features.forEach((feature) => {
        const stateName = feature.properties?.name || feature.properties?.NAME_1 || ''
        if (stateName) {
          try {
            const bounds = geoBounds(feature)
            const [[x0, y0], [x1, y1]] = bounds
            // Calculate approximate area (in square degrees, as a proxy)
            const width = x1 - x0
            const height = y1 - y0
            const area = width * height
            sizes[stateName] = area
          } catch (e) {
            // If bounds calculation fails, use default size
            sizes[stateName] = 1
          }
        }
      })
      setStateSizes(sizes)
    }
  }, [geoData])
  
  // Calculate marker size based on state area
  const getMarkerSize = (stateName) => {
    const area = stateSizes[stateName] || 1
    // Find min and max areas for normalization
    const areas = Object.values(stateSizes)
    if (areas.length === 0) return 20 // Default size
    
    const minArea = Math.min(...areas)
    const maxArea = Math.max(...areas)
    
    // Normalize to size range: 16px (small states) to 32px (large states)
    if (maxArea === minArea) return 20 // All same size
    
    const normalized = (area - minArea) / (maxArea - minArea)
    const size = 16 + (normalized * 16) // Range: 16-32px
    return Math.round(size)
  }

  // Load GeoJSON data and calculate bounding box
  useEffect(() => {
    const loadGeoJSON = async () => {
      try {
        setLoading(true)
        
        // If external focusedState or expandedState is provided, load individual state file
        const stateToLoad = externalFocusedState || expandedState
        let url = '/india-map.geojson'
        if (stateToLoad) {
          const stateFileName = STATE_NAME_MAPPINGS[stateToLoad] || getStateFileName(stateToLoad)
          if (stateFileName) {
            url = `/states/${stateFileName}.json`
          }
        }
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to load GeoJSON file: ${url}`)
        }
        const data = await response.json()
        setGeoData(data)
        
        // Calculate bounding box from GeoJSON to fit entire map
        if (data.features && data.features.length > 0) {
          let minLon = Infinity, maxLon = -Infinity
          let minLat = Infinity, maxLat = -Infinity
          
          data.features.forEach((feature) => {
            const coordinates = feature.geometry.coordinates
            const processCoordinates = (coords) => {
              if (Array.isArray(coords[0])) {
                coords.forEach(processCoordinates)
              } else if (coords.length >= 2) {
                const [lon, lat] = coords
                minLon = Math.min(minLon, lon)
                maxLon = Math.max(maxLon, lon)
                minLat = Math.min(minLat, lat)
                maxLat = Math.max(maxLat, lat)
              }
            }
            processCoordinates(coordinates)
          })
          
          // Calculate center and scale to fit entire bounding box
          const centerLon = (minLon + maxLon) / 2
          const centerLat = (minLat + maxLat) / 2
          const lonRange = maxLon - minLon
          const latRange = maxLat - minLat
          
          // Calculate scale - use different multipliers for full map vs single state
          const maxRange = Math.max(lonRange, latRange)
          let calculatedScale
          
          if (stateToLoad) {
            // For single state, calculate scale to fit within the actual container with padding
            // Container dimensions: h-96 (384px) on mobile, lg:h-[600px] (600px) on large screens
            // Width is flex-1 (varies based on viewport and filter sidebar)
            
            // Default container dimensions (conservative estimates)
            // On large screens: ~600px height, width varies but typically 800-1200px
            const containerHeight = 600 // lg:h-[600px]
            const containerWidth = 900 // Estimated flex-1 width on large screens (conservative)
            
            // Padding on all sides (top, bottom, left, right) - 8% on each side = 16% total
            const paddingPercent = 0.16 // 16% total padding (8% each side)
            const availableWidth = containerWidth * (1 - paddingPercent)
            const availableHeight = containerHeight * (1 - paddingPercent)
            
            // Account for Mercator projection distortion at different latitudes
            // Mercator stretches horizontally as you move away from equator
            const latAdjustment = Math.cos((centerLat * Math.PI) / 180)
            const adjustedLonRange = lonRange * latAdjustment
            
            // Calculate scale based on which dimension constrains the view
            // We need to fit the state's bounding box (with padding) into the available container space
            let scaleMultiplier
            
            // Compare adjusted aspect ratios
            const adjustedStateAspectRatio = adjustedLonRange / latRange
            const availableAspectRatio = availableWidth / availableHeight
            
            // Calculate scale for both dimensions and use the smaller one to ensure it fits
            const scaleForWidth = (availableWidth / adjustedLonRange) * 100
            const scaleForHeight = (availableHeight / latRange) * 100
            
            // Use the smaller scale to ensure the state fits in both dimensions
            scaleMultiplier = Math.min(scaleForWidth, scaleForHeight)
            
            // For state files, the coordinates might be in a different scale than the full India map
            // State files typically have coordinates that are more zoomed in, so we need a higher scale
            // Multiply by a factor to account for the difference in coordinate ranges
            // State files usually have coordinates in a smaller range, so we need larger scale values
            const stateFileScaleFactor = 8 // Adjust this based on actual state file coordinate ranges
            
            scaleMultiplier = scaleMultiplier * stateFileScaleFactor
            
            // Clamp scale to reasonable bounds, but allow higher values for state files
            calculatedScale = Math.max(800, Math.min(5000, scaleMultiplier))
            
            console.log('State scale calculation:', {
              lonRange,
              latRange,
              adjustedLonRange,
              centerLat,
              latAdjustment,
              scaleForWidth,
              scaleForHeight,
              scaleMultiplier,
              calculatedScale,
              containerWidth,
              containerHeight,
              availableWidth,
              availableHeight
            })
          } else {
            // For full map, use smaller scale
            calculatedScale = Math.max(500, Math.min(900, 750 / maxRange * 100))
          }
          
          setProjectionConfig({
            center: [centerLon || 77.5, centerLat || 22],
            scale: calculatedScale || 650, // Fallback to 650 if calculation fails
          })
          
          // Set zoom state for single state view - keep zoom at 1 to fit the state
          if (stateToLoad && data.features.length === 1) {
            const bounds = geoBounds(data.features[0])
            const [[x0, y0], [x1, y1]] = bounds
            const stateCenterLon = (x0 + x1) / 2
            const stateCenterLat = (y0 + y1) / 2
            // Keep zoom at 1 to ensure state fits within container
            // The scale calculation above handles the fitting
            setZoomState({ center: [stateCenterLon, stateCenterLat], zoom: 1 })
          }
          
          console.log('Map bounds calculated:', {
            minLon, maxLon, minLat, maxLat,
            center: [centerLon, centerLat],
            scale: calculatedScale,
            lonRange,
            latRange,
            stateToLoad
          })
        }
        
        setError(null)
      } catch (err) {
        console.error('Error loading GeoJSON:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadGeoJSON()
    
    // Cleanup timeout on unmount
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current)
      }
    }
  }, [externalFocusedState, expandedState])

  // Reset to full map view when expandedState is cleared
  useEffect(() => {
    if (!expandedState && !externalFocusedState) {
      // Reset to initial view only if no external focusedState
      setZoomState({ center: [77.5, 22], zoom: 1 })
      setTooltip(null) // Clear tooltip when returning to main map
    }
  }, [expandedState, externalFocusedState])
  
  // Sync expandedState with selectedStateFromFilter (from left filter)
  useEffect(() => {
    if (selectedStateFromFilter && !externalFocusedState) {
      // If a state is selected in the filter, expand it on the map
      const stateStories = storiesByRegion[selectedStateFromFilter] || []
      if (stateStories.length > 0) {
        setExpandedState(selectedStateFromFilter)
      }
    } else if (!selectedStateFromFilter && !externalFocusedState) {
      // If filter is cleared, collapse the expanded state
      setExpandedState(null)
    }
  }, [selectedStateFromFilter, externalFocusedState, storiesByRegion])

  // Get markers for states that have stories
  const getMarkers = () => {
    const markers = []
    Object.entries(storiesByRegion).forEach(([regionName, regionStories]) => {
      // Try to find exact match first
      let coords = STATE_COORDINATES[regionName]
      
      // If not found, try partial match
      if (!coords) {
        const matchedState = Object.keys(STATE_COORDINATES).find((state) =>
          regionName.includes(state) || state.includes(regionName)
        )
        coords = matchedState ? STATE_COORDINATES[matchedState] : null
      }

      if (coords) {
        markers.push({
          name: regionName,
          x: coords.x,
          y: coords.y,
          count: regionStories.length,
        })
      }
    })
    return markers
  }

  const markers = getMarkers()

  // GeoJSON-based map rendering
  if (loading) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading map...</p>
        </div>
      </div>
    )
  }

  if (error || !geoData) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="text-center">
          <FaMapMarkerAlt className="text-6xl text-green-700 mx-auto mb-4" />
          <p className="text-gray-700 mb-2">Failed to load map</p>
          <p className="text-sm text-gray-500">{error || 'GeoJSON data not available'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full" style={{ minHeight: '100%', maxHeight: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {/* GeoJSON-based map using react-simple-maps */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={projectionConfig}
        className="w-full h-full"
        style={{ 
          width: '100%', 
          height: '100%', 
          maxWidth: '100%', 
          maxHeight: '100%',
          overflow: 'hidden'
        }}
      >
          <ZoomableGroup
            center={zoomState.center}
            zoom={zoomState.zoom}
            minZoom={externalFocusedState ? zoomState.zoom : (activeFocusedState ? 1 : 0.1)}
            maxZoom={externalFocusedState ? zoomState.zoom : (activeFocusedState ? 8 : 5)}
            filterZoomEvent={() => false}
            onMoveEnd={externalFocusedState ? undefined : ((position) => {
              setZoomState({ center: position.coordinates, zoom: position.zoom })
            })}
          >
            <Geographies geography={geoData}>
                      {({ geographies }) =>
                geographies.map((geo) => {
                  const stateName = geo.properties?.name || geo.properties?.NAME_1 || ''
                  
                  // If external focusedState is provided, only show that state
                  if (externalFocusedState && stateName !== externalFocusedState) {
                    return null
                  }
                  
                  // Check if this state has stories (with flexible matching)
                  const hasStories = markers.some((m) => {
                    const markerName = m.name.toLowerCase()
                    const geoName = stateName.toLowerCase()
                    return markerName === geoName || 
                           markerName.includes(geoName) || 
                           geoName.includes(markerName)
                  })
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={hasStories ? '#6f9c76' : '#d1d5db'}
                      stroke="#ffffff"
                      strokeWidth={0.5}
                      style={{
                        default: {
                          outline: 'none',
                        },
                        hover: {
                          fill: hasStories ? '#059669' : '#9ca3af',
                          outline: 'none',
                          cursor: 'pointer',
                        },
                        pressed: {
                          fill: hasStories ? '#047857' : '#6b7280',
                          outline: 'none',
                        },
                      }}
                      onClick={() => {
                        if (hasStories && onStateClick) {
                          onStateClick(stateName)
                        }
                      }}
                      onMouseEnter={() => {
                        // Hover effect handled by CSS
                      }}
                      onMouseLeave={() => {
                        // Hover effect handled by CSS
                      }}
                    />
                  )
                })
              }
            </Geographies>

            {/* Markers for states with stories */}
            {markers
              .filter(({ name }) => !activeFocusedState || name === activeFocusedState) // Hide other state markers when focused
              .map(({ name, count }) => {
              // Get geographic coordinates from STATE_COORDINATES
              // These are already in lat/lon format (from the comments)
              const coords = STATE_COORDINATES[name]
              if (!coords) return null

              // Convert from SVG coordinates back to lat/lon
              // Reverse of: X = (longitude - 68) * (1000 / 29), Y = (37 - latitude) * (1000 / 30.5)
              const lon = 68 + (coords.x / 1000) * 29
              const lat = 37 - (coords.y / 1000) * 30.5

              // Get stories for this region
              const regionStories = storiesByRegion[name] || []

              // If this state is expanded and has multiple stories, don't show the aggregate marker
              if (activeFocusedState === name && regionStories.length > 1 && !externalFocusedState) {
                return null
              }

              return (
                <Marker key={name} coordinates={[lon, lat]}>
                  <g
                    onClick={(e) => {
                      e.stopPropagation()
                      const rect = e.currentTarget.closest('svg')?.getBoundingClientRect()
                      if (rect) {
                        // If only one story, show tooltip with story details
                        if (regionStories.length === 1) {
                          const story = regionStories[0]
                          setTooltip({
                            name: story.title,
                            count: 1,
                            story: story,
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                          })
                        } else if (regionStories.length > 1) {
                          // Multiple stories: expand to show individual markers
                          setTooltip(null) // Clear any existing tooltip
                          setExpandedState(name)
                          // Also update the filter on the left side
                          if (onStateClick) {
                            onStateClick(name)
                          }
                        } else if (onStateClick) {
                          onStateClick(name)
                        }
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {/* Use individual marker if only one story, otherwise use state marker with proportional sizing */}
                    {(() => {
                      const markerSize = getMarkerSize(name)
                      const halfSize = markerSize / 2
                      
                      // If only one story, use individual marker with proportional sizing
                      if (regionStories.length === 1) {
                        return (
                          <image
                            href="/images/individual-marker.svg"
                            x={-halfSize}
                            y={-markerSize}
                            width={markerSize}
                            height={markerSize}
                            className="drop-shadow-lg hover:opacity-90 transition-opacity"
                            preserveAspectRatio="xMidYMid meet"
                          />
                        )
                      }
                      // For multiple stories, use state marker with proportional sizing
                      return (
                        <image
                          href="/images/state-marker.svg"
                          x={-halfSize}
                          y={-markerSize}
                          width={markerSize}
                          height={markerSize}
                          className="drop-shadow-lg"
                          preserveAspectRatio="xMidYMid meet"
                        />
                      )
                    })()}
                  </g>
                </Marker>
              )
            })}

            {/* Individual story markers when a state is expanded */}
            {activeFocusedState && storiesByRegion[activeFocusedState] && storiesByRegion[activeFocusedState].length > 1 && (
              <>
                {storiesByRegion[activeFocusedState].map((story, index) => {
                  const coords = STATE_COORDINATES[activeFocusedState]
                  if (!coords) return null

                  // Base coordinates for the state
                  const baseLon = 68 + (coords.x / 1000) * 29
                  const baseLat = 37 - (coords.y / 1000) * 30.5

                  // Add small offsets to spread markers (in degrees)
                  // Create a grid or circular pattern
                  const offsetAngle = (index * (2 * Math.PI)) / storiesByRegion[activeFocusedState].length
                  const offsetDistance = 0.3 // degrees
                  const offsetLon = baseLon + Math.cos(offsetAngle) * offsetDistance
                  const offsetLat = baseLat + Math.sin(offsetAngle) * offsetDistance

                  return (
                    <Marker key={`story-${story.id}`} coordinates={[offsetLon, offsetLat]}>
                      <g
                        onClick={(e) => {
                          e.stopPropagation()
                          const rect = e.currentTarget.closest('svg')?.getBoundingClientRect()
                          if (rect) {
                            // Show tooltip on click
                            setTooltip({
                              name: story.title,
                              count: 1,
                              story: story,
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                            })
                          }
                        }}
                        className="cursor-pointer"
                      >
                        {/* Individual marker image */}
                        <image
                          href="/images/individual-marker.svg"
                          x="-12"
                          y="-24"
                          width="24"
                          height="24"
                          className="drop-shadow-lg hover:opacity-90 transition-opacity"
                          preserveAspectRatio="xMidYMid meet"
                        />
                      </g>
                    </Marker>
                  )
                })}
              </>
            )}
          </ZoomableGroup>
        </ComposableMap>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
        <button
          onClick={() => {
            const currentZoom = zoomState.zoom
            const maxZoom = externalFocusedState ? zoomState.zoom : (activeFocusedState ? 8 : 5)
            const newZoom = Math.min(maxZoom, currentZoom * 1.5)
            setZoomState({ ...zoomState, zoom: newZoom })
          }}
          className="bg-white rounded-lg shadow-lg px-3 py-2 border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center text-gray-700 hover:text-gray-900"
          title="Zoom In"
          disabled={externalFocusedState}
        >
          <FaPlus className="text-sm" />
        </button>
        <button
          onClick={() => {
            const currentZoom = zoomState.zoom
            const minZoom = externalFocusedState ? zoomState.zoom : (activeFocusedState ? 1 : 0.1)
            const newZoom = Math.max(minZoom, currentZoom / 1.5)
            setZoomState({ ...zoomState, zoom: newZoom })
          }}
          className="bg-white rounded-lg shadow-lg px-3 py-2 border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center text-gray-700 hover:text-gray-900"
          title="Zoom Out"
          disabled={externalFocusedState}
        >
          <FaMinus className="text-sm" />
        </button>
      </div>

      {/* Reset button when expanded (only show for internal expansion, not external focus) */}
      {expandedState && !externalFocusedState && (
        <div className="absolute top-4 right-4 z-20" style={{ top: '120px' }}>
          <button
            onClick={() => {
              setExpandedState(null)
              setTooltip(null) // Clear tooltip when resetting
              setZoomState({ center: [77.5, 22], zoom: 1 })
              // Clear filters on the left side
              if (onResetFilters) {
                onResetFilters()
              }
              // Reset projection config
              if (geoData) {
                let minLon = Infinity, maxLon = -Infinity
                let minLat = Infinity, maxLat = -Infinity
                
                geoData.features.forEach((feature) => {
                  const coordinates = feature.geometry.coordinates
                  const processCoordinates = (coords) => {
                    if (Array.isArray(coords[0])) {
                      coords.forEach(processCoordinates)
                    } else if (coords.length >= 2) {
                      const [lon, lat] = coords
                      minLon = Math.min(minLon, lon)
                      maxLon = Math.max(maxLon, lon)
                      minLat = Math.min(minLat, lat)
                      maxLat = Math.max(maxLat, lat)
                    }
                  }
                  processCoordinates(coordinates)
                })
                
                const centerLon = (minLon + maxLon) / 2
                const centerLat = (minLat + maxLat) / 2
                const lonRange = maxLon - minLon
                const latRange = maxLat - minLat
                const maxRange = Math.max(lonRange, latRange)
                const calculatedScale = Math.max(500, Math.min(900, 750 / maxRange * 100))
                
                setProjectionConfig({
                  center: [centerLon || 77.5, centerLat || 22],
                  scale: calculatedScale || 650,
                })
              }
            }}
            className="bg-white rounded-lg shadow-lg px-4 py-2 border border-green-300 hover:bg-green-50 transition-colors flex items-center gap-2 text-sm font-semibold text-green-800"
          >
            <FaMapMarkerAlt className="text-xs" />
            Show All States
          </button>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && tooltip.story && (
        <div
          className="absolute bg-white rounded-lg shadow-2xl z-50 pointer-events-auto"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y + 15}px`,
            transform: 'translateX(-50%)',
            width: '320px',
            maxWidth: 'calc(100vw - 40px)',
          }}
        >
          {/* Tooltip pointer pointing to marker */}
          <div
            className="absolute"
            style={{
              left: '50%',
              top: '-8px',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '8px solid white',
              filter: 'drop-shadow(0 -2px 2px rgba(0, 0, 0, 0.1))',
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
                  <FaMapMarkerAlt className="text-xs text-gray-500" />
                  <span>
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
                  if (onStoryClick) {
                    onStoryClick(tooltip.story)
                    setTooltip(null)
                  }
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
      )}
      
      {/* State aggregate tooltip (for states with multiple stories) */}
      {tooltip && !tooltip.story && (
        <div
          className="absolute bg-white border border-green-300 rounded-lg shadow-xl px-4 py-3 z-50 pointer-events-auto max-w-xs"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y + 15}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {/* Tooltip pointer pointing to marker */}
          <div
            className="absolute"
            style={{
              left: '50%',
              top: '-8px',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '8px solid white',
              filter: 'drop-shadow(0 -2px 2px rgba(0, 0, 0, 0.1))',
            }}
          />
          {/* Border pointer for state tooltip */}
          <div
            className="absolute"
            style={{
              left: '50%',
              top: '-9px',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '9px solid transparent',
              borderRight: '9px solid transparent',
              borderBottom: '9px solid #86efac',
              zIndex: -1,
            }}
          />
          <div>
            <div className="text-sm font-semibold text-green-800">
              {tooltip.name}
            </div>
            <div className="text-xs text-gray-600">
              {tooltip.count} {tooltip.count === 1 ? 'story' : 'stories'}
            </div>
          </div>
        </div>
      )}

      {/* Legend - Only show when not in story detail page (no externalFocusedState) */}
      {!externalFocusedState && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 border border-green-200">
          <div className="text-xs font-semibold text-green-800 mb-2">
            {activeFocusedState ? `Showing: ${activeFocusedState}` : 'Story Markers'}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <img 
                src="/images/individual-marker.svg" 
                alt="Individual story marker" 
                className="w-5 h-5"
              />
              <span className="text-xs text-gray-700">Single Story</span>
            </div>
            <div className="flex items-center gap-2">
              <img 
                src="/images/state-marker.svg" 
                alt="State marker" 
                className="w-5 h-5"
              />
              <span className="text-xs text-gray-700">Multiple Stories</span>
            </div>
          </div>
        </div>
      )}

      {/* Fallback list if markers don't show */}
      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <FaMapMarkerAlt className="text-6xl text-green-700 mx-auto mb-4" />
            <p className="text-gray-700 mb-4">No stories found</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default IndiaMapSVG

