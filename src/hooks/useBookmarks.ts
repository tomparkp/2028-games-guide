import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = '28games_session_guide_bookmarks'
const EMPTY: Set<string> = new Set()

let snapshot: Set<string> | null = null
const listeners = new Set<() => void>()

function loadBookmarks(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return (snapshot ??= loadBookmarks())
}

// Server (and hydration) render with no bookmarks, then React re-renders with the stored
// ones, so prerendered HTML never mismatches a returning visitor's saved sessions.
function getServerSnapshot() {
  return EMPTY
}

function setBookmarks(next: Set<string>) {
  snapshot = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
  } catch {}
  listeners.forEach((listener) => listener())
}

export function useBookmarks() {
  const bookmarks = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = useCallback((id: string) => {
    const next = new Set(getSnapshot())
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setBookmarks(next)
  }, [])

  const clearAll = useCallback(() => setBookmarks(new Set()), [])

  const isBookmarked = useCallback((id: string) => bookmarks.has(id), [bookmarks])

  return { bookmarks, toggle, clearAll, isBookmarked }
}
