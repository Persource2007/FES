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

### December 2, 2025

#### Story Management System

**File: `backend/create_stories_table.sql`** (NEW)
- Created stories table - PostgreSQL table for story submissions with status tracking
- Table structure: id, user_id, category_id, title, content, status, approved_by, approved_at, published_at, rejection_reason, created_at, updated_at
- Status values: draft, pending, approved, published, rejected
- Foreign keys to users and story_categories tables

**File: `backend/app/Models/Story.php`** (NEW)
- Created Story model - Eloquent model with relationships to User, StoryCategory, and approver
- Mass assignable fields and datetime casting for timestamps

**File: `backend/app/Http/Controllers/StoryController.php`** (NEW)
- Created StoryController - Handles all story-related operations
- `getPublishedStories()` - Public endpoint to get all published stories
- `store()` - Reader submits story (status: pending)
- `getPendingStories()` - Super admin gets pending stories for review
- `getPendingCount()` - Returns count of pending stories for notifications
- `approve()` - Super admin approves and publishes story
- `reject()` - Super admin rejects story with optional reason
- `getReaderStories()` - Gets all stories for a specific reader
- `getApprovedStories()` - Gets stories approved by a specific admin
- `update()` - Super admin edits published story
- `destroy()` - Super admin deletes published story

**File: `backend/routes/api.php`**
- Added story routes - 10 new endpoints for story management
- Public endpoint: GET /api/stories/published
- Reader endpoints: POST /api/stories, GET /api/stories/reader/{userId}
- Admin endpoints: GET /api/stories/pending, GET /api/stories/pending/count, POST /api/stories/{id}/approve, POST /api/stories/{id}/reject, GET /api/stories/approved/{adminId}, PUT /api/stories/{id}, DELETE /api/stories/{id}

**File: `src/pages/Stories.jsx`**
- Enhanced with story submission for readers - Added story submission form with category selection
- Added "My Stories" tab for readers - Displays reader's own stories with status badges (pending, published, rejected)
- Added "Approved Stories" tab for admins - Shows stories approved by current admin with edit/delete functionality
- Added story edit modal - Super admin can edit title, content, and category of published stories
- Added story delete confirmation - Super admin can delete published stories with confirmation
- Status badges with color coding - Visual indicators for story status
- Auto-refresh after actions - Stories list refreshes after submit, edit, or delete

**File: `src/pages/StoryReview.jsx`** (NEW)
- Created Story Review page - Super admin interface for reviewing pending stories
- Displays pending stories with author, category, and submission date
- Approve & Publish functionality - One-click approval that publishes the story
- Reject functionality - Reject stories with optional rejection reason
- Auto-refreshes every 10 seconds - Keeps pending stories list up to date
- Red notification banner - Prominent display of pending story count

**File: `src/pages/PublicStories.jsx`** (NEW)
- Created public-facing Stories page - Displays all published stories at `/stories`
- Responsive grid layout - 3-column grid on desktop, responsive on mobile
- Story cards with preview - Shows title, category, author, date, and content excerpt
- Story detail modal - Full story content displayed in modal on "Read more" click
- Newsletter subscription section - Email subscription form
- Footer with navigation - Links to other pages and social media

**File: `src/components/Sidebar.jsx`**
- Added dropdown submenu for Stories - "Story Review" is now a submenu under "Stories"
- Notification badge for pending stories - Red badge showing count of pending stories
- Badge updates every 15 seconds - Real-time notification count
- Auto-expands when on review page - Menu automatically expands when viewing story review
- Fixed navigation - Clicking "Stories" now navigates to categories page, chevron toggles dropdown

**File: `src/utils/constants.js`**
- Added STORIES endpoints - All story-related API endpoint constants
- Added PUBLISHED endpoint - Public endpoint for published stories
- Added story CRUD endpoints - Create, read, update, delete, approve, reject endpoints

**File: `src/App.jsx`**
- Added public stories route - `/stories` route for public-facing stories page
- Added story review route - `/dashboard/stories/review` for super admin story review

#### Permission System Refactoring

**File: `backend/create_permissions_system.sql`** (NEW)
- Created permissions system - Flexible permission-based access control
- Created permissions table - Stores permission slugs and descriptions
- Created role_permissions junction table - Many-to-many relationship between roles and permissions
- Default permissions inserted - manage_users, manage_story_categories, manage_reader_access, post_stories, view_stories, view_activity, manage_settings
- Dynamic role permission assignment - Automatically assigns permissions to Super admin and Reader roles

**File: `backend/app/Helpers/PermissionHelper.php`** (NEW)
- Created PermissionHelper - Backend utility for permission checks
- `getUserPermissions()` - Retrieves all permissions for a user
- `hasPermission()` - Checks if user has specific permission
- Specific permission check methods - canManageUsers, canManageStoryCategories, canPostStories, etc.

