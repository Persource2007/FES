/**
 * Permission Utilities
 * 
 * Utility functions for checking user permissions in the frontend.
 * This allows for flexible role-based access control without hardcoding role names.
 */

/**
 * Check if user has a specific permission
 * 
 * @param {Object} user - User object with permissions array
 * @param {string} permissionSlug - Permission slug to check
 * @returns {boolean}
 */
export function hasPermission(user, permissionSlug) {
  if (!user || !user.permissions || !Array.isArray(user.permissions)) {
    return false
  }
  return user.permissions.includes(permissionSlug)
}

/**
 * Check if user has any of the given permissions
 * 
 * @param {Object} user - User object with permissions array
 * @param {string[]} permissionSlugs - Array of permission slugs to check
 * @returns {boolean}
 */
export function hasAnyPermission(user, permissionSlugs) {
  if (!user || !user.permissions || !Array.isArray(user.permissions)) {
    return false
  }
  if (!permissionSlugs || permissionSlugs.length === 0) {
    return false
  }
  return permissionSlugs.some((slug) => user.permissions.includes(slug))
}

/**
 * Check if user has all of the given permissions
 * 
 * @param {Object} user - User object with permissions array
 * @param {string[]} permissionSlugs - Array of permission slugs to check
 * @returns {boolean}
 */
export function hasAllPermissions(user, permissionSlugs) {
  if (!user || !user.permissions || !Array.isArray(user.permissions)) {
    return false
  }
  if (!permissionSlugs || permissionSlugs.length === 0) {
    return false
  }
  return permissionSlugs.every((slug) => user.permissions.includes(slug))
}

/**
 * Check if user can manage users
 * 
 * @param {Object} user - User object with permissions array
 * @returns {boolean}
 */
export function canManageUsers(user) {
  return hasPermission(user, 'manage_users')
}

/**
 * Check if user can manage story categories
 * 
 * @param {Object} user - User object with permissions array
 * @returns {boolean}
 */
export function canManageStoryCategories(user) {
  return hasPermission(user, 'manage_story_categories')
}

/**
 * Check if user can manage reader access
 * 
 * @param {Object} user - User object with permissions array
 * @returns {boolean}
 */
export function canManageReaderAccess(user) {
  return hasPermission(user, 'manage_reader_access')
}

/**
 * Check if user can post stories
 * 
 * @param {Object} user - User object with permissions array
 * @returns {boolean}
 */
export function canPostStories(user) {
  return hasPermission(user, 'post_stories')
}

/**
 * Check if user can view stories
 * 
 * @param {Object} user - User object with permissions array
 * @returns {boolean}
 */
export function canViewStories(user) {
  return hasPermission(user, 'view_stories')
}

/**
 * Check if user can view activity
 * 
 * @param {Object} user - User object with permissions array
 * @returns {boolean}
 */
export function canViewActivity(user) {
  return hasPermission(user, 'view_activity')
}

/**
 * Check if user can manage settings
 * 
 * @param {Object} user - User object with permissions array
 * @returns {boolean}
 */
export function canManageSettings(user) {
  return hasPermission(user, 'manage_settings')
}

