import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],
  server: {
    host: '127.0.0.1', // explicitly use IPv4 localhost
    port: 3000,        // try a different port
    strictPort: false  // allow fallback if 3000 is occupied
  }
})