import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({})

// Component is code-split into `about.lazy.tsx`
