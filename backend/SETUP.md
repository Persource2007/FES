# Lumen API Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd backend
composer install
```

### 2. Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env and set your database credentials
# DB_DATABASE=lumen_api
# DB_USERNAME=root
# DB_PASSWORD=your_password
```

### 3. Create Database

```sql
CREATE DATABASE lumen_api;
```

Or via command line:
```bash
mysql -u root -p -e "CREATE DATABASE lumen_api;"
```

### 4. Run Migrations

```bash
php artisan migrate
```

### 5. Seed Database (Optional)

```bash
php artisan db:seed
```

This creates test users:
- `test@example.com` / `password123`
- `john@example.com` / `password123`
- `jane@example.com` / `password123`

### 6. Start Server

```bash
php -S localhost:8000 -t public
```

## Testing the API

### Test Login Endpoint

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Expected Response:
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

## Project Structure

```
backend/
├── app/
│   ├── Console/
│   │   └── Kernel.php
│   ├── Exceptions/
│   │   └── Handler.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   └── Controller.php
│   │   ├── Middleware/
│   │   │   └── CorsMiddleware.php
│   │   └── Requests/
│   │       └── LoginRequest.php
│   └── Models/
│       └── User.php
├── bootstrap/
│   └── app.php
├── database/
│   ├── migrations/
│   │   └── 2024_01_01_000001_create_users_table.php
│   └── seeders/
│       └── DatabaseSeeder.php
├── public/
│   ├── .htaccess
│   └── index.php
├── routes/
│   ├── api.php
│   └── web.php
├── storage/
│   ├── framework/
│   │   ├── cache/
│   │   ├── sessions/
│   │   └── views/
│   └── logs/
├── .env
├── .env.example
├── composer.json
└── README.md
```

## Troubleshooting

### CORS Issues
- Check `.env` has `CORS_ALLOWED_ORIGINS` set correctly
- Ensure `CorsMiddleware` is registered in `bootstrap/app.php`

### Database Connection
- Verify database credentials in `.env`
- Ensure database exists
- Check MySQL service is running

### 500 Errors
- Set `APP_DEBUG=true` in `.env` for detailed errors
- Check `storage/logs/` for error logs
- Verify migrations are run: `php artisan migrate`

