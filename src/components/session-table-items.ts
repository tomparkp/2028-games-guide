import type { GroupBy, Session } from '@/types/session'

export type SessionTableItem =
  | {
      key: string
      type: 'group'
      label: string
      count: number
    }
  | {
      key: string
      type: 'session'
      session: Session
    }

function getGroupValue(session: Session, key: GroupBy): string {
  if (key === 'sport') return session.sport || 'Other'
  if (key === 'rt') return session.rt
  if (key === 'zone') return session.zone
  if (key === 'date') return session.date
  return ''
}

function groupSessions(sessions: Session[], key: GroupBy): { label: string; sessions: Session[] }[] {
  if (!key) return [{ label: '', sessions }]

  const groups = new Map<string, { sortKey: string; sessions: Session[] }>()
  for (const session of sessions) {
    const value = getGroupValue(session, key)
    const entry = groups.get(value)
    if (entry) {
      entry.sessions.push(session)
      continue
    }

    groups.set(value, {
      sortKey: key === 'date' ? session.dk : value,
      sessions: [session],
    })
  }

  return Array.from(groups.entries())
    .sort((a, b) => a[1].sortKey.localeCompare(b[1].sortKey))
    .map(([label, group]) => ({ label, sessions: group.sessions }))
}

export function groupLabel(key: GroupBy): string {
  if (key === 'sport') return 'Sport'
  if (key === 'rt') return 'Round'
  if (key === 'date') return 'Date'
  return 'Zone'
}

export function buildSessionTableItems(sessions: Session[], groupBy: GroupBy): SessionTableItem[] {
  const groups = groupSessions(sessions, groupBy)

  return groups.flatMap((group) => {
    const sessionItems = group.sessions.map(
      (session): SessionTableItem => ({
        key: `session:${session.id}`,
        type: 'session',
        session,
      }),
    )

    if (!groupBy) return sessionItems

    return [
      {
        key: `group:${groupBy}:${group.label}`,
        type: 'group',
        label: group.label,
        count: group.sessions.length,
      } satisfies SessionTableItem,
      ...sessionItems,
    ]
  })
}
