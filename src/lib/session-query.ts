import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { PAGE_SIZE, getSessionDetail, getSessionsByIds, getSessionsPage } from '@/data/sessions.rpc'
import {
  routeSearchToFilters,
  routeSearchToSort,
  type SessionRouteSearch,
} from '@/lib/session-search'

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
          limit: PAGE_SIZE,
        },
      }),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    staleTime: 60_000,
  })
}

export function sessionDetailQueryOptions(sessionId: string) {
  return queryOptions({
    queryKey: ['session-detail', sessionId] as const,
    queryFn: () => getSessionDetail({ data: { sessionId } }),
    staleTime: 5 * 60_000,
  })
}

export function bookmarkedSessionsQueryOptions(ids: string[]) {
  const sortedIds = [...ids].sort()

  return queryOptions({
    queryKey: ['bookmarked-sessions', sortedIds] as const,
    queryFn: () => getSessionsByIds({ data: { ids: sortedIds } }),
    staleTime: 60_000,
  })
}
