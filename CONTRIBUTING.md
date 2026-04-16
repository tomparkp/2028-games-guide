# Contributing

## Getting Started

```bash
pnpm install
pnpm dev
```

The dev server runs on port 3000.

## Commands

- `pnpm dev` — Start dev server
- `pnpm build` — Production build
- `pnpm preview` — Preview production build
- `pnpm test` — Run tests with Vitest
- `pnpm generate-content` — Run the AI content + scorecard pipeline (see [Data](#data))

## Data

Session data lives in four JSON files under `src/data/`, committed to the repo and bundled into the worker at build time:

- `sessions.json` — hand-validated source data from the official Session Table (id, sport, venue, date, price, etc.). No generated content.
- `grounding.json` — raw Perplexity output (facts, related news, sources), keyed by session id.
- `writing.json` — Anthropic-authored prose (blurb, contenders), keyed by session id.
- `scoring.json` — ratings + optional full Scorecard (dimension scores with explanations), keyed by session id.

Runtime reads happen in `src/data/sessions.data.server.ts`, which merges the four files at module load.

### Regenerating session content and ratings

`pnpm generate-content` runs the three-stage AI pipeline (grounding → writing → scoring) and updates `grounding.json`, `writing.json`, and `scoring.json` in place. `pnpm refresh <sessionId>` refreshes a single session. Stages can be skipped independently:

```bash
pnpm generate-content --sport="Athletics (Track & Field)"
pnpm generate-content --skip-grounding  # keep existing facts/news, rewrite prose
pnpm refresh ATH04 --skip-grounding --prompt "Tighten the blurb"
```

Regenerated files are committed like any other source — there's no separate deploy step for data. Note that `generate-content` makes paid API calls (Perplexity grounding + Claude writing + Claude scoring for each of ~850 sessions) and costs real money — scope with `--sport=...` to limit spend while developing.

## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes/`.

To add a new route, create a file in `src/routes/` — TanStack will automatically generate the route entry. Use the `Link` component from `@tanstack/react-router` for SPA navigation:

```tsx
import { Link } from '@tanstack/react-router'
;<Link to="/venues">Venues</Link>
```

The root layout lives in `src/routes/__root.tsx`. More info in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Server Functions

TanStack Start provides server functions that integrate with client components:

```tsx
import { createServerFn } from '@tanstack/react-start'

const getServerTime = createServerFn({
  method: 'GET',
}).handler(async () => {
  return new Date().toISOString()
})
```

## Data Fetching

Use the `loader` functionality built into TanStack Router to load data for a route before it renders:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/people')({
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json()
  },
  component: PeopleComponent,
})

function PeopleComponent() {
  const data = Route.useLoaderData()
  return (
    <ul>
      {data.results.map((person) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  )
}
```

More info in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) v4.

## Learn More

- [TanStack documentation](https://tanstack.com)
- [TanStack Start](https://tanstack.com/start)
