# FES Stories - New System Setup Guide

This guide will help you set up the FES Stories project on a completely new system from scratch.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Install Required Software](#install-required-software)
3. [Project Setup](#project-setup)
4. [PHP Configuration](#php-configuration)
5. [PostgreSQL Database Setup](#postgresql-database-setup)
6. [Environment Configuration](#environment-configuration)
7. [Running the Project](#running-the-project)
8. [Verification & Testing](#verification--testing)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have administrative access to install software on the system.

### Required Software Versions
- **PHP**: 8.3 or 8.4 (with PostgreSQL extensions)
- **PostgreSQL**: 12 or higher (18.1 recommended)
- **Composer**: Latest version
- **Node.js**: 18.x or higher
- **npm**: Comes with Node.js

---

## Install Required Software

### Step 1: Install PHP

#### Windows
1. Download PHP 8.4 from [windows.php.net](https://windows.php.net/download/)
2. Choose **Thread Safe (TS)** version
3. Extract to `C:\php84\` (or your preferred location)
4. Add PHP to system PATH:
   - Open **System Properties** → **Environment Variables**
   - Add `C:\php84` to **Path** variable
   - Add `C:\php84\ext` to **Path** variable (for extensions)

#### Verify PHP Installation
```powershell
php -v
# Should show PHP 8.4.x
```

### Step 2: Install PostgreSQL

#### Windows
1. Download PostgreSQL from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Run the installer
3. During installation:
   - Remember the **postgres user password** (you'll need this)
   - Default port: **5432**
   - Default installation path: `C:\Program Files\PostgreSQL\18\`
4. Add PostgreSQL to PATH:
   - Add `C:\Program Files\PostgreSQL\18\bin` to system PATH

#### Verify PostgreSQL Installation
```powershell
psql --version
# Should show psql (PostgreSQL) 18.x
```

### Step 3: Install Composer

#### Windows
1. Download Composer from [getcomposer.org/download](https://getcomposer.org/download/)
2. Run the installer
3. Select your PHP executable (e.g., `C:\php84\php.exe`)

#### Verify Composer Installation
```powershell
composer --version
```

### Step 4: Install Node.js and npm

#### Windows
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Choose the **LTS version**
3. Run the installer (includes npm)

#### Verify Node.js Installation
```powershell
node --version
npm --version
```

---

## Project Setup

### Step 1: Clone/Copy Project

If using Git:
```powershell
git clone <repository-url>
cd FES_Stories
```

Or copy the project folder to your desired location.

### Step 2: Install Backend Dependencies

```powershell
cd backend
composer install
```

This will install all PHP dependencies including Lumen framework.

### Step 3: Install Frontend Dependencies

```powershell
cd ..
npm install
```

This will install all Node.js dependencies including React, Vite, etc.

---

## PHP Configuration

### Step 1: Locate php.ini

Find your PHP configuration file:
```powershell
php --ini
```

This will show the path to `php.ini`. Common locations:
- `C:\php84\php.ini`
- `C:\Windows\php.ini`

### Step 2: Configure php.ini

Open `php.ini` in a text editor and make the following changes:

#### Set Extension Directory
```ini
; Find and set the extension directory
extension_dir = "C:\php84\ext"
```
**Important:** Replace `C:\php84\ext` with your actual PHP extensions directory.

#### Enable PostgreSQL Extensions
Find these lines and uncomment them (remove the `;` at the beginning):
```ini
extension=pdo_pgsql
extension=pgsql
```

**Important:** Do NOT uncomment `extension=pdo` - this is not needed and may cause errors.

#### Verify Extensions
After saving `php.ini`, verify the extensions are loaded:
```powershell
php -m | Select-String pgsql
```

Expected output:
```
pdo_pgsql
pgsql
```

### Step 3: Copy Required DLL Files (if needed)

If PostgreSQL extensions are not loading, you may need to copy `libpq.dll`:

1. Find `libpq.dll` in PostgreSQL installation:
   - Usually at: `C:\Program Files\PostgreSQL\18\bin\libpq.dll`

2. Copy to PHP directory:
   ```powershell
   Copy-Item "C:\Program Files\PostgreSQL\18\bin\libpq.dll" -Destination "C:\php84\"
   ```

---

## PostgreSQL Database Setup

### Step 1: Create Database User

Connect to PostgreSQL as the superuser:
```powershell
psql -U postgres -h 127.0.0.1
```

Enter the postgres password when prompted.

Create the database user:
```sql
CREATE USER vyom WITH PASSWORD 'VT@123';
```

**Note:** You can change the username and password, but remember to update `.env` file accordingly.

### Step 2: Create Database

```sql
CREATE DATABASE fes_stories;
```

**Important:** Use lowercase `fes_stories` (PostgreSQL is case-sensitive).

### Step 3: Grant Database Privileges

```sql
GRANT ALL PRIVILEGES ON DATABASE fes_stories TO vyom;
```

### Step 4: Create Users Table

Connect to the database:
```sql
\c fes_stories
```

Create the users table:
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

### Step 5: Grant Table Permissions

**Important:** You must be connected as the `postgres` superuser to grant permissions.

```sql
-- Switch to fes_stories database (if not already)
\c fes_stories

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

### Step 6: Insert Test Users (Optional)

```sql
-- Insert test users with hashed passwords (password: 123)
INSERT INTO users (name, email, password) VALUES 
('Vyom', 'vyom@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Krina', 'krina@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (email) DO NOTHING;

-- Verify users were inserted
SELECT id, name, email, created_at FROM users ORDER BY id;
```

Exit PostgreSQL:
```sql
\q
```

### Alternative: Using pgAdmin 4

If you prefer using pgAdmin 4:

1. Open **pgAdmin 4**
2. Connect to your PostgreSQL server
3. Right-click on **Databases** → **Create** → **Database**
   - Name: `fes_stories`
4. Right-click on **fes_stories** → **Query Tool**
5. Paste and execute all SQL commands from Steps 4-6 above

---

## Environment Configuration

### Step 1: Backend Environment File

Navigate to the backend directory:
```powershell
cd backend
```

Copy the example environment file:
```powershell
Copy-Item .env.example .env
```

Or if `.env.example` doesn't exist, create a new `.env` file.

### Step 2: Configure Backend .env

Edit `backend/.env` with the following content:

```env
APP_NAME=Lumen
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_TIMEZONE=UTC
APP_URL=http://localhost:8000

LOG_CHANNEL=stack
LOG_LEVEL=debug

# PostgreSQL Database Configuration
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=fes_stories
DB_USERNAME=vyom
DB_PASSWORD=VT@123
DB_CHARSET=utf8

CACHE_DRIVER=file
QUEUE_CONNECTION=sync

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Important:** Update the following if you changed them:
- `DB_USERNAME`: Your PostgreSQL username
- `DB_PASSWORD`: Your PostgreSQL password
- `DB_DATABASE`: Your database name (must be lowercase)

### Step 3: Generate Application Key (Optional)

```powershell
php artisan key:generate
```

### Step 4: Frontend Environment (if needed)

If the frontend needs environment variables, create `.env` in the root directory:

```env
VITE_API_URL=http://localhost:8000
```

---

## Running the Project

### Step 1: Start Backend Server

Open a terminal/command prompt and navigate to the project root:
```powershell
cd D:\FES_Stories
```

Start the PHP development server:
```powershell
cd backend
php -S localhost:8000 -t public
```

**Important:** 
- Use the full path to PHP if it's not in PATH: `C:\php84\php.exe -S localhost:8000 -t backend/public`
- Keep this terminal window open

You should see:
```
PHP 8.4.x Development Server (http://localhost:8000) started
```

### Step 2: Start Frontend Development Server

Open a **new** terminal/command prompt:
```powershell
cd D:\FES_Stories
npm run dev
```

The frontend will start on `http://localhost:3000` (as configured in `vite.config.js`).

### Step 3: Access the Application

- **Frontend**: Open browser and go to `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **API Health Check**: `http://localhost:8000/api/health`

---

## Verification & Testing

### Test 1: Backend Health Check

In a new terminal:
```powershell
# Using PowerShell
Invoke-WebRequest -Uri http://localhost:8000/api/health -UseBasicParsing

# Or using curl (if available)
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Database connection successful",
  "user_count": 2,
  "database": "fes_stories"
}
```

### Test 2: Login API

```powershell
$body = @{
    email = 'vyom@example.com'
    password = '123'
} | ConvertTo-Json

Invoke-WebRequest -Uri 'http://localhost:8000/api/auth/login' `
    -Method POST `
    -Body $body `
    -ContentType 'application/json' `
    -UseBasicParsing
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "vyom@example.com",
    "name": "Vyom"
  }
}
```

### Test 3: Frontend Login

1. Open `http://localhost:3000` in your browser
2. Navigate to the login page
3. Enter credentials:
   - Email: `vyom@example.com`
   - Password: `123`
4. Click "Sign In"
5. You should be redirected to the dashboard

---

## Troubleshooting

### Issue: PHP Extensions Not Loading

**Symptoms:**
```
Warning: PHP Startup: Unable to load dynamic library 'pdo_pgsql'
```

**Solutions:**
1. Verify `extension_dir` in `php.ini` points to the correct directory
2. Check that `php_pdo_pgsql.dll` and `php_pgsql.dll` exist in the extensions directory
3. Ensure `libpq.dll` is accessible (copy from PostgreSQL bin directory if needed)
4. Verify PHP version matches extension version (PHP 8.4 extensions for PHP 8.4)

### Issue: Database Connection Failed

**Symptoms:**
```
SQLSTATE[08006] [7] FATAL: password authentication failed
```

**Solutions:**
1. Verify database credentials in `.env` match PostgreSQL user credentials
2. Check database name is lowercase: `fes_stories` (not `FES_Stories`)
3. Test connection manually:
   ```powershell
   psql -U vyom -d fes_stories -h 127.0.0.1
   ```

### Issue: Permission Denied Errors

**Symptoms:**
```
ERROR: permission denied for schema public
ERROR: permission denied for table users
```

**Solutions:**
1. Re-run all GRANT commands as the `postgres` superuser
2. Verify you're connected to the correct database: `\c fes_stories`
3. Check permissions:
   ```sql
   SELECT * FROM information_schema.table_privileges WHERE grantee = 'vyom';
   ```

### Issue: Port Already in Use

**Symptoms:**
```
Address already in use
```

**Solutions:**
1. Find the process using the port:
   ```powershell
   # For port 8000
   netstat -ano | findstr :8000
   
   # For port 3000
   netstat -ano | findstr :3000
   ```
2. Kill the process:
   ```powershell
   taskkill /F /PID <process_id>
   ```
3. Or change the port in configuration files

### Issue: CORS Errors

**Symptoms:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solutions:**
1. Verify frontend is running on port 3000 (check `vite.config.js`)
2. Check `CORS_ALLOWED_ORIGINS` in `backend/.env` includes `http://localhost:3000`
3. Restart the backend server after changing `.env`

### Issue: Frontend Can't Connect to Backend

**Symptoms:**
```
Network error
Failed to fetch
```

**Solutions:**
1. Verify backend is running: `http://localhost:8000/api/health`
2. Check `VITE_API_URL` in frontend `.env` (if exists)
3. Verify API endpoint in `src/utils/constants.js` is `/api/auth/login`
4. Check browser console for detailed error messages

---

## Quick Reference Commands

### Start Project
```powershell
# Terminal 1: Backend
cd backend
php -S localhost:8000 -t public

# Terminal 2: Frontend
npm run dev
```

### Database Operations
```powershell
# Connect to PostgreSQL
psql -U postgres -h 127.0.0.1

# Connect to database
psql -U vyom -d fes_stories -h 127.0.0.1

# View all users
psql -U vyom -d fes_stories -h 127.0.0.1 -c "SELECT * FROM users;"
```

### Verify Installations
```powershell
php -v
psql --version
composer --version
node --version
npm --version
php -m | Select-String pgsql
```

---

## Project Structure

```
FES_Stories/
├── backend/
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── AuthController.php
│   │   │   │   └── HealthController.php
│   │   │   └── Middleware/
│   │   │       └── CorsMiddleware.php
│   │   └── Models/
│   │       └── User.php
│   ├── config/
│   │   └── database.php
│   ├── routes/
│   │   └── api.php
│   ├── public/
│   │   └── index.php
│   ├── .env
│   └── composer.json
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── utils/
├── package.json
├── vite.config.js
└── NEW_SYSTEM_SETUP.md (this file)
```

---

## Summary Checklist

- [ ] PHP 8.4 installed and in PATH
- [ ] PostgreSQL installed and in PATH
- [ ] Composer installed
- [ ] Node.js and npm installed
- [ ] Project dependencies installed (`composer install`, `npm install`)
- [ ] `php.ini` configured with PostgreSQL extensions
- [ ] PostgreSQL extensions verified (`php -m | Select-String pgsql`)
- [ ] Database `fes_stories` created
- [ ] Database user `vyom` created with password
- [ ] `users` table created
- [ ] Permissions granted to `vyom` user
- [ ] Test users inserted (optional)
- [ ] `backend/.env` configured with database credentials
- [ ] Backend server running on port 8000
- [ ] Frontend server running on port 3000
- [ ] Health check endpoint working
- [ ] Login functionality working

---

## Additional Notes

1. **Database Name**: Always use lowercase `fes_stories` in PostgreSQL (case-sensitive)
2. **PHP Executable**: If PHP is not in PATH, use full path: `C:\php84\php.exe`
3. **Ports**: 
   - Backend: 8000
   - Frontend: 3000
   - PostgreSQL: 5432
4. **Development vs Production**: This guide is for development setup. Production setup requires additional security configurations.
5. **Password Security**: Change default passwords before deploying to production.

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the `POSTGRESQL_SETUP_RESOLUTION.md` file for detailed troubleshooting
2. Review error logs:
   - Backend: `backend/storage/logs/`
   - Browser console (F12)
3. Verify all services are running:
   - PostgreSQL service
   - Backend server
   - Frontend server

---

**Last Updated:** December 2025
**Project:** FES Stories
**Version:** 1.0

