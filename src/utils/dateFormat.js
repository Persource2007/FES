/**
 * Date Formatting Utilities
 * 
 * Centralized date formatting functions using Indian Standard Time (IST)
 * All dates are formatted in 'en-IN' locale with 'Asia/Kolkata' timezone
 */

const INDIAN_LOCALE = 'en-IN'
const INDIAN_TIMEZONE = 'Asia/Kolkata'

/**
 * Format a date string to Indian date format (long format with full month name)
 * Example: "15 January 2024"
 * 
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string or empty string if invalid
 */
export function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  
  return date.toLocaleDateString(INDIAN_LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: INDIAN_TIMEZONE,
  })
}

/**
 * Format a date string to Indian date format with time (short format)
 * Example: "15 Jan 2024, 10:30 AM"
 * 
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string or 'N/A' if invalid
 */
export function formatDateTime(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'N/A'
  
  return date.toLocaleString(INDIAN_LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: INDIAN_TIMEZONE,
  })
}

/**
 * Format a date string to short date format (short month name)
 * Example: "15 Jan 2024"
 * 
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string or empty string if invalid
 */
export function formatDateShort(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  
  return date.toLocaleDateString(INDIAN_LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: INDIAN_TIMEZONE,
  })
}

/**
 * Format a timestamp to relative time (e.g., "2 hours ago", "Just now")
 * Falls back to formatted date if older than 7 days
 * 
 * @param {string|Date} timestamp - Date string or Date object
 * @returns {string} Relative time string or formatted date
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return ''
  
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString(INDIAN_LOCALE, {
    timeZone: INDIAN_TIMEZONE,
  })
}

/**
 * Format a date to simple date string (default format)
 * 
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string or empty string if invalid
 */
export function formatDateSimple(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  
  return date.toLocaleDateString(INDIAN_LOCALE, {
    timeZone: INDIAN_TIMEZONE,
  })
}

