# Backend-for-Frontend (BFF) Implementation Guide

## Overview

This document explains how to implement a Backend-for-Frontend (BFF) pattern for the FES Stories application, moving from the current frontend-direct OAuth flow to a more secure, centralized authentication architecture.

## Current Implementation vs BFF Pattern

### Current Implementation (Frontend-Direct):
```
Frontend (React) 
  → Direct OAuth Server (authorization, token exchange, userinfo)
  → Stores tokens in localStorage
  → Makes API calls with tokens
```

**Issues:**
- Tokens exposed to JavaScript (XSS vulnerability)
- No centralized role management
- Frontend handles sensitive operations
- Difficult to integrate with microservices

### BFF Pattern (Recommended):
```
Frontend (React)
  → BFF Backend (Lumen)
    → OAuth Server (token exchange, userinfo)
    → Your Database (role checking)
  → Frontend gets session cookie
  → Frontend makes API calls to BFF (with session)
  → BFF makes microservice calls (with client token)
```

**Benefits:**
- ✅ Tokens never exposed to browser
- ✅ Centralized role management
- ✅ Secure HTTP-only cookies
- ✅ Better microservice integration
- ✅ Centralized error handling

## Architecture Decision: Use Existing Lumen Service

### Question: Do we need a separate service?

**Answer: No. Use your existing Lumen service as the BFF.**

### Current Architecture:
```
Lumen Backend (Current)
├── Database: PostgreSQL
│   ├── users table
│   ├── roles table
│   ├── organizations table
│   ├── stories table
│   └── ... (other tables)
├── Controllers
├── Middleware
└── Routes
```

### After BFF Implementation:
```
Lumen Backend (Same Service - Acts as BFF)
├── Database: PostgreSQL (Same Database)
│   ├── users table
│   ├── roles table
│   ├── organizations table
│   ├── stories table
│   ├── sessions table (NEW - for token/session storage)
│   └── ... (other tables)
├── Controllers
│   ├── AuthController (Enhanced - handles OAuth)
│   └── ... (existing controllers)
├── Middleware
│   ├── AuthenticateSession (NEW)
│   └── ... (existing middleware)
└── Routes
    ├── /api/auth/oauth/callback (NEW)
    ├── /api/auth/me (NEW)
    └── ... (existing routes)
```

### Why Use Existing Service?

1. ✅ **Already has user/role management** - No need to duplicate
2. ✅ **Same database** - Consistent data, easier queries
3. ✅ **Simpler deployment** - One service to manage
4. ✅ **No inter-service communication** - Faster, simpler
5. ✅ **Can evolve later** - Easy to split if needed

## Architecture Diagrams

### Current (Frontend-Direct):
```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │ Direct OAuth calls
       │ (tokens in localStorage)
       ▼
┌─────────────┐
│ OAuth Server│
│ (192.168...)│
└─────────────┘

┌─────────────┐
│Lumen Backend│
│  (API only) │
└─────────────┘
```

### After BFF (Using Existing Lumen):
```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │ Session cookie
       │ (no tokens exposed)
       ▼
┌─────────────────────────┐
│   Lumen Backend (BFF)   │
│  ┌───────────────────┐  │
│  │ AuthController    │  │
│  │ - OAuth callback  │  │
│  │ - Token exchange  │  │
│  │ - Session mgmt    │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ Session Middleware│  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ PostgreSQL DB     │  │
│  │ - users           │  │
│  │ - roles           │  │
│  │ - sessions (NEW)  │  │
│  └───────────────────┘  │
└──────────┬───────────────┘
           │ Server-to-server
           │ (tokens never exposed)
           ▼
┌─────────────┐
│ OAuth Server│
│ (192.168...)│
└─────────────┘
```

## Complete Request Flow

### OIDC Flow (User Login / SSO)

1. **User initiates login** - When a user clicks Login on the Common Stories website, the application sends an authorization request to the Auth Server.

