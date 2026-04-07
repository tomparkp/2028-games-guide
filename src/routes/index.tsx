import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { sessions } from '@/data/sessions'
import { useBookmarks } from '@/hooks/useBookmarks'
import { FilterBar } from '@/components/FilterBar'
import { SessionTable } from '@/components/SessionTable'
import { BookmarkSection } from '@/components/BookmarkSection'
import type { Filters, SortColumn, SortState, GroupBy } from '@/types/session'
import { filterSessions, sortSessions } from '@/lib/filter'
import { ThemeToggle } from '@/components/ThemeToggle'

export const Route = createFileRoute('/')({ component: SessionPicker })

const defaultFilters: Filters = {
  search: '',
  sport: '',
  round: '',
  zone: '',
  score: '',
  price: '',
}

function SessionPicker() {
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [sort, setSort] = useState<SortState>({ col: 'agg', dir: 'desc' })
  const [groupBy, setGroupBy] = useState<GroupBy>('')
  const { bookmarks, toggle, clearAll, isBookmarked } = useBookmarks()

  const filtered = useMemo(() => filterSessions(sessions, filters), [filters])
  const sorted = useMemo(() => sortSessions(filtered, sort), [filtered, sort])

  function handleSort(col: SortColumn) {
    setSort((prev) => ({
      col,
      dir: prev.col === col && prev.dir === 'desc' ? 'asc' : 'desc',
    }))
  }

  return (
    <>
      <div className="hero">
        <ThemeToggle />
        <div className="rings">
          <div className="ring" />
          <div className="ring" />
          <div className="ring" />
          <div className="ring" />
          <div className="ring" />
        </div>
        <h1><em>LA28</em> Session Picker</h1>
        <p className="sub">{sessions.length} sessions &middot; all sports &middot; rated &amp; sortable &middot; bookmark to save</p>
      </div>

      <FilterBar filters={filters} onChange={setFilters} groupBy={groupBy} onGroupByChange={setGroupBy} />

      <div className="wrap">
        <BookmarkSection
          sessions={sessions}
          bookmarks={bookmarks}
          onToggleBookmark={toggle}
          onClearAll={clearAll}
        />

        <SessionTable
          sessions={sorted}
          sort={sort}
          onSort={handleSort}
          isBookmarked={isBookmarked}
          onToggleBookmark={toggle}
          groupBy={groupBy}
        />

        <div className="footer-note">
          Data sourced from LA 2028 Session Table &middot; Los Angeles 2028
        </div>
      </div>
    </>
  )
}
