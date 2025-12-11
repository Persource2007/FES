import axios from 'axios'

// OAuth Configuration - Match OAuth page exactly
// Authorization uses direct URL (browser redirect, no CORS)
// Token and UserInfo use proxy in development to avoid CORS (same as OAuth page)
const OAUTH_BASE_URL = import.meta.env.DEV 
  ? '/oauth-proxy' 
  : 'http://192.168.14.16:9090'

const OAUTH_CONFIG = {
  authorizeUrl: 'http://192.168.14.16:9090/oauth2/authorize', // Direct URL for browser redirect
  tokenUrl: `${OAUTH_BASE_URL}/oauth2/token`, // Uses proxy in dev to avoid CORS (same as OAuth page)
  userInfoUrl: `${OAUTH_BASE_URL}/userinfo`, // Uses proxy in dev to avoid CORS (same as OAuth page)
  clientId: 'commonstories',
  clientSecret: 'a1a8ab04c6b245e7742a87c146d945f399139e85',
  // Use the same redirect URI as the OAuth testing page
  redirectUri: 'https://geet.observatory.org.in',
  scope: 'read',
}

// Generate code verifier for PKCE
export const generateCodeVerifier = () => {
  const array = new Uint8Array(45)
  crypto.getRandomValues(array)
  const base64 = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return base64
}

// Generate code challenge from verifier
export const generateCodeChallenge = async (codeVerifier) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashBase64 = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return hashBase64
}

// Initiate OAuth login - opens popup and tries to extract code from redirect URL
// Returns a promise that resolves with the code, or rejects with an error
// If we can't automatically extract (due to CORS), it will trigger a callback for manual entry
export const initiateOAuthLogin = async (onCodeNeeded) => {
  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  
  return new Promise((resolve, reject) => {
    
    // Store code verifier for later use
    localStorage.setItem('oauth_code_verifier', codeVerifier)
    
    // Generate state for CSRF protection
    const state = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
    localStorage.setItem('oauth_state', state)
    localStorage.setItem('oauth_pending', 'true') // Flag to indicate OAuth is in progress
    
    // Build authorization URL
    const params = new URLSearchParams({
      client_id: OAUTH_CONFIG.clientId,
      redirect_uri: OAUTH_CONFIG.redirectUri,
      response_type: 'code',
      scope: OAUTH_CONFIG.scope,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: state,
    })
    
    // Log the redirect URI being used
    console.log('=== OAuth Authorization ===')
    console.log('Redirect URI:', OAUTH_CONFIG.redirectUri)
    console.log('Full params:', Object.fromEntries(params))
    console.log('==========================')
    
    const authUrl = `${OAUTH_CONFIG.authorizeUrl}?${params.toString()}`
    
    console.log('Authorization URL:', authUrl)
    
    // Open popup window
    const popup = window.open(
      authUrl,
      'oauth_login',
      'width=800,height=600,scrollbars=yes,resizable=yes'
    )
    
    if (!popup) {
      localStorage.removeItem('oauth_pending')
      reject(new Error('Popup blocked. Please allow popups for this site.'))
      return
    }
    
    let codeExtracted = false
    let manualEntryTriggered = false
    
    // Poll popup to detect redirect and extract code
    const pollInterval = setInterval(() => {
      try {
        // Check if popup is closed
        if (popup.closed) {
          clearInterval(pollInterval)
          if (!codeExtracted) {
            localStorage.removeItem('oauth_pending')
            if (!manualEntryTriggered) {
              reject(new Error('OAuth popup was closed'))
            }
          }
          return
        }
        
        // Try to access popup's URL
        try {
          const popupUrl = popup.location.href
          
          // If we can access the URL and it contains the redirect domain
          if (popupUrl && popupUrl.includes('geet.observatory.org.in')) {
            // Extract code from URL
            const url = new URL(popupUrl)
            const code = url.searchParams.get('code')
            const returnedState = url.searchParams.get('state')
            const error = url.searchParams.get('error')
            
            if (error) {
              clearInterval(pollInterval)
              popup.close()
              localStorage.removeItem('oauth_pending')
              reject(new Error(url.searchParams.get('error_description') || error))
              return
            }
            
            if (code) {
              // Verify state
              if (returnedState !== state) {
                clearInterval(pollInterval)
                popup.close()
                localStorage.removeItem('oauth_pending')
                reject(new Error('State parameter mismatch'))
                return
              }
              
              codeExtracted = true
              clearInterval(pollInterval)
              popup.close()
              localStorage.removeItem('oauth_pending')
              resolve(code)
              return
            }
          }
        } catch (e) {
          // Cross-origin error - popup has redirected to geet.observatory.org.in
          // We can't access the URL due to CORS, so we need manual entry
          if (!manualEntryTriggered && onCodeNeeded) {
            manualEntryTriggered = true
            // Trigger callback to show manual code entry UI
            onCodeNeeded((code) => {
              codeExtracted = true
              clearInterval(pollInterval)
              if (!popup.closed) {
                popup.close()
              }
              localStorage.removeItem('oauth_pending')
              
              // Verify state if provided
              const returnedState = localStorage.getItem('oauth_returned_state')
              if (returnedState && returnedState !== state) {
                reject(new Error('State parameter mismatch'))
                return
              }
              
              resolve(code)
            })
          }
        }
      } catch (e) {
        // Error accessing popup
        console.error('Error polling popup:', e)
      }
    }, 500)
    
    // Timeout after 5 minutes
    setTimeout(() => {
      if (!codeExtracted) {
        clearInterval(pollInterval)
        if (!popup.closed) {
          popup.close()
        }
        localStorage.removeItem('oauth_pending')
        if (!manualEntryTriggered && onCodeNeeded) {
          manualEntryTriggered = true
          onCodeNeeded((code) => {
            const returnedState = localStorage.getItem('oauth_returned_state')
            if (returnedState && returnedState !== state) {
              reject(new Error('State parameter mismatch'))
              return
            }
            resolve(code)
          })
        } else {
          reject(new Error('OAuth login timeout'))
        }
      }
    }, 300000)
  })
}

