import { createFileRoute, stripSearchParams } from '@tanstack/react-router'

import {
  SITE_DESCRIPTION,
  SITE_NAME,
  pageHead,
  sessionPageDescription,
  sessionPageTitle,
} from '@/lib/seo'
import { sessionDetailQueryOptions, sessionsInfiniteQueryOptions } from '@/lib/session-query'
import { DEFAULT_FILTERS, DEFAULT_SORT, validateSessionSearch } from '@/lib/session-search'

// The page component is code-split into `index.lazy.tsx`.
export const Route = createFileRoute('/')({
  validateSearch: validateSessionSearch,
  search: {
    middlewares: [
      stripSearchParams({
        ...DEFAULT_FILTERS,
        sortCol: DEFAULT_SORT.col,
        sortDir: DEFAULT_SORT.dir,
      }),
    ],
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await context.queryClient.prefetchInfiniteQuery(sessionsInfiniteQueryOptions(deps))

    if (!deps.session) return { sessionHead: null }

    // `ensureQueryData` (unlike `prefetchQuery`) returns the data, which `head` needs. It still
    // throws on failure, so a failed lookup falls back to the default head instead of erroring.
    const detail = await context.queryClient
      .ensureQueryData(sessionDetailQueryOptions(deps.session))
      .catch(() => null)
    if (!detail) return { sessionHead: null }

    return {
      sessionHead: {
        id: detail.session.id,
        title: sessionPageTitle(detail.session),
        description: sessionPageDescription(detail.session, detail.insights?.summary),
      },
    }
  },
  // Filters and sort don't change what the page is, so they share the home page's canonical
  // URL. Each session drawer is its own page for sharing and search.
  head: ({ loaderData }) => {
    const sessionHead = loaderData?.sessionHead
    return sessionHead
      ? pageHead({
          title: sessionHead.title,
          description: sessionHead.description,
          path: `/?session=${encodeURIComponent(sessionHead.id)}`,
        })
      : pageHead({ title: SITE_NAME, description: SITE_DESCRIPTION, path: '/' })
  },
  headers: () => ({
    'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
  }),
})
