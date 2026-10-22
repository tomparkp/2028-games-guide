import { fmtTime } from '@/lib/format'
import type { Session } from '@/types/session'

export const SITE_URL = 'https://28games.tompiarulli.com'
export const SITE_NAME = '2028 Games Unofficial Guide'
export const SITE_DESCRIPTION =
  'Browse all 800+ sessions of the 2028 Summer Games in Los Angeles by sport, venue, and date, with AI ratings and summaries to help you choose tickets.'
export const OG_IMAGE = { path: '/og-image.png', width: 1200, height: 630 }

const MAX_TITLE_DETAIL_LENGTH = 60
const MAX_DESCRIPTION_LENGTH = 200

/** Shortens `text` to at most `max` characters, cutting at a word boundary. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–-]+$/, '')}…`
}

/**
 * Title, description, Open Graph tags and canonical link for one page. Site-wide tags
 * (og:site_name, og:image, twitter:card) live on the root route. Route meta is merged by
 * name/property with the deepest route winning, but links aren't deduplicated, so only page
 * routes may emit the canonical link.
 */
export function pageHead({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}) {
  const url = new URL(path, SITE_URL).toString()

  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}

export function sessionPageTitle(session: Pick<Session, 'name' | 'desc'>): string {
  return `${session.name}: ${truncate(session.desc, MAX_TITLE_DETAIL_LENGTH)} · ${SITE_NAME}`
}

/** When and where the session is, followed by the start of its AI summary when there is one. */
export function sessionPageDescription(
  session: Pick<Session, 'date' | 'time' | 'venue'>,
  summary?: string,
): string {
  const venue = session.venue && session.venue !== 'N/A' ? ` at ${session.venue}` : ''
  const when = `${session.date}, ${fmtTime(session.time)}${venue}.`
  const firstParagraph = summary?.split('\n\n')[0]?.trim()

  return truncate(firstParagraph ? `${when} ${firstParagraph}` : when, MAX_DESCRIPTION_LENGTH)
}
