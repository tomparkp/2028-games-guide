import { contentSecurityPolicy } from './content-security-policy.ts'

// Sent with every response via a Nitro `/**` route rule (see vite.config.ts) rather than the
// root route's `headers()`, which only runs for server-rendered pages: prerendered pages are
// served as static files and never reach it.
export function securityHeaders({ vercelToolbar = false } = {}): Record<string, string> {
  return {
    'Content-Security-Policy': contentSecurityPolicy({ vercelToolbar }),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  }
}
