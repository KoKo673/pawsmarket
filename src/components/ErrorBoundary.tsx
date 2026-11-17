import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

/**
 * مرز خطای React — آخرین سدی که یک استثنای رندر را از «صفحهٔ سفید» جدا می‌کند.
 *
 * Why this exists (production checklist item 39): React 18 unmounts the
 * whole tree when a render throws. Measured behaviour without a boundary
 * is a blank white page with the error only in devtools — the visitor
 * sees a shop that died, with no way back and no way to tell anyone.
 *
 * **What it catches:** errors thrown while RENDERING, in lifecycle
 * methods, and in constructors. That is the class that blanks a page.
 *
 * **What it does NOT catch, and this is not a detail:**
 *   - errors in event handlers        (React does not route them here)
 *   - errors in async code / promises (a `.catch` is still required)
 *   - errors thrown in the boundary itself
 *   - errors on the server
 * A boundary that is believed to catch these is worse than none, because
 * it stops anyone adding the `try/catch` that would actually work.
 *
 * **It reports upward.** On catching, it POSTs to the same
 * `/api/client-errors` sink the app already has, so a broken render
 * reaches the same Loki stream and the same `error_key` grouping as a
 * backend failure. A boundary that only renders a nice screen hides the
 * bug from the people who could fix it.
 */

interface Props {
  children: ReactNode
  /** Shown instead of the default card — e.g. inside a single widget. */
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

/** One report per page load; a render loop would otherwise flood the sink. */
let reportedThisLoad = false

function report(error: Error, info: ErrorInfo) {
  if (reportedThisLoad) return
  reportedThisLoad = true
  try {
    const body = JSON.stringify({
      message: error.message,
      // The component stack, not the JS stack: for a render error it is
      // the stack that names the component, and the JS one is minified.
      stack: (info.componentStack || '').slice(0, 4000),
      url: window.location.pathname,
    })
    // `keepalive` so a navigation away does not cancel the report.
    // `catch` swallows: reporting must never itself throw inside a
    // boundary that is already handling a failure.
    void fetch('/api/client-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* a failed report must not break the fallback */
  }
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    report(error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <div
        role="alert"
        dir="rtl"
        className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <h1 className="text-xl font-extrabold">این صفحه باز نشد</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          یک خطای غیرمنتظره رخ داد و صفحه نتوانست نمایش داده شود. بقیهٔ
          سایت سالم است — می‌توانید به صفحهٔ اصلی برگردید.
        </p>
        {/* A full reload, not a router push: the broken state may live in
            a provider above the router, and re-rendering the same tree
            would throw again. */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            تلاش دوباره
          </button>
          <Link
            to="/"
            onClick={() => window.location.assign('/')}
            className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
          >
            صفحهٔ اصلی
          </Link>
        </div>
      </div>
    )
  }
}
