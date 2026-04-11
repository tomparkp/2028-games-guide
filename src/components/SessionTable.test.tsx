import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SessionTable } from '@/components/SessionTable'
import type { Session, SortState } from '@/types/session'

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

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
}

function renderTable({ sessions }: { sessions: Session[] }) {
  const onSort = vi.fn()
  const onToggleBookmark = vi.fn()
  const onSelectSessionId = vi.fn()
  const sort: SortState = { col: 'agg', dir: 'desc' }

  const result = render(
    <SessionTable
      sessions={sessions}
      sort={sort}
      onSort={onSort}
      isBookmarked={() => false}
      onToggleBookmark={onToggleBookmark}
      selectedSessionId={null}
      onSelectSessionId={onSelectSessionId}
    />,
  )

  return {
    ...result,
    onSort,
    onToggleBookmark,
    onSelectSessionId,
  }
}

describe('SessionTable', () => {
  it('renders desktop rows and handles row interactions', () => {
    setViewportWidth(1200)
    const sessions = Array.from({ length: 5 }, (_, index) => makeSession(index))
    const { onSelectSessionId, onToggleBookmark } = renderTable({ sessions })

    fireEvent.click(screen.getByText('Event 1'))
    expect(onSelectSessionId).toHaveBeenCalledWith('session-1')

    fireEvent.click(screen.getByLabelText('Save Event 1'))
    expect(onToggleBookmark).toHaveBeenCalledWith('session-1')
    expect(onSelectSessionId).toHaveBeenCalledTimes(1)
  })

  it('shows empty state when no sessions match', () => {
    setViewportWidth(1200)
    renderTable({ sessions: [] })

    expect(screen.getByText('No sessions match your filters')).toBeTruthy()
  })
})
