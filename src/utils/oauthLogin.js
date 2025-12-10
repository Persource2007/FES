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

// Exchange authorization code for access token
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
  
  // Ensure redirect_uri is exactly what we expect (no localhost) - match OAuth page exactly
  const redirectUri = OAUTH_CONFIG.redirectUri.trim()
  if (redirectUri.includes('localhost')) {
    console.error('ERROR: Redirect URI contains localhost!', redirectUri)
    throw new Error('Invalid redirect URI configuration')
  }
  
  // Match OAuth page implementation exactly - same parameter construction
  const formData = new URLSearchParams()
  formData.append('grant_type', 'authorization_code')
  if (cleanCode) formData.append('code', cleanCode)
  if (redirectUri) formData.append('redirect_uri', redirectUri)
  if (OAUTH_CONFIG.clientId) formData.append('client_id', OAUTH_CONFIG.clientId)
  if (codeVerifier) formData.append('code_verifier', codeVerifier)
  
  // Log all parameters being sent
  console.log('=== Token Exchange Parameters ===')
  console.log('grant_type: authorization_code')
  console.log('code (original):', code)
  console.log('code (cleaned):', cleanCode)
  console.log('redirect_uri:', redirectUri)
  console.log('client_id:', OAUTH_CONFIG.clientId)
  console.log('code_verifier:', codeVerifier ? 'Present' : 'Missing')
  console.log('Form Data:', formData.toString())
  console.log('==================================')
  
  const basicAuth = btoa(`${OAUTH_CONFIG.clientId}:${OAUTH_CONFIG.clientSecret}`)
  
  try {
    // Match OAuth page exactly - use proxy URL construction
    const tokenUrl = OAUTH_CONFIG.tokenUrl
    
    console.log('=== Token Exchange Request ===')
    console.log('Token URL:', tokenUrl)
    console.log('Request Data:', Object.fromEntries(formData))
    console.log('Client ID:', OAUTH_CONFIG.clientId)
    console.log('Client Secret:', OAUTH_CONFIG.clientSecret ? 'Present' : 'Missing')
    console.log('Redirect URI:', redirectUri)
    console.log('Code (cleaned):', cleanCode)
    console.log('Code Verifier:', codeVerifier ? 'Present' : 'Missing')
    console.log('Using Basic Auth (client_id:client_secret)')
    console.log('=============================')
    
    const response = await axios.post(tokenUrl, formData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Basic ${basicAuth}`, // Basic Auth with client_id:client_secret
      },
      withCredentials: false,
    })
    
    console.log('=== Token Exchange Response ===')
    console.log('Status:', response.status)
    console.log('Data:', response.data)
    console.log('================================')
    
    // Store tokens
    if (response.data.access_token) {
      localStorage.setItem('oauth_access_token', response.data.access_token)
    }
    if (response.data.refresh_token) {
      localStorage.setItem('oauth_refresh_token', response.data.refresh_token)
    }
    
    // Clean up
    localStorage.removeItem('oauth_code_verifier')
    localStorage.removeItem('oauth_state')
    
    return response.data
  } catch (error) {
    console.error('=== Token Exchange Error ===')
    console.error('Error Message:', error.message)
    console.error('Response Status:', error.response?.status)
    console.error('Response Data:', error.response?.data)
    console.error('Request Config:', {
      url: error.config?.url,
      data: error.config?.data,
      headers: error.config?.headers,
    })
    console.error('===========================')
    
    // Create a more detailed error message
    const errorMessage = error.response?.data?.error_description 
      || error.response?.data?.error 
      || error.response?.data?.message
      || error.message
      || 'Unknown error during token exchange'
    
    const detailedError = new Error(errorMessage)
    detailedError.response = error.response
    detailedError.status = error.response?.status
    throw detailedError
  }
}

// Get user info using access token
export const getUserInfo = async () => {
  const accessToken = localStorage.getItem('oauth_access_token')
  
  if (!accessToken) {
    throw new Error('Access token not found. Please log in again.')
  }
  
  try {
    // Match OAuth page - use proxy URL
    const userInfoUrl = OAUTH_CONFIG.userInfoUrl
    
    const response = await axios.get(userInfoUrl, {
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
      withCredentials: false,
    })
    
    // Store user info
    if (response.data) {
      localStorage.setItem('oauth_user', JSON.stringify(response.data))
    }
    
    return response.data
  } catch (error) {
    console.error('UserInfo error:', error)
    // If token expired, clear it
    if (error.response?.status === 401) {
      localStorage.removeItem('oauth_access_token')
      localStorage.removeItem('oauth_user')
    }
    throw error
  }
}

// Check if user is logged in via OAuth
export const isOAuthLoggedIn = () => {
  return !!localStorage.getItem('oauth_access_token')
}

// Get stored OAuth user
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

// Logout OAuth user
export const logoutOAuth = () => {
  localStorage.removeItem('oauth_access_token')
  localStorage.removeItem('oauth_refresh_token')
  localStorage.removeItem('oauth_user')
  localStorage.removeItem('oauth_code_verifier')
  localStorage.removeItem('oauth_state')
}

