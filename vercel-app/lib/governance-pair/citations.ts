/**
 * HGR instruments as citations / knowledge.
 *
 * Pack is derived from vault YAML (ids, titles, layer, one-line force,
 * source pointer) plus a handful of SOURCE_FACT graph edges. Axis A/B
 * scores are omitted. UNKNOWN rows stay unknown. Not dumped into GLP/STI.
 */

import pack from './hgr-citation-pack.json'

export interface InstrumentCitation {
  id: string
  title: string
  layer: number[]
  legal_force: string
  one_line_force: string
  source_pointer: string
  pair_key?: string
}

export interface GraphEdgeCitation {
  id: string
  type: string
  from_id: string
  to_id: string
  claim_type: string
}

type PackFile = {
  instruments: InstrumentCitation[]
  edges: GraphEdgeCitation[]
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

export function edgesForCitations(citations: InstrumentCitation[]): GraphEdgeCitation[] {
  const ids = new Set(citations.map((row) => row.id))
  return PACK.edges.filter((edge) => ids.has(edge.from_id) || ids.has(edge.to_id))
}

export function attachCitations(instrumentKeys: string[]): {
  citations: InstrumentCitation[]
  citation_edges: GraphEdgeCitation[]
} {
  const citations = citationsForInstrumentKeys(instrumentKeys)
  return {
    citations,
    citation_edges: edgesForCitations(citations),
  }
}

export function payloadHasAxisScores(value: unknown): boolean {
  return AXIS_LEAK.test(JSON.stringify(value))
}
