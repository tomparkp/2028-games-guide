import data from './sport-facts.json'

export interface SportFacts {
  gamesContext: string
  parisRecap: string
}

export interface SportFactsMeta {
  lastVerified: string
  notes: string
}

const raw = data as Record<string, unknown>
const { _meta, ...sports } = raw

export const SPORT_FACTS_META = _meta as SportFactsMeta | undefined
export const SPORT_FACTS = sports as Record<string, SportFacts>
