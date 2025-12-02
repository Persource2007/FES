# FES Stories - Change Log

## Technologies Used

### Frontend
- **React** 18.2.0 - UI framework
- **Vite** 5.0.8 - Build tool and dev server
- **React Router DOM** 6.20.1 - Client-side routing
- **Axios** 1.6.2 - HTTP client for API requests
- **React Toastify** 9.1.3 - Toast notifications
- **React Icons** 4.12.0 - Icon library
- **Tailwind CSS** 3.3.6 - Utility-first CSS framework

### Backend
- **Lumen** (Laravel Micro-framework) - PHP API framework
- **PHP** 8.4 - Server-side language
- **PostgreSQL** 18.1 - Database system
- **Composer** - PHP dependency manager

### Development Tools
- **Node.js** - JavaScript runtime
- **npm** - Package manager
- **PostgreSQL** - Database server
- **pgAdmin 4** - PostgreSQL administration tool

---

## Change Log

### December 1, 2025

#### Frontend Changes

**File: `src/components/LoginForm.jsx`**
- Removed PasswordStrength component import and usage - Removed password strength indicator from login form as requested
- Added loginError state and error display UI - Shows error messages on login page when credentials are invalid
- Enhanced error handling in handleSubmit - Better error messages and state management for failed login attempts

**File: `src/pages/Login.jsx`**
- Implemented API login integration - Connected login form to backend API endpoint `/api/auth/login`
- Added success/error handling with navigation - Redirects to dashboard on success, shows error on failure
- Enhanced error message extraction - Improved error handling to distinguish network errors from API errors
- Added user data storage in localStorage - Stores user information after successful login

**File: `src/pages/Dashboard.jsx`**
- Added personalized welcome message - Displays user name and email after successful login
- Implemented user data loading from localStorage - Retrieves and displays logged-in user information

**File: `src/utils/constants.js`**
- Fixed API endpoints to include `/api` prefix - Changed `/auth/login` to `/api/auth/login` to match backend routes

**File: `src/utils/api.js`**
- Added request/response logging - Console logging for debugging API calls and errors
- Enhanced error handling in interceptors - Better error messages and logging for troubleshooting

**File: `vite.config.js`**
- Configured frontend to run on port 3000 - Set server port to 3000 (was already configured)

#### Backend Changes

**File: `backend/app/Http/Controllers/HealthController.php`**
- Fixed undefined `now()` function error - Replaced with `(new \DateTime())->format('c')` for Lumen compatibility

**File: `backend/config/database.php`**
- Updated PostgreSQL connection configuration - Added `url` and `search_path` options for better database connectivity

**File: `backend/.env`**
- Fixed database name case sensitivity - Changed `DB_DATABASE=FES_Stories` to `DB_DATABASE=fes_stories` (lowercase)

#### Configuration & Setup

**File: `backend/POSTGRESQL_SETUP_RESOLUTION.md`** (NEW)
- Created comprehensive resolution guide - Documented PHP extensions issue resolution and database permissions setup

**File: `NEW_SYSTEM_SETUP.md`** (NEW)
- Created new system setup guide - Complete step-by-step guide for setting up project on a new system

**File: `backend/setup_permissions_and_seed.sql`**
- SQL script for permissions and test data - Grants all necessary permissions and inserts test users

#### Documentation Cleanup

**Files Deleted:**
- `backend/PERPLEXITY_PROMPT.md` - Removed troubleshooting document
- `backend/PGADMIN_PERMISSIONS_GUIDE.md` - Consolidated into main resolution doc
- `backend/TESTING_CHECKLIST.md` - Removed redundant document
- `backend/TROUBLESHOOT_PGSQL_EXTENSIONS.md` - Consolidated into main resolution doc
- `backend/FIX_POSTGRESQL_EXTENSIONS.md` - Consolidated into main resolution doc
- `backend/POSTGRESQL_EXTENSION_SOLUTION.md` - Consolidated into main resolution doc
- `backend/ADD_POSTGRESQL_TO_PHP.INI.md` - Consolidated into main resolution doc
- `backend/ENABLE_POSTGRESQL_EXTENSION.md` - Consolidated into main resolution doc
- `backend/POSTGRESQL_FILES_SUMMARY.md` - Consolidated into main resolution doc
- `backend/POSTGRESQL_SETUP.md` - Consolidated into main resolution doc

**Reason:** Consolidated all troubleshooting documentation into single comprehensive guide

