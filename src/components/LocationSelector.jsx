import { useEffect, useState } from 'react'
import { FaSpinner } from 'react-icons/fa'
import axios from 'axios'

// Use proxy in development to avoid CORS issues, direct URL in production
const API_BASE_URL = import.meta.env.DEV 
  ? '/api-proxy/API' 
  : 'https://adminhierarchy.indiaobservatory.org.in/API'

function LocationSelector({ 
  selectedStateId, 
  selectedDistrictId, 
  selectedSubDistrictId, 
  selectedBlockId, 
  selectedPanchayatId, 
  selectedVillageId,
  onStateChange,
  onDistrictChange,
  onSubDistrictChange,
  onBlockChange,
  onPanchayatChange,
  onVillageChange,
  showLabels = true,
  className = ''
}) {
  // Data states
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [subDistricts, setSubDistricts] = useState([])
  const [blocks, setBlocks] = useState([])
  const [panchayats, setPanchayats] = useState([])
  const [villages, setVillages] = useState([])
  
  // Loading states
  const [loadingStates, setLoadingStates] = useState(true)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingSubDistricts, setLoadingSubDistricts] = useState(false)
  const [loadingBlocks, setLoadingBlocks] = useState(false)
  const [loadingPanchayats, setLoadingPanchayats] = useState(false)
  const [loadingVillages, setLoadingVillages] = useState(false)

  // Load states on mount
  useEffect(() => {
    fetchStates()
  }, [])

  // Fetch states
  const fetchStates = async () => {
    try {
      setLoadingStates(true)
      const response = await axios.get(`${API_BASE_URL}/getStates`, {
        timeout: 30000,
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
        setStates([])
      }
    } catch (err) {
      console.error('Error fetching states:', err)
      setStates([])
    } finally {
      setLoadingStates(false)
    }
  }

  // When state is selected, fetch districts
  useEffect(() => {
    if (selectedStateId) {
      fetchDistricts(selectedStateId)
      // Clear downstream selections
      if (onDistrictChange) onDistrictChange('', '')
      if (onSubDistrictChange) onSubDistrictChange('', '')
      if (onBlockChange) onBlockChange('', '')
      if (onPanchayatChange) onPanchayatChange('', '')
      if (onVillageChange) onVillageChange('', '')
      setDistricts([])
      setSubDistricts([])
      setBlocks([])
      setPanchayats([])
      setVillages([])
    }
  }, [selectedStateId])

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
      
      if (Array.isArray(response.data)) {
        setDistricts(response.data)
      } else if (response.data?.text && Array.isArray(response.data.text)) {
        setDistricts(response.data.text)
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setDistricts(response.data.data)
      } else {
        setDistricts([])
      }
    } catch (err) {
      console.error('Error fetching districts:', err)
      setDistricts([])
    } finally {
      setLoadingDistricts(false)
    }
  }

  // When district is selected, fetch sub-districts and blocks
  useEffect(() => {
    if (selectedDistrictId) {
      fetchSubDistricts(selectedDistrictId)
      fetchBlocks(selectedDistrictId)
      // Clear downstream selections
      if (onSubDistrictChange) onSubDistrictChange('', '')
      if (onBlockChange) onBlockChange('', '')
      if (onPanchayatChange) onPanchayatChange('', '')
      if (onVillageChange) onVillageChange('', '')
      setSubDistricts([])
      setBlocks([])
      setPanchayats([])
      setVillages([])
    }
  }, [selectedDistrictId])

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
      
      if (Array.isArray(response.data)) {
        setSubDistricts(response.data)
      } else if (response.data?.text && Array.isArray(response.data.text)) {
        setSubDistricts(response.data.text)
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setSubDistricts(response.data.data)
      } else {
        setSubDistricts([])
      }
    } catch (err) {
      console.error('Error fetching sub-districts:', err)
      setSubDistricts([])
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
      
      if (Array.isArray(response.data)) {
        setBlocks(response.data)
      } else if (response.data?.text && Array.isArray(response.data.text)) {
        setBlocks(response.data.text)
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setBlocks(response.data.data)
      } else {
        setBlocks([])
      }
    } catch (err) {
      console.error('Error fetching blocks:', err)
      setBlocks([])
    } finally {
      setLoadingBlocks(false)
    }
  }

  // When sub-district is selected, fetch panchayats
  useEffect(() => {
    if (selectedSubDistrictId) {
      fetchPanchayats(selectedSubDistrictId)
      // Clear downstream selections
      if (onPanchayatChange) onPanchayatChange('', '')
      if (onVillageChange) onVillageChange('', '')
      setPanchayats([])
      setVillages([])
    }
  }, [selectedSubDistrictId])

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
      
      if (Array.isArray(response.data)) {
        setPanchayats(response.data)
      } else if (response.data?.text && Array.isArray(response.data.text)) {
        setPanchayats(response.data.text)
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setPanchayats(response.data.data)
      } else {
        setPanchayats([])
      }
    } catch (err) {
      console.error('Error fetching panchayats:', err)
      setPanchayats([])
    } finally {
      setLoadingPanchayats(false)
    }
  }

  // When panchayat is selected, fetch villages
  useEffect(() => {
    if (selectedPanchayatId) {
      fetchVillages(selectedPanchayatId)
      if (onVillageChange) onVillageChange('', '')
      setVillages([])
    }
  }, [selectedPanchayatId])

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
      
      if (Array.isArray(response.data)) {
        setVillages(response.data)
      } else if (response.data?.text && Array.isArray(response.data.text)) {
        setVillages(response.data.text)
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setVillages(response.data.data)
      } else {
        setVillages([])
      }
    } catch (err) {
      console.error('Error fetching villages:', err)
      setVillages([])
    } finally {
      setLoadingVillages(false)
    }
  }

  const handleStateChange = (e) => {
    const stateId = e.target.value
    const state = states.find(s => s.lid === stateId)
    if (onStateChange) {
      onStateChange(stateId, state?.name || '')
    }
  }

  const handleDistrictChange = (e) => {
    const districtId = e.target.value
    const district = districts.find(d => d.lid === districtId)
    if (onDistrictChange) {
      onDistrictChange(districtId, district?.name || '')
    }
  }

  const handleSubDistrictChange = (e) => {
    const subDistrictId = e.target.value
    const subDistrict = subDistricts.find(sd => sd.lid === subDistrictId)
    if (onSubDistrictChange) {
      onSubDistrictChange(subDistrictId, subDistrict?.name || '')
    }
  }

  const handleBlockChange = (e) => {
    const blockId = e.target.value
    const block = blocks.find(b => b.lid === blockId)
    if (onBlockChange) {
      onBlockChange(blockId, block?.name || '')
    }
  }

  const handlePanchayatChange = (e) => {
    const panchayatId = e.target.value
    const panchayat = panchayats.find(p => p.lid === panchayatId)
    if (onPanchayatChange) {
      onPanchayatChange(panchayatId, panchayat?.name || '')
    }
  }

  const handleVillageChange = (e) => {
    const villageId = e.target.value
    const village = villages.find(v => v.lid === villageId)
    if (onVillageChange) {
      onVillageChange(villageId, village?.name || '')
    }
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {/* State */}
      <div>
        {showLabels && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State {loadingStates && <FaSpinner className="inline animate-spin ml-2" />}
          </label>
        )}
        <select
          value={selectedStateId || ''}
          onChange={handleStateChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={loadingStates}
        >
          <option value="">Select State</option>
          {states.map((state) => (
            <option key={state.lid} value={state.lid}>
              {state.name}
            </option>
          ))}
        </select>
      </div>

      {/* District */}
      <div>
        {showLabels && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            District {loadingDistricts && <FaSpinner className="inline animate-spin ml-2" />}
          </label>
        )}
        <select
          value={selectedDistrictId || ''}
          onChange={handleDistrictChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={!selectedStateId || loadingDistricts}
        >
          <option value="">Select District</option>
          {districts.map((district) => (
            <option key={district.lid} value={district.lid}>
              {district.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sub-District */}
      <div>
        {showLabels && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sub-District {loadingSubDistricts && <FaSpinner className="inline animate-spin ml-2" />}
          </label>
        )}
        <select
          value={selectedSubDistrictId || ''}
          onChange={handleSubDistrictChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={!selectedDistrictId || loadingSubDistricts}
        >
          <option value="">Select Sub-District</option>
          {subDistricts.map((subDistrict) => (
            <option key={subDistrict.lid} value={subDistrict.lid}>
              {subDistrict.name}
            </option>
          ))}
        </select>
      </div>

      {/* Block */}
      <div>
        {showLabels && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Block {loadingBlocks && <FaSpinner className="inline animate-spin ml-2" />}
          </label>
        )}
        <select
          value={selectedBlockId || ''}
          onChange={handleBlockChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={!selectedDistrictId || loadingBlocks}
        >
          <option value="">Select Block</option>
          {blocks.map((block) => (
            <option key={block.lid} value={block.lid}>
              {block.name}
            </option>
          ))}
        </select>
      </div>

      {/* Panchayat */}
      <div>
        {showLabels && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Panchayat {loadingPanchayats && <FaSpinner className="inline animate-spin ml-2" />}
          </label>
        )}
        <select
          value={selectedPanchayatId || ''}
          onChange={handlePanchayatChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={!selectedSubDistrictId || loadingPanchayats}
        >
          <option value="">Select Panchayat</option>
          {panchayats.map((panchayat) => (
            <option key={panchayat.lid} value={panchayat.lid}>
              {panchayat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Village */}
      <div>
        {showLabels && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Village {loadingVillages && <FaSpinner className="inline animate-spin ml-2" />}
          </label>
        )}
        <select
          value={selectedVillageId || ''}
          onChange={handleVillageChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={!selectedPanchayatId || loadingVillages}
        >
          <option value="">Select Village</option>
          {villages.map((village) => (
            <option key={village.lid} value={village.lid}>
              {village.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default LocationSelector

