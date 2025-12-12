# Refresh Token Flow - Complete System Overview

This document explains all refresh token scenarios in the FES Stories application using a hybrid approach (Frontend Proactive + Backend Reactive).

## System Architecture

```mermaid
graph TB
    subgraph "Frontend (React)"
        A[App Component] --> B[useTokenRefresh Hook]
        B --> C[Token Refresh Utility]
        C --> D[API Client]
        D --> E[Axios Interceptors]
    end
    
    subgraph "Backend (Laravel BFF)"
        F[API Routes] --> G[AuthenticateSession Middleware]
        G --> H[Session Model]
        G --> I[AuthController]
        I --> J[OAuth Server]
    end
    
    D -->|HTTP Requests| F
    J -->|Token Response| I
    I -->|Update Session| H
```

## Complete Refresh Token Scenarios

### Scenario 1: User Logs In (Initial Authentication)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant BFF as Backend BFF
    participant OAuth as OAuth Server
    participant DB as Database

    User->>Frontend: Click Login
    Frontend->>OAuth: Redirect to OAuth Server
    OAuth->>User: Login Form
    User->>OAuth: Enter Credentials
    OAuth->>Frontend: Redirect with Auth Code
    Frontend->>BFF: POST /api/auth/oauth/callback<br/>(code, code_verifier)
    BFF->>OAuth: Exchange Code for Tokens
    OAuth->>BFF: Return access_token + refresh_token
    BFF->>DB: Create Session<br/>(encrypt tokens, set expires_at)
    BFF->>Frontend: Set HTTP-only Cookie (session_id)
    Frontend->>Frontend: Store token expiry in localStorage
    Frontend->>BFF: GET /api/auth/me
    BFF->>Frontend: Return user info + token expiry
    Frontend->>User: User Logged In
```

### Scenario 2: Token Expired, Refresh Token Valid (User Returns Next Day)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant BFF as Backend BFF
    participant OAuth as OAuth Server
    participant DB as Database

    Note over User,DB: User returns next day - Access token expired, Refresh token still valid
    
    User->>Frontend: Open Application
    Frontend->>Frontend: useTokenRefresh hook initializes
    Frontend->>BFF: GET /api/auth/me<br/>(with session cookie)
    
    BFF->>BFF: AuthenticateSession Middleware
    BFF->>DB: Load Session from Cookie
    DB->>BFF: Session (expired access_token, valid refresh_token)
    
    BFF->>BFF: Check: isExpired() = true
    BFF->>BFF: Check: oauth_refresh_token exists = true
    
    BFF->>OAuth: POST /oauth2/token<br/>(grant_type=refresh_token)
    OAuth->>BFF: Return new access_token + refresh_token
    BFF->>DB: Update Session<br/>(new tokens, new expires_at)
    DB->>BFF: Session Updated
    
    BFF->>Frontend: 200 OK<br/>(user info + new token expiry)
    Frontend->>Frontend: Update localStorage with new expiry
    Frontend->>User: User stays logged in (seamless)
```

### Scenario 3: Token Expired, Refresh Token Also Expired

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant BFF as Backend BFF
    participant OAuth as OAuth Server
    participant DB as Database

    Note over User,DB: Both tokens expired - User must login again
    
    User->>Frontend: Open Application
    Frontend->>BFF: GET /api/auth/me<br/>(with session cookie)
    
    BFF->>BFF: AuthenticateSession Middleware
    BFF->>DB: Load Session from Cookie
    DB->>BFF: Session (expired access_token, expired refresh_token)
    
    BFF->>BFF: Check: isExpired() = true
    BFF->>BFF: Check: oauth_refresh_token exists = true
    
    BFF->>OAuth: POST /oauth2/token<br/>(grant_type=refresh_token)
    OAuth->>BFF: 400/401 Error<br/>(refresh_token expired/invalid)
    
    BFF->>BFF: Catch Exception
    BFF->>BFF: Log Warning
    BFF->>Frontend: 401 Unauthorized<br/>(message: Session expired)
    
    Frontend->>Frontend: Clear token expiry from localStorage
    Frontend->>Frontend: Clear user from localStorage
    Frontend->>User: Redirect to Login Page
