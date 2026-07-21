import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/acordos': {
        target: 'http://177.85.6.66:8089',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/acordos/, '/rest'),
      },
      '/rest': {
        target: 'http://177.85.6.66:8091',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/rest/, '/rest01'),
      },
    },
  },
})
