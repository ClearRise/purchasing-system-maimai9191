import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    tailwindcss(),
  ],
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
    },
  }
})
