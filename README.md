# FES Stories - React Application

A modern React application built with Vite, featuring Tailwind CSS, React Router, and comprehensive API management.

## 🚀 Features

- ⚡ **Vite** - Fast development and optimized builds
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🧭 **React Router** - Client-side routing
- 📡 **Axios** - HTTP client with interceptors
- 🔔 **React Toastify** - Beautiful notifications
- 🎯 **Custom Hooks** - Reusable API hooks (useApi, useMutation)
- 🔧 **ESLint & Prettier** - Code quality and formatting
- 📦 **Organized Structure** - Clean folder architecture

## 📁 Project Structure

```
FES_Stories/
├── public/
├── src/
│   ├── components/          # Reusable React components
│   ├── pages/              # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   └── Dashboard.jsx
│   ├── hooks/              # Custom React hooks
│   │   └── useApi.js
│   ├── utils/              # Utility functions
│   │   ├── api.js          # Axios instance & interceptors
│   │   └── constants.js    # API endpoints & constants
│   ├── styles/             # Global styles
│   │   └── index.css
│   ├── App.jsx             # Main App component
│   └── main.jsx            # Application entry point
├── .env                    # Environment variables (not in git)
├── .env.example            # Example environment variables
├── .eslintrc.cjs           # ESLint configuration
├── .prettierrc             # Prettier configuration
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure your API URL:
   ```
   VITE_API_URL=http://localhost:8000
   ```

## 🏃 Running the Project

### Development Server
```bash
npm run dev
```
The application will open at `http://localhost:3000`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Code Quality

**Linting:**
```bash
npm run lint
```

**Formatting:**
```bash
npm run format
```

## 📚 Usage Examples

### Using the API Hook

**GET Request:**
```jsx
import { useApi } from '../hooks/useApi'
import { API_ENDPOINTS } from '../utils/constants'

function MyComponent() {
  const { data, loading, error } = useApi(API_ENDPOINTS.USERS.LIST)
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return <div>{/* Render data */}</div>
}
```

**POST/PUT/DELETE Request:**
```jsx
import { useMutation } from '../hooks/useApi'
import { toast } from 'react-toastify'

function MyComponent() {
  const { execute: createUser, loading } = useMutation(API_ENDPOINTS.USERS.LIST)
  
  const handleSubmit = async (formData) => {
    try {
      const result = await createUser(formData)
      toast.success('User created!')
    } catch (error) {
      toast.error('Failed to create user')
    }
  }
  
  return <button onClick={() => handleSubmit(data)} disabled={loading}>
    {loading ? 'Creating...' : 'Create User'}
  </button>
}
```

### API Configuration

The API base URL is configured in `.env`:
```
VITE_API_URL=http://localhost:8000
```

API endpoints are defined in `src/utils/constants.js`:
```javascript
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    // ...
  },
  USERS: {
    LIST: '/users',
    DETAIL: (id) => `/users/${id}`,
    // ...
  },
}
```

### Authentication

The API client automatically adds the auth token from localStorage:
```javascript
// Token is stored after login
localStorage.setItem('authToken', token)

// Token is automatically added to all requests
// 401 errors automatically redirect to /login
```

## 🎨 Styling

This project uses Tailwind CSS. You can customize the theme in `tailwind.config.js`.

Example:
```jsx
<div className="bg-blue-500 text-white p-4 rounded-lg">
  Styled with Tailwind
</div>
```

## 🔔 Notifications

React Toastify is configured globally. Use it anywhere:
```jsx
import { toast } from 'react-toastify'

toast.success('Success message')
toast.error('Error message')
toast.info('Info message')
toast.warning('Warning message')
```

## 📝 Code Quality

- **ESLint**: Configured with React and React Hooks plugins
- **Prettier**: Configured for consistent code formatting

Run both before committing:
```bash
npm run lint
npm run format
```

## 🌐 Routing

Routes are defined in `src/App.jsx`:
- `/` - Home page
- `/login` - Login page
- `/dashboard` - Dashboard page

Add new routes:
```jsx
<Route path="/new-route" element={<NewPage />} />
```

## 📦 Dependencies

### Production
- `react` & `react-dom` - React library
- `react-router-dom` - Routing
- `axios` - HTTP client
- `react-toastify` - Notifications
- `react-icons` - Icon library

### Development
- `vite` - Build tool
- `@vitejs/plugin-react` - Vite React plugin
- `tailwindcss` - CSS framework
- `autoprefixer` & `postcss` - CSS processing
- `eslint` - Linting
- `prettier` - Code formatting

## 🔧 Configuration Files

- **vite.config.js** - Vite configuration
- **tailwind.config.js** - Tailwind CSS configuration
- **postcss.config.js** - PostCSS configuration
- **.eslintrc.cjs** - ESLint rules
- **.prettierrc** - Prettier formatting rules

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and formatting
4. Submit a pull request

---

**Happy Coding! 🎉**