2. **Auth Server validates session**:
   - If no active session exists, the Auth Server displays the login page. After the user enters their credentials and they are successfully validated, the Auth Server issues an authorization code.
   - If a valid session exists, it directly returns the authorization code.

3. **Backend-for-Frontend (BFF) exchanges the code** - The Common Stories BFF uses this authorization code to request tokens from the Auth Server.

4. **Fetch user details** - The BFF calls the userinfo endpoint to obtain the authenticated user's details (e.g., username, email).

5. **Apply role-based access** - With the username available, the BFF can determine the user's assigned roles and provide module-level access accordingly on the website.

### Machine-to-Machine Flow (Microservice API Access)

1. The Common Stories website (through the BFF) requests a token from the Auth Server using the `client_id`.

2. This token is then used to call Common Stories microservices' APIs through the API Gateway.

3. No user-level data is required here, since authorization is performed at the client level (e.g., `client_id = commonstories`) rather than at the individual user level. (IO's microservices will not be user-facing)

### User-Specific Access in Common Stories Website

Since you already obtained the username/userid when a user logs into the website via the OIDC flow, your BFF can establish a user session locally. This session can be used to enforce user-specific rules based on your role-management module.

**Because of this, you don't need to:**
- Send user-specific information in request headers, or
- Repeatedly call the userinfo endpoint from your microservices.

All user-level authorization decisions can be made within your BFF using the information retrieved once during login.

## Implementation Steps

### Step 1: Create Database Migration for Sessions Table

**File: `backend/database/migrations/xxxx_create_sessions_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id', 40)->primary();
            $table->unsignedBigInteger('user_id');
            $table->text('oauth_access_token'); // Encrypted
            $table->text('oauth_refresh_token')->nullable(); // Encrypted
            $table->timestamp('expires_at');
            $table->timestamps();
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index('user_id');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
    }
};
```

### Step 2: Create BFF OAuth Endpoints

**File: `backend/routes/api.php`** - Add these routes:

```php
// OAuth callback endpoint (receives authorization code from frontend)
$router->post('/auth/oauth/callback', 'AuthController@oauthCallback');

// Get current user session
$router->get('/auth/me', 'AuthController@getCurrentUser');

// Logout
$router->post('/auth/logout', 'AuthController@logout');
```

### Step 3: Implement OAuth Callback in AuthController

**File: `backend/app/Http/Controllers/AuthController.php`** - Add these methods:

```php
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\User;

public function oauthCallback(Request $request)
{
    try {
        // 1. Get authorization code from frontend
        $code = $request->input('code');
        $codeVerifier = $request->input('code_verifier'); // From PKCE
        
        if (!$code || !$codeVerifier) {
            return $this->errorResponse('Code and code verifier are required', 400);
        }
        
        // 2. Exchange code for tokens (server-side, tokens never exposed to browser)
        $tokenResponse = $this->exchangeCodeForToken($code, $codeVerifier);
        
        if (!isset($tokenResponse['access_token'])) {
            return $this->errorResponse('Failed to obtain access token', 400);
        }
        
        // 3. Get user info from OAuth server
        $userInfo = $this->getUserInfoFromOAuth($tokenResponse['access_token']);
        
        if (!isset($userInfo['email'])) {
            return $this->errorResponse('Email not found in user info', 400);
        }
        
        // 4. Check if user exists in your database with role
        $user = User::where('email', $userInfo['email'])->first();
        
        if (!$user) {
            return $this->errorResponse(
                'User not found in database. Please contact the administrator to create an account for you.',
                404
            );
        }
        
        if (!$user->role_id) {
            return $this->errorResponse(
                'No role assigned to your account. Please contact the administrator to assign a role before proceeding.',
                403
            );
        }
        
        // 5. Create local session (store in database)
        $sessionId = $this->createUserSession($user, $tokenResponse);
        
        // 6. Get user role
        $role = null;
        if ($user->role_id) {
            $roleResult = DB::table('roles')->where('id', $user->role_id)->first();
            if ($roleResult) {
                $role = [
                    'id' => $roleResult->id,
                    'name' => $roleResult->role_name,
                ];
            }
        }
        
        // 7. Return session cookie (HTTP-only, secure)
        return $this->successResponse([
            'message' => 'Login successful',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $role,
            ],
        ])->cookie('session_id', $sessionId, 60*24*7, '/', null, true, true); // 7 days, HTTP-only, secure
    } catch (\Exception $e) {
        \Log::error('OAuth callback error', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
        
        return $this->errorResponse('An error occurred during authentication', 500);
    }
}

private function exchangeCodeForToken($code, $codeVerifier)
{
    // Make server-side request to OAuth token endpoint
    $response = Http::asForm()->withBasicAuth(
        'commonstories',
        'a1a8ab04c6b245e7742a87c146d945f399139e85'
    )->post('http://192.168.14.16:9090/oauth2/token', [
        'grant_type' => 'authorization_code',
        'code' => $code,
        'redirect_uri' => 'https://geet.observatory.org.in',
        'client_id' => 'commonstories',
        'code_verifier' => $codeVerifier,
    ]);
    
    if (!$response->successful()) {
        throw new \Exception('Token exchange failed: ' . $response->body());
    }
    
    return $response->json();
}

private function getUserInfoFromOAuth($accessToken)
{
    $response = Http::withToken($accessToken)
        ->get('http://192.168.14.16:9090/userinfo');
    
    if (!$response->successful()) {
        throw new \Exception('Failed to get user info: ' . $response->body());
    }
    
    return $response->json();
}

private function createUserSession($user, $tokenResponse)
{
    // Generate unique session ID
    $sessionId = Str::random(40);
    
    // Encrypt tokens before storing
    $encryptedAccessToken = encrypt($tokenResponse['access_token']);
    $encryptedRefreshToken = isset($tokenResponse['refresh_token']) 
        ? encrypt($tokenResponse['refresh_token']) 
        : null;
    
    // Calculate expiration
    $expiresAt = now()->addSeconds($tokenResponse['expires_in'] ?? 900);
    
    // Store in database
    DB::table('sessions')->insert([
        'id' => $sessionId,
        'user_id' => $user->id,
        'oauth_access_token' => $encryptedAccessToken,
        'oauth_refresh_token' => $encryptedRefreshToken,
        'expires_at' => $expiresAt,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    
    return $sessionId;
}

public function getCurrentUser(Request $request)
{
    $sessionId = $request->cookie('session_id');
    
    if (!$sessionId) {
        return $this->errorResponse('No active session', 401);
    }
    
    $session = DB::table('sessions')
        ->where('id', $sessionId)
        ->where('expires_at', '>', now())
        ->first();
    
    if (!$session) {
        return $this->errorResponse('Session expired', 401);
    }
    
    $user = User::find($session->user_id);
    
    if (!$user) {
        return $this->errorResponse('User not found', 404);
    }
    
    // Get role
    $role = null;
    if ($user->role_id) {
        $roleResult = DB::table('roles')->where('id', $user->role_id)->first();
        if ($roleResult) {
            $role = [
                'id' => $roleResult->id,
                'name' => $roleResult->role_name,
            ];
        }
    }
    
    return $this->successResponse([
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $role,
        ],
    ]);
}

public function logout(Request $request)
{
    $sessionId = $request->cookie('session_id');
    
    if ($sessionId) {
        DB::table('sessions')->where('id', $sessionId)->delete();
    }
    
    return $this->successResponse(['message' => 'Logged out successfully'])
        ->cookie('session_id', '', -1); // Delete cookie
}
```

### Step 4: Create Session Middleware

**File: `backend/app/Http/Middleware/AuthenticateSession.php`:**

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class AuthenticateSession
{
    public function handle(Request $request, Closure $next)
    {
        $sessionId = $request->cookie('session_id');
        
        if (!$sessionId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - No session found'
            ], 401);
        }
        
        $session = DB::table('sessions')
            ->where('id', $sessionId)
            ->where('expires_at', '>', now())
            ->first();
        
        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Session expired'
            ], 401);
        }
        
        // Attach user to request
        $user = User::find($session->user_id);
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - User not found'
            ], 401);
        }
        
        // Attach user to request for use in controllers
        $request->merge(['user_id' => $user->id]);
        $request->setUserResolver(function () use ($user) {
            return $user;
        });
        
        return $next($request);
    }
}
```

**Register middleware in `backend/bootstrap/app.php`:**

```php
$app->routeMiddleware([
    'auth.session' => App\Http\Middleware\AuthenticateSession::class,
]);
```

### Step 5: Update Frontend OAuth Flow

**File: `src/utils/oauthLogin.js`** - Update to send code to BFF:

```javascript
// Instead of exchanging code directly, send it to your BFF
export const initiateOAuthLogin = async () => {
  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  
  // Store code verifier for later
  localStorage.setItem('oauth_code_verifier', codeVerifier)
  
  // Build authorization URL
  const params = new URLSearchParams({
    client_id: 'commonstories',
    redirect_uri: 'https://geet.observatory.org.in',
    response_type: 'code',
    scope: 'read',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  
  // Open OAuth server in popup
  const authUrl = `http://192.168.14.16:9090/oauth2/authorize?${params.toString()}`
  const popup = window.open(authUrl, 'oauth', 'width=500,height=600')
  
  // Wait for authorization code (polling or message)
  // ... (existing code to get code from popup)
  
  // Once you have the code, send it to BFF instead of exchanging directly
  const apiClient = (await import('./api')).default
  const codeVerifier = localStorage.getItem('oauth_code_verifier')
  
  const response = await apiClient.post('/api/auth/oauth/callback', {
    code: code,
    code_verifier: codeVerifier,
  })
  
  // Clear code verifier
  localStorage.removeItem('oauth_code_verifier')
  
  // BFF returns user info and sets session cookie automatically
  return response.data
}
```

### Step 6: Update Frontend API Calls

**File: `src/utils/api.js`** - Remove OAuth token handling:

```javascript
import axios from 'axios'
import { API_BASE_URL } from './constants'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Send cookies with requests
})

