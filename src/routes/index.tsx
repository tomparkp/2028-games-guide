import { createFileRoute } from '@tanstack/react-router'

import { sessionDetailQueryOptions, sessionsInfiniteQueryOptions } from '@/lib/session-query'
import { validateSessionSearch } from '@/lib/session-search'

export const Route = createFileRoute('/')({
  validateSearch: validateSessionSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.prefetchInfiniteQuery(sessionsInfiniteQueryOptions(deps))

    if (deps.session) {
      await context.queryClient.prefetchQuery(sessionDetailQueryOptions(deps.session))
    }
  },
  headers: () => ({
    'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
  }),
})

// Component is code-split into `index.lazy.tsx`
