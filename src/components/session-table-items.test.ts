import { describe, expect, it } from 'vitest'

import { buildSessionTableItems } from '@/components/session-table-items'
import type { GroupBy, Session } from '@/types/session'

function makeSession(index: number, overrides: Partial<Session> = {}): Session {
  return {
    id: `session-${index}`,
    sport: 'Swimming',
    name: `Event ${index}`,
    desc: `Description ${index}`,
    venue: 'Venue',
    zone: 'LA',
    date: 'Thu Jul 13',
    dk: '2028-07-13',
    time: '12:00 PM-1:00 PM',
    rt: 'Prelim',
    pLo: 100,
    pHi: 200,
    soccer: false,
    rSig: 7,
    rExp: 7,
    rStar: 7,
    rUniq: 7,
    rDem: 7,
    agg: 7,
    ...overrides,
  }
}

function getKeys(groupBy: GroupBy, sessions: Session[]) {
  return buildSessionTableItems(sessions, groupBy).map((item) => item.key)
}

describe('buildSessionTableItems', () => {
  it('returns only session items in input order when grouping is disabled', () => {
    const sessions = [makeSession(1), makeSession(2), makeSession(3)]

    expect(getKeys('', sessions)).toEqual([
      'session:session-1',
      'session:session-2',
      'session:session-3',
    ])
  })

  it('inserts grouped banner items with stable keys and counts', () => {
    const sessions = [
      makeSession(1, { sport: 'Swimming' }),
      makeSession(2, { sport: 'Swimming' }),
      makeSession(3, { sport: 'Archery' }),
    ]

    expect(buildSessionTableItems(sessions, 'sport')).toEqual([
      {
        key: 'group:sport:Archery',
        type: 'group',
        label: 'Archery',
        count: 1,
      },
      {
        key: 'session:session-3',
        type: 'session',
        session: sessions[2],
      },
      {
        key: 'group:sport:Swimming',
        type: 'group',
        label: 'Swimming',
        count: 2,
      },
      {
        key: 'session:session-1',
        type: 'session',
        session: sessions[0],
      },
      {
        key: 'session:session-2',
        type: 'session',
        session: sessions[1],
      },
    ])
  })

  it('sorts date groups by dk instead of the display label', () => {
    const sessions = [
      makeSession(1, { date: 'Wed Jul 19', dk: '2028-07-19' }),
      makeSession(2, { date: 'Mon Jul 17', dk: '2028-07-17' }),
      makeSession(3, { date: 'Tue Jul 18', dk: '2028-07-18' }),
    ]

    expect(getKeys('date', sessions)).toEqual([
      'group:date:Mon Jul 17',
      'session:session-2',
      'group:date:Tue Jul 18',
      'session:session-3',
      'group:date:Wed Jul 19',
      'session:session-1',
    ])
  })
})
