# FES Stories - Microservices Architecture Setup Guide

## Overview

This document outlines the microservices architecture setup for FES Stories application. The system will be broken down into three main microservices, each with its own REST API, database schema, and Docker configuration.

## Architecture Diagram

```
┌─────────────────┐
│ React Frontend  │
└────────┬────────┘
         │
┌────────▼────────┐
│  API Gateway    │ (Nginx/Kong)
│  (Port 8000)    │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┐
    │         │              │
┌───▼───┐ ┌──▼───┐    ┌──────▼──────┐
│Stories│ │Admin │    │Users & Auth │
│Service│ │Hier. │    │Service      │
│:8001  │ │:8002 │    │:8003        │
└───┬───┘ └──┬───┘    └──────┬──────┘
    │        │               │
┌───▼───┐ ┌──▼───┐    ┌──────▼──────┐
│Stories│ │Regions│   │Users DB     │
│  DB   │ │  DB  │    │(or FES IO)  │
└───────┘ └──────┘    └─────────────┘
```

## Microservices Breakdown

### 1. Common Stories Service

**Purpose:** Handles all story-related operations, metadata, and moderation workflow.

**Responsibilities:**
- Story CRUD operations
- Story metadata management
- Moderation workflow (approve/reject/publish)
- Story categories management
- Reader access management
- Region-based category access

**API Endpoints:**
```
GET    /api/stories/published          - Get all published stories (Public)
POST   /api/stories                   - Submit a new story (Reader)
GET    /api/stories/pending            - Get pending stories (Super admin)
GET    /api/stories/pending/count      - Get pending count (Super admin)
POST   /api/stories/{id}/approve       - Approve and publish story (Super admin)
POST   /api/stories/{id}/reject        - Reject story (Super admin)
GET    /api/stories/reader/{userId}    - Get reader's stories
GET    /api/stories/approved/{adminId}  - Get approved stories by admin
PUT    /api/stories/{id}               - Update published story (Super admin)
DELETE /api/stories/{id}               - Delete published story (Super admin)

GET    /api/story-categories                    - Get all categories
POST   /api/story-categories                   - Create category (Super admin)
PUT    /api/story-categories/{id}              - Update category (Super admin)
PATCH  /api/story-categories/{id}/toggle-status - Toggle category status (Super admin)
DELETE /api/story-categories/{id}              - Delete category (Super admin)
GET    /api/story-categories/readers           - Get readers with access (Super admin)
GET    /api/story-categories/readers/{userId}  - Get reader categories
PUT    /api/story-categories/readers/{userId}/access - Update reader access (Super admin)
```

**Database Schema:**
- `stories` - Story submissions and metadata
- `story_categories` - Story categories
- `reader_category_access` - Reader-category access mapping
- `category_regions` - Category-region mapping

**Technology Stack:**
- Framework: Lumen (PHP 8.4)
- Database: PostgreSQL
- Port: 8001

**Dependencies:**
- Users Service (for user validation)
- Admin Hierarchy Service (for region data)

---

### 2. Admin Hierarchy Service

**Purpose:** Manages locations, districts, and administrative structure.

**Responsibilities:**
- Region/State management
- District management (future)
- Administrative hierarchy
- Location-based access control

**Integration:** Will use FES IO's Admin Hierarchy Microservice

**API Endpoints:**
```
GET    /api/regions     - Get all regions (states/UTs)
GET    /api/districts   - Get districts (future)
GET    /api/admin-structure - Get admin hierarchy (future)
```

**Database Schema:**
- `regions` - Indian states and union territories
- `districts` - Districts within states (future)
- `admin_structure` - Administrative hierarchy (future)

**Technology Stack:**
- Framework: Lumen (PHP 8.4) or API Gateway/Adapter
- Database: PostgreSQL (or sync with FES IO service)
- Port: 8002

**Integration Options:**
- **Option A:** Direct integration with FES IO's service (API Gateway pattern)
- **Option B:** Build wrapper/adapter service for FES IO's service
- **Option C:** Build independent service (if FES IO service unavailable)

---

### 3. Users & Identity Service

**Purpose:** Handles user management, authentication, and authorization.

**Responsibilities:**
- User CRUD operations
- Authentication (login/logout)
- Role management
- Permission system
- Activity logging
- User status management

