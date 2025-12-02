# PostgreSQL Setup & PHP Extensions Resolution Guide

This document summarizes how we resolved the PostgreSQL PHP extensions issue and configured database connections with proper user permissions for the FES Stories project.

## Table of Contents
1. [PHP PostgreSQL Extensions Issue](#php-postgresql-extensions-issue)
2. [Database Connection Setup](#database-connection-setup)
3. [User Permissions Configuration](#user-permissions-configuration)
4. [Final Configuration](#final-configuration)

---

## PHP PostgreSQL Extensions Issue

### Problem
PHP was unable to load the PostgreSQL extensions (`pdo_pgsql` and `pgsql`), showing errors like:
```
Warning: PHP Startup: Unable to load dynamic library 'pdo_pgsql'
```

### Root Cause
The issue was caused by a **Visual C++ runtime mismatch**:
- PHP 8.4 was linked with Visual C++ 14.29
- The PostgreSQL extensions were compiled for PHP 8.3 and linked with Visual C++ 14.44
- This version mismatch prevented the extensions from loading

### Solution

#### Step 1: Use Correct PHP Installation
We switched from Herd Lite's PHP installation to a standalone PHP 8.4 installation:
- **PHP Location**: `C:\php83\` (Note: Despite the folder name, this contains PHP 8.4)
- **Extensions Location**: `C:\php83\ext\`

#### Step 2: Configure php.ini
The `php.ini` file was located at:
```
C:\Users\vyom3\.config\herd-lite\bin\php.ini
```

**Required Configuration:**
```ini
; Set the extension directory
extension_dir = "C:\php83\ext"

; Enable PostgreSQL extensions
extension=pdo_pgsql
extension=pgsql

; Note: Do NOT include extension=pdo (this was causing errors)
```

#### Step 3: Verify Extensions
After configuration, verify the extensions are loaded:
```powershell
C:\php83\php.exe -m | Select-String pgsql
```

Expected output:
```
pdo_pgsql
pgsql
```

#### Step 4: Use Correct PHP Executable
When running the backend server, use the correct PHP executable:
```powershell
C:\php83\php.exe -S localhost:8000 -t backend/public
```

---

## Database Connection Setup

### Database Configuration

- **Database Name**: `fes_stories` (lowercase - PostgreSQL is case-sensitive)
- **Database User**: `vyom`
- **Database Password**: `VT@123`
- **Database Host**: `127.0.0.1`
- **Database Port**: `5432`

### Environment Configuration (.env)

The backend `.env` file should contain:
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=fes_stories
DB_USERNAME=vyom
DB_PASSWORD=VT@123
DB_CHARSET=utf8
```

### Database Configuration File

The `backend/config/database.php` file was updated with:
```php
'pgsql' => [
    'driver' => 'pgsql',
    'url' => env('DB_URL'),
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => env('DB_PORT', '5432'),
    'database' => env('DB_DATABASE', 'laravel'),
    'username' => env('DB_USERNAME', 'root'),
    'password' => env('DB_PASSWORD', ''),
    'charset' => env('DB_CHARSET', 'utf8'),
    'prefix' => '',
    'prefix_indexes' => true,
    'search_path' => 'public',
    'sslmode' => 'prefer',
],
```

**Key Points:**
- `search_path` is set to `'public'` to ensure queries use the public schema
- `url` option allows connection via connection string if needed

### Creating the Database

Connect to PostgreSQL as the `postgres` superuser:
```powershell
psql -U postgres -h 127.0.0.1
```

Create the database:
```sql
CREATE DATABASE fes_stories;
```

**Important:** Use lowercase `fes_stories` (not `FES_Stories`) as PostgreSQL is case-sensitive and the `.env` file uses lowercase.

### Creating the Users Table

The `users` table was created manually with the following structure:
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX users_created_at_index ON users(created_at);
```

---

## User Permissions Configuration

### Problem
The `vyom` user lacked sufficient permissions to:
- Access the `public` schema
- Create/modify tables
- Insert/update/delete data

This resulted in errors like:
```
ERROR: permission denied for schema public
ERROR: permission denied for table users
```

### Solution

#### Step 1: Connect as PostgreSQL Superuser
Connect to PostgreSQL as the `postgres` superuser:
```powershell
psql -U postgres -h 127.0.0.1
```

#### Step 2: Switch to the Database
```sql
\c fes_stories
```

#### Step 3: Grant Permissions
Run the following SQL commands to grant all necessary permissions:

```sql
-- Grant all privileges on existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vyom;

-- Grant all privileges on existing sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vyom;

-- Grant privileges on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO vyom;

-- Grant privileges on future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO vyom;

-- Grant usage and create on schema
GRANT USAGE, CREATE ON SCHEMA public TO vyom;
```

#### Step 4: Verify Permissions
Verify that permissions were granted correctly:
```sql
SELECT 
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'vyom'
AND table_schema = 'public';
```

### Using pgAdmin 4 (Alternative Method)

If you prefer using pgAdmin 4:

1. Open **pgAdmin 4**
2. Connect to your PostgreSQL server
3. Navigate to: **Databases** → **fes_stories**
4. Right-click on **fes_stories** → **Query Tool**
5. Paste and execute the SQL commands from Step 3 above

### Seeding Test Data

After permissions are granted, you can insert test users:

```sql
-- Insert test users with hashed passwords (Laravel bcrypt hash for "123")
INSERT INTO users (name, email, password) VALUES 
('Vyom', 'vyom@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Krina', 'krina@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (email) DO NOTHING;

-- Verify users were inserted
SELECT id, name, email, created_at FROM users ORDER BY id;
```

**Note:** The password hash is for the password `123`. This is a Laravel bcrypt hash.

---

## Final Configuration

### Complete Setup Script

All permissions and test data can be set up using the `setup_permissions_and_seed.sql` file:

```sql
-- Grant all privileges on existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vyom;

-- Grant all privileges on existing sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vyom;

-- Grant privileges on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO vyom;

-- Grant privileges on future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO vyom;

-- Grant usage and create on schema
GRANT USAGE, CREATE ON SCHEMA public TO vyom;

-- Insert test users (password: 123)
INSERT INTO users (name, email, password) VALUES 
('Vyom', 'vyom@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Krina', 'krina@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (email) DO NOTHING;

-- Verify users were inserted
SELECT id, name, email, created_at FROM users ORDER BY id;
```

### Running the Backend Server

Always use the correct PHP executable:
```powershell
cd backend
C:\php83\php.exe -S localhost:8000 -t public
```

### Testing the Connection

Test the database connection:
```powershell
# Test via API health endpoint
curl http://localhost:8000/api/health

# Or test login endpoint
$body = @{email='vyom@example.com';password='123'} | ConvertTo-Json
Invoke-WebRequest -Uri 'http://localhost:8000/api/auth/login' -Method POST -Body $body -ContentType 'application/json'
```

---

## Troubleshooting

### Extension Still Not Loading

1. **Verify PHP version compatibility:**
   ```powershell
   C:\php83\php.exe -v
   ```

2. **Check extension files exist:**
   ```powershell
   Test-Path C:\php83\ext\php_pdo_pgsql.dll
   Test-Path C:\php83\ext\php_pgsql.dll
   ```

3. **Verify libpq.dll is accessible:**
   - Should be in `C:\php83\` or in PostgreSQL's `bin` directory
   - Ensure PostgreSQL's `bin` directory is in system PATH

### Database Connection Errors

1. **Check database name case sensitivity:**
   - Use lowercase `fes_stories` in `.env`
   - PostgreSQL is case-sensitive

2. **Verify user permissions:**
   ```sql
   SELECT * FROM information_schema.table_privileges WHERE grantee = 'vyom';
   ```

3. **Test connection directly:**
   ```powershell
   psql -U vyom -d fes_stories -h 127.0.0.1
   ```

### Permission Denied Errors

If you still get permission errors:
1. Ensure you're connected as `postgres` superuser when granting permissions
2. Verify you're in the correct database (`fes_stories`)
3. Re-run all GRANT commands from the permissions section

---

## Summary

The resolution involved:
1. **Switching to PHP 8.4 from `C:\php83\`** to resolve Visual C++ runtime mismatch
2. **Configuring `php.ini`** with correct extension directory and enabling PostgreSQL extensions
3. **Setting up database** with lowercase name (`fes_stories`)
4. **Granting comprehensive permissions** to the `vyom` user for schema, tables, and sequences
5. **Configuring Lumen** with proper database settings including `search_path`

All components are now working together correctly, allowing the Lumen API to connect to PostgreSQL and perform database operations successfully.

