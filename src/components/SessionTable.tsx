import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { Bookmark } from 'lucide-react'
import {
  memo,
  type CSSProperties,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/cn'
import { fmtPrice, fmtTime } from '@/lib/format'
import { roundTagClasses } from '@/lib/tw'
import type { GroupBy, Session, SortColumn, SortState } from '@/types/session'

import { ScorePill } from './ScorePill'
import { buildSessionTableItems, groupLabel } from './session-table-items'

export interface SessionTableProps {
  sessions: Session[]
  sort: SortState
  onSort: (col: SortColumn) => void
  isBookmarked: (id: string) => boolean
  onToggleBookmark: (id: string) => void
  groupBy: GroupBy
  selectedSessionId: string | null
  onSelectSessionId: (sessionId: string) => void
}

const headerCellBase =
  'flex min-w-0 items-center border-b border-border bg-surface2 px-2.5 py-2 text-left text-[0.62rem] font-semibold whitespace-nowrap tracking-[0.08em] uppercase text-ink3'

const sortHeaderBase =
  'w-full cursor-pointer select-none justify-start border-0 transition-colors duration-100 hover:text-gold'

const desktopGridColumns =
  'minmax(0, 3fr) minmax(108px, 1fr) minmax(190px, 1.5fr) minmax(76px, 0.75fr) minmax(92px, 0.8fr) minmax(84px, 0.8fr) minmax(96px, 0.85fr) 36px'

const desktopGridStyle = { gridTemplateColumns: desktopGridColumns } satisfies CSSProperties
const initialVirtualRect = { width: 1280, height: 900 }
const groupEstimate = 36
const desktopRowEstimate = 52
const mobileCardEstimate = 128
const desktopOverscan = 15
const mobileOverscan = 6
const rowCellBase = 'min-w-0'
const rowCellInnerBase =
  "relative h-full px-2.5 py-[7px] before:pointer-events-none before:absolute before:inset-x-0 before:top-px before:bottom-px before:content-['']"
const rowCellContentBase = 'relative z-10'

const SortHeader = memo(function SortHeader({
  label,
  col,
  sort,
  onSort,
  title,
}: {
  label: string
  col: SortColumn
  sort: SortState
  onSort: (col: SortColumn) => void
  title?: string
}) {
  const active = sort.col === col
  return (
    <button
      type="button"
      data-col={col}
      onClick={() => onSort(col)}
      title={title}
      className={cn(headerCellBase, sortHeaderBase)}
    >
      {label}
      {active && (
        <span className="text-[0.55rem] text-gold ml-0.5">
          {sort.dir === 'asc' ? '\u25B2' : '\u25BC'}
        </span>
      )}
    </button>
  )
})

/* ─── Mobile card ─── */

const SessionCard = memo(function SessionCard({
  session,
  selected,
  onSelectId,
  bookmarked,
  onToggleBookmark,
}: {
  session: Session
  selected: boolean
  onSelectId: (id: string) => void
  bookmarked: boolean
  onToggleBookmark: (id: string) => void
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelectId(session.id)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      data-session-item
      onClick={() => onSelectId(session.id)}
      onKeyDown={handleKeyDown}
      className={cn(
        'rounded-lg border border-border bg-surface bg-clip-padding p-3 active:bg-surface2',
        selected && 'border-gold bg-gold-dim',
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-ink text-[0.84rem] leading-tight">
            {session.name}
          </div>
          <div className="mt-0.5 text-[0.72rem] text-ink3 line-clamp-1">
            {session.desc}
          </div>
        </div>
        <button
          type="button"
          className="size-10 shrink-0 flex items-center justify-center rounded-md transition-all duration-100 hover:bg-gold-dim -mr-1 -mt-1"
          onClick={(e) => {
            e.stopPropagation()
            onToggleBookmark(session.id)
          }}
          title={bookmarked ? 'Remove from saved' : 'Save'}
          aria-label={bookmarked ? `Remove ${session.name} from saved` : `Save ${session.name}`}
        >
          <Bookmark
            size={20}
            className="transition-all duration-100"
            fill={bookmarked ? 'var(--gold)' : 'none'}
            stroke={bookmarked ? 'var(--gold)' : 'var(--ink3)'}
          />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.72rem] text-ink2">
        <span className="whitespace-nowrap">{session.date} · {fmtTime(session.time)}</span>
        <span className="text-border">|</span>
        <span className="whitespace-nowrap">{session.venue}</span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="inline-block px-1.5 py-0.5 rounded-md text-[0.6rem] font-semibold bg-surface3 text-ink2 whitespace-nowrap tracking-[0.02em]">
          {session.zone}
        </span>
        <span className={roundTagClasses(session.rt)}>{session.rt}</span>
        <span className="font-semibold tabular-nums text-[0.78rem] text-ink">
          {fmtPrice(session.pLo, session.pHi)}
        </span>
        <span className="ml-auto">
          <ScorePill
            agg={session.agg}
            rSig={session.rSig}
            rExp={session.rExp}
            rStar={session.rStar}
            rUniq={session.rUniq}
            rDem={session.rDem}
          />
        </span>
      </div>
    </div>
  )
}, areSessionEntryPropsEqual)

/* ─── Desktop table row ─── */

const SessionRow = memo(function SessionRow({
  session,
  selected,
  onSelectId,
  bookmarked,
  onToggleBookmark,
}: {
  session: Session
  selected: boolean
  onSelectId: (id: string) => void
  bookmarked: boolean
  onToggleBookmark: (id: string) => void
}) {
  function handleRowKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelectId(session.id)
    }
  }

  const cellInnerBase = cn(
    rowCellInnerBase,
    selected ? 'before:bg-gold-dim' : 'group-hover:before:bg-surface2',
  )

  return (
    <div
      className="group relative grid w-full cursor-pointer text-[0.78rem] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-border"
      style={desktopGridStyle}
      data-session-item
      onClick={() => onSelectId(session.id)}
      onKeyDown={handleRowKeyDown}
      tabIndex={0}
      role="button"
      aria-pressed={selected}
    >
      <div className={rowCellBase}>
        <div className={cellInnerBase}>
          <div className={cn(rowCellContentBase, 'min-w-0')}>
          <span className="block font-semibold text-ink whitespace-nowrap text-[0.78rem]">
            {session.name}
          </span>
          <span
            className="block text-[0.65rem] text-ink3 max-w-[280px] overflow-hidden text-ellipsis whitespace-nowrap"
            title={session.desc}
          >
            {session.desc}
          </span>
          </div>
        </div>
      </div>
      <div className={rowCellBase}>
        <div className={cn(cellInnerBase, 'whitespace-nowrap')}>
          <div className={rowCellContentBase}>
            {session.date}
            <br />
            <span className="text-[0.68rem] text-ink3">{fmtTime(session.time)}</span>
          </div>
        </div>
      </div>
      <div className={rowCellBase}>
        <div className={cn(cellInnerBase, 'whitespace-nowrap')}>
          <div className={rowCellContentBase}>{session.venue}</div>
        </div>
      </div>
      <div className={rowCellBase}>
        <div className={cn(cellInnerBase, 'flex items-start')}>
          <div className={rowCellContentBase}>
            <span className="inline-block px-1.5 py-0.5 rounded-md text-[0.6rem] font-semibold bg-surface3 text-ink2 whitespace-nowrap tracking-[0.02em]">
              {session.zone}
            </span>
          </div>
        </div>
      </div>
      <div className={rowCellBase}>
        <div className={cn(cellInnerBase, 'font-semibold whitespace-nowrap tabular-nums')}>
          <div className={rowCellContentBase}>{fmtPrice(session.pLo, session.pHi)}</div>
        </div>
      </div>
      <div className={rowCellBase}>
        <div className={cn(cellInnerBase, 'flex items-start')}>
          <div className={rowCellContentBase}>
            <span className={roundTagClasses(session.rt)}>{session.rt}</span>
          </div>
        </div>
      </div>
      <div className={rowCellBase}>
        <div className={cn(cellInnerBase, 'flex items-start justify-center')}>
          <div className={rowCellContentBase}>
            <ScorePill
              agg={session.agg}
              rSig={session.rSig}
              rExp={session.rExp}
              rStar={session.rStar}
              rUniq={session.rUniq}
              rDem={session.rDem}
            />
          </div>
        </div>
      </div>
      <div className={rowCellBase}>
        <div className={cn(cellInnerBase, 'flex items-start justify-center')}>
          <div className={rowCellContentBase}>
            <button
              type="button"
              className="size-7 border-none bg-transparent cursor-pointer p-0.5 rounded-md transition-all duration-100 flex items-center justify-center hover:bg-gold-dim [&:hover_.bm-off]:stroke-gold"
              onClick={(event) => {
                event.stopPropagation()
                onToggleBookmark(session.id)
              }}
              title={bookmarked ? 'Remove from saved' : 'Save'}
              aria-label={bookmarked ? `Remove ${session.name} from saved` : `Save ${session.name}`}
            >
              <Bookmark
                size={20}
                className={cn('transition-all duration-100', bookmarked ? 'bm-on' : 'bm-off')}
                fill={bookmarked ? 'var(--gold)' : 'none'}
                stroke={bookmarked ? 'var(--gold)' : 'var(--ink3)'}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}, areSessionEntryPropsEqual)

/* ─── Group divider (shared) ─── */

const GroupBanner = memo(function GroupBanner({
  groupBy,
  label,
  count,
}: {
  groupBy: GroupBy
  label: string
  count: number
}) {
  return (
    <div className="bg-surface2 text-[0.72rem] font-semibold text-ink2 px-2.5 py-1.5 border-b border-border">
      <span className="text-ink3 font-normal uppercase text-[0.6rem] tracking-[0.06em] mr-1">
        {groupLabel(groupBy)}:
      </span>{' '}
      {label}
      <span className="ml-1.5 text-[0.58rem] font-bold text-bg bg-ink3 px-[5px] py-px rounded-lg align-middle">
        {count}
      </span>
    </div>
  )
})

function areSessionEntryPropsEqual(
  prev: {
    session: Session
    selected: boolean
    bookmarked: boolean
  },
  next: {
    session: Session
    selected: boolean
    bookmarked: boolean
  },
) {
  return (
    prev.session === next.session &&
    prev.selected === next.selected &&
    prev.bookmarked === next.bookmarked
  )
}

/* ─── Main component ─── */

export function SessionTable({
  sessions,
  sort,
  onSort,
  isBookmarked,
  onToggleBookmark,
  groupBy,
  selectedSessionId,
  onSelectSessionId,
}: SessionTableProps) {
  const isMobile = useMediaQuery('(max-width: 539px)')
  const shouldMeasureItems = isMobile
  const listRef = useRef<HTMLDivElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  const items = useMemo(() => buildSessionTableItems(sessions, groupBy), [sessions, groupBy])

  const updateScrollMargin = useCallback(() => {
    if (!listRef.current || typeof window === 'undefined') return

    const next = listRef.current.getBoundingClientRect().top + window.scrollY
    setScrollMargin((prev) => (Math.abs(prev - next) < 1 ? prev : next))
  }, [])

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: (index) => {
      const item = items[index]
      if (!item) return isMobile ? mobileCardEstimate : desktopRowEstimate
      if (item.type === 'group') return groupEstimate
      return isMobile ? mobileCardEstimate : desktopRowEstimate
    },
    getItemKey: (index) => items[index]?.key ?? index,
    overscan: isMobile ? mobileOverscan : desktopOverscan,
    initialRect: initialVirtualRect,
    scrollMargin,
  })

  useEffect(() => {
    updateScrollMargin()

    if (typeof window === 'undefined') return

    const frame = window.requestAnimationFrame(() => {
      updateScrollMargin()
      if (shouldMeasureItems) {
        virtualizer.measure()
      }
    })

    function handleResize() {
      updateScrollMargin()
      if (shouldMeasureItems) {
        virtualizer.measure()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', handleResize)
    }
  }, [
    groupBy,
    isMobile,
    items.length,
    sessions.length,
    shouldMeasureItems,
    updateScrollMargin,
    virtualizer,
  ])

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  const tableHeader = (
    <div className="grid w-full" style={desktopGridStyle}>
      <SortHeader label="Event" col="name" sort={sort} onSort={onSort} />
      <SortHeader label="Date" col="date" sort={sort} onSort={onSort} />
      <SortHeader label="Venue" col="venue" sort={sort} onSort={onSort} />
      <div className={headerCellBase}>Zone</div>
      <SortHeader label="Price" col="pLo" sort={sort} onSort={onSort} />
      <div className={headerCellBase}>Round</div>
      <SortHeader
        label="AI Rating"
        col="agg"
        sort={sort}
        onSort={onSort}
        title="AI-generated aggregate rating (prestige, experience, star power, uniqueness, demand)"
      />
      <div className={headerCellBase} />
    </div>
  )

  function getVirtualItemStyle(start: number): CSSProperties {
    const offset = Math.round(start - scrollMargin)

    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      transform: `translateY(${offset}px)`,
    }
  }

  return (
    isMobile ? (
      <div ref={listRef}>
        {sessions.length === 0 ? (
          <div className="text-center py-12 px-4 text-ink3 text-[0.85rem] font-light">
            No sessions match your filters
          </div>
        ) : (
          <div className="relative" style={{ height: totalSize }}>
            {virtualItems.map((virtualItem) => {
              const item = items[virtualItem.index]
              if (!item) return null

              return (
                <div
                  key={item.key}
                  ref={shouldMeasureItems ? virtualizer.measureElement : undefined}
                  data-index={virtualItem.index}
                  style={getVirtualItemStyle(virtualItem.start)}
                >
                  <div className="pb-2 last:pb-0">
                    {item.type === 'group' ? (
                      <GroupBanner groupBy={groupBy} label={item.label} count={item.count} />
                    ) : (
                      <SessionCard
                        session={item.session}
                        selected={selectedSessionId === item.session.id}
                        onSelectId={onSelectSessionId}
                        bookmarked={isBookmarked(item.session.id)}
                        onToggleBookmark={onToggleBookmark}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    ) : (
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <div className="min-w-[940px]">
          {tableHeader}
          {sessions.length === 0 ? (
            <div
              ref={listRef}
              className="text-center px-4 py-12 text-[0.85rem] font-light text-ink3"
            >
              No sessions match your filters
            </div>
          ) : (
            <div ref={listRef} className="relative" style={{ height: totalSize }}>
              {virtualItems.map((virtualItem) => {
                const item = items[virtualItem.index]
                if (!item) return null

                return (
                  <div
                    key={item.key}
                    ref={shouldMeasureItems ? virtualizer.measureElement : undefined}
                    data-index={virtualItem.index}
                    style={getVirtualItemStyle(virtualItem.start)}
                  >
                    {item.type === 'group' ? (
                      <GroupBanner groupBy={groupBy} label={item.label} count={item.count} />
                    ) : (
                      <SessionRow
                        session={item.session}
                        selected={selectedSessionId === item.session.id}
                        onSelectId={onSelectSessionId}
                        bookmarked={isBookmarked(item.session.id)}
                        onToggleBookmark={onToggleBookmark}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  )
}
