import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Read .env / .env.local so the proxy target is configurable without
  // rebuilding. VITE_API_BASE_URL is the Flask + PostGIS backend.
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_BASE_URL || 'http://localhost:9232'

  return {
    plugins: [react()],
    // Base path for the deployment target (e.g. "/pawsmarket/" on
    // GitHub Pages project sites). Defaults to "/" for local dev.
    // Read from loadEnv too — Git Bash mangles inline `VITE_BASE=/…`
    // env assignments for native Windows processes (MSYS path conversion),
    // so the value lives in .env.production instead.
    base: process.env.VITE_BASE || env.VITE_BASE || '/',
    resolve: {
      alias: {
        // Allows absolute imports: `import { Button } from '@/components/ui/button'`
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      host: true,
      // All /api/* traffic is same-origin in the browser and proxied to
      // Flask here — no CORS, single config point (see .env).
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
