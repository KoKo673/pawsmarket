import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// ── Service worker ─────────────────────────────────────────────────
// Registered after `load`, never during it. A worker that installs while
// the first paint is still happening competes for bandwidth with the
// assets it is precaching, and the visitor pays for it on the visit
// where it matters least — the first one.
//
// Production only. In `vite dev` a worker intercepts module requests and
// serves stale code across HMR reloads, which reads as "my edit did
// nothing". `import.meta.env.PROD` is compile-time, so the dev bundle
// carries no registration at all.
//
// Failure is swallowed on purpose: registration fails in private modes
// and on insecure origins, and a shop that refuses to render because a
// cache could not be installed is worse than an uncached one.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is an enhancement, not a requirement */
    })
  })
}
