import { useState, useEffect } from 'react'
import { FaSpinner, FaCheckCircle, FaExclamationCircle, FaCopy, FaKey, FaUser, FaLock, FaSync } from 'react-icons/fa'
import Header from '../components/Header'
import Footer from '../components/Footer'
import axios from 'axios'

// OAuth API Base URL - Use proxy in development to avoid CORS issues for AJAX requests
// The proxy rewrites /oauth-proxy to empty, so /oauth-proxy/oauth2/token becomes http://192.168.14.16:9090/oauth2/token
const OAUTH_BASE_URL = import.meta.env.DEV 
  ? '/oauth-proxy' 
  : 'http://192.168.14.16:9090'

// Authorization URL - Always use direct URL (no proxy) since it's a browser redirect, not AJAX
// This ensures the OAuth server can redirect properly to the redirect_uri
const OAUTH_AUTHORIZE_URL = 'http://192.168.14.16:9090'

// Token and UserInfo URLs - Use proxy in development to avoid CORS issues (these are AJAX requests)
const OAUTH_TOKEN_URL = OAUTH_BASE_URL
const OAUTH_USERINFO_URL = OAUTH_BASE_URL

// Generate code verifier (equivalent to: openssl rand -base64 60 | tr -d "\\n" | tr '/+' '_-' | tr -d '=')
const generateCodeVerifier = () => {
  // Generate random bytes and convert to base64
  const array = new Uint8Array(45) // 45 bytes = 60 base64 chars
  crypto.getRandomValues(array)
  const base64 = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return base64
}

// Generate code challenge (equivalent to: printf "code-verifier-string" | shasum -a 256 | head -c 64 | xxd -r -p - | openssl base64 | tr '/+' '_-' | tr -d '=')
const generateCodeChallenge = async (codeVerifier) => {
  // SHA-256 hash
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  
  // Convert to base64
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashBase64 = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  return hashBase64
}