// Request interceptor - No need to add Authorization header
// Session cookie is sent automatically by browser
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
    })
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      response: error.response,
    })
    
    // Handle 401 - Session expired
    if (error.response?.status === 401) {
      // Clear any local state
      localStorage.removeItem('user')
      // Redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

### Step 7: Update Frontend to Check Session

**File: `src/components/Header.jsx`** - Update to check session:

```javascript
// Check if user is logged in
useEffect(() => {
  const checkSession = async () => {
    try {
      const apiClient = (await import('../utils/api')).default
      const response = await apiClient.get('/api/auth/me')
      
      if (response.data.success) {
        setOAuthUser(response.data.user)
        setIsOAuthAuthenticated(true)
      }
    } catch (error) {
      // No active session
      setOAuthUser(null)
      setIsOAuthAuthenticated(false)
    }
  }
  
  checkSession()
}, [])
```

## Request Flow Diagrams

### User Login Flow:
```
1. User clicks "Login" 
   → Frontend redirects to OAuth server

2. User authenticates 
   → OAuth server redirects back with code

3. Frontend sends code to BFF 
   → POST /api/auth/oauth/callback

4. BFF exchanges code for tokens (server-side)
   → POST http://192.168.14.16:9090/oauth2/token

5. BFF gets userinfo from OAuth server
   → GET http://192.168.14.16:9090/userinfo

6. BFF checks user in database + role
   → Query users table

7. BFF creates session + returns session cookie
   → Insert into sessions table
   → Set HTTP-only cookie

8. Frontend stores user info in state (not tokens)
   → Update React state
```

### API Request Flow:
```
1. Frontend makes API call 
   → GET /api/stories

2. Browser automatically sends session cookie
   → Cookie: session_id=xxx

3. BFF validates session 
   → Query sessions table
   → Gets user from session

4. BFF applies role-based access control
   → Check user.role_id
   → Check permissions

5. BFF calls microservices (if needed) with client token
   → Machine-to-machine token

6. BFF returns data to frontend
   → JSON response
```

### Microservice Call Flow:
```
1. BFF needs to call microservice 
   → Uses client credentials

2. BFF requests token from OAuth server 
   → client_id/client_secret

3. BFF calls microservice API Gateway with client token
   → Authorization: Bearer <client_token>

4. Microservice validates client token
   → OAuth server validates

5. Returns data to BFF 
   → Returns to frontend
```

## Security Improvements

### Before (Frontend-Direct):
- ❌ Tokens stored in localStorage (XSS vulnerable)
- ❌ Tokens visible in JavaScript
- ❌ No centralized token management
- ❌ Difficult to revoke sessions

### After (BFF Pattern):
- ✅ Tokens stored server-side (encrypted in database)
- ✅ Tokens never exposed to JavaScript
- ✅ HTTP-only cookies (XSS protection)
- ✅ Centralized session management
- ✅ Easy session revocation
- ✅ Automatic expiration handling

## Database Schema

### Sessions Table:
```sql
CREATE TABLE sessions (
    id VARCHAR(40) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    oauth_access_token TEXT NOT NULL,  -- Encrypted
    oauth_refresh_token TEXT,            -- Encrypted, nullable
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

## Optional: Redis for Sessions (Performance Optimization)

For better performance at scale, you can use Redis instead of database:

```php
// Store session in Redis instead of database
use Illuminate\Support\Facades\Cache;

private function createUserSession($user, $tokenResponse)
{
    $sessionId = Str::random(40);
    
    Cache::put("session:{$sessionId}", [
        'user_id' => $user->id,
        'oauth_access_token' => encrypt($tokenResponse['access_token']),
        'oauth_refresh_token' => isset($tokenResponse['refresh_token']) 
            ? encrypt($tokenResponse['refresh_token']) 
            : null,
        'expires_at' => now()->addSeconds($tokenResponse['expires_in'] ?? 900),
    ], $tokenResponse['expires_in'] ?? 900); // Auto-expire
    
    return $sessionId;
}
```

**Benefits:**
- Faster lookups (in-memory)
- Automatic expiration
- Better for high traffic
- Can migrate from database later

## When to Consider Separate BFF Service

Consider a separate BFF service if:
- ✅ You need to scale BFF independently from main API
- ✅ You have multiple frontend apps sharing same BFF
- ✅ You want strict service boundaries
- ✅ You have full microservices architecture
- ✅ Different teams manage BFF vs main API

**For current setup:** Existing Lumen service is sufficient.

## Migration Path

### Phase 1: Current (Frontend-Direct)
- Frontend handles OAuth
- Tokens in localStorage
- Direct API calls

### Phase 2: BFF in Existing Service (Recommended)
- Add BFF endpoints to Lumen
- Add sessions table
- Move token exchange to backend
- Use session cookies

### Phase 3: Optional - Separate BFF Service
- Extract BFF to separate service
- Only if scaling requires it

## Key Changes Summary

1. ✅ **Add `sessions` table** to existing PostgreSQL database
2. ✅ **Enhance `AuthController`** with OAuth methods
3. ✅ **Add new routes** to existing `routes/api.php`
4. ✅ **Create `AuthenticateSession` middleware**
5. ✅ **Update frontend** to use BFF endpoints
6. ✅ **Remove token storage** from localStorage
7. ✅ **Use session cookies** instead of tokens

## Testing Checklist

- [ ] OAuth callback endpoint works
- [ ] Session creation works
- [ ] Session validation works
- [ ] Role checking works
- [ ] Session expiration works
- [ ] Logout clears session
- [ ] Frontend receives user info
- [ ] API calls work with session cookie
- [ ] Unauthorized requests are rejected

## Notes

- **No new service needed** - Use existing Lumen service
- **Same database** - Add sessions table to existing PostgreSQL
- **Backward compatible** - Can run both flows during migration
- **Secure by default** - Tokens never exposed to browser
- **Scalable** - Can migrate to Redis or separate service later

