import { describe, expect, it } from 'vitest'

import { SITE_NAME, SITE_URL, pageHead, sessionPageDescription, sessionPageTitle, truncate } from '@/lib/seo'

describe('truncate', () => {
  it('leaves short text alone', () => {
    expect(truncate('Closing Ceremony', 60)).toBe('Closing Ceremony')
  })

  it('cuts at a word boundary, drops trailing punctuation and adds an ellipsis', () => {
    const result = truncate('W Heptathlon (LJ, Javelin, 800m Final); W 100mH Rep; M 800m Semi', 30)

    expect(result).toBe('W Heptathlon (LJ, Javelin…')
    expect(result.length).toBeLessThanOrEqual(30)
  })
})

describe('pageHead', () => {
  it('builds matching title, description, Open Graph tags and an absolute canonical URL', () => {
    const head = pageHead({ title: 'Terms', description: 'The terms.', path: '/terms' })

    expect(head.meta).toEqual([
      { title: 'Terms' },
      { name: 'description', content: 'The terms.' },
      { property: 'og:title', content: 'Terms' },
      { property: 'og:description', content: 'The terms.' },
      { property: 'og:url', content: `${SITE_URL}/terms` },
    ])
    expect(head.links).toEqual([{ rel: 'canonical', href: `${SITE_URL}/terms` }])
  })

  it('keeps the query string for session pages', () => {
    const head = pageHead({ title: 'T', description: 'D', path: '/?session=ATH15' })

    expect(head.links[0]?.href).toBe(`${SITE_URL}/?session=ATH15`)
  })
})

describe('sessionPageTitle', () => {
  it('combines the session name and events with the site name', () => {
    expect(sessionPageTitle({ name: 'BKB42 Basketball', desc: "Women's Gold Medal Game" })).toBe(
      `BKB42 Basketball: Women's Gold Medal Game · ${SITE_NAME}`,
    )
  })
})

describe('sessionPageDescription', () => {
  const session = { date: 'Sat Jul 29', time: '4:00 PM–6:15 PM', venue: 'Intuit Dome' }

  it('leads with when and where, then the first summary paragraph', () => {
    expect(sessionPageDescription(session, 'Gold on the line.\n\nSecond paragraph.')).toBe(
      'Sat Jul 29, 4:00 PM–6:15 PM at Intuit Dome. Gold on the line.',
    )
  })

  it('omits a placeholder venue and works without a summary', () => {
    expect(sessionPageDescription({ ...session, venue: 'N/A' })).toBe('Sat Jul 29, 4:00 PM–6:15 PM.')
  })

  it('stays within the description length limit', () => {
    expect(sessionPageDescription(session, 'word '.repeat(100)).length).toBeLessThanOrEqual(200)
  })
})
