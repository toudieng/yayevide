import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const django = {
  target: 'http://localhost:8000',
  changeOrigin: false,
  configure: (proxy) => {
    proxy.on('proxyReq', (proxyReq, req) => {
      proxyReq.setHeader('X-Forwarded-Proto', req.headers['x-forwarded-proto'] || 'http')
    })
  },
}

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.trycloudflare.com'],
    proxy: {
      '/api': django,
      '/media': django,
    },
  },
})