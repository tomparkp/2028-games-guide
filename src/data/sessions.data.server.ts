import { getSessionInsights, type SessionInsights } from '@/lib/ai-scorecard'
import { filterSessions, sortSessions } from '@/lib/filter'
import type {
  Filters,
  Session,
  SessionContent,
  SessionWithContent,
  SortState,
} from '@/types/session'

import rawSessionContent from './session-content.json'
import rawSessions from './sessions.json'

export interface SessionsPage {
  items: Session[]
  nextOffset: number | null
  total: number
  sports: string[]
  zones: string[]
}

export interface SessionDetailPayload {
  session: Session
  insights: SessionInsights
  contentMeta?: SessionContent['contentMeta']
}

interface SessionsIndex {
  sessions: Session[]
  sports: string[]
  zones: string[]
  sessionsById: Map<string, Session>
  contentBySessionId: Record<string, SessionContent>
}

// Workers isolates may be evicted between requests, so this is best-effort.
let cachedIndex: SessionsIndex | null = null

function getSessionsIndex(): SessionsIndex {
  if (cachedIndex) return cachedIndex

  const sessions = rawSessions as Session[]
  const sports = [...new Set(sessions.map((session) => session.sport))].filter(Boolean).sort()
  const zones = [...new Set(sessions.map((session) => session.zone))].sort()

  cachedIndex = {
    sessions,
    sports,
    zones,
    sessionsById: new Map(sessions.map((session) => [session.id, session])),
    contentBySessionId: rawSessionContent as Record<string, SessionContent>,
  }

  return cachedIndex
}

function getSessionWithContent(sessionId: string): SessionWithContent | null {
  const { sessionsById, contentBySessionId } = getSessionsIndex()
  const session = sessionsById.get(sessionId)
  if (!session) return null

  return {
    ...session,
    ...contentBySessionId[sessionId],
  }
}

export function getSessionsPageData({
  filters,
  sort,
  offset,
  limit,
}: {
  filters: Filters
  sort: SortState
  offset: number
  limit: number
}): SessionsPage {
  const { sessions, sports, zones } = getSessionsIndex()
  const filtered = filterSessions(sessions, filters)
  const sorted = sortSessions(filtered, sort)
  const items = sorted.slice(offset, offset + limit)
  const nextOffset = offset + items.length < sorted.length ? offset + items.length : null

  return {
    items,
    nextOffset,
    total: sorted.length,
    sports,
    zones,
  }
}

export function getSessionDetailData(sessionId: string): SessionDetailPayload | null {
  const session = getSessionWithContent(sessionId)
  if (!session) return null

  const {
    blurb: _blurb,
    potentialContenders: _potentialContenders,
    potentialContendersIntro: _potentialContendersIntro,
    contentMeta,
    ...sessionSummary
  } = session

  return {
    session: sessionSummary,
    insights: getSessionInsights(session),
    contentMeta,
  }
}

export function getSessionsByIds(ids: string[]): Session[] {
  const { sessionsById } = getSessionsIndex()

  return ids
    .map((id) => sessionsById.get(id))
    .filter((session): session is Session => !!session)
    .sort((a, b) => a.dk.localeCompare(b.dk) || a.name.localeCompare(b.name))
}
