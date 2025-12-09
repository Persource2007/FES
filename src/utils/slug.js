/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - The text to convert to a slug
 * @returns {string} - The slug
 */
export function generateSlug(text) {
  if (!text) return ''
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '') // Trim hyphens from start
    .replace(/-+$/, '') // Trim hyphens from end
}

/**
 * Extract story ID from slug or return slug as ID
 * @param {string} slugOrId - Slug or ID
 * @returns {number|null} - Story ID or null (deprecated - now returns slug)
 */
export function getStoryIdFromSlug(slugOrId) {
  // If it's a number, return it (for backward compatibility)
  const id = parseInt(slugOrId, 10)
  if (!isNaN(id) && slugOrId.toString() === id.toString()) {
    return id
  }
  // Otherwise, it's a slug - return null (slug will be used directly)
  return null
}

/**
 * Get story slug from URL parameter
 * @param {string} slugOrId - Slug or ID from URL
 * @returns {string} - The slug
 */
export function getStorySlug(slugOrId) {
  // If it's a number, it's an old format - return null to use ID endpoint
  const id = parseInt(slugOrId, 10)
  if (!isNaN(id) && slugOrId.toString() === id.toString()) {
    return null // Use ID endpoint for backward compatibility
  }
  // Otherwise, it's a slug
  return slugOrId
}

