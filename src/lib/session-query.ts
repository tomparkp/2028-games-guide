import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { PAGE_SIZE, getSessionDetail, getSessionsByIds, getSessionsPage } from '@/data/sessions.rpc'
import {
  routeSearchToFilters,
  routeSearchToSort,
  type SessionRouteSearch,
} from '@/lib/session-search'

// Session data is bundled into each deployment, so it can't change until the next deploy.
// It must never go stale on the client: `/` is served from the CDN cache for up to a day,
// and stale dehydrated data refetches on the first client render, which flips `isFetching`
// during hydration and makes React discard the server HTML (minified error #418).
const DEPLOYMENT_STATIC = Infinity

// The first page is server-rendered into the document, so it stays small: about two
// screens of rows keeps the DOM and the embedded query data light for first paint.
// Infinite scroll then loads full pages.
const FIRST_PAGE_SIZE = 20

export function sessionsInfiniteQueryOptions(search: SessionRouteSearch) {
  const filters = routeSearchToFilters(search)
  const sort = routeSearchToSort(search)

  return infiniteQueryOptions({
    queryKey: ['sessions', filters, sort] as const,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getSessionsPage({
        data: {
          filters,
          sort,
          offset: pageParam,
          limit: pageParam === 0 ? FIRST_PAGE_SIZE : PAGE_SIZE,
        },
      }),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    staleTime: DEPLOYMENT_STATIC,
  })
}

export function sessionDetailQueryOptions(sessionId: string) {
  return queryOptions({
    queryKey: ['session-detail', sessionId] as const,
    queryFn: () => getSessionDetail({ data: { sessionId } }),
    staleTime: DEPLOYMENT_STATIC,
  })
}

export function bookmarkedSessionsQueryOptions(ids: string[]) {
  const sortedIds = [...ids].sort()

  return queryOptions({
    queryKey: ['bookmarked-sessions', sortedIds] as const,
    queryFn: () => getSessionsByIds({ data: { ids: sortedIds } }),
    staleTime: DEPLOYMENT_STATIC,
  })
}
