# FES Stories - Current Architecture & Flow

This document illustrates the complete current architecture and flow of the FES Stories application using the Backend-for-Frontend (BFF) pattern.

## Complete System Architecture & Flow

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Frontend<br/>localhost:3000]
        A1[Home Page<br/>Public]
        A2[Dashboard<br/>Protected]
        A3[Stories Page<br/>Public/Protected]
    end
    
    subgraph "BFF Layer - Lumen Backend"
        B[Lumen Backend<br/>localhost:8000]
        B1[AuthController<br/>OAuth Handler]
        B2[AuthenticateSession<br/>Middleware]
        B3[API Controllers<br/>Business Logic]
        B4[Session Management<br/>Token Refresh]
    end
    
    subgraph "Data Layer"
        C[(PostgreSQL Database)]
        C1[users table]
        C2[roles table]
        C3[sessions table<br/>Encrypted Tokens]
        C4[stories table]
        C5[story_categories table]
        C --> C1
        C --> C2
        C --> C3
        C --> C4
        C --> C5
    end
    
    subgraph "External Services"
        D[OAuth Server<br/>192.168.14.16:9090]
        D1[Authorize Endpoint]
        D2[Token Endpoint]
        D3[UserInfo Endpoint]
        D --> D1
        D --> D2
        D --> D3
    end
    
    %% User Login Flow
    A -->|1. Click Login| B1
    B1 -->|2. Redirect to OAuth| D1
    D1 -->|3. User Authenticates| D
    D -->|4. Authorization Code| A
    A -->|5. POST /api/auth/oauth/callback<br/>code + code_verifier| B1
    B1 -->|6. Exchange Code for Token| D2
    D2 -->|7. access_token + refresh_token| B1
    B1 -->|8. Get User Info| D3
    D3 -->|9. User Email/Info| B1
    B1 -->|10. Check User in DB| C1
    C1 -->|11. User + Role Data| B1
    B1 -->|12. Create Session<br/>Encrypt Tokens| C3
    B1 -->|13. Set HTTP-only Cookie<br/>session_id| A
    
    %% API Request Flow
    A2 -->|14. API Request<br/>withCredentials: true| B2
    B2 -->|15. Validate Session Cookie| C3
    C3 -->|16. Session + User ID| B2
    B2 -->|17. Check Token Expiration| B4
    B4 -->|18. Token Expiring?<br/>Refresh if needed| D2
    D2 -->|19. New Tokens| B4
    B4 -->|20. Update Session| C3
    B2 -->|21. Attach User to Request| B3
    B3 -->|22. Query Business Data| C
    C -->|23. Return Data| B3
    B3 -->|24. JSON Response| A2
    
    %% Public Routes
    A1 -->|25. GET /api/story-categories<br/>No Auth Required| B3
    A1 -->|26. GET /api/stories/published<br/>No Auth Required| B3
    A3 -->|27. GET /api/regions<br/>No Auth Required| B3
    B3 -->|28. Public Data| A1
    
    %% Logout Flow
    A2 -->|29. POST /api/auth/logout| B1
    B1 -->|30. Delete Session| C3
    B1 -->|31. Clear Cookie| A
    
    style A fill:#e3f2fd
    style B fill:#c8e6c9
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style C3 fill:#ffecb3
    style B4 fill:#c5e1a5
```

## Key Components

### 1. **Authentication Flow (Steps 1-13)**
- User initiates OAuth login via PKCE flow
- Frontend receives authorization code
- Code sent to BFF backend (never exposed to browser)
- BFF exchanges code for tokens server-side
- Tokens encrypted and stored in database
- HTTP-only session cookie set in browser

### 2. **Session Management (Steps 14-24)**
- All API requests include session cookie automatically
- Middleware validates session on each request
- Automatic token refresh when expiring (within 5 minutes)
- User attached to request for authorization checks
- Business logic executes with user context

### 3. **Public Routes (Steps 25-28)**
- Categories, published stories, and regions accessible without authentication
- No session validation required
- Data filtered to show only active/public content

### 4. **Security Features**
- ✅ Tokens stored server-side (encrypted in database)
- ✅ HTTP-only cookies (XSS protection)
- ✅ Automatic token refresh (seamless user experience)
- ✅ Role-based access control (server-side validation)
- ✅ Session revocation capability

## Technology Stack

- **Frontend**: React (Vite)
- **Backend**: Lumen (PHP)
- **Database**: PostgreSQL
- **Authentication**: OAuth 2.0 with PKCE
- **Session Storage**: Database (encrypted)
- **Token Management**: Server-side with automatic refresh

