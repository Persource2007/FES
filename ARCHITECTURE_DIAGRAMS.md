# FES Stories - Architecture Diagrams

This document contains Mermaid diagrams illustrating the complete authentication and API request flows for both the current implementation (without BFF) and the recommended BFF pattern.

## Table of Contents

1. [Current Architecture (Without BFF)](#current-architecture-without-bff)
2. [BFF Architecture (Recommended)](#bff-architecture-recommended)
3. [Comparison](#comparison)

---

## Current Architecture (Without BFF)

### Complete User Login Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend (React)
    participant OAuth as OAuth Server<br/>(192.168.14.16:9090)
    participant Lumen as Lumen Backend<br/>(localhost:8000)
    participant DB as PostgreSQL Database

    User->>Frontend: Click "OLogin" button
    Frontend->>Frontend: Generate PKCE: code_verifier, code_challenge
    Frontend->>Frontend: Store code_verifier in localStorage
    Frontend->>OAuth: Open popup: GET /oauth2/authorize<br/>(with code_challenge)
    
    alt User not logged in to OAuth
        OAuth->>User: Show login page
        User->>OAuth: Enter credentials
        OAuth->>OAuth: Validate credentials
    end
    
    OAuth->>Frontend: Redirect to redirect_uri<br/>?code=AUTH_CODE&state=STATE
    Frontend->>Frontend: Extract code from URL
    
    Note over Frontend: User manually enters code<br/>(due to CORS on different domain)
    
    Frontend->>Frontend: Get code_verifier from localStorage
    Frontend->>OAuth: POST /oauth2/token<br/>(via /oauth-proxy in dev)<br/>Body: code, code_verifier, redirect_uri<br/>Headers: Basic Auth (client_id:client_secret)
    OAuth->>Frontend: Return access_token, refresh_token
    
    Frontend->>Frontend: Store tokens in localStorage<br/>(⚠️ Security Risk: XSS vulnerable)
    
    Frontend->>OAuth: GET /userinfo<br/>(via /oauth-proxy in dev)<br/>Headers: Bearer access_token
    OAuth->>Frontend: Return user info (email, name, sub)
    
    Note over Frontend: ⚠️ No role checking yet<br/>(User can proceed without role)
    
    Frontend->>Frontend: Display user info in header
```

### API Request Flow (Current)

```mermaid
sequenceDiagram
    participant Frontend as Frontend (React)
    participant Lumen as Lumen Backend
    participant DB as PostgreSQL Database

    Frontend->>Frontend: Get access_token from localStorage
    Frontend->>Lumen: API Request<br/>GET /api/stories<br/>Headers: Authorization: Bearer token
    
    Note over Lumen: ⚠️ No session validation<br/>Token must be validated with OAuth server
    
    Lumen->>DB: Query stories
    DB->>Lumen: Return stories
    Lumen->>Frontend: Return JSON response
```

### Security Issues (Current)

```mermaid
graph TD
    A[Frontend Application] -->|Stores| B[localStorage]
    B -->|Contains| C[access_token]
    B -->|Contains| D[refresh_token]
    B -->|Contains| E[user_info]
    
    F[XSS Attack] -->|Can Access| B
    F -->|Steals| C
    F -->|Steals| D
    
    G[No Centralized Control] -->|Tokens scattered| B
    G -->|No revocation| H[Expired tokens still work]
    
    I[No Role Validation] -->|User can login| J[Without role assignment]
    
    style C fill:#ff6b6b
    style D fill:#ff6b6b
    style F fill:#ff6b6b
    style H fill:#ff6b6b
    style J fill:#ff6b6b
```

---

## BFF Architecture (Recommended)

### Complete User Login Flow (BFF)

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Frontend (React)
    participant BFF as Lumen Backend (BFF)
    participant OAuth as OAuth Server<br/>(192.168.14.16:9090)
    participant DB as PostgreSQL Database

    User->>Frontend: Click "Login" button
    Frontend->>Frontend: Generate PKCE: code_verifier, code_challenge
    Frontend->>Frontend: Store code_verifier temporarily
    Frontend->>OAuth: Open popup: GET /oauth2/authorize<br/>(with code_challenge)
    
    alt User not logged in to OAuth
        OAuth->>User: Show login page
        User->>OAuth: Enter credentials
        OAuth->>OAuth: Validate credentials
    end
    
    OAuth->>Frontend: Redirect to redirect_uri<br/>?code=AUTH_CODE&state=STATE
    Frontend->>Frontend: Extract code from URL
    
    Note over Frontend: Send code to BFF<br/>(not exchanging directly)
    
    Frontend->>BFF: POST /api/auth/oauth/callback<br/>Body: {code, code_verifier}
    
    Note over BFF: Server-side token exchange<br/>(tokens never exposed to browser)
    
    BFF->>OAuth: POST /oauth2/token<br/>Body: code, code_verifier, redirect_uri<br/>Headers: Basic Auth (client_id:client_secret)
    OAuth->>BFF: Return access_token, refresh_token
    
    BFF->>OAuth: GET /userinfo<br/>Headers: Bearer access_token
    OAuth->>BFF: Return user info (email, name, sub)
    
    BFF->>DB: Query: SELECT * FROM users WHERE email = ?
    DB->>BFF: Return user record
    
    alt User not found
        BFF->>Frontend: 404 Error: User not found
    else User has no role
        BFF->>Frontend: 403 Error: No role assigned
    else User found with role
        BFF->>DB: INSERT INTO sessions<br/>(id, user_id, encrypted tokens, expires_at)
        DB->>BFF: Session created
        
        BFF->>BFF: Encrypt tokens before storing
        
        BFF->>Frontend: 200 Success + Set Cookie<br/>Set-Cookie: session_id=xxx<br/>(HTTP-only, Secure)
        Frontend->>Frontend: Store user info in React state<br/>(✅ No tokens stored)
    end
```

### API Request Flow (BFF)

```mermaid
sequenceDiagram
    participant Frontend as Frontend (React)
    participant BFF as Lumen Backend (BFF)
    participant Middleware as Session Middleware
    participant DB as PostgreSQL Database
    participant Microservice as Microservice API<br/>(via API Gateway)

    Frontend->>BFF: API Request<br/>GET /api/stories<br/>(withCredentials: true)
    
    Note over Frontend: Browser automatically sends<br/>session cookie (HTTP-only)
    
    BFF->>Middleware: Check session cookie
    Middleware->>DB: SELECT * FROM sessions<br/>WHERE id = ? AND expires_at > NOW()
    DB->>Middleware: Return session record
    
    alt Session not found or expired
        Middleware->>Frontend: 401 Unauthorized
    else Session valid
        Middleware->>DB: SELECT * FROM users WHERE id = ?
        DB->>Middleware: Return user with role
        Middleware->>BFF: Attach user to request
        
        BFF->>BFF: Apply role-based access control
        
        alt Needs microservice data
            BFF->>OAuth: Request client token<br/>(Machine-to-Machine)
            OAuth->>BFF: Return client access_token
            BFF->>Microservice: API Call<br/>Headers: Bearer client_token
            Microservice->>BFF: Return data
        end
        
        BFF->>DB: Query application data
        DB->>BFF: Return data
        BFF->>Frontend: Return JSON response
    end
```

### Machine-to-Machine Flow (Microservice Access)

```mermaid
sequenceDiagram
    participant BFF as Lumen Backend (BFF)
    participant OAuth as OAuth Server
    participant Gateway as API Gateway
    participant Microservice as Microservice<br/>(IO Services)

    Note over BFF: User already authenticated<br/>via OIDC flow
    
    BFF->>BFF: Need to call microservice
    
    BFF->>OAuth: POST /oauth2/token<br/>grant_type: client_credentials<br/>client_id: commonstories<br/>client_secret: xxx<br/>(Basic Auth)
    OAuth->>BFF: Return client access_token
    
    Note over BFF: Client token (not user token)<br/>Used for service-to-service calls
    
    BFF->>Gateway: API Request<br/>GET /api/microservice/endpoint<br/>Headers: Bearer client_token
    Gateway->>Gateway: Validate client token
    Gateway->>Microservice: Forward request
    Microservice->>Gateway: Return data
    Gateway->>BFF: Return data
    
    Note over BFF: No user info needed<br/>Authorization at client level
```

### Complete System Architecture (BFF)

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Frontend<br/>localhost:3000]
    end
    
    subgraph "BFF Layer"
        B[Lumen Backend<br/>localhost:8000]
        B1[AuthController<br/>OAuth Handler]
        B2[Session Middleware<br/>Authentication]
        B3[API Controllers<br/>Business Logic]
    end
    
    subgraph "Data Layer"
        C[(PostgreSQL Database)]
        C1[users table]
        C2[roles table]
        C3[sessions table]
        C4[stories table]
        C --> C1
        C --> C2
        C --> C3
        C --> C4
    end
    
    subgraph "External Services"
        D[OAuth Server<br/>192.168.14.16:9090]
        E[API Gateway]
        F[Microservices<br/>IO Services]
    end
    
    A -->|Session Cookie<br/>HTTP-only| B
    B --> B1
    B --> B2
    B --> B2
    B2 --> B3
    
    B1 -->|Token Exchange<br/>User Info| D
    B1 -->|Store Session| C3
    B2 -->|Validate Session| C3
    B2 -->|Get User| C1
    B3 -->|Query Data| C
    
    B3 -->|Client Token| D
    B3 -->|Service Calls| E
    E -->|Forward| F
    
    style A fill:#e3f2fd
    style B fill:#c8e6c9
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#f3e5f5
    style F fill:#f3e5f5
```

### Security Flow Comparison

```mermaid
graph LR
    subgraph "Without BFF (Current)"
        A1[Frontend] -->|Stores| A2[localStorage]
        A2 -->|Contains| A3[Tokens Exposed]
        A3 -->|Vulnerable to| A4[XSS Attacks]
    end
    
    subgraph "With BFF (Recommended)"
        B1[Frontend] -->|Sends| B2[Session Cookie]
        B2 -->|HTTP-only| B3[BFF Backend]
        B3 -->|Stores Encrypted| B4[Database]
        B4 -->|Secure| B5[No Token Exposure]
    end
    
    style A3 fill:#ff6b6b
    style A4 fill:#ff6b6b
    style B2 fill:#51cf66
    style B5 fill:#51cf66
```

### Token Storage Comparison

```mermaid
graph TD
    subgraph "Current: Frontend-Direct"
        A[Browser localStorage] -->|Stores| B[access_token<br/>refresh_token<br/>user_info]
        B -->|Visible to| C[JavaScript]
        C -->|Vulnerable to| D[XSS Attacks]
    end
    
    subgraph "BFF: Server-Side"
        E[HTTP-only Cookie] -->|Contains| F[session_id]
        F -->|Sent to| G[BFF Backend]
        G -->|Queries| H[Database]
        H -->|Stores Encrypted| I[oauth_access_token<br/>oauth_refresh_token]
        I -->|Never Exposed| J[Browser]
    end
    
    style B fill:#ff6b6b
    style D fill:#ff6b6b
    style F fill:#51cf66
    style I fill:#51cf66
    style J fill:#51cf66
```

### Role-Based Access Control Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant BFF
    participant DB as Database
    participant OAuth

    User->>Frontend: Login Request
    Frontend->>OAuth: Authorization Request
    OAuth->>Frontend: Authorization Code
    Frontend->>BFF: POST /api/auth/oauth/callback<br/>{code, code_verifier}
    
    BFF->>OAuth: Exchange Code for Token
    OAuth->>BFF: Access Token
    BFF->>OAuth: Get User Info
    OAuth->>BFF: User Email
    
    BFF->>DB: SELECT * FROM users<br/>WHERE email = ?
    DB->>BFF: User Record
    
    alt User Not Found
        BFF->>Frontend: 404: User not found
    else No Role Assigned
        BFF->>Frontend: 403: No role assigned
    else User Has Role
        BFF->>DB: SELECT * FROM roles<br/>WHERE id = user.role_id
        DB->>BFF: Role Information
        BFF->>DB: INSERT INTO sessions
        BFF->>Frontend: 200: Success + Session Cookie
        Frontend->>Frontend: Store User Info (no tokens)
    end
    
    Note over BFF,DB: All role checking happens<br/>server-side during login
```

### Session Management Flow

```mermaid
stateDiagram-v2
    [*] --> NoSession: User visits site
    NoSession --> LoginInitiated: Click Login
    LoginInitiated --> OAuthRedirect: Redirect to OAuth
    OAuthRedirect --> CodeReceived: User authenticates
    CodeReceived --> TokenExchange: Send code to BFF
    TokenExchange --> UserValidation: BFF exchanges token
    UserValidation --> RoleCheck: BFF gets user info
    
    RoleCheck --> SessionCreated: User has role
    RoleCheck --> LoginFailed: No role/not found
    
    SessionCreated --> Authenticated: Session cookie set
    Authenticated --> APIRequest: User makes API call
    APIRequest --> SessionValidated: Middleware checks session
    
    SessionValidated --> RequestProcessed: Session valid
    SessionValidated --> SessionExpired: Session expired
    
    SessionExpired --> NoSession: Redirect to login
    RequestProcessed --> Authenticated: Continue using app
    
    LoginFailed --> NoSession: Show error message
```

### Data Flow: Story Submission Example

```mermaid
sequenceDiagram
    participant Writer as Writer User
    participant Frontend
    participant BFF
    participant SessionMW as Session Middleware
    participant DB
    participant OAuth

    Writer->>Frontend: Submit Story Form
    Frontend->>BFF: POST /api/stories<br/>(with session cookie)
    
    BFF->>SessionMW: Validate session
    SessionMW->>DB: Check session validity
    DB->>SessionMW: Session + User data
    SessionMW->>BFF: User attached to request
    
    BFF->>BFF: Check user.role_id == Writer
    BFF->>DB: Check user permissions
    DB->>BFF: Permission data
    
    alt User is Writer
        BFF->>DB: INSERT INTO stories
        DB->>BFF: Story created
        BFF->>Frontend: 201: Story submitted
    else User not Writer
        BFF->>Frontend: 403: Forbidden
    end
```

### Microservice Integration Flow

```mermaid
sequenceDiagram
    participant Frontend
    participant BFF
    participant OAuth
    participant Gateway as API Gateway
    participant Microservice as IO Microservice

    Frontend->>BFF: Request requiring microservice data<br/>GET /api/external-data
    
    BFF->>BFF: Validate user session<br/>(already done via middleware)
    
    Note over BFF: Need to call external microservice<br/>Requires client credentials
    
    BFF->>OAuth: POST /oauth2/token<br/>grant_type: client_credentials<br/>client_id: commonstories<br/>client_secret: xxx
    OAuth->>BFF: Return client_token<br/>(Machine-to-Machine)
    
    BFF->>Gateway: GET /api/microservice/endpoint<br/>Headers: Bearer client_token
    Gateway->>Gateway: Validate client token
    Gateway->>Microservice: Forward request
    Microservice->>Gateway: Return data
    Gateway->>BFF: Return data
    
    BFF->>BFF: Process/Transform data
    BFF->>Frontend: Return combined response
```

---

## Comparison

### Architecture Comparison Table

| Aspect | Without BFF (Current) | With BFF (Recommended) |
|--------|----------------------|------------------------|
| **Token Storage** | localStorage (browser) | Database (server, encrypted) |
| **Token Exposure** | ✅ Exposed to JavaScript | ❌ Never exposed |
| **XSS Protection** | ❌ Vulnerable | ✅ HTTP-only cookies |
| **Session Management** | Manual (localStorage) | Automatic (database) |
| **Role Validation** | ❌ Not implemented | ✅ Server-side validation |
| **Token Revocation** | ❌ Not possible | ✅ Can revoke sessions |
| **Microservice Integration** | ❌ Difficult | ✅ Easy (client tokens) |
| **Centralized Control** | ❌ No | ✅ Yes |
| **Security** | ⚠️ Medium | ✅ High |

### Request Flow Comparison

#### Without BFF:
```
User → Frontend → OAuth Server → Frontend (tokens) → Frontend (localStorage) → API Calls (with token)
```

#### With BFF:
```
User → Frontend → OAuth Server → Frontend (code) → BFF (tokens) → BFF (session) → Frontend (cookie) → API Calls (with cookie)
```

### Security Comparison

```mermaid
graph TB
    subgraph "Current Security Issues"
        A1[Tokens in localStorage] -->|XSS Risk| A2[Token Theft]
        A3[No Session Control] -->|Cannot Revoke| A4[Expired Tokens Work]
        A5[No Role Check] -->|Unauthorized Access| A6[Security Breach]
    end
    
    subgraph "BFF Security Benefits"
        B1[HTTP-only Cookies] -->|XSS Protection| B2[Tokens Safe]
        B3[Server Sessions] -->|Can Revoke| B4[Full Control]
        B5[Role Validation] -->|Access Control| B6[Secure Access]
    end
    
    style A2 fill:#ff6b6b
    style A4 fill:#ff6b6b
    style A6 fill:#ff6b6b
    style B2 fill:#51cf66
    style B4 fill:#51cf66
    style B6 fill:#51cf66
```

---

## Key Takeaways

### Without BFF (Current):
- ⚠️ Tokens stored in browser (security risk)
- ⚠️ No centralized session management
- ⚠️ No role validation during login
- ⚠️ Difficult to integrate with microservices

### With BFF (Recommended):
- ✅ Tokens stored server-side (encrypted)
- ✅ HTTP-only cookies (XSS protection)
- ✅ Centralized session management
- ✅ Role validation during login
- ✅ Easy microservice integration
- ✅ Better security posture

---

## Implementation Priority

1. **Phase 1**: Add sessions table to database
2. **Phase 2**: Implement OAuth callback endpoint in BFF
3. **Phase 3**: Create session middleware
4. **Phase 4**: Update frontend to use BFF endpoints
5. **Phase 5**: Remove token storage from localStorage
6. **Phase 6**: Implement microservice client token flow

---

**Note**: All diagrams use Mermaid syntax and can be rendered in:
- GitHub/GitLab markdown
- VS Code with Mermaid extension
- Online Mermaid editors (mermaid.live)
- Documentation tools that support Mermaid

