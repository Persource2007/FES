/**
 * Activity tracking utility
 * Stores activities in database via API
 */

import apiClient from './api'
import { API_ENDPOINTS } from './constants'

/**
 * Get current user ID from localStorage
 * Supports both OAuth (oauth_user) and old local login (user)
 */
const getCurrentUserId = () => {
  try {
    const oauthUserData = localStorage.getItem('oauth_user')
    const oldUserData = localStorage.getItem('user')
    const userData = oauthUserData || oldUserData
    
    if (!userData) return null
    const user = JSON.parse(userData)
    return user?.id || null
  } catch (error) {
    console.error('Error getting current user ID:', error)
    return null
  }
}

/**
 * Get all activities for the current user from API
 */
export const getActivities = async () => {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      console.warn('No user ID found, cannot fetch activities')
      return []
    }

    const response = await apiClient.get(API_ENDPOINTS.ACTIVITIES.LIST, {
      params: { user_id: userId },
    })

    if (response.data && response.data.success && response.data.activities) {
      return response.data.activities
    }

    return []
  } catch (error) {
    console.error('Error fetching activities from API:', error)
    // Return empty array on error to prevent UI breakage
    return []
  }
}

/**
 * Add a new activity via API
 */
export const addActivity = async (type, message, metadata = {}) => {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      console.warn('No user ID found, cannot log activity')
      return null
    }

    const response = await apiClient.post(API_ENDPOINTS.ACTIVITIES.CREATE, {
      user_id: userId,
      type,
      message,
      metadata,
    })

    if (response.data && response.data.success && response.data.activity) {
      return response.data.activity
    }

    return null
  } catch (error) {
    console.error('Error logging activity to API:', error)
    // Don't throw error - activity logging should not break the app
    return null
  }
}

/**
 * Clear all activities (not implemented for database)
 * This function is kept for backward compatibility but does nothing
 */
export const clearActivities = () => {
  console.warn('clearActivities() is not supported with database storage. Activities are permanent.')
}

