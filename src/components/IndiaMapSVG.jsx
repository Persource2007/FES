import { useState, useEffect } from 'react'
import { FaMapMarkerAlt } from 'react-icons/fa'
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

function IndiaMapSVG({ storiesByRegion, onStateClick, onStoryClick, focusedState: externalFocusedState }) {
  const [tooltip, setTooltip] = useState(null)
  const [geoData, setGeoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedState, setExpandedState] = useState(null) // State showing individual story markers
  const [zoomState, setZoomState] = useState({ center: [77.5, 22], zoom: 1 })
  
  // Use external focusedState if provided, otherwise use expandedState
  const activeFocusedState = externalFocusedState || expandedState
  const [projectionConfig, setProjectionConfig] = useState({
    center: [77.5, 22], // Approximate center of India
    scale: 650, // Reduced scale for smaller default map
  })

  // Load GeoJSON data and calculate bounding box
  useEffect(() => {
    const loadGeoJSON = async () => {
      try {
        setLoading(true)
        
        // If external focusedState is provided, load individual state file
        let url = '/india-map.geojson'
        if (externalFocusedState) {
          const stateFileName = STATE_NAME_MAPPINGS[externalFocusedState] || getStateFileName(externalFocusedState)
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
          
          if (externalFocusedState) {
            // For single state in square container, calculate scale to fill the container
            // The container is square (aspect-square, max-w-lg = 512px)
            // Calculate scale to maximize map size while fitting in square
            const aspectRatio = lonRange / latRange
            
            // Use a more direct calculation - fit the larger dimension with minimal padding
            const paddingFactor = 0.92 // 8% padding for better visual appearance
            const baseContainerSize = 512 // max-w-lg in pixels
            
            // Calculate scale based on which dimension is larger
            // For Mercator projection, we need to account for the projection scaling
            let scaleMultiplier
            
            if (aspectRatio > 1.0) {
              // State is wider - fit longitude range to container width
              // Scale calculation: container width / longitude range * projection factor
              scaleMultiplier = (baseContainerSize * paddingFactor) / lonRange * 120
            } else {
              // State is taller - fit latitude range to container height
              // Scale calculation: container height / latitude range * projection factor
              scaleMultiplier = (baseContainerSize * paddingFactor) / latRange * 120
            }
            
            // Increased scale range to make map larger - allow up to 2000 for very small states
            calculatedScale = Math.max(600, Math.min(2000, scaleMultiplier))
          } else {
            // For full map, use smaller scale
            calculatedScale = Math.max(500, Math.min(900, 750 / maxRange * 100))
          }
          
          setProjectionConfig({
            center: [centerLon || 77.5, centerLat || 22],
            scale: calculatedScale || 650, // Fallback to 650 if calculation fails
          })
          
          // Set zoom state for single state view - keep zoom at 1 to fit the state
          if (externalFocusedState && data.features.length === 1) {
            const bounds = geoBounds(data.features[0])
            const [[x0, y0], [x1, y1]] = bounds
            const stateCenterLon = (x0 + x1) / 2
            const stateCenterLat = (y0 + y1) / 2
            // Keep zoom at 1 to ensure state fits within square container
            // The scale calculation above handles the fitting
            setZoomState({ center: [stateCenterLon, stateCenterLat], zoom: 1 })
          }
          
          console.log('Map bounds calculated:', {
            minLon, maxLon, minLat, maxLat,
            center: [centerLon, centerLat],
            scale: calculatedScale
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
  }, [externalFocusedState])

  // Effect to handle expandedState changes (for internal expansion, not external focusedState)
  // External focusedState is handled in the loadGeoJSON effect above
  useEffect(() => {
    if (expandedState && geoData && !externalFocusedState) {
      const expandedGeo = geoData.features.find(
        (geo) =>
          (geo.properties?.name && geo.properties.name === expandedState) ||
          (geo.properties?.NAME_1 && geo.properties.NAME_1 === expandedState)
      )

      if (expandedGeo) {
        const bounds = geoBounds(expandedGeo)
        const [[x0, y0], [x1, y1]] = bounds
        const centerLon = (x0 + x1) / 2
        const centerLat = (y0 + y1) / 2

        // Calculate zoom level to fit the state
        const width = x1 - x0
        const height = y1 - y0
        const maxDim = Math.max(width, height)
        const newZoom = Math.min(3, Math.max(1.5, 2.5 / (maxDim / 20)))

        setZoomState({ center: [centerLon, centerLat], zoom: newZoom })
        
        // Update projection config for expanded state
        const lonRange = x1 - x0
        const latRange = y1 - y0
        const maxRange = Math.max(lonRange, latRange)
        const calculatedScale = Math.max(1200, Math.min(2000, 1500 / maxRange * 15))
        
        setProjectionConfig({
          center: [centerLon, centerLat],
          scale: calculatedScale,
        })
      }
    } else if (!expandedState && !externalFocusedState) {
      // Reset to initial view only if no external focusedState
      setZoomState({ center: [77.5, 22], zoom: 1 })
    }
  }, [expandedState, geoData, externalFocusedState])

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
            filterZoomEvent={() => !externalFocusedState}
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
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.closest('svg')?.getBoundingClientRect()
                      if (rect) {
                        setTooltip({
                          name,
                          count,
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                        })
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={(e) => {
                      e.stopPropagation()
                      // If there's only one story, navigate to it
                      if (regionStories.length === 1 && onStoryClick) {
                        onStoryClick(regionStories[0])
                      } else if (regionStories.length > 1) {
                        // Multiple stories: expand to show individual markers
                        setExpandedState(name)
                      } else if (onStateClick) {
                        onStateClick(name)
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <circle
                      r="10"
                      fill="#dc2626"
                      stroke="#fff"
                      strokeWidth="2"
                      className="animate-pulse"
                    />
                    <text
                      textAnchor="middle"
                      y="4"
                      fontSize="14"
                      fill="#fff"
                      fontWeight="bold"
                    >
                      {count}
                    </text>
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
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.closest('svg')?.getBoundingClientRect()
                          if (rect) {
                            setTooltip({
                              name: story.title,
                              count: 1,
                              story: story,
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                            })
                          }
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onStoryClick) {
                            onStoryClick(story)
                            setExpandedState(null) // Reset expansion after navigation
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <circle
                          r="8"
                          fill="#ef4444"
                          stroke="#fff"
                          strokeWidth="2"
                          className="hover:r-10 transition-all"
                        />
                        <text
                          textAnchor="middle"
                          y="3"
                          fontSize="12"
                          fill="#fff"
                          fontWeight="bold"
                        >
                          {index + 1}
                        </text>
                      </g>
                    </Marker>
                  )
                })}
              </>
            )}
          </ZoomableGroup>
        </ComposableMap>

      {/* Reset button when expanded (only show for internal expansion, not external focus) */}
      {expandedState && !externalFocusedState && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => {
              setExpandedState(null)
              setZoomState({ center: [77.5, 22], zoom: 1 })
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
      {tooltip && (
        <div
          className="absolute bg-white border border-green-300 rounded-lg shadow-lg px-3 py-2 z-10 pointer-events-auto"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y - 10}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="text-sm font-semibold text-green-800">
            {tooltip.story ? tooltip.story.title : tooltip.name}
          </div>
          <div className="text-xs text-gray-600">
            {tooltip.story ? 'Click to view story' : `${tooltip.count} ${tooltip.count === 1 ? 'story' : 'stories'}`}
          </div>
        </div>
      )}

      {/* Legend - Only show when not in story detail page (no externalFocusedState) */}
      {!externalFocusedState && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 border border-green-200">
          <div className="text-xs font-semibold text-green-800 mb-2">
            {activeFocusedState ? `Showing: ${activeFocusedState}` : 'States with Stories'}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white"></div>
            <span className="text-xs text-gray-700">
              {activeFocusedState ? 'Individual story markers' : 'Story markers'}
            </span>
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