**Integration:** Will use FES IO's User Role service and Auth Server

**API Endpoints:**
```
POST   /api/auth/login                    - User login
POST   /api/auth/logout                   - User logout (future)
POST   /api/auth/refresh                  - Refresh token (future)

GET    /api/users                         - List all users (Super admin)
POST   /api/users                         - Create user (Super admin)
GET    /api/users/roles                   - Get available roles
PUT    /api/users/{id}/role               - Update user role (Super admin)
PATCH  /api/users/{id}/toggle-status     - Toggle user status (Super admin)
DELETE /api/users/{id}                   - Delete user (Super admin)

GET    /api/activities                    - Get user activities
POST   /api/activities                    - Log activity
```

**Database Schema:**
- `users` - User accounts (or sync with FES IO)
- `roles` - User roles (or sync with FES IO)
- `permissions` - System permissions (or sync with FES IO)
- `role_permissions` - Role-permission mapping (or sync with FES IO)
- `activities` - User activity logs

**Technology Stack:**
- Framework: Lumen (PHP 8.4) or Adapter service
- Database: PostgreSQL (or sync with FES IO)
- Authentication: FES IO's Auth Server (OAuth2/JWT)
- Port: 8003

**Integration:**
- **Authentication:** Use FES IO's Auth Server for token generation/validation
- **User Management:** May use FES IO's User Role service
- **Your Service:** Acts as adapter/wrapper or manages activities only

---

## Implementation Strategy

### Phase 1: Preparation & Setup

#### 1.1 API Gateway Configuration

**Nginx Configuration Example:**

```nginx
upstream stories_service {
    server stories-service:8001;
}

upstream admin_hierarchy_service {
    server admin-hierarchy-service:8002;
}

upstream users_service {
    server users-service:8003;
}

server {
    listen 8000;
    server_name api.fesstories.local;

    # Stories Service
    location /api/stories {
        proxy_pass http://stories_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/story-categories {
        proxy_pass http://stories_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Admin Hierarchy Service
    location /api/regions {
        proxy_pass http://admin_hierarchy_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Users Service
    location /api/users {
        proxy_pass http://users_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/auth {
        proxy_pass http://users_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/activities {
        proxy_pass http://users_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### 1.2 Service Communication Strategy

**Synchronous Communication:**
- HTTP/REST APIs for immediate responses
- Service-to-service calls for data validation

**Asynchronous Communication:**
- Message Queue (RabbitMQ/Redis) for events
- Event-driven architecture for decoupled operations

**Service Discovery:**
- Docker Compose service names (development)
- Kubernetes services (production)
- Consul/Eureka (advanced)

---

### Phase 2: Database Strategy

#### Option A: Database per Service (Recommended)

**Pros:**
- Complete isolation
- Independent scaling
- Technology flexibility
- Better security

**Cons:**
- Cross-service queries require API calls
- Data consistency challenges
- More complex deployment

**Implementation:**
```yaml
services:
  stories-db:
    image: postgres:18.1
    environment:
      POSTGRES_DB: stories_db
      POSTGRES_USER: stories_user
      POSTGRES_PASSWORD: stories_pass

  admin-hierarchy-db:
    image: postgres:18.1
    environment:
      POSTGRES_DB: admin_hierarchy_db
      POSTGRES_USER: admin_user
      POSTGRES_PASSWORD: admin_pass

  users-db:
    image: postgres:18.1
    environment:
      POSTGRES_DB: users_db
      POSTGRES_USER: users_user
      POSTGRES_PASSWORD: users_pass
