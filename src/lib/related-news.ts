import { SPORT_KNOWLEDGE } from '@/data/sport-knowledge'
import type { RelatedNews, Session } from '@/types/session'

export const RELATED_NEWS_LIMIT = 4

const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g

function escapeRegExp(value: string) {
  return value.replace(REGEX_SPECIAL_CHARS, '\\$&')
}

function keywordMatchesSessionText(haystack: string, keyword: string) {
  const trimmed = keyword.trim()
  if (!trimmed) return true

  const pattern = new RegExp(`\\b${escapeRegExp(trimmed)}\\b`, 'i')
  return pattern.test(haystack)
}

export function relatedNewsMatchesSession(news: RelatedNews, session: Session): boolean {
  if (news.roundTypes?.length && !news.roundTypes.includes(session.rt)) return false

  if (news.eventKeywords?.length) {
    const haystack = `${session.name} ${session.desc}`
    return news.eventKeywords.every((keyword) => keywordMatchesSessionText(haystack, keyword))
  }

  return true
}

export function resolveRelatedNewsForSession(
  session: Session,
  relatedNews: RelatedNews[],
  limit = RELATED_NEWS_LIMIT,
): RelatedNews[] {
  return relatedNews
    .filter((news) => relatedNewsMatchesSession(news, session))
    .sort((a, b) => Date.parse(b.publishedDate) - Date.parse(a.publishedDate))
    .slice(0, limit)
}

export function getRelatedNewsForSession(session: Session): RelatedNews[] {
  return resolveRelatedNewsForSession(session, SPORT_KNOWLEDGE[session.sport]?.relatedNews ?? [])
}
