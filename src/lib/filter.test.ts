import { describe, expect, it } from 'vitest'

import { filterSessions } from '@/lib/filter'
import type { Filters, Session } from '@/types/session'

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'ATH01',
    sport: 'Athletics',
    name: 'ATH01 Athletics',
    desc: "Men's Final",
    venue: 'Olympic Stadium',
    zone: 'Downtown',
    date: 'Thu Jul 13',
    dk: '2028-07-13',
    time: '12:00 PM-4:15 PM',
    rt: 'Final',
    soccer: false,
    rSig: 7,
    rExp: 8,
    rStar: 9,
    rUniq: 6,
    rDem: 8,
    agg: 7.5,
    ...overrides,
  }
}

const defaultFilters: Filters = {
  sport: '',
  round: '',
  zone: '',
  score: '',
}

describe('filterSessions', () => {
  it('filters by sport', () => {
    const sessions = [
      makeSession(),
      makeSession({
        id: 'SWM01',
        sport: 'Swimming',
        name: 'SWM01 Swimming',
        zone: 'Beach',
        rt: 'Semi',
      }),
    ]

    const filtered = filterSessions(sessions, {
      ...defaultFilters,
      sport: 'Athletics',
    })

    expect(filtered.map((session) => session.id)).toEqual(['ATH01'])
  })

  it('keeps the single-select rating filter working', () => {
    const sessions = [
      makeSession({ id: 'LOW01', agg: 5.5 }),
      makeSession({ id: 'MID01', agg: 8.2 }),
      makeSession({ id: 'HIGH01', agg: 9.1 }),
    ]

    const filtered = filterSessions(sessions, {
      ...defaultFilters,
      score: '8',
    })

    expect(filtered.map((session) => session.id)).toEqual(['MID01', 'HIGH01'])
  })
})
