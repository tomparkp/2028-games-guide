import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/cn'
import { roundTypes } from '@/data/sessions'
import { useStickyFilterBorder } from '@/hooks/useStickyFilterBorder'
import type { Filters, GroupBy } from '@/types/session'

interface FilterBarProps {
  filters: Filters
  onChange: (filters: Filters) => void
  groupBy: GroupBy
  onGroupByChange: (groupBy: GroupBy) => void
  sports: string[]
  zones: string[]
}

const inputBase =
  'bg-surface2 border border-border rounded-md text-ink text-[0.74rem] font-[system-ui] outline-none transition-[border-color] duration-150 px-2 py-1.5 focus:border-gold'

const selectCls = `${inputBase} filter-select`

const activeCls = 'border-gold bg-gold-dim'

const actionBtnCls =
  'flex items-center gap-1.5 shrink-0 rounded-md border border-border bg-surface2 px-2.5 py-1.5 text-[0.74rem] font-medium text-ink2 cursor-pointer transition-colors duration-150'

const actionActiveCls = 'border-gold text-gold'

const badgeCls =
  'flex size-[18px] items-center justify-center rounded-full bg-gold text-bg text-[0.6rem] font-bold'

function activeFilterCount(filters: Filters, groupBy: GroupBy): number {
  let count = 0
  if (filters.sport) count++
  if (filters.round) count++
  if (filters.zone) count++
  if (filters.score) count++
  if (filters.price) count++
  if (groupBy) count++
  return count
}

export function FilterBar({
  filters,
  onChange,
  groupBy,
  onGroupByChange,
  sports,
  zones,
}: FilterBarProps) {
  const { sentinelRef, stuck } = useStickyFilterBorder()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeCount = activeFilterCount(filters, groupBy)

  function update(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value })
  }

  const searchInput = (desktop: boolean) => (
    <div className={cn('relative', !desktop && 'flex-1 min-w-0')}>
      <input
        type="text"
        placeholder="Search events..."
        value={filters.search}
        className={cn(
          inputBase,
          'placeholder:text-ink3',
          desktop ? 'w-[150px] lg:w-[220px]' : 'w-full',
          filters.search && 'pr-6',
          filters.search && activeCls,
        )}
        onChange={(e) => update('search', e.target.value)}
      />
      {filters.search && (
        <button
          type="button"
          onClick={() => update('search', '')}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-ink3 hover:text-ink transition-colors cursor-pointer"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )

  const filterSelects = (
    <>
      <select
        className={cn(selectCls, filters.sport && activeCls)}
        value={filters.sport}
        onChange={(e) => update('sport', e.target.value)}
      >
        <option value="" className="text-ink bg-surface">Sport</option>
        {sports.map((s) => (
          <option key={s} value={s} className="text-ink bg-surface">
            {s}
          </option>
        ))}
      </select>
      <select
        className={cn(selectCls, filters.round && activeCls)}
        value={filters.round}
        onChange={(e) => update('round', e.target.value)}
      >
        <option value="" className="text-ink bg-surface">Round</option>
        {roundTypes.map((r) => (
          <option key={r} value={r} className="text-ink bg-surface">
            {r}
          </option>
        ))}
      </select>
      <select
        className={cn(selectCls, filters.zone && activeCls)}
        value={filters.zone}
        onChange={(e) => update('zone', e.target.value)}
      >
        <option value="" className="text-ink bg-surface">Zone</option>
        {zones.map((z) => (
          <option key={z} value={z} className="text-ink bg-surface">
            {z}
          </option>
        ))}
      </select>
      <select
        className={cn(selectCls, filters.score && activeCls)}
        value={filters.score}
        onChange={(e) => update('score', e.target.value)}
      >
        <option value="" className="text-ink bg-surface">Rating</option>
        <option value="8">8+</option>
        <option value="6">6+</option>
        <option value="4">4+</option>
      </select>
      <select
        className={cn(selectCls, filters.price && activeCls)}
        value={filters.price}
        onChange={(e) => update('price', e.target.value)}
      >
        <option value="" className="text-ink bg-surface">Price</option>
        <option value="0-50">&lt;$50</option>
        <option value="0-100">&lt;$100</option>
        <option value="0-200">&lt;$200</option>
        <option value="0-500">&lt;$500</option>
        <option value="500-99999">$500+</option>
      </select>
    </>
  )

  const groupBySelect = (
    <select
      className={cn(selectCls, groupBy && activeCls)}
      value={groupBy}
      onChange={(e) => onGroupByChange(e.target.value as GroupBy)}
    >
      <option value="" className="text-ink bg-surface">Group By</option>
      <option value="sport">Sport</option>
      <option value="rt">Round</option>
      <option value="zone">Zone</option>
      <option value="date">Date</option>
    </select>
  )

  return (
    <>
      <div ref={sentinelRef} className="h-px m-0 pointer-events-none" aria-hidden />
      <div className={cn('sticky top-0 z-10 bg-bg', stuck && 'border-b border-border')}>
        {/* ─── Desktop: single row ─── */}
        <div className="hidden min-[880px]:flex items-center gap-1.5 px-4 py-2.5 mx-auto max-w-[1400px]">
          {searchInput(true)}
          <span className="flex-1" />
          {filterSelects}
          <span className="flex-1" />
          {groupBySelect}
        </div>

        {/* ─── Mobile / narrow: collapsible filters ─── */}
        <div className="min-[880px]:hidden px-3 py-2 mx-auto max-w-[1400px] space-y-1.5">
          <div className="flex gap-1.5">
            {searchInput(false)}
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className={cn(actionBtnCls, (filtersOpen || activeCount > 0) && actionActiveCls)}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
              {activeCount > 0 && (
                <span className={badgeCls}>{activeCount}</span>
              )}
              <ChevronDown
                size={14}
                className={cn('transition-transform duration-150', filtersOpen && 'rotate-180')}
              />
            </button>
          </div>

          <div
            className={cn(
              'grid transition-[grid-template-rows] duration-200 ease-panel',
              filtersOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
            )}
          >
            <div className="overflow-hidden">
              <div className="grid grid-cols-2 max-[400px]:grid-cols-1 gap-2 pt-1 pb-0.5">
                {filterSelects}
                {groupBySelect}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
