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
 * @returns {number|null} - Story ID or null
 */
export function getStoryIdFromSlug(slugOrId) {
  // If it's a number, return it
  const id = parseInt(slugOrId, 10)
  if (!isNaN(id)) {
    return id
  }
  // Otherwise, try to extract ID from slug (format: id-title-slug)
  const match = slugOrId.match(/^(\d+)-/)
  if (match) {
    return parseInt(match[1], 10)
  }
  return null
}

