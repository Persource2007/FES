import { useEffect, useState } from 'react'
import { FaCode, FaSpinner, FaCheckCircle, FaExclamationCircle, FaCopy, FaMapMarkerAlt } from 'react-icons/fa'
import Header from '../components/Header'
import Footer from '../components/Footer'
import axios from 'axios'

// Use proxy in development to avoid CORS issues, direct URL in production
const API_BASE_URL = import.meta.env.DEV 
  ? '/api-proxy/API' 
  : 'https://adminhierarchy.indiaobservatory.org.in/API'

function API() {
  // Hierarchical selection state
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [subDistricts, setSubDistricts] = useState([])
  const [blocks, setBlocks] = useState([])
  const [panchayats, setPanchayats] = useState([])
  const [villages, setVillages] = useState([])
  
  // Selected values
  const [selectedState, setSelectedState] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedSubDistrict, setSelectedSubDistrict] = useState('')
  const [selectedBlock, setSelectedBlock] = useState('')
  const [selectedPanchayat, setSelectedPanchayat] = useState('')
  const [selectedVillage, setSelectedVillage] = useState('')
  
  // Loading states
  const [loadingStates, setLoadingStates] = useState(true)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingSubDistricts, setLoadingSubDistricts] = useState(false)
  const [loadingBlocks, setLoadingBlocks] = useState(false)
  const [loadingPanchayats, setLoadingPanchayats] = useState(false)
  const [loadingVillages, setLoadingVillages] = useState(false)
  
  // Error states
  const [error, setError] = useState(null)
  
  // Results display
  const [results, setResults] = useState({})
  
  // Other endpoints
  const [regionId, setRegionId] = useState('')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [parentId, setParentId] = useState('')

  // Load states on mount
  useEffect(() => {
    fetchStates()
  }, [])

  // Fetch states
  const fetchStates = async () => {
    try {
      setLoadingStates(true)
      setError(null)
      const response = await axios.get(`${API_BASE_URL}/getStates`, {
        timeout: 30000, // 30 seconds timeout
        headers: {
          'Accept': 'application/json',
        },
        withCredentials: false,
      })
      
      // The API returns: {"responseType":"1","text":[...array...]}
      if (Array.isArray(response.data)) {
        setStates(response.data)
      } else if (response.data?.text && Array.isArray(response.data.text)) {
        setStates(response.data.text)
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setStates(response.data.data)
      } else {
        console.warn('Unexpected response format:', response.data)
        setStates([])
      }
    } catch (err) {
      console.error('Error fetching states:', err)
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        response: err.response,
        request: err.request,
      })
      
      let errorMessage = 'Failed to load states: '
      
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage += 'Request timeout. The server took too long to respond.'
      } else if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        // Check if it's actually a CORS error
        if (err.message.includes('CORS') || err.message.includes('Access-Control')) {
          errorMessage += 'CORS error: The API server is blocking cross-origin requests. Using proxy...'
        } else {
          errorMessage += 'Network error. Please check your internet connection or the API server might be down.'
        }
      } else if (err.code === 'ERR_CANCELED' || err.message.includes('aborted')) {
        errorMessage += 'Request was cancelled. Please try again.'
      } else if (err.response) {
        errorMessage += err.response.data?.message || `HTTP ${err.response.status}: ${err.response.statusText}`
      } else {
        errorMessage += err.message || 'Unknown error occurred'
      }
      
      setError(errorMessage)
    } finally {
      setLoadingStates(false)
    }
  }

  // When state is selected, fetch districts
  useEffect(() => {
    if (selectedState) {
      fetchDistricts(selectedState)
      // Reset downstream selections
      setSelectedDistrict('')
      setSelectedSubDistrict('')
      setSelectedBlock('')
      setSelectedPanchayat('')
      setSelectedVillage('')
      setDistricts([])
      setSubDistricts([])
      setBlocks([])
      setPanchayats([])
      setVillages([])
    }
  }, [selectedState])

  // Fetch districts
  const fetchDistricts = async (stateId) => {
    try {
      setLoadingDistricts(true)
      const formData = new URLSearchParams()
      formData.append('state_id', stateId)
      
      const response = await axios.post(`${API_BASE_URL}/getDistricts`, formData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        withCredentials: false,
      })
      
      // The API returns: {"responseType":"1","text":[...array...]}
      if (Array.isArray(response.data)) {
        setDistricts(response.data)
      } else if (response.data?.text && Array.isArray(response.data.text)) {
        setDistricts(response.data.text)
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setDistricts(response.data.data)
      } else {
        console.warn('Unexpected districts response format:', response.data)
        setDistricts([])
      }
    } catch (err) {
      console.error('Error fetching districts:', err)
      const errorMsg = err.code === 'ECONNABORTED' || err.message.includes('timeout')
        ? 'Request timeout'
        : err.code === 'ERR_NETWORK' || err.message.includes('Network Error')
        ? 'Network error'
        : err.response?.data?.message || err.message || 'Unknown error'
      setError('Failed to load districts: ' + errorMsg)
    } finally {
      setLoadingDistricts(false)
    }
  }

  // When district is selected, fetch sub-districts and blocks
  useEffect(() => {
    if (selectedDistrict) {
      fetchSubDistricts(selectedDistrict)
      fetchBlocks(selectedDistrict)
      // Reset downstream selections
      setSelectedSubDistrict('')
      setSelectedPanchayat('')
      setSelectedVillage('')
      setSubDistricts([])
      setPanchayats([])
      setVillages([])
    }
  }, [selectedDistrict])

  // Fetch sub-districts
  const fetchSubDistricts = async (districtId) => {
    try {
      setLoadingSubDistricts(true)
      const formData = new URLSearchParams()
      formData.append('district_id', districtId)
      
      const response = await axios.post(`${API_BASE_URL}/getSubDistricts`, formData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        withCredentials: false,
      })
      
      // The API returns: {"responseType":"1","text":[...array...]}
      if (Array.isArray(response.data)) {
        setSubDistricts(response.data)
      } else if (response.data?.text && Array.isArray(response.data.text)) {
        setSubDistricts(response.data.text)
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setSubDistricts(response.data.data)
      } else {
        console.warn('Unexpected sub-districts response format:', response.data)
        setSubDistricts([])
      }
    } catch (err) {
      console.error('Error fetching sub-districts:', err)
      setError('Failed to load sub-districts: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoadingSubDistricts(false)
    }
  }

  // Fetch blocks
  const fetchBlocks = async (districtId) => {
    try {
      setLoadingBlocks(true)
      const formData = new URLSearchParams()
      formData.append('district_id', districtId)
      
      const response = await axios.post(`${API_BASE_URL}/getBlocks`, formData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        withCredentials: false,
      })
      
      // The API returns: {"responseType":"1","text":[...array...]}
      if (Array.isArray(response.data)) {
        setBlocks(response.data)
      } else if (response.data?.text && Array.isArray(response.data.text)) {
        setBlocks(response.data.text)
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setBlocks(response.data.data)
      } else {
        console.warn('Unexpected blocks response format:', response.data)
        setBlocks([])
      }
    } catch (err) {
      console.error('Error fetching blocks:', err)
      setError('Failed to load blocks: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoadingBlocks(false)
    }
  }

  // When sub-district is selected, fetch panchayats
  useEffect(() => {
    if (selectedSubDistrict) {
      fetchPanchayats(selectedSubDistrict)
      // Reset downstream selections
      setSelectedPanchayat('')
      setSelectedVillage('')
      setPanchayats([])
      setVillages([])
    }
  }, [selectedSubDistrict])

  // Fetch panchayats
  const fetchPanchayats = async (subDistrictId) => {
    try {
      setLoadingPanchayats(true)
      const formData = new URLSearchParams()
      formData.append('subdistrict_id', subDistrictId)
      
      const response = await axios.post(`${API_BASE_URL}/getPanchayats`, formData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        withCredentials: false,
      })
      
      // The API returns: {"responseType":"1","text":[...array...]}
      if (Array.isArray(response.data)) {
        setPanchayats(response.data)
      } else if (response.data?.text && Array.isArray(response.data.text)) {
        setPanchayats(response.data.text)
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setPanchayats(response.data.data)
      } else {
        console.warn('Unexpected panchayats response format:', response.data)
        setPanchayats([])
      }
    } catch (err) {
      console.error('Error fetching panchayats:', err)
      setError('Failed to load panchayats: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoadingPanchayats(false)
    }
  }

  // When panchayat is selected, fetch villages
  useEffect(() => {
    if (selectedPanchayat) {
      fetchVillages(selectedPanchayat)
      setSelectedVillage('')
      setVillages([])
    }
  }, [selectedPanchayat])

  // Fetch villages
  const fetchVillages = async (panchayatId) => {
    try {
      setLoadingVillages(true)
      const formData = new URLSearchParams()
      formData.append('panchayat_id', panchayatId)
      
      const response = await axios.post(`${API_BASE_URL}/getVillages`, formData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        withCredentials: false,
      })
      
      // The API returns: {"responseType":"1","text":[...array...]}
      if (Array.isArray(response.data)) {
        setVillages(response.data)
      } else if (response.data?.text && Array.isArray(response.data.text)) {
        setVillages(response.data.text)
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setVillages(response.data.data)
      } else {
        console.warn('Unexpected villages response format:', response.data)
        setVillages([])
      }
    } catch (err) {
      console.error('Error fetching villages:', err)
      setError('Failed to load villages: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoadingVillages(false)
    }
  }

  // Test other endpoints
  const testGetRegionsByParent = async () => {
    if (!parentId) {
      setError('Please enter a parent ID')
      return
    }
    
    try {
      setResults((prev) => ({ ...prev, regionsByParent: { loading: true } }))
      const formData = new URLSearchParams()
      formData.append('parent_id', parentId)
      
      const response = await axios.post(`${API_BASE_URL}/getRegionsByParent`, formData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        withCredentials: false,
      })
      
      setResults((prev) => ({
        ...prev,
        regionsByParent: { loading: false, data: response.data, error: null },
      }))
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        regionsByParent: { loading: false, error: err.response?.data || err.message, data: null },
      }))
    }
  }

  const testGetGeometry = async () => {
    if (!regionId) {
      setError('Please enter a region ID')
      return
    }
    
    try {
      setResults((prev) => ({ ...prev, geometry: { loading: true } }))
      const formData = new URLSearchParams()
      formData.append('region_id', regionId)
      
      const response = await axios.post(`${API_BASE_URL}/getGeometry`, formData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        withCredentials: false,
      })
      
      setResults((prev) => ({
        ...prev,
        geometry: { loading: false, data: response.data, error: null },
      }))
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        geometry: { loading: false, error: err.response?.data || err.message, data: null },
      }))
    }
  }

  const testGetRegionDetailsByLatLon = async () => {
    if (!lat || !lon) {
      setError('Please enter both latitude and longitude')
      return
    }
    
    try {
      setResults((prev) => ({ ...prev, regionDetails: { loading: true } }))
      const response = await axios.get(`${API_BASE_URL}/getRegionDetailsByLatLon`, {
        timeout: 30000,
        params: { lat: parseFloat(lat), lon: parseFloat(lon) },
        headers: {
          'Accept': 'application/json',
        },
        withCredentials: false,
      })
      
      setResults((prev) => ({
        ...prev,
        regionDetails: { loading: false, data: response.data, error: null },
      }))
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        regionDetails: { loading: false, error: err.response?.data || err.message, data: null },
      }))
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2))
  }

  const renderResult = (resultKey) => {
    const result = results[resultKey]
    if (!result) return null

    if (result.loading) {
      return (
        <div className="mt-2 flex items-center gap-2 text-blue-600">
          <FaSpinner className="animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      )
    }

    if (result.error) {
      return (
        <div className="mt-2 bg-red-50 border border-red-200 rounded p-3">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <FaExclamationCircle />
            <span className="font-semibold">Error</span>
          </div>
          <pre className="text-sm text-red-600 overflow-auto">
            {typeof result.error === 'string' ? result.error : JSON.stringify(result.error, null, 2)}
          </pre>
        </div>
      )
    }

    if (result.data) {
      return (
        <div className="mt-2 bg-green-50 border border-green-200 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-green-700">
              <FaCheckCircle />
              <span className="font-semibold">Success</span>
            </div>
            <button
              onClick={() => copyToClipboard(result.data)}
              className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
            >
              <FaCopy />
              Copy
            </button>
          </div>
          <pre className="text-sm text-green-800 overflow-auto max-h-96">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FaCode className="text-4xl text-slate-700" />
            <h1 className="text-5xl font-bold text-slate-900">
              Admin Hierarchy API Testing
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Test the Admin Hierarchy Microservice API endpoints with interactive hierarchical selection
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Hierarchical Location Selection
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                API Base URL: <code className="bg-gray-100 px-2 py-1 rounded">{API_BASE_URL}</code>
                {import.meta.env.DEV && (
                  <span className="ml-2 text-xs text-blue-600">(Using Vite proxy to avoid CORS)</span>
                )}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-red-700">
                    <FaExclamationCircle />
                    <span className="font-semibold">Error</span>
                  </div>
                  <button
                    onClick={() => {
                      setError(null)
                      fetchStates()
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Retry
                  </button>
                </div>
                <p className="text-sm text-red-600 mt-2">{error}</p>
                {error.includes('Network') || error.includes('timeout') || error.includes('CORS') ? (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-800">
                      <strong>Note:</strong> If this error persists, it may be due to CORS restrictions or the API server being unavailable. 
                      You may need to use a CORS proxy or contact the API administrator.
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Hierarchical Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State {loadingStates && <FaSpinner className="inline animate-spin ml-2" />}
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loadingStates}
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state.lid} value={state.lid}>
                      {state.name} ({state.lid})
                    </option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District {loadingDistricts && <FaSpinner className="inline animate-spin ml-2" />}
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!selectedState || loadingDistricts}
                >
                  <option value="">Select District</option>
                  {districts.map((district) => (
                    <option key={district.lid} value={district.lid}>
                      {district.name} ({district.lid})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub-District */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub-District {loadingSubDistricts && <FaSpinner className="inline animate-spin ml-2" />}
                </label>
                <select
                  value={selectedSubDistrict}
                  onChange={(e) => setSelectedSubDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!selectedDistrict || loadingSubDistricts}
                >
                  <option value="">Select Sub-District</option>
                  {subDistricts.map((subDistrict) => (
                    <option key={subDistrict.lid} value={subDistrict.lid}>
                      {subDistrict.name} ({subDistrict.lid})
                    </option>
                  ))}
                </select>
              </div>

              {/* Block */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Block {loadingBlocks && <FaSpinner className="inline animate-spin ml-2" />}
                </label>
                <select
                  value={selectedBlock}
                  onChange={(e) => setSelectedBlock(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!selectedDistrict || loadingBlocks}
                >
                  <option value="">Select Block</option>
                  {blocks.map((block) => (
                    <option key={block.lid} value={block.lid}>
                      {block.name} ({block.lid})
                    </option>
                  ))}
                </select>
              </div>

              {/* Panchayat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Panchayat {loadingPanchayats && <FaSpinner className="inline animate-spin ml-2" />}
                </label>
                <select
                  value={selectedPanchayat}
                  onChange={(e) => setSelectedPanchayat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!selectedSubDistrict || loadingPanchayats}
                >
                  <option value="">Select Panchayat</option>
                  {panchayats.map((panchayat) => (
                    <option key={panchayat.lid} value={panchayat.lid}>
                      {panchayat.name} ({panchayat.lid})
                    </option>
                  ))}
                </select>
              </div>

              {/* Village */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Village {loadingVillages && <FaSpinner className="inline animate-spin ml-2" />}
                </label>
                <select
                  value={selectedVillage}
                  onChange={(e) => setSelectedVillage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!selectedPanchayat || loadingVillages}
                >
                  <option value="">Select Village</option>
                  {villages.map((village) => (
                    <option key={village.lid} value={village.lid}>
                      {village.name} ({village.lid})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Values Display */}
            {(selectedState || selectedDistrict || selectedSubDistrict || selectedBlock || selectedPanchayat || selectedVillage) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Selected Hierarchy:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedState && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      State: {states.find(s => s.lid === selectedState)?.name || selectedState}
                    </span>
                  )}
                  {selectedDistrict && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      District: {districts.find(d => d.lid === selectedDistrict)?.name || selectedDistrict}
                    </span>
                  )}
                  {selectedSubDistrict && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Sub-District: {subDistricts.find(sd => sd.lid === selectedSubDistrict)?.name || selectedSubDistrict}
                    </span>
                  )}
                  {selectedBlock && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Block: {blocks.find(b => b.lid === selectedBlock)?.name || selectedBlock}
                    </span>
                  )}
                  {selectedPanchayat && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Panchayat: {panchayats.find(p => p.lid === selectedPanchayat)?.name || selectedPanchayat}
                    </span>
                  )}
                  {selectedVillage && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Village: {villages.find(v => v.lid === selectedVillage)?.name || selectedVillage}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Other Endpoints */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Other Endpoints</h3>
              
              <div className="space-y-4">
                {/* Get Regions By Parent */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Get Regions By Parent</h4>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                      placeholder="Enter parent ID"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={testGetRegionsByParent}
                      disabled={!parentId || results.regionsByParent?.loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {results.regionsByParent?.loading ? <FaSpinner className="animate-spin" /> : 'Test'}
                    </button>
                  </div>
                  {renderResult('regionsByParent')}
                </div>

                {/* Get Geometry */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Get Geometry</h4>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={regionId}
                      onChange={(e) => setRegionId(e.target.value)}
                      placeholder="Enter region ID"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={testGetGeometry}
                      disabled={!regionId || results.geometry?.loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {results.geometry?.loading ? <FaSpinner className="animate-spin" /> : 'Test'}
                    </button>
                  </div>
                  {renderResult('geometry')}
                </div>

                {/* Get Region Details By Lat/Lon */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <FaMapMarkerAlt />
                    Get Region Details By Latitude & Longitude
                  </h4>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="number"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      placeholder="Latitude"
                      step="any"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="number"
                      value={lon}
                      onChange={(e) => setLon(e.target.value)}
                      placeholder="Longitude"
                      step="any"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={testGetRegionDetailsByLatLon}
                      disabled={!lat || !lon || results.regionDetails?.loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {results.regionDetails?.loading ? <FaSpinner className="animate-spin" /> : 'Test'}
                    </button>
                  </div>
                  {renderResult('regionDetails')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default API
