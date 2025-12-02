import { useState, useEffect, useCallback } from 'react'
import apiClient from '../utils/api'

/**
 * Custom hook for making API calls
 * @param {string} url - API endpoint URL
 * @param {object} options - Request options (method, data, immediate, etc.)
 * @returns {object} - { data, loading, error, execute, reset }
 */
export const useApi = (url, options = {}) => {
  const {
    method = 'GET',
    data: initialData = null,
    immediate = true,
    headers = {},
  } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)

  const execute = useCallback(
    async (requestData = null) => {
      setLoading(true)
      setError(null)

      try {
        const config = {
          method,
          url,
          headers,
        }

        if (requestData || initialData) {
          if (method === 'GET') {
            config.params = requestData || initialData
          } else {
            config.data = requestData || initialData
          }
        }

        const response = await apiClient(config)
        setData(response.data)
        return response.data
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || err.message || 'An error occurred'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [url, method, initialData, headers]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (immediate) {
      execute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, loading, error, execute, reset }
}

/**
 * Custom hook for making POST/PUT/PATCH requests
 * @param {string} url - API endpoint URL
 * @param {object} options - Request options
 * @returns {object} - { execute, loading, error, reset }
 */
export const useMutation = (url, options = {}) => {
  const { method = 'POST', headers = {} } = options
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(
    async (data) => {
      setLoading(true)
      setError(null)

      try {
        const response = await apiClient({
          method,
          url,
          data,
          headers,
        })
        return response.data
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || err.message || 'An error occurred'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [url, method, headers]
  )

  const reset = useCallback(() => {
    setError(null)
    setLoading(false)
  }, [])

  return { execute, loading, error, reset }
}

