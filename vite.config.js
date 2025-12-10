import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
        proxy: {
          '/api-proxy': {
            target: 'https://adminhierarchy.indiaobservatory.org.in',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api-proxy/, ''),
            secure: true,
          },
          '/oauth-proxy': {
            target: 'http://192.168.14.16:9090',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/oauth-proxy/, ''),
            secure: false,
          }
        }
  }
})

