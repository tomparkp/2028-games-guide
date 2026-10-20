import { describe, expect, it } from 'vitest'

import { contentSecurityPolicy } from '@/lib/content-security-policy'
import { securityHeaders } from '@/lib/security-headers'

describe('securityHeaders', () => {
  it('uses the strict policy by default', () => {
    expect(securityHeaders()['Content-Security-Policy']).toBe(contentSecurityPolicy())
  })

  it('passes the Vercel Toolbar option through to the policy', () => {
    expect(securityHeaders({ vercelToolbar: true })['Content-Security-Policy']).toBe(
      contentSecurityPolicy({ vercelToolbar: true }),
    )
  })
})
