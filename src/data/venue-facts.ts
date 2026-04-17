import data from './venue-facts.json'

export interface VenueFacts {
  capacity?: number
  yearBuilt?: number
  location?: string
  iconicMoments?: string
  spectatorExperience?: string
  changes2028?: string
}

export interface VenueFactsMeta {
  lastVerified: string
  notes: string
}

const raw = data as Record<string, unknown>
const { _meta, ...venues } = raw

export const VENUE_FACTS_META = _meta as VenueFactsMeta | undefined
export const VENUE_FACTS = venues as Record<string, VenueFacts>
