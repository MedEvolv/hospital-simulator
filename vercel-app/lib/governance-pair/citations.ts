/**
 * HGR instruments as citations / knowledge.
 *
 * Pack is derived from the India instrument index, three YAML schema
 * samples, and the axis-scores note for UNKNOWN rows. Axis A/B scores
 * are omitted. The graph is not dumped. Not written into GLP/STI.
 */

import pack from './hgr-citation-pack.json'

export interface InstrumentCitation {
  id: string
  title: string
  layer: number[]
  one_line_force: string
  claim_type: 'INFERENCE' | 'UNKNOWN'
  pair_key?: string
}

type PackFile = {
  instruments: InstrumentCitation[]
}

const PACK = pack as PackFile

const AXIS_LEAK = /regulatory_significance|trajectory_significance/

export function citationPack(): PackFile {
  return PACK
}

export function citationsForInstrumentKeys(keys: string[]): InstrumentCitation[] {
  const wanted = new Set(keys)
  return PACK.instruments.filter((row) => row.pair_key != null && wanted.has(row.pair_key))
}

export function attachCitations(instrumentKeys: string[]): {
  citations: InstrumentCitation[]
} {
  return { citations: citationsForInstrumentKeys(instrumentKeys) }
}

export function payloadHasAxisScores(value: unknown): boolean {
  return AXIS_LEAK.test(JSON.stringify(value))
}
