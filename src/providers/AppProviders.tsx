import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { useState, type PropsWithChildren } from 'react'

/**
 * App-wide context providers.
 * The QueryClient is created inside the component (StrictMode-safe) so
 * dev double-mounting never hands down a shared, cache-polluted instance.
 */
export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {/* ── reducedMotion="user" ────────────────────────────────────
          framer-motion's default is "never": it ignores
          prefers-reduced-motion unless told otherwise. The CSS layer in
          index.css respects it and lib/motion.ts checks it by hand, but
          every component built on motion.div animates regardless — page
          transitions, the mobile menu, dialogs, the theme toggle.

          Measured with reduce emulated: opening the mobile menu still left
          the sheet mid-transition at opacity 0, transform translateY. A
          reader who asked the operating system to stop motion was being
          moved anyway, by the library, one level below the CSS that was
          doing it right.

          "user" follows the OS setting. No component needs to change: this
          is the single switch the library exposes for it. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </QueryClientProvider>
  )
}
