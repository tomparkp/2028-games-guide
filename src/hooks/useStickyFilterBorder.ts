import { useEffect, useRef, useState } from 'react'

/**
 * Sentinel sits just above the sticky filter bar. When its top edge moves above
 * the viewport, the bar is pinned — show a bottom border.
 */
export function useStickyFilterBorder() {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const apply = (entry: IntersectionObserverEntry) => {
      setStuck(entry.boundingClientRect.top < 0)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry) apply(entry)
      },
      { root: null, threshold: [0, 1], rootMargin: '0px' },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  return { sentinelRef, stuck }
}