```

#### Option B: Shared Database with Schema Separation

**Pros:**
- Easier migration
- Simpler transactions
- Single backup strategy

**Cons:**
- Less isolation
- Shared resources
- Technology lock-in

**Implementation:**
```sql
CREATE SCHEMA stories;
CREATE SCHEMA admin_hierarchy;
CREATE SCHEMA users;
```

#### Option C: Hybrid Approach

- Stories Service: Own database
- Users Service: Syncs with FES IO's database
- Admin Hierarchy: Uses FES IO's service (no local DB)

---

### Phase 3: Migration Plan

#### Step 1: Extract Stories Service (Easiest)

**Tasks:**
1. Create new Lumen application: `services/stories-service/`
2. Move `StoryController` and `StoryCategoryController`
3. Move story-related models (`Story`, `StoryCategory`)
4. Create separate database/schema
5. Update frontend API base URL for story endpoints
6. Test in parallel with monolith

**Timeline:** 1-2 weeks

#### Step 2: Extract Admin Hierarchy Service

**Tasks:**
1. Create adapter service OR integrate with FES IO's service
2. Move `RegionController` or create API gateway routes
3. Handle region data sync if using external service
4. Update frontend to use new endpoints
5. Test integration

**Timeline:** 1 week (if using FES IO service) or 2 weeks (if building new)

#### Step 3: Extract Users & Identity Service (Most Complex)

**Tasks:**
1. Integrate with FES IO's Auth Server
   - OAuth2 token validation
   - User authentication flow
2. Integrate with FES IO's User Role service
   - User data sync
   - Role/permission sync
3. Move `UserController`, `AuthController`, `ActivityController`
4. Handle authentication token validation across services
5. Update all services to validate tokens
6. Test end-to-end authentication flow

**Timeline:** 2-3 weeks

---

## Docker Setup

### Docker Compose Configuration

**File: `docker-compose.yml`**

```yaml
version: '3.8'

services:
  # API Gateway
  api-gateway:
    image: nginx:alpine
    ports:
      - "8000:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - stories-service
      - admin-hierarchy-service
      - users-service

  # Stories Service
  stories-service:
    build: ./services/stories-service
    ports:
      - "8001:8000"
    environment:
      - APP_ENV=local
      - DB_HOST=stories-db
      - DB_DATABASE=stories_db
      - DB_USERNAME=stories_user
      - DB_PASSWORD=stories_pass
      - USERS_SERVICE_URL=http://users-service:8000
      - ADMIN_HIERARCHY_SERVICE_URL=http://admin-hierarchy-service:8000
    depends_on:
      - stories-db

  stories-db:
    image: postgres:18.1
    environment:
      POSTGRES_DB: stories_db
      POSTGRES_USER: stories_user
      POSTGRES_PASSWORD: stories_pass
    volumes:
      - stories-data:/var/lib/postgresql/data

  # Admin Hierarchy Service
  admin-hierarchy-service:
    build: ./services/admin-hierarchy-service
    ports:
      - "8002:8000"
    environment:
      - APP_ENV=local
      - DB_HOST=admin-hierarchy-db
      - DB_DATABASE=admin_hierarchy_db
      - DB_USERNAME=admin_user
      - DB_PASSWORD=admin_pass
      - FES_IO_SERVICE_URL=${FES_IO_SERVICE_URL}
    depends_on:
      - admin-hierarchy-db

  admin-hierarchy-db:
    image: postgres:18.1
    environment:
      POSTGRES_DB: admin_hierarchy_db
      POSTGRES_USER: admin_user
      POSTGRES_PASSWORD: admin_pass
    volumes:
      - admin-hierarchy-data:/var/lib/postgresql/data

  # Users Service
  users-service:
    build: ./services/users-service
    ports:
      - "8003:8000"
    environment:
      - APP_ENV=local
      - DB_HOST=users-db
      - DB_DATABASE=users_db
      - DB_USERNAME=users_user
      - DB_PASSWORD=users_pass
      - FES_IO_AUTH_URL=${FES_IO_AUTH_URL}
      - FES_IO_USER_ROLE_URL=${FES_IO_USER_ROLE_URL}
    depends_on:
      - users-db

  users-db:
    image: postgres:18.1
    environment:
      POSTGRES_DB: users_db
      POSTGRES_USER: users_user
      POSTGRES_PASSWORD: users_pass
    volumes:
      - users-data:/var/lib/postgresql/data

volumes:
  stories-data:
  admin-hierarchy-data:
  users-data:
```

### Dockerfile Template

**File: `services/stories-service/Dockerfile`**

```dockerfile
FROM php:8.4-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    postgresql-client

# Install PHP extensions
RUN docker-php-ext-install pdo_pgsql pgsql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy application files
COPY . .

# Install dependencies
RUN composer install --no-dev --optimize-autoloader

# Set permissions
RUN chown -R www-data:www-data /var/www

# Expose port
EXPOSE 8000

