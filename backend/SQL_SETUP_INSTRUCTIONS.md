# SQL Setup Instructions

This document lists all SQL files that need to be run in your PostgreSQL database, in the correct order.

## Prerequisites

- PostgreSQL database is set up and running
- Database `fes_stories` exists
- User `vyom` has been granted necessary permissions
- `roles` table exists with at least "Super admin" and "Reader" roles

## SQL Files to Run (In Order)

### 1. Permissions System
**File:** `backend/create_permissions_system.sql`

**What it does:**
- Creates `permissions` table
- Creates `role_permissions` junction table
- Inserts 7 default permissions
- Assigns permissions to "Super admin" and "Reader" roles
- Grants permissions to `vyom` user

**Run this FIRST** as it sets up the permission-based access control system.

### 2. Story Categories System
**File:** `backend/create_story_categories_tables.sql`

**What it does:**
- Creates `story_categories` table
- Creates `reader_category_access` junction table
- Creates indexes for performance
- Grants permissions to `vyom` user

**Run this SECOND** as it depends on the `users` table (which should already exist).

## Execution Order

```sql
-- Step 1: Run permissions system
\i backend/create_permissions_system.sql

-- Step 2: Run story categories system
\i backend/create_story_categories_tables.sql
```

Or in pgAdmin4:
1. Open `backend/create_permissions_system.sql` and execute
2. Open `backend/create_story_categories_tables.sql` and execute

## Verification

After running both files, verify the setup:

```sql
-- Check permissions were created
SELECT * FROM permissions;

-- Check role permissions were assigned
SELECT r.role_name, p.name, p.slug 
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
ORDER BY r.role_name, p.name;

-- Check story categories tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('story_categories', 'reader_category_access');
```

## Notes

- Both SQL files use `CREATE TABLE IF NOT EXISTS`, so they're safe to run multiple times
- The permissions system uses role names (not hardcoded IDs) to find roles dynamically
- If you add new roles in the future, you can assign permissions using:
  ```sql
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id 
  FROM roles r
  CROSS JOIN permissions p
  WHERE r.role_name = 'Your New Role Name'
    AND p.slug IN ('permission1', 'permission2', ...)
  ON CONFLICT (role_id, permission_id) DO NOTHING;
  ```