// Function to manually submit code (when user pastes it)
export const submitOAuthCode = (code, state = null) => {
  if (state) {
    localStorage.setItem('oauth_returned_state', state)
  }
  // Trigger the callback that was set up in initiateOAuthLogin
  const pending = localStorage.getItem('oauth_pending')
  if (pending === 'true') {
    // The code will be processed by the callback in initiateOAuthLogin
    return true
  }
  return false
}

// Exchange authorization code for tokens via BFF (Backend for Frontend)
// This sends the code to our backend, which handles token exchange server-side
export const exchangeCodeForToken = async (code) => {
  const codeVerifier = localStorage.getItem('oauth_code_verifier')
  
  if (!codeVerifier) {
    throw new Error('Code verifier not found. Please try logging in again.')
  }
  
  // Clean the code - extract just the code value if it contains parameters
  let cleanCode = code.trim()
  
  // If code contains &state=, extract everything before it
  if (cleanCode.includes('&state=')) {
    cleanCode = cleanCode.split('&state=')[0]
  }
  // If code contains &, try to extract just the code part
  else if (cleanCode.includes('&') && !cleanCode.includes('code=')) {
    // If it's just "codeValue&state=value", take everything before the first &
    cleanCode = cleanCode.split('&')[0]
  }
  // If it contains code=, extract the code parameter value
  else if (cleanCode.includes('code=')) {
    try {
      // If it's a full URL, parse it
      if (cleanCode.startsWith('http://') || cleanCode.startsWith('https://')) {
        const url = new URL(cleanCode)
        const codeParam = url.searchParams.get('code')
        if (codeParam) {
          cleanCode = codeParam
        }
      } else {
        // Try parsing as URL parameters
        const match = cleanCode.match(/code=([^&]+)/)
        if (match && match[1]) {
          cleanCode = decodeURIComponent(match[1])
        } else {
          // Try URLSearchParams
          const params = new URLSearchParams(cleanCode)
          const codeParam = params.get('code')
          if (codeParam) {
            cleanCode = codeParam
          }
        }
      }
    } catch (e) {
      // If parsing fails, try manual extraction
      const match = cleanCode.match(/code=([^&]+)/)
      if (match && match[1]) {
        cleanCode = decodeURIComponent(match[1])
      }
    }
  }
  
  try {
    // Import API client
    const apiClient = (await import('./api')).default
    const { API_ENDPOINTS } = await import('./constants')
    
    console.log('=== BFF OAuth Callback Request ===')
    console.log('Code (cleaned):', cleanCode)
    console.log('Code Verifier:', codeVerifier ? 'Present' : 'Missing')
    console.log('Endpoint:', API_ENDPOINTS.AUTH.OAUTH_CALLBACK)
    console.log('===================================')
    
    // Send code to BFF backend - tokens are handled server-side
    const response = await apiClient.post(API_ENDPOINTS.AUTH.OAUTH_CALLBACK, {
      code: cleanCode,
      code_verifier: codeVerifier,
    })
    
    console.log('=== BFF OAuth Callback Response ===')
    console.log('Status:', response.status)
    console.log('Data:', response.data)
    console.log('===================================')
    
    // Clean up PKCE data
    localStorage.removeItem('oauth_code_verifier')
    localStorage.removeItem('oauth_state')
    
    // BFF returns user info and sets session cookie automatically
    // Store user info in localStorage (but NOT tokens - they're in HTTP-only cookie)
    if (response.data.user) {
      localStorage.setItem('oauth_user', JSON.stringify(response.data.user))
    }
    
    return response.data
  } catch (error) {
    console.error('=== BFF OAuth Callback Error ===')
    console.error('Error Message:', error.message)
    console.error('Response Status:', error.response?.status)
    console.error('Response Data:', error.response?.data)
    console.error('===============================')
    
    // Create a more detailed error message
    const errorMessage = error.response?.data?.message
      || error.message
      || 'Unknown error during authentication'
    
    const detailedError = new Error(errorMessage)
    detailedError.response = error.response
    detailedError.status = error.response?.status
    throw detailedError
  }
}

