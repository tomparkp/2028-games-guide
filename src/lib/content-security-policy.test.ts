import { describe, expect, it } from 'vitest'

import { contentSecurityPolicy } from '@/lib/content-security-policy'

function directives(policy: string): Record<string, string> {
  return Object.fromEntries(
    policy.split('; ').map((directive) => {
      const [name, ...sources] = directive.split(' ')
      return [name, sources.join(' ')]
    }),
  )
}

describe('contentSecurityPolicy', () => {
  it('allows only same-origin sources by default', () => {
    expect(contentSecurityPolicy()).toBe(
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
    )
  })

  it('adds the Vercel Toolbar sources on top of the defaults', () => {
    const policy = directives(contentSecurityPolicy({ vercelToolbar: true }))

    expect(policy['script-src']).toBe("'self' 'unsafe-inline' https://vercel.live")
    expect(policy['connect-src']).toBe("'self' https://vercel.live wss://ws-us3.pusher.com")
    expect(policy['frame-src']).toBe("'self' https://vercel.live")
    expect(policy['frame-ancestors']).toBe("'none'")
    expect(policy['object-src']).toBe("'none'")
  })
})