function OAuth() {
  // Code verifier and challenge state
  const [codeVerifier, setCodeVerifier] = useState('')
  const [codeChallenge, setCodeChallenge] = useState('')

  // Authorization endpoint state
  const [authParams, setAuthParams] = useState({
    client_id: 'commonstories',
    redirect_uri: 'https://geet.observatory.org.in', // Must match exactly what's registered with OAuth server
    response_type: 'code',
    scope: 'openid email profile',
    state: '',
    code_challenge: '',
    code_challenge_method: 'S256',
  })
  const [authResult, setAuthResult] = useState(null)

  // Token endpoint state
  const [tokenParams, setTokenParams] = useState({
    grant_type: 'authorization_code',
    code: '',
    redirect_uri: 'https://geet.observatory.org.in',
    client_id: 'commonstories',
    client_secret: 'a1a8ab04c6b245e7742a87c146d945f399139e85', // Default client secret
    code_verifier: '',
  })
  const [tokenResult, setTokenResult] = useState(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [refreshToken, setRefreshToken] = useState('')

  // UserInfo endpoint state
  const [userInfoResult, setUserInfoResult] = useState(null)
  const [userInfoLoading, setUserInfoLoading] = useState(false)

  // Generate code verifier and challenge on mount
  useEffect(() => {
    generateNewCodePair()
    
    // Load stored tokens from localStorage
    const storedAccessToken = localStorage.getItem('oauth_access_token')
    const storedRefreshToken = localStorage.getItem('oauth_refresh_token')
    
    if (storedAccessToken) {
      setAccessToken(storedAccessToken)
    }
    if (storedRefreshToken) {
      setRefreshToken(storedRefreshToken)
    }
  }, [])

  // Function to generate new code verifier and challenge
  const generateNewCodePair = async () => {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    setCodeVerifier(verifier)
    setCodeChallenge(challenge)
    setAuthParams(prev => ({ ...prev, code_challenge: challenge }))
    setTokenParams(prev => ({ ...prev, code_verifier: verifier }))
  }

  // Handle authorization
  const handleAuthorize = (e) => {
    e.preventDefault()
    
    // Build query parameters - ensure redirect_uri is properly trimmed and formatted
    const redirectUri = authParams.redirect_uri?.trim()
    if (!redirectUri) {
      setAuthResult({
        success: false,
        error: { error: 'invalid_request', error_description: 'redirect_uri is required' },
      })
      return
    }
    
    const params = new URLSearchParams()
    if (authParams.client_id) params.append('client_id', authParams.client_id.trim())
    params.append('redirect_uri', redirectUri) // Always include redirect_uri
    if (authParams.response_type) params.append('response_type', authParams.response_type.trim())
    if (authParams.scope) params.append('scope', authParams.scope.trim())
    if (authParams.state) params.append('state', authParams.state.trim())
    if (authParams.code_challenge) params.append('code_challenge', authParams.code_challenge.trim())
    if (authParams.code_challenge_method) params.append('code_challenge_method', authParams.code_challenge_method.trim())

    // Use direct URL for authorization (not proxy) to ensure proper redirects
    const url = `${OAUTH_AUTHORIZE_URL}/oauth2/authorize?${params.toString()}`
    
    // Log the URL for debugging
    console.log('=== OAuth Authorization Request ===')
    console.log('Full Authorization URL:', url)
    console.log('Redirect URI being sent:', redirectUri)
    console.log('Expected redirect after login:', redirectUri)
    console.log('All parameters:', Object.fromEntries(params))
    console.log('Code Challenge:', authParams.code_challenge)
    console.log('Code Challenge Method:', authParams.code_challenge_method)
    console.log('===================================')
    
    // Validate redirect_uri format
    try {
      const redirectUrl = new URL(redirectUri)
      if (redirectUrl.protocol !== 'https:' && redirectUrl.protocol !== 'http:') {
        throw new Error('Invalid protocol')
      }
    } catch (e) {
      setAuthResult({
        success: false,
        error: { error: 'invalid_request', error_description: `Invalid redirect_uri format: ${redirectUri}. Must be a valid URL.` },
      })
      return
    }
    
    // For OAuth authorization, we need to redirect the browser to the authorization server
    // The server will handle login and redirect back with an authorization code
    // Store the redirect URI and code verifier for when we come back
    if (authParams.state) {
      localStorage.setItem('oauth_state', authParams.state)
    }
    localStorage.setItem('oauth_redirect_uri', authParams.redirect_uri)
    localStorage.setItem('oauth_code_verifier', codeVerifier)
    
    // Open authorization server in a new window
    // This allows the user to stay on the OAuth page to generate the token
    window.open(url, 'oauth_authorize', 'width=800,height=600,scrollbars=yes,resizable=yes')
    
    // Show instructions to the user
    setAuthResult({
      success: true,
      data: {
        message: 'Authorization window opened. After logging in, you will be redirected. Copy the authorization code from the URL and paste it in the Token form below.',
        instructions: [
          '1. Complete the login in the new window',
          '2. After redirect, check the URL in the new window for the "code" parameter',
          '3. Copy the code value and paste it in the "Authorization Code" field below',
          '4. The code verifier is already filled automatically'
        ]
      },
      url: url,
    })
  }

  // Handle token exchange
  const handleGetToken = async (e) => {
    e.preventDefault()
    try {
      setTokenLoading(true)
      setTokenResult(null)

      const formData = new URLSearchParams()
      formData.append('grant_type', tokenParams.grant_type)
      
      // Different parameters based on grant type
      if (tokenParams.grant_type === 'authorization_code') {
        if (tokenParams.code) formData.append('code', tokenParams.code)
        if (tokenParams.redirect_uri) formData.append('redirect_uri', tokenParams.redirect_uri)
        if (tokenParams.client_id) formData.append('client_id', tokenParams.client_id)
        if (tokenParams.code_verifier) formData.append('code_verifier', tokenParams.code_verifier)
      } else if (tokenParams.grant_type === 'refresh_token') {
        if (refreshToken) formData.append('refresh_token', refreshToken)
        if (tokenParams.client_id) formData.append('client_id', tokenParams.client_id)
      }

      // Use proxy for token request (AJAX) to avoid CORS issues
      const tokenUrl = `${OAUTH_TOKEN_URL}/oauth2/token`
      
      // Create Basic Auth header: username = client_id, password = client_secret
      const basicAuth = btoa(`${tokenParams.client_id}:${tokenParams.client_secret}`)
      
      // Log request details for debugging
      console.log('=== OAuth Token Request ===')
      console.log('Token URL:', tokenUrl)
      console.log('Request Data:', Object.fromEntries(formData))
      console.log('Client ID:', tokenParams.client_id)
      console.log('Code Verifier:', tokenParams.code_verifier)
      console.log('Using Basic Auth (client_id:client_secret)')
      console.log('==========================')

      const response = await axios.post(tokenUrl, formData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${basicAuth}`, // Basic Auth with client_id:client_secret
        },
        withCredentials: false,
      })

      console.log('=== Token Response ===')
      console.log('Status:', response.status)
      console.log('Data:', response.data)
      console.log('======================')

      const tokenData = response.data
      setTokenResult({ success: true, data: tokenData })
      
      // Store access token and refresh token if available
      if (tokenData.access_token) {
        setAccessToken(tokenData.access_token)
        localStorage.setItem('oauth_access_token', tokenData.access_token)
      }
      if (tokenData.refresh_token) {
        setRefreshToken(tokenData.refresh_token)
        localStorage.setItem('oauth_refresh_token', tokenData.refresh_token)
      }
    } catch (err) {
      // Enhanced error logging
      console.error('=== Token Request Error ===')
      console.error('Error Message:', err.message)
      console.error('Error Code:', err.code)
      console.error('Response Status:', err.response?.status)
      console.error('Response Data:', err.response?.data)
      console.error('Response Headers:', err.response?.headers)
      console.error('Request URL:', err.config?.url)
      console.error('Request Data:', err.config?.data)
      console.error('Full Error:', err)
      console.error('==========================')
      
      setTokenResult({
        success: false,
        error: {
          message: err.message,
          code: err.code,
          status: err.response?.status,
          data: err.response?.data || err.message,
          details: err.response ? {
            status: err.response.status,
            statusText: err.response.statusText,
            data: err.response.data,
          } : {
            networkError: true,
            message: 'Network error - check CORS or server connectivity'
          }
        },
      })
    } finally {
      setTokenLoading(false)
    }
  }

  // Handle refresh token
  const handleRefreshToken = async (e) => {
    e.preventDefault()
    if (!refreshToken) {
      setTokenResult({
        success: false,
        error: { error: 'missing_refresh_token', error_description: 'Refresh token is required. Please get an access token first.' },
      })
      return
    }

    try {
      setTokenLoading(true)
      setTokenResult(null)

      const formData = new URLSearchParams()
      formData.append('grant_type', 'refresh_token')
      formData.append('refresh_token', refreshToken)
      if (tokenParams.client_id) formData.append('client_id', tokenParams.client_id)

      const tokenUrl = `${OAUTH_TOKEN_URL}/oauth2/token`
      
      // Create Basic Auth header: username = client_id, password = client_secret
      const basicAuth = btoa(`${tokenParams.client_id}:${tokenParams.client_secret}`)
      
      console.log('=== Refresh Token Request ===')
      console.log('Token URL:', tokenUrl)
      console.log('Request Data:', Object.fromEntries(formData))
      console.log('Refresh Token:', refreshToken)
      console.log('Using Basic Auth (client_id:client_secret)')
      console.log('============================')

      const response = await axios.post(tokenUrl, formData, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${basicAuth}`,
        },
        withCredentials: false,
      })

      console.log('=== Refresh Token Response ===')
      console.log('Status:', response.status)
      console.log('Data:', response.data)
      console.log('==============================')

      const tokenData = response.data
      setTokenResult({ success: true, data: tokenData })
      
      // Store new access token and refresh token if available
      if (tokenData.access_token) {
        setAccessToken(tokenData.access_token)
        localStorage.setItem('oauth_access_token', tokenData.access_token)
      }
      if (tokenData.refresh_token) {
        setRefreshToken(tokenData.refresh_token) // Update refresh token (some servers issue new refresh tokens)
        localStorage.setItem('oauth_refresh_token', tokenData.refresh_token)
      }
    } catch (err) {
      console.error('=== Refresh Token Error ===')
      console.error('Error Message:', err.message)
      console.error('Response Status:', err.response?.status)
      console.error('Response Data:', err.response?.data)
      console.error('===========================')
      
      setTokenResult({
        success: false,
        error: {
          message: err.message,
          code: err.code,
          status: err.response?.status,
          data: err.response?.data || err.message,
          details: err.response ? {
            status: err.response.status,
            statusText: err.response.statusText,
            data: err.response.data,
          } : {
            networkError: true,
            message: 'Network error - check CORS or server connectivity'
          }
        },
      })
    } finally {
      setTokenLoading(false)
    }
  }

  // Handle userinfo
  const handleGetUserInfo = async (e) => {
    e.preventDefault()
    if (!accessToken && !tokenResult?.data?.access_token) {
      setUserInfoResult({
        success: false,
        error: 'Access token is required. Please get a token first.',
      })
      return
    }

    try {
      setUserInfoLoading(true)
      setUserInfoResult(null)

      const token = accessToken || tokenResult?.data?.access_token

      // Use proxy for userinfo request (AJAX) to avoid CORS issues
      const response = await axios.get(`${OAUTH_USERINFO_URL}/userinfo`, {
        timeout: 30000,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        withCredentials: false,
      })

      setUserInfoResult({ success: true, data: response.data })
    } catch (err) {
      setUserInfoResult({
        success: false,
        error: err.response?.data || err.message,
      })
    } finally {
      setUserInfoLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2))
    // Note: OAuth.jsx doesn't have access to useError hook, so we'll keep alert for now
    // or we can add the hook if needed
    alert('Copied to clipboard!')
  }

  // Check for authorization code in URL on mount (when redirected back)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    const error = urlParams.get('error')
    
    if (code) {
      // Auto-fill the authorization code in token form
      setTokenParams(prev => ({
        ...prev,
        code: code,
      }))
      
      // Restore state if available
      const storedState = localStorage.getItem('oauth_state')
      if (state && storedState === state) {
        setAuthParams(prev => ({ ...prev, state: state }))
      }
      
      // Show success message
      setAuthResult({
        success: true,
        data: { code, state, message: 'Authorization code received. You can now exchange it for a token.' },
        url: window.location.href,
      })
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (error) {
      setAuthResult({
        success: false,
        error: { error, error_description: urlParams.get('error_description') || 'Authorization was denied or failed.' },
        url: window.location.href,
      })
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const renderResult = (result, title) => {
    if (!result) return null

    if (result.success === false) {
      return (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-red-700">
              <FaExclamationCircle />
              <span className="font-semibold">{title} - Error</span>
            </div>
            <button
              onClick={() => copyToClipboard(result.error)}
              className="text-xs px-2 py-1 bg-red-200 hover:bg-red-300 rounded flex items-center gap-1"
            >
              <FaCopy /> Copy
            </button>
          </div>
          <pre className="text-xs overflow-auto max-h-60 bg-white p-2 rounded border">
            {JSON.stringify(result.error, null, 2)}
          </pre>
        </div>
      )
    }

    if (result.success === true) {
      return (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-green-700">
              <FaCheckCircle />
              <span className="font-semibold">{title} - Success</span>
            </div>
            <button
              onClick={() => copyToClipboard(result.data)}
              className="text-xs px-2 py-1 bg-green-200 hover:bg-green-300 rounded flex items-center gap-1"
            >
              <FaCopy /> Copy
            </button>
          </div>
          {result.data?.message && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800 font-medium mb-2">{result.data.message}</p>
              {result.data.instructions && (
                <ul className="list-disc list-inside text-xs text-blue-700 space-y-1">
                  {result.data.instructions.map((instruction, idx) => (
                    <li key={idx}>{instruction}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {result.url && (
            <div className="mb-2 text-xs text-gray-600">
              <strong>Authorization URL:</strong> <code className="bg-white px-1 py-0.5 rounded break-all">{result.url}</code>
            </div>
          )}
          {result.data?.code && (
            <div className="mb-2 p-2 bg-white rounded border">
              <p className="text-xs font-medium text-gray-700 mb-1">Authorization Code:</p>
              <code className="text-xs break-all">{result.data.code}</code>
            </div>
          )}
          {!result.data?.message && (
            <pre className="text-xs overflow-auto max-h-60 bg-white p-2 rounded border">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1">

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            OAuth 2.0 Authentication
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Test and implement OAuth 2.0 authorization flow
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Code Verifier & Challenge Section */}
            <div className="bg-blue-50 rounded-lg shadow-md p-6 border border-blue-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaLock className="text-blue-700" />
                PKCE Code Verifier & Challenge
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Code verifier and challenge are automatically generated using S256 method
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code Verifier
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={codeVerifier}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-xs font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(codeVerifier)}
                      className="px-3 py-2 bg-blue-200 hover:bg-blue-300 rounded text-sm"
                      title="Copy Code Verifier"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code Challenge (S256)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={codeChallenge}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-xs font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(codeChallenge)}
                      className="px-3 py-2 bg-blue-200 hover:bg-blue-300 rounded text-sm"
                      title="Copy Code Challenge"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={generateNewCodePair}
                className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 flex items-center gap-2"
              >
                <FaSync />
                Generate New Code Pair
              </button>
            </div>

            {/* Authorization Endpoint */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaKey className="text-green-700" />
                Authorization Endpoint
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                API: <code className="bg-gray-100 px-2 py-1 rounded">{OAUTH_AUTHORIZE_URL}/oauth2/authorize</code>
                <span className="text-xs text-gray-500 ml-2">(Direct URL - no proxy for browser redirects)</span>
              </p>
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>Important:</strong> The redirect_uri must match exactly what's registered with the OAuth server. 
                  Current value: <code className="bg-white px-1 py-0.5 rounded">{authParams.redirect_uri}</code>
                </p>
              </div>
              
              <form onSubmit={handleAuthorize} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client ID *
                    </label>
                    <input
                      type="text"
                      value={authParams.client_id}
                      onChange={(e) => setAuthParams(prev => ({ ...prev, client_id: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter client ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Redirect URI *
                    </label>
                    <input
                      type="text"
                      value={authParams.redirect_uri}
                      onChange={(e) => setAuthParams(prev => ({ ...prev, redirect_uri: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="http://localhost:3000/callback"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Response Type
                    </label>
                    <select
                      value={authParams.response_type}
                      onChange={(e) => setAuthParams(prev => ({ ...prev, response_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="code">code</option>
                      <option value="token">token</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scope
                    </label>
                    <input
                      type="text"
                      value={authParams.scope}
                      onChange={(e) => setAuthParams(prev => ({ ...prev, scope: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="openid email profile"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State (Optional)
                    </label>
                    <input
                      type="text"
                      value={authParams.state}
                      onChange={(e) => setAuthParams(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Random state value"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code Challenge (Auto-filled)
                    </label>
                    <input
                      type="text"
                      value={authParams.code_challenge}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code Challenge Method
                    </label>
                    <select
                      value={authParams.code_challenge_method}
                      onChange={(e) => setAuthParams(prev => ({ ...prev, code_challenge_method: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="S256">S256</option>
                      <option value="plain">plain</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 flex items-center gap-2"
                >
                  <FaKey />
                  Authorize (Redirect to Login)
                </button>
                <p className="text-sm text-gray-600">
                  This will redirect you to the authorization server for login
                </p>
              </form>
              {renderResult(authResult, 'Authorization')}
            </div>

            {/* Token Endpoint */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaLock className="text-green-700" />
                Token Endpoint
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                API: <code className="bg-gray-100 px-2 py-1 rounded">{OAUTH_TOKEN_URL}/oauth2/token</code>
                <span className="text-xs text-gray-500 ml-2">(Uses proxy in dev to avoid CORS)</span>
              </p>
              
              <form onSubmit={handleGetToken} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grant Type
                    </label>
                    <select
                      value={tokenParams.grant_type}
                      onChange={(e) => setTokenParams(prev => ({ ...prev, grant_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="authorization_code">authorization_code</option>
                      <option value="client_credentials">client_credentials</option>
                      <option value="refresh_token">refresh_token</option>
                    </select>
                  </div>
                  {tokenParams.grant_type === 'authorization_code' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Authorization Code *
                        </label>
                        <input
                          type="text"
                          value={tokenParams.code}
                          onChange={(e) => setTokenParams(prev => ({ ...prev, code: e.target.value }))}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Code from authorization"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Redirect URI *
                        </label>
                        <input
                          type="text"
                          value={tokenParams.redirect_uri}
                          onChange={(e) => setTokenParams(prev => ({ ...prev, redirect_uri: e.target.value }))}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Same as authorization redirect_uri"
                        />
                      </div>
                    </>
                  )}
                  {tokenParams.grant_type === 'refresh_token' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Refresh Token *
                      </label>
                      <input
                        type="text"
                        value={refreshToken}
                        onChange={(e) => setRefreshToken(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-xs"
                        placeholder="Refresh token from previous token response"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-filled from previous token response if available
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client ID *
                    </label>
                    <input
                      type="text"
                      value={tokenParams.client_id}
                      onChange={(e) => setTokenParams(prev => ({ ...prev, client_id: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter client ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Secret *
                    </label>
                    <input
                      type="password"
                      value={tokenParams.client_secret}
                      onChange={(e) => setTokenParams(prev => ({ ...prev, client_secret: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter client secret"
                    />
                  </div>
                  {tokenParams.grant_type === 'authorization_code' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code Verifier (Auto-filled)
                      </label>
                      <input
                        type="text"
                        value={tokenParams.code_verifier}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-xs font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Must match the code verifier used in authorization
                      </p>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={tokenLoading}
                  className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {tokenLoading ? <FaSpinner className="animate-spin" /> : <FaLock />}
                  {tokenLoading ? 'Getting Token...' : 'Get Token'}
                </button>
              </form>
              {renderResult(tokenResult, 'Token')}
              {tokenResult?.success && tokenResult?.data?.access_token && (
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-2">Access Token (stored for UserInfo):</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-white p-2 rounded border break-all">
                        {tokenResult.data.access_token}
                      </code>
                      <button
                        onClick={() => copyToClipboard(tokenResult.data.access_token)}
                        className="px-2 py-1 bg-blue-200 hover:bg-blue-300 rounded text-xs"
                      >
                        <FaCopy />
                      </button>
                    </div>
                    {tokenResult.data.expires_in && (
                      <p className="text-xs text-blue-600 mt-2">
                        Expires in: {tokenResult.data.expires_in} seconds ({Math.round(tokenResult.data.expires_in / 60)} minutes)
                      </p>
                    )}
                  </div>
                  {tokenResult.data.refresh_token && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800 mb-2">Refresh Token (stored for token refresh):</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-white p-2 rounded border break-all font-mono">
                          {tokenResult.data.refresh_token}
                        </code>
                        <button
                          onClick={() => copyToClipboard(tokenResult.data.refresh_token)}
                          className="px-2 py-1 bg-green-200 hover:bg-green-300 rounded text-xs"
                        >
                          <FaCopy />
                        </button>
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        Use this token to get a new access token when it expires
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Refresh Token Section */}
            {refreshToken && (
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaSync className="text-purple-700" />
                  Refresh Token
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Use your refresh token to get a new access token without re-authenticating. Your access token expires in <strong>{tokenResult?.data?.expires_in ? Math.round(tokenResult.data.expires_in / 60) : '~15'}</strong> minutes.
                </p>
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-xs text-purple-800 mb-2">
                    <strong>What is a Refresh Token?</strong>
                  </p>
                  <ul className="text-xs text-purple-700 space-y-1 list-disc list-inside">
                    <li>Access tokens expire quickly (typically 15 minutes) for security</li>
                    <li>Refresh tokens are long-lived and can be used to get new access tokens</li>
                    <li>You don't need to log in again - just use the refresh token</li>
                    <li>Refresh tokens can be revoked if compromised, limiting damage</li>
                  </ul>
                </div>
                <form onSubmit={handleRefreshToken} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Refresh Token (Auto-filled)
                    </label>
                    <input
                      type="text"
                      value={refreshToken}
                      onChange={(e) => setRefreshToken(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-xs font-mono"
                      readOnly
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={tokenLoading || !refreshToken}
                    className="px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {tokenLoading ? <FaSpinner className="animate-spin" /> : <FaSync />}
                    {tokenLoading ? 'Refreshing Token...' : 'Refresh Access Token'}
                  </button>
                </form>
              </div>
            )}

            {/* UserInfo Endpoint */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaUser className="text-green-700" />
                UserInfo Endpoint
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                API: <code className="bg-gray-100 px-2 py-1 rounded">{OAUTH_USERINFO_URL}/userinfo</code>
                <span className="text-xs text-gray-500 ml-2">(Uses proxy in dev to avoid CORS)</span>
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Token
                  </label>
                  <input
                    type="text"
                    value={accessToken || tokenResult?.data?.access_token || ''}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Access token from token endpoint"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Token will be auto-filled from Token endpoint result, or enter manually
                  </p>
                </div>
                <button
                  onClick={handleGetUserInfo}
                  disabled={userInfoLoading || (!accessToken && !tokenResult?.data?.access_token)}
                  className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {userInfoLoading ? <FaSpinner className="animate-spin" /> : <FaUser />}
                  {userInfoLoading ? 'Fetching User Info...' : 'Get User Info'}
                </button>
              </div>
              {renderResult(userInfoResult, 'UserInfo')}
            </div>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  )
}

export default OAuth
