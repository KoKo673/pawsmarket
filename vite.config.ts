import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'

import { buildSpaFallback } from './scripts/spaFallback.js'

/**
 * Publish index.html again as 404.html after the build.
 *
 * GitHub Pages serves files from disk and answers its own 404 for any path it
 * cannot find, so /explore, /pet/12 and /explore?preset=vets all showed
 * "File not found" on a direct load, refresh or shared link. 404.html is the
 * documented fallback: Pages serves it, and the client router takes over on
 * the original URL.
 */
function spaFallback(base: string): Plugin {
  return {
    name: 'pawsmarket-spa-fallback',
    apply: 'build',
    closeBundle() {
      const written = buildSpaFallback(
        fileURLToPath(new URL('./dist', import.meta.url)), base)
      this.info?.(`SPA fallback written: ${written}`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Read .env / .env.local so the proxy target is configurable without
  // rebuilding.
  // loadEnv(mode, root, '') — an explicit '' prefix is required so non-VITE_
  // vars (HTTPS_DEV, DEV_PROXY_TARGET) are read from .env / .env.local too.
  const env = loadEnv(mode, process.cwd(), '')
  // Where the DEV SERVER forwards /api. Distinct from VITE_API_BASE_URL, which
  // is baked into the browser bundle for production (where there is no proxy).
  // Point this at a deployed API to develop against the real backend.
  const apiTarget = env.DEV_PROXY_TARGET || 'http://localhost:9232'
  // HTTPS_DEV=1 → serve over HTTPS so geolocation works from a phone on
  // the LAN (browsers require a secure context for navigator.geolocation).
  const httpsDev = env.HTTPS_DEV === '1' || env.HTTPS_DEV === 'true'

  // Base path for the deployment target (e.g. "/pawsmarket/" on
  // GitHub Pages project sites). Defaults to "/" for local dev.
  // Read from loadEnv too — Git Bash mangles inline `VITE_BASE=/…`
  // env assignments for native Windows processes (MSYS path conversion),
  // so the value lives in .env.production instead.
  const base = process.env.VITE_BASE || env.VITE_BASE || '/'

  return {
    // Base path for the deployment target (e.g. "/pawsmarket/" on
    // GitHub Pages project sites). Defaults to "/" for local dev.
    base,
    plugins: [react(), spaFallback(base), ...(httpsDev ? [basicSsl()] : [])],
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
