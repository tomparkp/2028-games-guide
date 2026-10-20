import type { QueryClient } from '@tanstack/react-query'
import {
  HeadContent,
  Link,
  ScriptOnce,
  Scripts,
  createRootRouteWithContext,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

import { Nav } from '../components/Nav'
import { DEFAULT_FILTERS } from '../lib/session-search'

// Inlined into the document rather than linked: the stylesheet was the only render-blocking
// request, and on a slow connection that extra round trip delayed first paint. It's about
// 8 KB compressed, and the site is essentially one page, so separate caching buys little.
import appCss from '../styles.css?inline'

// Inlined (not an external file) so the stored theme applies before first paint without
// adding a render-blocking request. ScriptOnce removes the tag after it runs so it can't
// cause a hydration mismatch.
const themeInitScript = `(function(){try{var t=window.localStorage.getItem('28games_session_guide_theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: '2028 Games Unofficial Guide' },
      {
        name: 'description',
        content:
          'Browse all 800+ sessions of the 2028 Summer Games in Los Angeles by sport, venue, and date, with AI ratings and summaries to help you choose tickets.',
      },
    ],
    styles: [{ children: appCss }],
    links: [
      { rel: 'icon', href: '/favicon.svg?v=5', type: 'image/svg+xml', sizes: 'any' },
      { rel: 'icon', href: '/favicon.ico?v=5', type: 'image/x-icon', sizes: '32x32 16x16' },
      { rel: 'apple-touch-icon', href: '/logo192.png' },
      // Browsers fetch manifests without cookies by default; sending them lets the manifest
      // load on login-protected Vercel previews instead of redirecting to Vercel SSO.
      { rel: 'manifest', href: '/manifest.json', crossOrigin: 'use-credentials' },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: RootError,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ScriptOnce>{themeInitScript}</ScriptOnce>
        <HeadContent />
      </head>
      <body>
        <Nav />
        {children}
        <footer className="text-ink3 flex flex-col items-center gap-2 py-6 text-center text-xs">
          <div>Made with love and electricity in Los Angeles. ☀️</div>
          <div className="flex items-center gap-3">
            <Link to="/privacy" className="hover:text-gold transition-colors">
              Privacy
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/terms" className="hover:text-gold transition-colors">
              Terms
            </Link>
          </div>
        </footer>
        <Scripts />
        {import.meta.env.VITE_VERCEL_INSIGHTS === 'true' && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  )
}

function ErrorMessage({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <h2 className="font-display mb-3 text-[2rem] leading-[1.1] font-normal -tracking-[0.03em]">
        {heading}
      </h2>
      <p className="text-ink3 mb-6 max-w-[420px] text-sm">{body}</p>
      <Link
        to="/"
        search={{ ...DEFAULT_FILTERS, sortCol: 'agg', sortDir: 'desc' }}
        className="border-border bg-surface2 text-ink2 hover:border-gold hover:text-gold inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm transition-colors"
      >
        Back to home
      </Link>
    </div>
  )
}

function RootError({ error }: ErrorComponentProps) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error(error)
  } else {
    // eslint-disable-next-line no-console
    console.error('Root error:', error instanceof Error ? error.message : 'Unknown error')
  }
  return (
    <ErrorMessage
      heading="Something went wrong"
      body="An unexpected error occurred. Please try refreshing the page."
    />
  )
}

function NotFound() {
  return (
    <ErrorMessage
      heading="Page not found"
      body="The page you're looking for doesn't exist or has been moved."
    />
  )
}
