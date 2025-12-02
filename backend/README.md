# FES Stories - Lumen API

A Lumen-based REST API for the FES Stories application with authentication endpoints ready for React integration.

## 🚀 Features

- ✅ **Lumen Framework** - Fast, lightweight PHP micro-framework
- ✅ **Authentication Endpoint** - Login endpoint with validation
- ✅ **CORS Support** - Configured for React frontend
- ✅ **Eloquent ORM** - Database models and migrations
- ✅ **Request Validation** - Form request validation
- ✅ **Error Handling** - Global exception handler with consistent JSON responses
- ✅ **Database Seeders** - Test users for development
- ✅ **PSR-12 Standards** - Clean, well-documented code

## 📁 Project Structure

```
backend/
├── app/
│   ├── Console/
│   │   └── Kernel.php
│   ├── Exceptions/
│   │   └── Handler.php          # Global exception handler
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   └── Controller.php
│   │   ├── Middleware/
│   │   │   └── CorsMiddleware.php
│   │   └── Requests/
│   │       └── LoginRequest.php  # Login validation
│   └── Models/
│       └── User.php
├── bootstrap/
│   └── app.php                   # Application bootstrap
├── database/
│   ├── migrations/
│   │   └── 2024_01_01_000001_create_users_table.php
│   └── seeders/
│       └── DatabaseSeeder.php
├── public/
│   ├── .htaccess
│   └── index.php                 # Entry point
├── routes/
│   ├── api.php                   # API routes
│   └── web.php                   # Web routes
├── .env                          # Environment variables
├── .env.example                  # Example environment variables
├── composer.json                 # Dependencies
└── README.md
```

## 🛠️ Installation

### Prerequisites

- PHP >= 8.1
- Composer
- MySQL/MariaDB
- Apache/Nginx (or PHP built-in server)

### Step 1: Install Dependencies

```bash
cd backend
composer install
```

### Step 2: Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure your database:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lumen_api
DB_USERNAME=root
DB_PASSWORD=your_password
```

Generate application key (optional, but recommended):

```bash
php artisan key:generate
```

Or manually add to `.env`:

```env
APP_KEY=base64:your-random-key-here
```

### Step 3: Create Database

Create a MySQL database:

```sql
CREATE DATABASE lumen_api;
```

Or using command line:

```bash
mysql -u root -p -e "CREATE DATABASE lumen_api;"
```

### Step 4: Run Migrations

```bash
php artisan migrate
```

### Step 5: Seed Database (Optional)

Seed the database with test users:

```bash
php artisan db:seed
```

This creates three test users:
- `test@example.com` / `password123`
- `john@example.com` / `password123`
- `jane@example.com` / `password123`

## 🏃 Running the API

### Using PHP Built-in Server

```bash
php -S localhost:8000 -t public
```

The API will be available at `http://localhost:8000`

### Using Apache/Nginx

Configure your web server to point to the `public` directory.

## 📡 API Endpoints

### POST /api/auth/login

Login endpoint for user authentication.

**Request:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

**Error Response (400/401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Validation Error Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "The email field is required.",
    "The password field is required."
  ]
}
```

## 🔧 Configuration

### CORS Configuration

CORS is configured in `.env`:

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

The `CorsMiddleware` automatically handles CORS headers for these origins.

### Database Configuration

All database settings are in `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lumen_api
DB_USERNAME=root
DB_PASSWORD=
```

## 🧪 Testing the API

### Using cURL

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Using Postman

1. Create a new POST request
2. URL: `http://localhost:8000/api/auth/login`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

## 📝 Code Quality

### PSR-12 Coding Standards

The codebase follows PSR-12 coding standards:
- Proper indentation (4 spaces)
- Consistent naming conventions
- Type hints where applicable
- Comprehensive comments

### Validation

- Email format validation
- Required field validation
- Custom error messages
- Consistent error response format

### Error Handling

- Global exception handler
- Proper HTTP status codes:
  - `200` - Success
  - `400` - Bad Request (validation errors)
  - `401` - Unauthorized (invalid credentials)
  - `404` - Not Found
  - `500` - Internal Server Error

## 🔐 Security Notes

**Current Implementation:**
- The login endpoint currently uses dummy validation (checks if user exists)
- Password verification is commented out for development

**For Production:**
1. Uncomment password verification in `AuthController.php`:
```php
if (!Hash::check($password, $user->password)) {
    return $this->errorResponse('Invalid credentials', 401);
}
```

2. Implement JWT or session-based authentication
3. Add rate limiting
4. Use HTTPS
5. Implement proper password hashing (already using Laravel's Hash)

## 📦 Dependencies

### Production
- `laravel/lumen-framework` - Lumen framework
- `vlucas/phpdotenv` - Environment variable management

### Development
- `fakerphp/faker` - Fake data generation
- `phpunit/phpunit` - Testing framework

## 🗄️ Database Schema

### Users Table

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| name | varchar(255) | User's full name |
| email | varchar(255) | Unique email address |
| password | varchar(255) | Hashed password |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Update timestamp |

## 🔄 Migration Commands

```bash
# Run migrations
php artisan migrate

# Rollback last migration
php artisan migrate:rollback

# Rollback all migrations
php artisan migrate:reset

# Refresh database (rollback + migrate)
php artisan migrate:refresh

# Refresh with seeding
php artisan migrate:refresh --seed
```

## 🌱 Seeding Commands

```bash
# Run seeders
php artisan db:seed

# Run specific seeder
php artisan db:seed --class=DatabaseSeeder

# Refresh and seed
php artisan migrate:refresh --seed
```

## 🐛 Troubleshooting

### CORS Issues

If you encounter CORS errors:
1. Check `.env` has correct `CORS_ALLOWED_ORIGINS`
2. Ensure `CorsMiddleware` is registered in `bootstrap/app.php`
3. Clear any cached config: `php artisan config:clear`

### Database Connection Issues

1. Verify database credentials in `.env`
2. Ensure database exists
3. Check MySQL service is running
4. Verify database user has proper permissions

### 500 Errors

1. Check `APP_DEBUG=true` in `.env` for detailed errors
2. Check `storage/logs/` for error logs
3. Verify all migrations are run
4. Check PHP version >= 8.1

## 📄 License

This project is private and proprietary.

## 🤝 Integration with React

The API is ready to integrate with the React frontend:

1. Set `VITE_API_URL=http://localhost:8000` in React `.env`
2. Use the login endpoint: `POST /api/auth/login`
3. Store the token from response (when JWT is implemented)
4. Include token in Authorization header for protected routes

---

**Happy Coding! 🎉**

