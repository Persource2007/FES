# Project Structure

```
FES_Stories/
├── public/                    # Static assets (create if needed)
├── src/
│   ├── components/           # Reusable React components
│   ├── pages/                # Page components
│   │   ├── Home.jsx         # Home page
│   │   ├── Login.jsx        # Login page
│   │   └── Dashboard.jsx    # Dashboard page
│   ├── hooks/                # Custom React hooks
│   │   └── useApi.js        # API hooks (useApi, useMutation)
│   ├── utils/                # Utility functions
│   │   ├── api.js           # Axios instance & interceptors
│   │   └── constants.js     # API endpoints & constants
│   ├── styles/               # Global styles
│   │   └── index.css        # Tailwind CSS imports
│   ├── App.jsx               # Main App component with routes
│   └── main.jsx              # Application entry point
├── .env                      # Environment variables (create manually)
├── .env.example              # Example environment variables (create manually)
├── .eslintrc.cjs             # ESLint configuration
├── .gitignore                # Git ignore rules
├── .prettierignore           # Prettier ignore rules
├── .prettierrc               # Prettier configuration
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── postcss.config.js         # PostCSS configuration
├── README.md                  # Project documentation
├── tailwind.config.js        # Tailwind CSS configuration
└── vite.config.js            # Vite configuration
```

## Key Configuration Files

### vite.config.js
- Vite build configuration
- React plugin setup
- Server port: 3000

### tailwind.config.js
- Tailwind CSS configuration
- Content paths for purging unused styles

### .eslintrc.cjs
- ESLint rules for React
- React Hooks plugin
- React Refresh plugin

### .prettierrc
- Code formatting rules
- Single quotes, semicolons, 2-space indentation

### Environment Variables
Create `.env` file with:
```
VITE_API_URL=http://localhost:8000
```