// Get user info from BFF (checks session)
export const getUserInfo = async () => {
  try {
    const apiClient = (await import('./api')).default
    const { API_ENDPOINTS } = await import('./constants')
    
    const response = await apiClient.get(API_ENDPOINTS.AUTH.ME)
    
    // Store user info in localStorage (but NOT tokens - they're in HTTP-only cookie)
    if (response.data.user) {
      localStorage.setItem('oauth_user', JSON.stringify(response.data.user))
      return response.data.user
    }
    
    return null
  } catch (error) {
    console.error('Get user info error:', error)
    // If session expired, clear local state
    if (error.response?.status === 401) {
      localStorage.removeItem('oauth_user')
    }
    throw error
  }
}

// Check if user is logged in via OAuth (by checking session)
export const isOAuthLoggedIn = async () => {
  try {
    const user = await getUserInfo()
    return !!user
  } catch (error) {
    return false
  }
}

// Get stored OAuth user (from localStorage)
export const getOAuthUser = () => {
  const userStr = localStorage.getItem('oauth_user')
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch (e) {
      return null
    }
  }
  return null
}

// Logout OAuth user (calls BFF logout endpoint)
export const logoutOAuth = async () => {
  try {
    const apiClient = (await import('./api')).default
    const { API_ENDPOINTS } = await import('./constants')
    
    // Call BFF logout endpoint to destroy session
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // Clear local state regardless of API call result
    localStorage.removeItem('oauth_user')
    localStorage.removeItem('oauth_code_verifier')
    localStorage.removeItem('oauth_state')
    localStorage.removeItem('oauth_access_token') // Legacy cleanup
    localStorage.removeItem('oauth_refresh_token') // Legacy cleanup
  }
}