# Start PHP server
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]
```

---

## Service Communication Patterns

### 1. Synchronous HTTP Calls

**Example: Stories Service calling Users Service**

```php
// In Stories Service
public function store(Request $request)
{
    // Validate user via Users Service
    $userResponse = Http::get('http://users-service:8000/api/users/' . $userId);
    
    if (!$userResponse->successful()) {
        return $this->errorResponse('User not found', 404);
    }
    
    $user = $userResponse->json()['user'];
    
    // Continue with story creation
    // ...
}
```

### 2. Event-Driven Architecture

**Using Redis Pub/Sub:**

```php
// In Users Service - When user is deactivated
Redis::publish('user.deactivated', json_encode([
    'user_id' => $userId,
    'timestamp' => now()
]));

// In Stories Service - Subscribe to events
Redis::subscribe(['user.deactivated'], function ($message) {
    $data = json_decode($message, true);
    // Handle user deactivation
    // e.g., Hide user's stories
});
```

### 3. JWT Token Validation

**Token Structure:**
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "role": "Reader",
  "permissions": ["post_stories", "view_stories"],
  "exp": 1234567890
}
```

**Validation in Each Service:**
```php
// Middleware in each service
public function handle($request, Closure $next)
{
    $token = $request->bearerToken();
    
    // Validate with FES IO Auth Server or local validation
    $user = $this->validateToken($token);
    
    if (!$user) {
        return response()->json(['error' => 'Unauthorized'], 401);
    }
    
    $request->merge(['user' => $user]);
    
    return $next($request);
}
```

---

## Challenges & Solutions

### Challenge 1: Cross-Service Data Access

**Problem:** Stories need user information, but users are in different service.

**Solutions:**
- **API Calls:** Stories Service calls Users Service API (adds latency)
- **Event-Driven:** User updates publish events, Stories Service subscribes
- **Data Duplication:** Store minimal user data (id, name) in Stories Service
- **Caching:** Cache user data in Stories Service to reduce API calls

### Challenge 2: Transaction Management

**Problem:** Creating a story needs user validation (cross-service transaction).

**Solutions:**
- **Saga Pattern:** Distributed transaction management
- **Eventual Consistency:** Accept temporary inconsistencies
- **Compensating Actions:** Rollback mechanism for failed operations

### Challenge 3: Service Discovery

**Problem:** Services need to find each other dynamically.

**Solutions:**
- **Docker Compose:** Use service names (development)
- **Kubernetes:** Use service names and DNS (production)
- **Service Registry:** Consul, Eureka (advanced)

### Challenge 4: Authentication & Authorization

**Problem:** How to validate tokens across services?

**Solutions:**
- **JWT Tokens:** Include user info in token, validate in each service
- **OAuth2:** Use FES IO's Auth Server, validate tokens
- **API Gateway:** Validate token once, pass user context to services

---

## Migration Checklist

### Stories Service
- [ ] Create new Lumen application
- [ ] Move StoryController and StoryCategoryController
- [ ] Move story-related models
- [ ] Create database schema
- [ ] Set up Docker configuration
- [ ] Create API documentation (Swagger)
- [ ] Update frontend API endpoints
- [ ] Test all story endpoints
- [ ] Deploy to staging
- [ ] Monitor and fix issues

### Admin Hierarchy Service
- [ ] Decide on integration approach (FES IO or new service)
- [ ] Create service or adapter
- [ ] Move RegionController or create gateway routes
- [ ] Set up database (if needed)
- [ ] Set up Docker configuration
- [ ] Create API documentation
- [ ] Update frontend API endpoints
- [ ] Test integration
- [ ] Deploy to staging

### Users & Identity Service
- [ ] Integrate with FES IO's Auth Server
- [ ] Integrate with FES IO's User Role service
- [ ] Move UserController, AuthController, ActivityController
- [ ] Set up token validation middleware
- [ ] Update all services to validate tokens
- [ ] Set up Docker configuration
- [ ] Create API documentation
- [ ] Update frontend authentication flow
- [ ] Test end-to-end authentication
- [ ] Deploy to staging

### API Gateway
- [ ] Set up Nginx configuration
- [ ] Configure routing rules
- [ ] Set up SSL/TLS (production)
- [ ] Configure rate limiting
- [ ] Set up logging and monitoring
- [ ] Test all routes
- [ ] Deploy to staging

