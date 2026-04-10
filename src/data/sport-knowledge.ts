import type { Contender, RelatedNews } from '@/types/session'

import data from './sport-knowledge.json'

export interface SportKnowledge {
  la28Context: string
  venueNotes: Record<string, string>
  eventHighlights: Record<string, string>
  potentialContenders: Contender[]
  relatedNews?: RelatedNews[]
}

export interface SportKnowledgeMeta {
  lastVerified: string
  notes: string
}

const raw = data as Record<string, unknown>
const { _meta, ...sports } = raw

export const SPORT_KNOWLEDGE_META = _meta as SportKnowledgeMeta
export const SPORT_KNOWLEDGE = sports as Record<string, SportKnowledge>