```

### Scenario 4: Proactive Token Refresh (Token Valid but Near Expiry)

```mermaid
sequenceDiagram
    participant Frontend
    participant BFF as Backend BFF
    participant OAuth as OAuth Server
    participant DB as Database

    Note over Frontend,DB: Token expires in < 5 minutes - Proactive refresh
    
    Frontend->>Frontend: Periodic Check (every 1 minute)
    Frontend->>Frontend: Check: shouldRefreshToken() = true<br/>(expires in < 5 min)
    Frontend->>BFF: GET /api/auth/me<br/>(with session cookie)
    
    BFF->>BFF: AuthenticateSession Middleware
    BFF->>DB: Load Session from Cookie
    DB->>BFF: Session (valid but expires soon)
    
    BFF->>BFF: Check: isExpired() = false
    BFF->>BFF: refreshIfNeeded()<br/>(expires within 5 min threshold)
    BFF->>OAuth: POST /oauth2/token<br/>(grant_type=refresh_token)
    OAuth->>BFF: Return new access_token + refresh_token
    BFF->>DB: Update Session<br/>(new tokens, new expires_at)
    
    BFF->>Frontend: 200 OK<br/>(user info + new token expiry)
    Frontend->>Frontend: Update localStorage with new expiry
    Note over Frontend: Token refreshed before expiry - No interruption
```

### Scenario 5: User Returns to Tab (Visibility API)

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Frontend
    participant BFF as Backend BFF

    Note over User,BFF: User switches tabs and returns
    
    User->>Browser: Switch back to tab
    Browser->>Frontend: visibilitychange event<br/>(visibilityState = 'visible')
    Frontend->>Frontend: useTokenRefresh hook detects visibility change
    Frontend->>BFF: GET /api/auth/me<br/>(check current token status)
    
    alt Token Expired or Near Expiry
        BFF->>BFF: Middleware refreshes if needed
        BFF->>Frontend: Return user info + new token expiry
        Frontend->>Frontend: Update localStorage
    else Token Still Valid
        BFF->>Frontend: Return user info + current token expiry
        Frontend->>Frontend: Update localStorage
    end
    
    Note over Frontend: User seamlessly continues - No interruption
```

### Scenario 6: API Request with Expired Token (Reactive Refresh)

```mermaid
sequenceDiagram
    participant Frontend
    participant BFF as Backend BFF
    participant OAuth as OAuth Server
    participant DB as Database

    Note over Frontend,DB: User makes API request, token expired during request
    
    Frontend->>BFF: POST /api/stories<br/>(with session cookie)
    
    BFF->>BFF: AuthenticateSession Middleware
    BFF->>DB: Load Session
    DB->>BFF: Session (expired access_token, valid refresh_token)
    
    BFF->>BFF: Check: isExpired() = true
    BFF->>OAuth: POST /oauth2/token<br/>(grant_type=refresh_token)
    OAuth->>BFF: Return new access_token
    BFF->>DB: Update Session
    
    BFF->>BFF: Continue with original request
    BFF->>BFF: Process POST /api/stories
    BFF->>Frontend: 200 OK<br/>(story created + new token expiry)
    
    Frontend->>Frontend: Update token expiry from response
    Note over Frontend: Request succeeds - Token refreshed transparently
```

### Scenario 7: No Refresh Token Available

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant BFF as Backend BFF
    participant DB as Database

    Note over User,DB: Session exists but no refresh token (edge case)
    
    User->>Frontend: Make API Request
    Frontend->>BFF: GET /api/users<br/>(with session cookie)
    
    BFF->>BFF: AuthenticateSession Middleware
    BFF->>DB: Load Session
    DB->>BFF: Session (expired access_token, no refresh_token)
    
    BFF->>BFF: Check: isExpired() = true
    BFF->>BFF: Check: oauth_refresh_token = null
    
    BFF->>BFF: Log Warning
    BFF->>Frontend: 401 Unauthorized<br/>(message: Session expired)
    
    Frontend->>Frontend: Clear localStorage
    Frontend->>User: Redirect to Login
    Note over User: User must login again