#### Issues Resolved

**Config Related Issues:**
- ✅ PHP PostgreSQL extensions loading issue - Resolved Visual C++ runtime mismatch by using correct PHP 8.4 installation
- ✅ Database connection configuration - Fixed database name case sensitivity and added search_path
- ✅ CORS configuration - Verified and confirmed CORS settings allow frontend on port 3000
- ✅ API endpoint configuration - Fixed endpoint paths to include `/api` prefix

**Functionality Issues:**
- ✅ Login form password validation - Changed minimum password length from 8 to 1 character for development
- ✅ Login error handling - Added proper error display on login page
- ✅ Success message and navigation - Implemented welcome message and dashboard redirect after login
- ✅ Password strength indicator - Removed as not necessary during login

**Database Issues:**
- ✅ User permissions - Granted all necessary permissions to `vyom` user for schema, tables, and sequences
- ✅ Database name case sensitivity - Fixed to use lowercase `fes_stories` consistently

**Port Configuration:**
- ✅ Frontend port standardization - Stopped process on port 3001, configured to run on port 3000 only

---

## Notes

- All changes tested and verified working
- Backend API running on `http://localhost:8000`
- Frontend running on `http://localhost:3000`
- Database: PostgreSQL `fes_stories` on `127.0.0.1:5432`
- Test users available: `vyom@example.com` / `123` and `krina@example.com` / `123`

---

## How to Update This Log

When making changes to the project:

1. Add new entry under the current date (or create new date section if different day)
2. Format: `**File:** \`path/to/file\`` followed by description
3. Include brief one-line explanation
4. Add to "Issues Resolved" section if it fixes a problem
5. Mark config-related issues with ✅ Config Related tag

---

#### Documentation

**File: `backend/api-docs/swagger.yaml`** (NEW)
- Created OpenAPI 3.0.3 specification - Complete API documentation with request/response schemas, examples, and error responses

**File: `backend/api-docs/README.md`** (NEW)
- Created API documentation guide - Instructions for viewing and testing API using Swagger UI, Postman, and other tools

**File: `backend/api-docs/swagger.yaml`**
- Updated with all user management endpoints - Added GET/POST /api/users, GET /api/users/roles, PUT /api/users/{id}/role, DELETE /api/users/{id}
- Updated login endpoint documentation - Added role information in response, removed duplicate entries

#### Activity Tracking

**File: `src/utils/activity.js`** (NEW)
- Created activity tracking utility - Initially managed activities in localStorage, migrated to database-backed API
- Updated to use API endpoints - Now fetches and stores activities via `/api/activities` endpoints
- Added user-scoped activity retrieval - Users can only see their own activities

**File: `src/pages/Activity.jsx`** (NEW)
- Created Recent Activity page - Displays activity timeline with login, user creation, role updates, and deletions
- Updated to fetch from API - Replaced localStorage with API calls, auto-refreshes every 5 seconds

**File: `src/pages/Users.jsx`**
- Added activity tracking - Logs activities when creating, updating roles, and deleting users
- Updated to use API - Activity logging now persists to database via API

**File: `src/pages/Login.jsx`**
- Added activity tracking - Logs login activities with user details
- Updated to use API - Login activities now stored in database

**File: `src/components/Sidebar.jsx`**
- Added Recent Activity menu item - Added as navigation menu item with history icon

**File: `src/pages/Dashboard.jsx`**
- Removed Recent Activity section - Moved to dedicated Activity page accessible via sidebar menu

#### Backend - Activity System

**File: `backend/create_activities_table.sql`** (NEW)
- Created activities table - PostgreSQL table with user_id foreign key, indexes, and permissions
- Table structure: id, user_id, type, message, metadata (JSONB), created_at

**File: `backend/app/Models/Activity.php`** (NEW)
- Created Activity model - Eloquent model for activities table with user relationship

**File: `backend/app/Http/Controllers/ActivityController.php`** (NEW)
- Created ActivityController - Handles GET /api/activities (user-scoped) and POST /api/activities
- User-scoped filtering - Users can only retrieve their own activities via user_id parameter

**File: `backend/routes/api.php`**
- Added activity routes - GET /api/activities and POST /api/activities endpoints

**File: `src/utils/constants.js`**
- Added ACTIVITIES endpoints - Added API endpoint constants for activity operations

---

**Last Updated:** December 2, 2025

