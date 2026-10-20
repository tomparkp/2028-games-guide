const DIRECTIVES: Record<string, string> = {
  'default-src': "'self'",
  'script-src': "'self' 'unsafe-inline'",
  'style-src': "'self' 'unsafe-inline'",
  'img-src': "'self' data:",
  'font-src': "'self'",
  'connect-src': "'self'",
  'frame-ancestors': "'none'",
  'base-uri': "'self'",
  'form-action': "'self'",
  'object-src': "'none'",
}

// Vercel injects its toolbar (comments, accessibility audit, layout tools) into preview
// deployments only. These are the extra sources it needs:
// https://vercel.com/docs/vercel-toolbar/managing-toolbar#using-a-content-security-policy
const VERCEL_TOOLBAR_SOURCES: Record<string, string> = {
  'script-src': 'https://vercel.live',
  'style-src': 'https://vercel.live',
  'img-src': 'https://vercel.live https://vercel.com blob:',
  'font-src': 'https://vercel.live https://assets.vercel.com',
  'connect-src': 'https://vercel.live wss://ws-us3.pusher.com',
  'frame-src': 'https://vercel.live',
}

export function contentSecurityPolicy({ vercelToolbar = false } = {}): string {
  const directives = { ...DIRECTIVES }
  if (vercelToolbar) {
    for (const [name, sources] of Object.entries(VERCEL_TOOLBAR_SOURCES)) {
      directives[name] = `${directives[name] ?? "'self'"} ${sources}`
    }
  }
  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources}`)
    .join('; ')
}