```

## Complete State Diagram

```mermaid
stateDiagram-v2
    [*] --> NotAuthenticated
    
    NotAuthenticated --> Authenticated: OAuth Login Success
    Authenticated --> TokenValid: Token Active
    Authenticated --> TokenExpiring: Token < 5 min to expiry
    
    TokenValid --> TokenExpiring: Time passes
    TokenExpiring --> TokenValid: Proactive Refresh Success
    TokenExpiring --> TokenExpired: Time passes
    
    TokenExpired --> TokenValid: Refresh Token Valid<br/>Auto Refresh Success
    TokenExpired --> NotAuthenticated: Refresh Token Expired<br/>401 Error
    
    TokenValid --> TokenExpired: Time passes
    TokenValid --> [*]: Logout
    
    note right of TokenExpiring
        Frontend proactively refreshes
        before expiry (5 min threshold)
    end note
    
    note right of TokenExpired
        Backend middleware automatically
        refreshes on next request if
        refresh token is valid
    end note
```

## Token Lifecycle Timeline

```mermaid
gantt
    title Token Lifecycle Example (15 min access token, 30 day refresh token)
    dateFormat X
    axisFormat %s
    
    section Access Token
    Token Valid (0-10 min)           :active, token1, 0, 600
    Near Expiry (10-15 min)         :crit, token2, 600, 900
    Expired (15+ min)               :done, token3, 900, 1800
    
    section Refresh Token
    Refresh Token Valid (0-30 days) :active, refresh1, 0, 2592000
    Refresh Token Expired (30+ days):done, refresh2, 2592000, 2593000
    
    section Actions
    Proactive Refresh (at 10 min)   :milestone, m1, 600, 0
    Auto Refresh (at 15 min)        :milestone, m2, 900, 0
    User Must Login (at 30 days)    :milestone, m3, 2592000, 0
```

## Key Points

### Frontend Responsibilities
- ✅ Proactive refresh when token expires in < 5 minutes
- ✅ Periodic checks every 1 minute
- ✅ Visibility API refresh when user returns to tab
- ✅ Track token expiry in localStorage
- ✅ Update expiry from all API responses

### Backend Responsibilities
- ✅ Reactive refresh when expired token detected
- ✅ Automatic refresh on all protected routes
- ✅ Proactive refresh when token expires in < 5 minutes
- ✅ Handle refresh token expiry gracefully
- ✅ Return token expiry info in `/api/auth/me` response

### Hybrid Approach Benefits
- **Resilient**: Frontend proactive + Backend reactive = No missed refreshes
- **Seamless**: User never sees 401 errors (unless refresh token expired)
- **Efficient**: Only refreshes when needed (5 min threshold)
- **Secure**: Refresh tokens never exposed to frontend (HTTP-only cookies)

## Error Handling

```mermaid
flowchart TD
    A[API Request] --> B{Session Exists?}
    B -->|No| C[401: No Session]
    B -->|Yes| D{Token Expired?}
    
    D -->|No| E{Expires in < 5 min?}
    E -->|Yes| F[Proactive Refresh]
    E -->|No| G[Continue Request]
    
    D -->|Yes| H{Refresh Token Exists?}
    H -->|No| I[401: No Refresh Token]
    H -->|Yes| J[Attempt Refresh]
    
    J --> K{Refresh Success?}
    K -->|Yes| L[Update Session]
    K -->|No| M[401: Refresh Failed]
    
    L --> G
    F --> N{Refresh Success?}
    N -->|Yes| G
    N -->|No| O[Log Warning, Continue]
    
    C --> P[Clear Frontend State]
    I --> P
    M --> P
    P --> Q[Redirect to Login]
    
    G --> R[Return Response]
    O --> R
```

## Summary

The system handles all refresh token scenarios automatically:

1. ✅ **User returns next day** → Auto-refresh if refresh token valid
2. ✅ **Token near expiry** → Proactive refresh before expiry
3. ✅ **Token expired during request** → Reactive refresh by middleware
4. ✅ **Refresh token expired** → User must login (expected behavior)
5. ✅ **User returns to tab** → Check and refresh if needed
6. ✅ **No refresh token** → User must login (edge case)

The hybrid approach ensures users stay logged in as long as their refresh token is valid, with seamless token renewal happening automatically in the background.