---

## Environment Variables

### Stories Service
```env
APP_NAME="FES Stories Service"
APP_ENV=local
APP_DEBUG=true
APP_TIMEZONE=Asia/Kolkata

DB_CONNECTION=pgsql
DB_HOST=stories-db
DB_PORT=5432
DB_DATABASE=stories_db
DB_USERNAME=stories_user
DB_PASSWORD=stories_pass

USERS_SERVICE_URL=http://users-service:8000
ADMIN_HIERARCHY_SERVICE_URL=http://admin-hierarchy-service:8000

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Admin Hierarchy Service
```env
APP_NAME="FES Admin Hierarchy Service"
APP_ENV=local
APP_DEBUG=true
APP_TIMEZONE=Asia/Kolkata

DB_CONNECTION=pgsql
DB_HOST=admin-hierarchy-db
DB_PORT=5432
DB_DATABASE=admin_hierarchy_db
DB_USERNAME=admin_user
DB_PASSWORD=admin_pass

FES_IO_SERVICE_URL=https://api.fes.io/admin-hierarchy
FES_IO_API_KEY=your_api_key_here
```

### Users Service
```env
APP_NAME="FES Users & Identity Service"
APP_ENV=local
APP_DEBUG=true
APP_TIMEZONE=Asia/Kolkata

DB_CONNECTION=pgsql
DB_HOST=users-db
DB_PORT=5432
DB_DATABASE=users_db
DB_USERNAME=users_user
DB_PASSWORD=users_pass

FES_IO_AUTH_URL=https://auth.fes.io
FES_IO_USER_ROLE_URL=https://api.fes.io/user-role
FES_IO_CLIENT_ID=your_client_id
FES_IO_CLIENT_SECRET=your_client_secret

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## Testing Strategy

### Unit Tests
- Test each service independently
- Mock external service calls
- Test business logic in isolation

### Integration Tests
- Test service-to-service communication
- Test API Gateway routing
- Test database operations

### End-to-End Tests
- Test complete user flows
- Test authentication across services
- Test error handling and rollback

### Load Testing
- Test each service under load
- Test API Gateway performance
- Identify bottlenecks

---

## Monitoring & Logging

### Logging Strategy
- Centralized logging (ELK Stack, Loki)
- Structured logging (JSON format)
- Correlation IDs for request tracking

### Monitoring
- Health check endpoints for each service
- Metrics collection (Prometheus)
- Alerting (Grafana, PagerDuty)

### Health Check Endpoints
```
GET /health - Service health status
GET /health/db - Database connectivity
GET /health/dependencies - External service status
```

---

## Deployment Strategy

### Development
- Docker Compose for local development
- Hot reload for code changes
- Local database instances

### Staging
- Docker Compose or Kubernetes
- Separate environment variables
- Test data seeding

### Production
- Kubernetes orchestration
- Auto-scaling based on load
- Database replication
- Load balancers
- CDN for static assets

---

## Rollback Plan

1. **Keep Monolith Running:** Run both old and new in parallel
2. **Feature Flags:** Toggle between old and new services
3. **Gradual Migration:** Move endpoints one by one
4. **Monitor:** Watch for errors and performance issues
5. **Quick Rollback:** Revert to monolith if issues arise

---

## Next Steps

1. **Week 1-2:** Set up Stories Service
   - Create service structure
   - Migrate code
   - Set up Docker
   - Test endpoints

2. **Week 3:** Set up Admin Hierarchy Service
   - Integrate with FES IO or build new
   - Set up Docker
   - Test integration

3. **Week 4-5:** Set up Users & Identity Service
   - Integrate with FES IO Auth Server
   - Integrate with FES IO User Role service
   - Set up authentication flow
   - Test end-to-end

4. **Week 6:** Set up API Gateway
   - Configure Nginx
   - Set up routing
   - Test all routes

5. **Week 7:** Testing & Deployment
   - Integration testing
   - Load testing
   - Deploy to staging
   - Monitor and fix issues

---

## Resources

- [Lumen Documentation](https://lumen.laravel.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Microservices Patterns](https://microservices.io/patterns/)
- [FES IO API Documentation](https://docs.fes.io) (if available)

---

**Last Updated:** December 3, 2025

