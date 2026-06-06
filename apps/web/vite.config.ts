import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@tavuilu/shared': path.resolve(__dirname, '../../shared/index.ts'),
    },
  },
  server: {
    proxy: {
      '/api': process.env.API_URL ?? 'http://localhost:3000',
      '/images': process.env.API_URL ?? 'http://localhost:3000',
    },
  },
})
