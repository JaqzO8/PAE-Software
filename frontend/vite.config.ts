import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const githubPagesBase = repositoryName ? `/${repositoryName}/` : '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === 'true' ? githubPagesBase : '/',
  
  // Configuración para Docker
  server: {
    host: '0.0.0.0', // Permite acceso externo
    port: 5173,
    watch: {
      usePolling: true, // Necesario para hot-reload en Docker
    },
  },
  
  // Resolver alias (opcional, para imports limpios)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 450,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          radix: [
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
          ],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          icons: ['lucide-react'],
          realtime: ['socket.io-client'],
          http: ['axios'],
        },
      },
    },
  },
})
