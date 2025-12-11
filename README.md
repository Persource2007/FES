# FES Stories

A full-stack web application for managing and publishing stories with OAuth 2.0 authentication, role-based access control, and comprehensive content management.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm**
- **PHP** 8.1+ and **Composer**
- **PostgreSQL** 18+

### Installation

```bash
# Clone repository
git clone https://github.com/Vyom03/fes_stories.git
cd fes_stories

# Frontend setup
npm install

# Backend setup
cd backend
composer install
cp .env.example .env
# Configure database in .env
php artisan migrate
```

### Running

```bash
# Terminal 1: Frontend (port 3000)
npm run dev

# Terminal 2: Backend (port 8000)
cd backend
php -S localhost:8000 -t public

# Terminal 3: Swagger UI (port 3001, optional)
npx swagger-ui-watcher -p 3001 backend/api-docs/swagger.yaml
```

## 🛠️ Technology Stack

### Frontend
- **React** 18.2.0 - UI framework
- **Vite** 5.0.8 - Build tool & dev server
- **React Router DOM** 6.20.1 - Client-side routing
- **Axios** 1.6.2 - HTTP client
- **Tailwind CSS** 3.3.6 - Utility-first CSS
- **React Toastify** 9.1.3 - Notifications
- **React Icons** 4.12.0 - Icon library
- **CKEditor 5** 47.3.0 - Rich text editor

### Backend
- **Lumen** 10.0 (Laravel micro-framework) - PHP API framework
- **PHP** 8.1+ - Server-side language
- **PostgreSQL** 18+ - Database
- **Composer** - PHP dependency manager

### Authentication
- **OAuth 2.0** with PKCE flow
- **OAuth Server**: `http://192.168.14.16:9090`
- **Session Management**: HTTP-only cookies (BFF pattern)

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Swagger/OpenAPI** 3.0.3 - API documentation

## 📁 Project Structure

```
FES_Stories/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── utils/        # Utilities (API, OAuth, etc.)
│   │   └── hooks/        # Custom React hooks
│   ├── public/           # Static assets
│   └── vite.config.js    # Vite configuration
│
├── backend/               # Lumen API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   └── Middleware/
│   │   └── Models/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/
│   │   └── api.php       # API routes
│   └── api-docs/
│       └── swagger.yaml   # API documentation
│
├── ARCHITECTURE_DIAGRAMS.md    # System architecture diagrams
├── BFF_IMPLEMENTATION_GUIDE.md # BFF pattern guide
└── CHANGELOG.md          # Project changelog
```

## 🔐 Authentication

### OAuth 2.0 Flow (Current)
- **Authorization**: Direct browser redirect to OAuth server
- **Token Exchange**: Via Vite proxy (`/oauth-proxy`) in development
- **Storage**: Tokens stored in localStorage (⚠️ will migrate to BFF)

### BFF Pattern (Recommended)
See [BFF_IMPLEMENTATION_GUIDE.md](./BFF_IMPLEMENTATION_GUIDE.md) for implementation details.

## 📡 API Documentation

View interactive API docs:
```bash
npx swagger-ui-watcher -p 3001 backend/api-docs/swagger.yaml
```
Then open: `http://localhost:3001`

## 🗄️ Database

- **PostgreSQL** 18+
- **Migrations**: `php artisan migrate`
- **Seeders**: `php artisan db:seed`

## 🔧 Configuration

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

### Backend (backend/.env)
```env
APP_ENV=local
APP_DEBUG=true
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=fes_stories
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:3001
```

## 📚 Key Features

- ✅ OAuth 2.0 authentication with PKCE
- ✅ Role-based access control (Super Admin, Editor, Writer)
- ✅ Story management (create, review, publish)
- ✅ Organization and region management
- ✅ Activity logging
- ✅ Multi-language support (Google Translate)
- ✅ Interactive India map with story locations

## 📖 Documentation

- [Architecture Diagrams](./ARCHITECTURE_DIAGRAMS.md) - System architecture with Mermaid diagrams
- [BFF Implementation Guide](./BFF_IMPLEMENTATION_GUIDE.md) - Backend-for-Frontend pattern guide
- [CHANGELOG](./CHANGELOG.md) - Detailed change history
- [API Documentation](./backend/api-docs/swagger.yaml) - OpenAPI 3.0 specification

## 🧪 Development

```bash
# Frontend
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
npm run format   # Format with Prettier

# Backend
php artisan migrate        # Run migrations
php artisan db:seed        # Seed database
php artisan migrate:refresh --seed  # Reset & seed
```

## 📝 License

Private and proprietary.

---

**Built with ❤️ for FES Stories**
