import { memo } from 'react'

import { cn } from '@/lib/cn'
import { ratingClasses } from '@/lib/tw'

interface ScorePillProps {
  agg: number
  rSig: number
  rExp: number
  rStar: number
  rUniq: number
  rDem: number
  className?: string
}

export const ScorePill = memo(function ScorePill({
  agg,
  rSig,
  rExp,
  rStar,
  rUniq,
  rDem,
  className,
}: ScorePillProps) {
  return (
    <span
      className={cn(ratingClasses(agg), className)}
      title={`Significance ${rSig} · Experience ${rExp} · Star Power ${rStar} · Uniqueness ${rUniq} · Demand ${rDem}`}
    >
      {agg.toFixed(1)}
    </span>
  )
})