**File: `backend/app/Http/Controllers/AuthController.php`**
- Updated login response - Includes permissions array in user object
- Fallback for permissions - Handles cases where permissions tables don't exist yet

**File: `src/utils/permissions.js`** (NEW)
- Created frontend permission utilities - Permission checking functions for React components
- `hasPermission()` - Check if user has specific permission
- `hasAnyPermission()` - Check if user has any of the specified permissions
- `hasAllPermissions()` - Check if user has all specified permissions
- Specific permission checks - canManageUsers, canManageStoryCategories, canPostStories, etc.

**File: `src/pages/Dashboard.jsx`**
- Updated to use permission checks - Replaced hardcoded role checks with permission-based checks

**File: `src/pages/Users.jsx`**
- Updated to use permission checks - Uses canManageUsers permission check

**File: `src/pages/Stories.jsx`**
- Updated to use permission checks - Uses permission-based checks for category management and story posting

**File: `src/components/Sidebar.jsx`**
- Updated to use permission checks - Menu items shown based on user permissions
- Notification badge only for users with manage_story_categories permission

#### Story Categories System

**File: `backend/create_story_categories_tables.sql`** (NEW)
- Created story_categories table - Stores story categories with name, description, and active status
- Created reader_category_access junction table - Many-to-many relationship for reader category access
- Foreign keys and indexes for performance

**File: `backend/app/Models/StoryCategory.php`** (NEW)
- Created StoryCategory model - Eloquent model with readers relationship

**File: `backend/app/Models/ReaderCategoryAccess.php`** (NEW)
- Created ReaderCategoryAccess model - Junction table model for reader category access

**File: `backend/app/Http/Controllers/StoryCategoryController.php`** (NEW)
- Created StoryCategoryController - Handles category management and reader access
- `index()` - Lists all categories
- `store()` - Creates new category (Super admin only)
- `update()` - Updates category (Super admin only)
- `destroy()` - Deletes category (Super admin only)
- `getReadersWithAccess()` - Lists readers with their category access (excludes Super admins)
- `getReaderCategories()` - Gets categories accessible by a reader
- `updateReaderAccess()` - Updates reader's category access (Super admin only)
- Fixed validation - Allows empty category_ids array to remove all access
- Fixed date function - Replaced `now()` with `date('Y-m-d H:i:s')` for Lumen compatibility

**File: `backend/routes/api.php`**
- Added story category routes - 7 endpoints for category management and reader access

**File: `src/pages/Stories.jsx`**
- Added category management tabs - "Categories" and "Reader Access" tabs for super admin
- Category CRUD operations - Create, read, update, delete categories
- Reader access management - Assign/remove category access for readers
- Category selection for story submission - Readers can only select categories they have access to

#### Swagger Documentation

**File: `backend/api-docs/swagger.yaml`**
- Added Stories tag - New tag for story-related endpoints
- Added 10 story endpoints - Complete documentation for all story operations
- Added story schemas - Story, PublishedStoriesResponse, SubmitStoryRequest/Response, PendingStoriesResponse, etc.
- Updated API description - Added story management information
- All endpoints documented - Request/response schemas, parameters, examples, and error responses
- Verified no duplicates - All 21 API endpoints from routes/api.php are documented

#### Issues Resolved

**Story Management:**
- ✅ Story submission validation - Fixed category_id type conversion (string to integer)
- ✅ Story category page navigation - Fixed sidebar dropdown preventing navigation to categories page
- ✅ Story review dropdown - Made "Story Review" a submenu under "Stories" with proper navigation
- ✅ Reader stories display - Fixed white page issue by moving hooks to top level (React Rules of Hooks)
- ✅ Story edit/delete permissions - Only published stories can be edited/deleted by super admin
- ✅ Category access validation - Fixed validation to allow empty arrays for removing all access
- ✅ Date function compatibility - Replaced `now()` with `date('Y-m-d H:i:s')` for Lumen

**Permission System:**
- ✅ Permission checks in frontend - Added defensive checks for users logged in before permissions system
- ✅ Super admin category access - Super admins cannot be given category access (excluded from reader lists)
- ✅ Permission-based menu items - Sidebar and pages use permission checks instead of hardcoded role names

**UI/UX:**
- ✅ Story status badges - Color-coded badges for pending, published, rejected statuses
- ✅ Notification badges - Real-time pending story count in sidebar
- ✅ Story detail modal - Full story content in modal for public stories page
- ✅ Responsive design - All new pages are fully responsive

---

**Last Updated:** December 2, 2025

