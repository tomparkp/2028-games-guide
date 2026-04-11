import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-virtual', async () => {
  const React = await import('react')

  return {
    useWindowVirtualizer: (options: {
      count: number
      overscan?: number
      scrollMargin?: number
      initialRect?: { height?: number }
      estimateSize: (index: number) => number
      getItemKey?: (index: number) => string | number
    }) => {
      const [, forceRender] = React.useReducer((value: number) => value + 1, 0)

      React.useEffect(() => {
        function handleViewportChange() {
          forceRender()
        }

        window.addEventListener('scroll', handleViewportChange)
        window.addEventListener('resize', handleViewportChange)
        return () => {
          window.removeEventListener('scroll', handleViewportChange)
          window.removeEventListener('resize', handleViewportChange)
        }
      }, [])

      const overscan = options.overscan ?? 0
      const viewportHeight = window.innerHeight || options.initialRect?.height || 768
      const scrollOffset = Math.max(0, window.scrollY - (options.scrollMargin ?? 0))

      const itemSizes = Array.from({ length: options.count }, (_, index) => options.estimateSize(index))
      const itemStarts = itemSizes.reduce<number[]>((starts, _size, index) => {
        starts.push(index === 0 ? 0 : starts[index - 1] + itemSizes[index - 1])
        return starts
      }, [])

      let startIndex = 0
      while (
        startIndex < options.count &&
        itemStarts[startIndex] + itemSizes[startIndex] <= scrollOffset
      ) {
        startIndex += 1
      }

      let endIndex = startIndex
      while (
        endIndex < options.count &&
        itemStarts[endIndex] < scrollOffset + viewportHeight
      ) {
        endIndex += 1
      }

      const from = Math.max(0, startIndex - overscan)
      const to = Math.min(options.count, endIndex + overscan)

      const virtualItems = Array.from({ length: Math.max(0, to - from) }, (_, offset) => {
        const index = from + offset
        const size = itemSizes[index] ?? 0
        const start = itemStarts[index] ?? 0

        return {
          index,
          key: options.getItemKey?.(index) ?? index,
          size,
          start,
          end: start + size,
        }
      })

      return {
        getVirtualItems: () => virtualItems,
        getTotalSize: () => itemSizes.reduce((sum, size) => sum + size, 0),
        measure: () => {},
        measureElement: () => {},
      }
    },
  }
})

import { SessionTable } from '@/components/SessionTable'
import type { GroupBy, Session, SortState } from '@/types/session'

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

function setScrollOffset(offset: number) {
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    writable: true,
    value: offset,
  })
  Object.defineProperty(window, 'pageYOffset', {
    configurable: true,
    writable: true,
    value: offset,
  })
  document.documentElement.scrollTop = offset
  fireEvent.scroll(window)
}

function renderTable({
  sessions,
  groupBy = '',
}: {
  sessions: Session[]
  groupBy?: GroupBy
}) {
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
      groupBy={groupBy}
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
  it('renders only a virtualized desktop subset and keeps row interactions working', async () => {
    setViewportWidth(1200)
    const sessions = Array.from({ length: 200 }, (_, index) => makeSession(index))
    const { container, onSelectSessionId, onToggleBookmark } = renderTable({ sessions })

    await waitFor(() => {
      expect(container.querySelectorAll('[data-session-item]').length).toBeLessThan(40)
    })

    fireEvent.click(screen.getByText('Event 1'))
    expect(onSelectSessionId).toHaveBeenCalledWith('session-1')

    fireEvent.click(screen.getByLabelText('Save Event 1'))
    expect(onToggleBookmark).toHaveBeenCalledWith('session-1')
    expect(onSelectSessionId).toHaveBeenCalledTimes(1)

    setScrollOffset(9000)

    await waitFor(() => {
      expect(screen.getByText('Event 180')).toBeTruthy()
    })
  })

  it('renders grouped banners in the virtualized desktop list', async () => {
    setViewportWidth(1200)
    const sessions = [
      ...Array.from({ length: 8 }, (_, index) => makeSession(index, { sport: 'Archery' })),
      ...Array.from({ length: 8 }, (_, index) => makeSession(index + 10, { sport: 'Boxing' })),
      ...Array.from({ length: 8 }, (_, index) => makeSession(index + 20, { sport: 'Cycling' })),
    ]

    renderTable({ sessions, groupBy: 'sport' })

    await waitFor(() => {
      expect(screen.getByText('Archery')).toBeTruthy()
      expect(screen.getByText('Boxing')).toBeTruthy()
    })

    setScrollOffset(1200)

    await waitFor(() => {
      expect(screen.getByText('Cycling')).toBeTruthy()
    })
  })

  it('virtualizes the mobile card list', async () => {
    setViewportWidth(480)
    const sessions = Array.from({ length: 120 }, (_, index) => makeSession(index))
    const { container } = renderTable({ sessions })

    await waitFor(() => {
      expect(container.querySelectorAll('[data-session-item]').length).toBeLessThan(20)
    })

    setScrollOffset(9000)

    await waitFor(() => {
      expect(screen.getByText('Event 70')).toBeTruthy()
    })
  })
})
