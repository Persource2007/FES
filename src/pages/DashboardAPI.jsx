import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaCode, FaSpinner, FaCheckCircle, FaExclamationCircle, FaCopy, FaMapMarkerAlt } from 'react-icons/fa'
import Sidebar from '../components/Sidebar'
import { useError } from '../contexts/ErrorContext'
import axios from 'axios'

// Use proxy in development to avoid CORS issues, direct URL in production
const API_BASE_URL = import.meta.env.DEV 
  ? '/api-proxy/API' 
  : 'https://adminhierarchy.indiaobservatory.org.in/API'

function DashboardAPI() {
  const navigate = useNavigate()
  const { showError, showInfo } = useError()
  const [user, setUser] = useState(null)

  // Load user data from localStorage on mount
  // Support both OAuth (oauth_user) and old local login (user)
  useEffect(() => {
    const oauthUserData = localStorage.getItem('oauth_user')
    const oldUserData = localStorage.getItem('user')
    const userData = oauthUserData || oldUserData
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (e) {
        console.error('Error parsing user data:', e)
        navigate('/', { replace: true })
      }
    } else {
      navigate('/', { replace: true })
    }
  }, [navigate])

  const handleLogout = async () => {
    try {
      // Import logoutOAuth dynamically to avoid circular dependencies
      const { logoutOAuth } = await import('../utils/oauthLogin')
      // Call BFF logout endpoint to destroy session on server
      // logoutOAuth() handles all localStorage cleanup
      await logoutOAuth()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Redirect to home page (using window.location for reliable logout redirect)
      window.location.href = '/'
    }
  }

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
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
        },
        withCredentials: false,
      })
      
      let data = response.data
      if (data?.text) {
        data = data.text
      } else if (data?.data) {
        data = data.data
      }
      
      if (Array.isArray(data)) {
        setStates(data)
      } else {
        setError('Invalid response format from API')
      }
    } catch (err) {
      console.error('Error fetching states:', err)
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout. The API server might be slow or unavailable.')
      } else if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        setError('Network error. Please check your internet connection or the API server might be down. Note: If this error persists, it may be due to CORS restrictions or the API server being unavailable. You may need to use a CORS proxy or contact the API administrator.')
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load states')
      }
    } finally {
      setLoadingStates(false)
    }
  }

  // Fetch districts when state is selected
  useEffect(() => {
    if (selectedState) {
      fetchDistricts(selectedState)
    } else {
      setDistricts([])
      setSelectedDistrict('')
    }
  }, [selectedState])

  const fetchDistricts = async (stateId) => {
    try {
      setLoadingDistricts(true)
      setError(null)
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
      
      let data = response.data
      if (data?.text) {
        data = data.text
      } else if (data?.data) {
        data = data.data
      }
      
      if (Array.isArray(data)) {
        setDistricts(data)
      }
    } catch (err) {
      console.error('Error fetching districts:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load districts')
    } finally {
      setLoadingDistricts(false)
    }
  }

  // Fetch sub-districts when district is selected
  useEffect(() => {
    if (selectedDistrict) {
      fetchSubDistricts(selectedDistrict)
    } else {
      setSubDistricts([])
      setSelectedSubDistrict('')
    }
  }, [selectedDistrict])

  const fetchSubDistricts = async (districtId) => {
    try {
      setLoadingSubDistricts(true)
      setError(null)
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
      
      let data = response.data
      if (data?.text) {
        data = data.text
      } else if (data?.data) {
        data = data.data
      }
      
      if (Array.isArray(data)) {
        setSubDistricts(data)
      }
    } catch (err) {
      console.error('Error fetching sub-districts:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load sub-districts')
    } finally {
      setLoadingSubDistricts(false)
    }
  }

  // Fetch blocks when sub-district is selected
  useEffect(() => {
    if (selectedSubDistrict) {
      fetchBlocks(selectedSubDistrict)
    } else {
      setBlocks([])
      setSelectedBlock('')
    }
  }, [selectedSubDistrict])

  const fetchBlocks = async (subDistrictId) => {
    try {
      setLoadingBlocks(true)
      setError(null)
      const formData = new URLSearchParams()
      formData.append('sub_district_id', subDistrictId)
      
      const response = await axios.post(`${API_BASE_URL}/getBlocks`, formData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        withCredentials: false,
      })
      
      let data = response.data
      if (data?.text) {
        data = data.text
      } else if (data?.data) {
        data = data.data
      }
      
      if (Array.isArray(data)) {
        setBlocks(data)
      }
    } catch (err) {
      console.error('Error fetching blocks:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load blocks')
    } finally {
      setLoadingBlocks(false)
    }
  }

  // Fetch panchayats when block is selected
  useEffect(() => {
    if (selectedBlock) {
      fetchPanchayats(selectedBlock)
    } else {
      setPanchayats([])
      setSelectedPanchayat('')
    }
  }, [selectedBlock])

  const fetchPanchayats = async (blockId) => {
    try {
      setLoadingPanchayats(true)
      setError(null)
      const formData = new URLSearchParams()
      formData.append('block_id', blockId)
      
      const response = await axios.post(`${API_BASE_URL}/getPanchayats`, formData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        withCredentials: false,
      })
      
      let data = response.data
      if (data?.text) {
        data = data.text
      } else if (data?.data) {
        data = data.data
      }
      
      if (Array.isArray(data)) {
        setPanchayats(data)
      }
    } catch (err) {
      console.error('Error fetching panchayats:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load panchayats')
    } finally {
      setLoadingPanchayats(false)
    }
  }

  // Fetch villages when panchayat is selected
  useEffect(() => {
    if (selectedPanchayat) {
      fetchVillages(selectedPanchayat)
    } else {
      setVillages([])
      setSelectedVillage('')
    }
  }, [selectedPanchayat])

  const fetchVillages = async (panchayatId) => {
    try {
      setLoadingVillages(true)
      setError(null)
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
      
      let data = response.data
      if (data?.text) {
        data = data.text
      } else if (data?.data) {
        data = data.data
      }
      
      if (Array.isArray(data)) {
        setVillages(data)
      }
    } catch (err) {
      console.error('Error fetching villages:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load villages')
    } finally {
      setLoadingVillages(false)
    }
  }

  // Test other endpoints
  const testGetRegionsByParent = async () => {
    if (!parentId) {
      showError('Please enter a parent ID', 'Missing Input')
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
      
      setResults((prev) => ({ ...prev, regionsByParent: { loading: false, data: response.data, error: null } }))
    } catch (err) {
      setResults((prev) => ({ ...prev, regionsByParent: { loading: false, error: err.response?.data || err.message, data: null } }))
    }
  }

  const testGetGeometry = async () => {
    if (!regionId) {
      showError('Please enter a region ID', 'Missing Input')
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
      
      setResults((prev) => ({ ...prev, geometry: { loading: false, data: response.data, error: null } }))
    } catch (err) {
      setResults((prev) => ({ ...prev, geometry: { loading: false, error: err.response?.data || err.message, data: null } }))
    }
  }

  const testGetRegionDetailsByLatLon = async () => {
    if (!lat || !lon) {
      showError('Please enter both latitude and longitude', 'Missing Input')
      return
    }
    try {
      setResults((prev) => ({ ...prev, regionDetails: { loading: true } }))
      const formData = new URLSearchParams()
      formData.append('lat', lat)
      formData.append('lon', lon)
      
      const response = await axios.post(`${API_BASE_URL}/getRegionDetailsByLatLon`, formData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        withCredentials: false,
      })
      
      setResults((prev) => ({ ...prev, regionDetails: { loading: false, data: response.data, error: null } }))
    } catch (err) {
      setResults((prev) => ({ ...prev, regionDetails: { loading: false, error: err.response?.data || err.message, data: null } }))
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    showInfo('Copied to clipboard!', 'Success')
  }

  const renderResult = (key) => {
    const result = results[key]
    if (!result) return null

    if (result.loading) {
      return (
        <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <FaSpinner className="animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      )
    }

    if (result.error) {
      return (
        <div className="mt-2 p-3 bg-red-50 rounded border border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <FaExclamationCircle />
            <span>Error: {typeof result.error === 'object' ? JSON.stringify(result.error, null, 2) : result.error}</span>
          </div>
        </div>
      )
    }

    if (result.data) {
      return (
        <div className="mt-2 p-3 bg-green-50 rounded border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-green-700">
              <FaCheckCircle />
              <span className="font-semibold">Success</span>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(result.data, null, 2))}
              className="text-xs px-2 py-1 bg-green-200 hover:bg-green-300 rounded flex items-center gap-1"
            >
              <FaCopy /> Copy
            </button>
          </div>
          <pre className="text-xs overflow-auto max-h-60 bg-white p-2 rounded border">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="flex-1 transition-all duration-200 ease-in-out">
        {/* Top Header */}
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Admin Hierarchy Microservice Testing</h1>
          </div>
        </header>

        {/* API Testing Content */}
        <div className="p-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <FaExclamationCircle />
                <span>{error}</span>
              </div>
            </div>
          )}

          <section className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaMapMarkerAlt className="text-green-700" />
              Hierarchical Location Selection
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* States */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State {loadingStates && <FaSpinner className="inline-block animate-spin ml-2" />}
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value)
                    setSelectedDistrict('')
                    setSelectedSubDistrict('')
                    setSelectedBlock('')
                    setSelectedPanchayat('')
                    setSelectedVillage('')
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={loadingStates}
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state.lid || state.id || state.state_id} value={state.lid || state.id || state.state_id}>
                      {state.name || state.state_name} {state.lid ? `(${state.lid})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Districts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District {loadingDistricts && <FaSpinner className="inline-block animate-spin ml-2" />}
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value)
                    setSelectedSubDistrict('')
                    setSelectedBlock('')
                    setSelectedPanchayat('')
                    setSelectedVillage('')
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={!selectedState || loadingDistricts}
                >
                  <option value="">Select District</option>
                  {districts.map((district) => (
                    <option key={district.lid || district.id || district.district_id} value={district.lid || district.id || district.district_id}>
                      {district.name || district.district_name} {district.lid ? `(${district.lid})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub-Districts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub-District {loadingSubDistricts && <FaSpinner className="inline-block animate-spin ml-2" />}
                </label>
                <select
                  value={selectedSubDistrict}
                  onChange={(e) => {
                    setSelectedSubDistrict(e.target.value)
                    setSelectedBlock('')
                    setSelectedPanchayat('')
                    setSelectedVillage('')
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={!selectedDistrict || loadingSubDistricts}
                >
                  <option value="">Select Sub-District</option>
                  {subDistricts.map((subDistrict) => (
                    <option key={subDistrict.lid || subDistrict.id || subDistrict.sub_district_id} value={subDistrict.lid || subDistrict.id || subDistrict.sub_district_id}>
                      {subDistrict.name || subDistrict.sub_district_name} {subDistrict.lid ? `(${subDistrict.lid})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Blocks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Block {loadingBlocks && <FaSpinner className="inline-block animate-spin ml-2" />}
                </label>
                <select
                  value={selectedBlock}
                  onChange={(e) => {
                    setSelectedBlock(e.target.value)
                    setSelectedPanchayat('')
                    setSelectedVillage('')
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={!selectedSubDistrict || loadingBlocks}
                >
                  <option value="">Select Block</option>
                  {blocks.map((block) => (
                    <option key={block.lid || block.id || block.block_id} value={block.lid || block.id || block.block_id}>
                      {block.name || block.block_name} {block.lid ? `(${block.lid})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Panchayats */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Panchayat {loadingPanchayats && <FaSpinner className="inline-block animate-spin ml-2" />}
                </label>
                <select
                  value={selectedPanchayat}
                  onChange={(e) => {
                    setSelectedPanchayat(e.target.value)
                    setSelectedVillage('')
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={!selectedBlock || loadingPanchayats}
                >
                  <option value="">Select Panchayat</option>
                  {panchayats.map((panchayat) => (
                    <option key={panchayat.lid || panchayat.id || panchayat.panchayat_id} value={panchayat.lid || panchayat.id || panchayat.panchayat_id}>
                      {panchayat.name || panchayat.panchayat_name} {panchayat.lid ? `(${panchayat.lid})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Villages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Village {loadingVillages && <FaSpinner className="inline-block animate-spin ml-2" />}
                </label>
                <select
                  value={selectedVillage}
                  onChange={(e) => setSelectedVillage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={!selectedPanchayat || loadingVillages}
                >
                  <option value="">Select Village</option>
                  {villages.map((village) => (
                    <option key={village.lid || village.id || village.village_id} value={village.lid || village.id || village.village_id}>
                      {village.name || village.village_name} {village.lid ? `(${village.lid})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Display Selected Values */}
            {(selectedState || selectedDistrict || selectedSubDistrict || selectedBlock || selectedPanchayat || selectedVillage) && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Selected Location:</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  {selectedState && <p>State: {states.find(s => (s.lid || s.id || s.state_id) === selectedState)?.name || states.find(s => (s.lid || s.id || s.state_id) === selectedState)?.state_name}</p>}
                  {selectedDistrict && <p>District: {districts.find(d => (d.lid || d.id || d.district_id) === selectedDistrict)?.name || districts.find(d => (d.lid || d.id || d.district_id) === selectedDistrict)?.district_name}</p>}
                  {selectedSubDistrict && <p>Sub-District: {subDistricts.find(sd => (sd.lid || sd.id || sd.sub_district_id) === selectedSubDistrict)?.name || subDistricts.find(sd => (sd.lid || sd.id || sd.sub_district_id) === selectedSubDistrict)?.sub_district_name}</p>}
                  {selectedBlock && <p>Block: {blocks.find(b => (b.lid || b.id || b.block_id) === selectedBlock)?.name || blocks.find(b => (b.lid || b.id || b.block_id) === selectedBlock)?.block_name}</p>}
                  {selectedPanchayat && <p>Panchayat: {panchayats.find(p => (p.lid || p.id || p.panchayat_id) === selectedPanchayat)?.name || panchayats.find(p => (p.lid || p.id || p.panchayat_id) === selectedPanchayat)?.panchayat_name}</p>}
                  {selectedVillage && <p>Village: {villages.find(v => (v.lid || v.id || v.village_id) === selectedVillage)?.name || villages.find(v => (v.lid || v.id || v.village_id) === selectedVillage)?.village_name}</p>}
                </div>
              </div>
            )}
          </section>

          {/* Other API Endpoints */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaCode className="text-green-700" />
              Other API Endpoints
            </h2>
            
            <div className="space-y-6">
              {/* Get Regions By Parent */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Get Regions By Parent</h4>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    placeholder="Enter Parent ID"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    onClick={testGetRegionsByParent}
                    disabled={!parentId || results.regionsByParent?.loading}
                    className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {results.regionsByParent?.loading ? <FaSpinner className="animate-spin" /> : 'Test'}
                  </button>
                </div>
                {renderResult('regionsByParent')}
              </div>

              {/* Get Geometry */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Get Geometry</h4>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={regionId}
                    onChange={(e) => setRegionId(e.target.value)}
                    placeholder="Enter Region ID"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    onClick={testGetGeometry}
                    disabled={!regionId || results.geometry?.loading}
                    className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {results.geometry?.loading ? <FaSpinner className="animate-spin" /> : 'Test'}
                  </button>
                </div>
                {renderResult('geometry')}
              </div>

              {/* Get Region Details By Lat/Lon */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Get Region Details By Lat/Lon</h4>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="Latitude"
                    step="any"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <input
                    type="number"
                    value={lon}
                    onChange={(e) => setLon(e.target.value)}
                    placeholder="Longitude"
                    step="any"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    onClick={testGetRegionDetailsByLatLon}
                    disabled={!lat || !lon || results.regionDetails?.loading}
                    className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {results.regionDetails?.loading ? <FaSpinner className="animate-spin" /> : 'Test'}
                  </button>
                </div>
                {renderResult('regionDetails')}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default DashboardAPI

