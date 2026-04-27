'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import type { SimulationReport, SimEvent, PatientProfile } from '@/lib/types'

// ── Layout constants (SVG coordinate space) ───────────────────────────────────

const W = 1200
const H = 560
const HDR = 52          // header bar height
const STATS_H = 36      // capacity stats strip below header
const FLOOR_Y = HDR + STATS_H
const FLOOR_H = H - FLOOR_Y

const TRIAGE_X  = 0
const TRIAGE_W  = 250
const SEP1_X    = TRIAGE_W + 8
const WAITING_X = SEP1_X + 10
const WAITING_W = 330
const SEP2_X    = WAITING_X + WAITING_W + 8
const ROOMS_X   = SEP2_X + 10
const ROOMS_W   = W - ROOMS_X

const TOKEN_R      = 20
const LABEL_FS     = 12
const FLASH_WINDOW = 60
const BUBBLE_TICKS = 120  // sim-time units a chat bubble stays visible

// ── Color palette ─────────────────────────────────────────────────────────────

const ZONE_BG   = { triage: '#1e293b', waiting: '#0f172a', room: '#1e293b' }
const SEP_COLOR = '#334155'
const LABEL_CLR = '#64748b'

const TRIAGE_CLR: Record<string, string> = {
  RED:     '#ef4444',
  YELLOW:  '#f59e0b',
  BLUE:    '#60a5fa',
  UNKNOWN: '#475569',
}

const BUBBLE_BORDER: Record<string, string> = {
  triage:    '#334155',
  admit:     '#1e3a5f',
  ethics:    '#7c3c0a',
  discharge: '#14532d',
  arrival:   '#1e293b',
}
const BUBBLE_TEXT_CLR: Record<string, string> = {
  triage:    '#94a3b8',
  admit:     '#93c5fd',
  ethics:    '#fbbf24',
  discharge: '#4ade80',
  arrival:   '#94a3b8',
}

const ROOM_FILL = (load: number, max: number): string => {
  if (load === 0) return '#14532d'
  if (load < max) return '#78350f'
  return '#7f1d1d'
}
const ROOM_STROKE = (load: number, max: number): string => {
  if (load === 0) return '#16a34a'
  if (load < max) return '#d97706'
  return '#dc2626'
}

// ── Types ─────────────────────────────────────────────────────────────────────

type TriageColor = 'RED' | 'YELLOW' | 'BLUE' | 'UNKNOWN'
type Zone = 'triage' | 'waiting' | 'room' | 'gone'

interface PatientViz {
  id: string
  zone: Zone
  triage: TriageColor
  arrivedAt: number
  roomName?: string
  lastEventType?: string
}

interface PatientBubble {
  text: string
  eventTs: number
  kind: 'triage' | 'admit' | 'ethics' | 'discharge' | 'arrival'
}

interface RoomDef {
  name: string
  label: string
  maxOccupancy: number
}

interface FrameState {
  patients: Map<string, PatientViz>
  roomLoads: Map<string, number>
  ethicalFlashes: Array<{ patientId?: string; severity: 'HIGH' | 'CRITICAL' }>
  bubbles: Map<string, PatientBubble>
}

interface HoverTooltip {
  patientId: string
  clientX: number
  clientY: number
}

// ── Room configuration ────────────────────────────────────────────────────────

function roomsForCapacity(
  profile: string,
  erCapacity = 2,
  opdCapacity = 4,
): RoomDef[] {
  const rooms: RoomDef[] = []
  const erCap = Math.max(1, Math.min(8,  erCapacity))
  const opdCap = Math.max(1, Math.min(12, opdCapacity))
  const erOcc = profile === 'Private Hospital' ? 2 : 1
  const opdOcc = profile === 'Private Hospital' ? 3 : 2

  for (let i = 0; i < erCap; i++) {
    rooms.push({ name: `Emergency ${i + 1}`, label: `ER ${i + 1}`, maxOccupancy: erOcc })
  }
  for (let i = 0; i < opdCap; i++) {
    rooms.push({ name: `OPD ${i + 1}`, label: `OPD ${i + 1}`, maxOccupancy: opdOcc })
  }
  return rooms
}

// ── Dynamic room rect (fits any number of rooms into ROOMS_W × FLOOR_H) ──────

function roomRect(index: number, total: number): { x: number; y: number; w: number; h: number } {
  const COLS = 2
  const rows = Math.ceil(total / COLS)
  const col = index % COLS
  const row = Math.floor(index / COLS)
  const GAP = 8
  const w = Math.floor((ROOMS_W - GAP * (COLS + 1)) / COLS)
  const h = Math.min(105, Math.floor((FLOOR_H - GAP * (rows + 1)) / rows))
  return {
    x: ROOMS_X + GAP + col * (w + GAP),
    y: FLOOR_Y + GAP + row * (h + GAP),
    w,
    h,
  }
}

function triageSlot(slot: number): { x: number; y: number } {
  const col = slot % 3
  const row = Math.floor(slot / 3)
  return { x: TRIAGE_X + 42 + col * 80, y: FLOOR_Y + 88 + row * 110 }
}

function waitingSlot(slot: number): { x: number; y: number } {
  const col = slot % 4
  const row = Math.floor(slot / 4)
  return { x: WAITING_X + 34 + col * 76, y: FLOOR_Y + 88 + row * 90 }
}

// ── Event utilities ───────────────────────────────────────────────────────────

function norm(t: string): string { return t.toUpperCase().replace(/[-\s]/g, '_') }

function parseTriageColor(payload: Record<string, unknown>): TriageColor {
  const t = (payload.triage as string | undefined)?.toUpperCase()
  if (t === 'RED')    return 'RED'
  if (t === 'YELLOW') return 'YELLOW'
  if (t === 'BLUE')   return 'BLUE'
  const score = Number(payload.triage_score ?? payload.acuity ?? NaN)
  if (!isNaN(score)) {
    if (score <= 1) return 'RED'
    if (score <= 3) return 'YELLOW'
    return 'BLUE'
  }
  const sev = (payload.severity as string | undefined)?.toUpperCase()
  if (sev === 'CRITICAL') return 'RED'
  if (sev === 'HIGH')     return 'YELLOW'
  return 'UNKNOWN'
}

function isEthical(type: string): boolean {
  return ['ETHICS_INTERVENTION', 'HARM_EVENT', 'REFUSAL', 'ESCALATION_SUGGESTED']
    .some(k => type.includes(k))
}

function flashSeverity(ev: SimEvent): 'HIGH' | 'CRITICAL' | null {
  const sev = (ev.payload.severity as string | undefined)?.toUpperCase()
  const type = norm(ev.event_type)
  if (sev === 'CRITICAL' || type === 'HARM_EVENT') return 'CRITICAL'
  if (sev === 'HIGH' || isEthical(type)) return 'HIGH'
  return null
}

function trunc(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

function formatCurrentEvent(ev: SimEvent, tick: number): string {
  const p = ev.payload as Record<string, unknown>
  const type = norm(ev.event_type)
  const pid = p.patient_id ? String(p.patient_id) : null
  if (type === 'PATIENT_ARRIVAL')
    return `Tick ${tick} — ${pid ? `Patient ${pid} arrived` : 'Patient arrived'} — acuity ${p.acuity ?? '?'}`
  if (type.includes('TRIAGE') || type === 'TRIAGE_DECISION')
    return `Tick ${tick} — ${pid ? `Patient ${pid}` : 'Patient'} triaged as ${(p.triage as string ?? '').toUpperCase() || `score ${p.triage_score ?? '?'}`}`
  if (type === 'PATIENT_ADMITTED')
    return `Tick ${tick} — ${pid ? `Patient ${pid}` : 'Patient'} admitted to ${p.room ?? 'treatment room'}`
  if (type === 'PATIENT_DISCHARGE')
    return `Tick ${tick} — ${pid ? `Patient ${pid}` : 'Patient'} discharged — outcome: ${p.outcome ?? 'unknown'}`
  if (type === 'ETHICS_INTERVENTION')
    return `Tick ${tick} — ⚠ Ethics intervention: ${p.description ?? p.reason ?? 'flagged'}`
  if (type === 'HARM_EVENT')
    return `Tick ${tick} — ● Harm: ${String(p.harm_type ?? '').replace(/_/g, ' ')} — ${p.description ?? ''}`
  if (type === 'REFUSAL')
    return `Tick ${tick} — 🛑 Refusal: ${p.reason ?? 'escalated'} — human review required`
  return `Tick ${tick} — ${ev.event_type.replace(/_/g, ' ')}`
}

// ── computeFrame ──────────────────────────────────────────────────────────────

function computeFrame(events: SimEvent[], upTo: number): FrameState {
  const patients = new Map<string, PatientViz>()
  const roomLoads = new Map<string, number>()
  const ethicalFlashes: FrameState['ethicalFlashes'] = []
  const bubbles = new Map<string, PatientBubble>()

  for (const ev of events) {
    if (ev.timestamp > upTo) break
    const type = norm(ev.event_type)
    const p = ev.payload as Record<string, unknown>

    if (type === 'PATIENT_ARRIVAL') {
      const id = String(p.patient_id ?? ev.event_id)
      patients.set(id, { id, zone: 'triage', triage: 'UNKNOWN', arrivedAt: ev.timestamp, lastEventType: type })
      bubbles.set(id, { text: 'Arrived', eventTs: ev.timestamp, kind: 'arrival' })
    }

    if (type.includes('TRIAGE') || type === 'TRIAGE_DECISION') {
      const id = String(p.patient_id ?? '')
      const pat = patients.get(id)
      if (pat) {
        const color = parseTriageColor(p)
        if (color !== 'UNKNOWN') {
          pat.triage = color
          bubbles.set(id, {
            text: `Triage: ${color}`,
            eventTs: ev.timestamp,
            kind: 'triage',
          })
        }
        pat.lastEventType = type
      }
    }

    if (type === 'QUEUE_REORDER' || type === 'QUEUE_ASSIGNMENT') {
      for (const [, pat] of patients) {
        if (pat.zone === 'triage') { pat.zone = 'waiting'; pat.lastEventType = type }
      }
    }

    if (type === 'PATIENT_ADMITTED') {
      const id = String(p.patient_id ?? '')
      const pat = patients.get(id)
      if (pat) {
        pat.zone = 'room'
        pat.roomName = p.room as string | undefined
        const c = parseTriageColor(p)
        if (c !== 'UNKNOWN') pat.triage = c
        pat.lastEventType = type
        bubbles.set(id, {
          text: `→ ${(p.room as string) ?? 'treatment'}`,
          eventTs: ev.timestamp,
          kind: 'admit',
        })
      }
      const roomName = p.room as string | undefined
      if (roomName) roomLoads.set(roomName, (roomLoads.get(roomName) ?? 0) + 1)
    }

    if (type === 'ROOM_DISCHARGE') {
      const roomName = String(p.room_name ?? p.room_type ?? '')
      if (roomName) roomLoads.set(roomName, Math.max(0, (roomLoads.get(roomName) ?? 0) - 1))
    }

    if (type === 'PATIENT_DISCHARGE') {
      const id = String(p.patient_id ?? '')
      const pat = patients.get(id)
      if (pat) {
        const prev = bubbles.get(id)
        bubbles.set(id, {
          text: `↑ ${String(p.outcome ?? 'discharged')}`,
          eventTs: ev.timestamp,
          kind: 'discharge',
        })
        pat.zone = 'gone'
        pat.lastEventType = type
        void prev
      }
    }

    if (isEthical(type)) {
      const id = p.patient_id != null ? String(p.patient_id) : null
      const desc = String(p.description ?? p.reason ?? 'ethical flag')
      if (id) {
        bubbles.set(id, {
          text: `⚠ ${trunc(desc, 28)}`,
          eventTs: ev.timestamp,
          kind: 'ethics',
        })
      }
      if (ev.timestamp > upTo - FLASH_WINDOW) {
        const sev = flashSeverity(ev)
        if (sev) {
          ethicalFlashes.push({
            patientId: id ?? undefined,
            severity: sev,
          })
        }
      }
    }
  }

  return { patients, roomLoads, ethicalFlashes, bubbles }
}

// ── Chat bubble SVG renderer ──────────────────────────────────────────────────

function renderChatBubble(
  key: string,
  cx: number, cy: number,
  text: string,
  kind: PatientBubble['kind'],
  opacity: number,
): React.ReactNode {
  const BW = 148
  const BH = 26
  const bx = cx - BW / 2
  const by = cy - TOKEN_R - BH - 10
  const border = BUBBLE_BORDER[kind] ?? BUBBLE_BORDER.triage
  const textClr = BUBBLE_TEXT_CLR[kind] ?? BUBBLE_TEXT_CLR.triage

  return (
    <g key={key} opacity={opacity} style={{ pointerEvents: 'none' }}>
      {/* body */}
      <rect x={bx} y={by} width={BW} height={BH} rx={5} fill="#0c1525" stroke={border} strokeWidth={1} />
      {/* tail */}
      <polygon
        points={`${cx - 5},${by + BH} ${cx + 5},${by + BH} ${cx},${by + BH + 8}`}
        fill="#0c1525"
        stroke={border}
        strokeWidth={1}
        strokeLinejoin="round"
      />
      {/* cover tail body join */}
      <rect x={cx - 6} y={by + BH - 1} width={12} height={3} fill="#0c1525" />
      {/* text */}
      <text
        x={bx + BW / 2}
        y={by + BH / 2 + 4}
        style={{
          fontSize: 10,
          fill: textClr,
          fontFamily: 'monospace',
          textAnchor: 'middle' as const,
          userSelect: 'none',
        }}
      >
        {text}
      </text>
    </g>
  )
}

// ── Token renderer ────────────────────────────────────────────────────────────

function renderToken(
  key: string,
  x: number, y: number,
  triage: TriageColor,
  patientId: string,
  flashing: boolean,
  flashSev?: 'HIGH' | 'CRITICAL',
  pulse?: boolean,
  onHoverEnter?: (id: string, cx: number, cy: number) => void,
  onHoverLeave?: () => void,
): React.ReactNode {
  const fill    = TRIAGE_CLR[triage] ?? TRIAGE_CLR.UNKNOWN
  const ringClr = flashSev === 'CRITICAL' ? '#ef4444' : '#f59e0b'
  const shortId = patientId.replace(/^([A-Za-z]+)0*(\d+)$/, '$1$2').slice(0, 3)

  return (
    <g
      key={key}
      style={{ cursor: 'pointer' }}
      onMouseEnter={e => onHoverEnter?.(patientId, e.clientX, e.clientY)}
      onMouseLeave={() => onHoverLeave?.()}
    >
      {flashing && (
        <circle cx={x} cy={y} r={TOKEN_R + 7} fill="none" stroke={ringClr} strokeWidth={2} opacity={0.7}>
          <animate attributeName="r"       values={`${TOKEN_R + 5};${TOKEN_R + 12};${TOKEN_R + 5}`} dur="0.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.2;0.8"                                    dur="0.8s" repeatCount="indefinite" />
        </circle>
      )}
      {pulse && !flashing && (
        <circle cx={x} cy={y} r={TOKEN_R + 4} fill={fill} opacity={0.12}>
          <animate attributeName="r"       values={`${TOKEN_R + 3};${TOKEN_R + 8};${TOKEN_R + 3}`} dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.12;0.03;0.12"                                 dur="2.5s" repeatCount="indefinite" />
        </circle>
      )}
      <circle cx={x} cy={y} r={TOKEN_R} fill={fill} opacity={0.9} />
      <circle cx={x} cy={y} r={TOKEN_R} fill="none" stroke={fill} strokeWidth={1} opacity={0.35} />
      <text
        x={x} y={y + LABEL_FS * 0.38}
        style={{
          fontSize: LABEL_FS,
          fill: '#fff',
          fontFamily: 'monospace',
          textAnchor: 'middle' as const,
          fontWeight: 600,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {shortId}
      </text>
    </g>
  )
}

// ── SVG floor renderer ────────────────────────────────────────────────────────

interface RenderProps {
  frame: FrameState
  rooms: RoomDef[]
  currentTimestamp: number
  maxTimestamp: number
  patientsPerHour?: number
  patientProfiles?: Record<string, PatientProfile>
  onHoverEnter: (id: string, cx: number, cy: number) => void
  onHoverLeave: () => void
}

function renderFloor({
  frame, rooms, currentTimestamp, maxTimestamp,
  patientsPerHour, patientProfiles,
  onHoverEnter, onHoverLeave,
}: RenderProps) {
  const { patients, roomLoads, ethicalFlashes, bubbles } = frame

  const triagePatients:  PatientViz[]              = []
  const waitingPatients: PatientViz[]              = []
  const roomPatients:    Map<string, PatientViz[]> = new Map()

  for (const pat of patients.values()) {
    if (pat.zone === 'triage')  triagePatients.push(pat)
    if (pat.zone === 'waiting') waitingPatients.push(pat)
    if (pat.zone === 'room') {
      const rn = pat.roomName ?? 'unknown'
      if (!roomPatients.has(rn)) roomPatients.set(rn, [])
      roomPatients.get(rn)!.push(pat)
    }
  }

  triagePatients.sort((a, b) => a.arrivedAt - b.arrivedAt)
  waitingPatients.sort((a, b) => a.arrivedAt - b.arrivedAt)

  const flashedIds  = new Set(ethicalFlashes.flatMap(f => f.patientId ? [f.patientId] : []))
  const globalFlash = ethicalFlashes.find(f => !f.patientId)
  const progress    = maxTimestamp > 0 ? (currentTimestamp / maxTimestamp) * W : 0
  const tick        = maxTimestamp > 0 ? Math.round(currentTimestamp / 5) : 0

  const totalActive  = Array.from(patients.values()).filter(p => p.zone !== 'gone').length
  const totalInRoom  = Array.from(patients.values()).filter(p => p.zone === 'room').length
  const erLoad       = rooms.filter(r => r.name.startsWith('Emergency'))
                            .reduce((s, r) => s + (roomLoads.get(r.name) ?? 0), 0)
  const erMax        = rooms.filter(r => r.name.startsWith('Emergency'))
                            .reduce((s, r) => s + r.maxOccupancy, 0)
  const opdLoad      = rooms.filter(r => r.name.startsWith('OPD'))
                            .reduce((s, r) => s + (roomLoads.get(r.name) ?? 0), 0)
  const opdMax       = rooms.filter(r => r.name.startsWith('OPD'))
                            .reduce((s, r) => s + r.maxOccupancy, 0)

  const els: React.ReactNode[] = []

  // ── Zone backgrounds
  els.push(
    <rect key="bg-triage"  x={TRIAGE_X}  y={FLOOR_Y} width={TRIAGE_W}  height={FLOOR_H} fill={ZONE_BG.triage}  rx={3} />,
    <rect key="bg-waiting" x={WAITING_X} y={FLOOR_Y} width={WAITING_W} height={FLOOR_H} fill={ZONE_BG.waiting} rx={3} />,
    <rect key="bg-rooms"   x={ROOMS_X}   y={FLOOR_Y} width={ROOMS_W}   height={FLOOR_H} fill={ZONE_BG.room}    rx={3} />,
  )

  // ── Separators
  els.push(
    <line key="sep1" x1={SEP1_X + 4} y1={FLOOR_Y + 6} x2={SEP1_X + 4} y2={H - 8}
      stroke={SEP_COLOR} strokeWidth={1.5} strokeDasharray="5 4" opacity={0.8} />,
    <line key="sep2" x1={SEP2_X + 4} y1={FLOOR_Y + 6} x2={SEP2_X + 4} y2={H - 8}
      stroke={SEP_COLOR} strokeWidth={1.5} strokeDasharray="5 4" opacity={0.8} />,
  )

  // ── Zone labels
  const zoneStyle = {
    fontSize: 20,
    fill: '#94a3b8',
    fontFamily: 'system-ui, sans-serif',
    textAnchor: 'middle' as const,
    letterSpacing: 3,
    fontWeight: 700,
  }
  els.push(
    <text key="lbl-triage"  x={TRIAGE_X  + TRIAGE_W  / 2} y={FLOOR_Y + 24} style={zoneStyle}>TRIAGE</text>,
    <text key="lbl-waiting" x={WAITING_X + WAITING_W / 2} y={FLOOR_Y + 24} style={zoneStyle}>WAITING</text>,
    <text key="lbl-rooms"   x={ROOMS_X   + ROOMS_W   / 2} y={FLOOR_Y + 24} style={zoneStyle}>TREATMENT</text>,
  )

  // ── Capacity stats strip (below main header, above floor)
  const statsY = HDR
  els.push(
    <rect key="stats-bg" x={0} y={statsY} width={W} height={STATS_H} fill="#0c1525" />,
    <line key="stats-sep" x1={0} y1={statsY + STATS_H} x2={W} y2={statsY + STATS_H}
      stroke={SEP_COLOR} strokeWidth={1} opacity={0.5} />,
  )

  const statItems = [
    { label: 'ER', val: `${erLoad}/${erMax}`,  color: erLoad >= erMax ? '#ef4444' : erLoad > 0 ? '#f59e0b' : '#4ade80' },
    { label: 'OPD', val: `${opdLoad}/${opdMax}`, color: opdLoad >= opdMax ? '#ef4444' : opdLoad > 0 ? '#f59e0b' : '#4ade80' },
    { label: 'Active', val: String(totalActive), color: '#94a3b8' },
    ...(patientsPerHour ? [{ label: 'Pts/hr', val: String(patientsPerHour), color: '#64748b' }] : []),
    { label: 'Tick', val: String(tick).padStart(3, '0'), color: '#475569' },
  ]

  statItems.forEach((item, i) => {
    const sx = 14 + i * 120
    const sy = statsY + STATS_H / 2
    els.push(
      <text key={`si-lbl-${i}`} x={sx} y={sy - 6}
        style={{ fontSize: 9, fill: '#475569', fontFamily: 'monospace', letterSpacing: 1 }}>
        {item.label.toUpperCase()}
      </text>,
      <text key={`si-val-${i}`} x={sx} y={sy + 9}
        style={{ fontSize: 13, fill: item.color, fontFamily: 'monospace', fontWeight: 700 }}>
        {item.val}
      </text>,
    )
  })

  // ── Room rectangles
  rooms.forEach((room, i) => {
    const rect = roomRect(i, rooms.length)
    const load   = roomLoads.get(room.name) ?? 0
    const fill   = ROOM_FILL(load, room.maxOccupancy)
    const stroke = ROOM_STROKE(load, room.maxOccupancy)

    els.push(
      <rect key={`room-${i}`}
        x={rect.x} y={rect.y} width={rect.w} height={rect.h}
        fill={fill} stroke={stroke} strokeWidth={1.5} rx={3} />,
      <text key={`rl-${i}`} x={rect.x + 8} y={rect.y + 15}
        style={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'monospace', letterSpacing: 1 }}>
        {room.label}
      </text>,
      <text key={`rc-${i}`} x={rect.x + rect.w - 8} y={rect.y + 15}
        style={{ fontSize: 10, fill: stroke, fontFamily: 'monospace', textAnchor: 'end' as const }}>
        {load}/{room.maxOccupancy}
      </text>,
    )

    const inRoom = roomPatients.get(room.name) ?? []
    const maxShow = Math.floor((rect.w - 20) / (TOKEN_R * 2 + 8))
    inRoom.slice(0, maxShow).forEach((pat, j) => {
      const px = rect.x + TOKEN_R + 10 + j * (TOKEN_R * 2 + 8)
      const py = rect.y + rect.h / 2 + 8
      els.push(renderToken(
        `rp-${pat.id}`, px, py, pat.triage, pat.id,
        flashedIds.has(pat.id), ethicalFlashes[0]?.severity,
        false, onHoverEnter, onHoverLeave,
      ))
      // bubble
      const bub = bubbles.get(pat.id)
      if (bub) {
        const age = (currentTimestamp - bub.eventTs) / BUBBLE_TICKS
        if (age < 1) {
          const op = age < 0.65 ? 1 : 1 - (age - 0.65) / 0.35
          const text = bub.kind === 'triage' && patientProfiles?.[pat.id]
            ? trunc(patientProfiles[pat.id].chief_complaint, 22)
            : bub.text
          els.push(renderChatBubble(`bub-rp-${pat.id}`, px, py, text, bub.kind, op))
        }
      }
    })
  })

  // ── Triage tokens + bubbles
  triagePatients.slice(0, 9).forEach((pat, i) => {
    const { x, y } = triageSlot(i)
    const flashing = flashedIds.has(pat.id) || (globalFlash != null)
    els.push(renderToken(
      `tp-${pat.id}`, x, y, pat.triage, pat.id,
      flashing, ethicalFlashes[0]?.severity,
      false, onHoverEnter, onHoverLeave,
    ))
    const bub = bubbles.get(pat.id)
    if (bub) {
      const age = (currentTimestamp - bub.eventTs) / BUBBLE_TICKS
      if (age < 1) {
        const op = age < 0.65 ? 1 : 1 - (age - 0.65) / 0.35
        const text = bub.kind === 'triage' && patientProfiles?.[pat.id]
          ? trunc(patientProfiles[pat.id].chief_complaint, 22)
          : bub.text
        els.push(renderChatBubble(`bub-tp-${pat.id}`, x, y, text, bub.kind, op))
      }
    }
  })
  if (triagePatients.length > 9) {
    els.push(
      <text key="t-overflow" x={TRIAGE_X + TRIAGE_W / 2} y={H - 12}
        style={{ fontSize: 10, fill: LABEL_CLR, fontFamily: 'monospace', textAnchor: 'middle' as const }}>
        +{triagePatients.length - 9} more
      </text>
    )
  }

  // ── Waiting tokens + bubbles
  waitingPatients.slice(0, 16).forEach((pat, i) => {
    const { x, y } = waitingSlot(i)
    const flashing = flashedIds.has(pat.id) || (globalFlash != null)
    els.push(renderToken(
      `wp-${pat.id}`, x, y, pat.triage, pat.id,
      flashing, ethicalFlashes[0]?.severity,
      true, onHoverEnter, onHoverLeave,
    ))
    const bub = bubbles.get(pat.id)
    if (bub) {
      const age = (currentTimestamp - bub.eventTs) / BUBBLE_TICKS
      if (age < 1) {
        const op = age < 0.65 ? 1 : 1 - (age - 0.65) / 0.35
        const text = bub.kind === 'triage' && patientProfiles?.[pat.id]
          ? trunc(patientProfiles[pat.id].chief_complaint, 22)
          : bub.text
        els.push(renderChatBubble(`bub-wp-${pat.id}`, x, y, text, bub.kind, op))
      }
    }
  })
  if (waitingPatients.length > 16) {
    els.push(
      <text key="w-overflow" x={WAITING_X + WAITING_W / 2} y={H - 12}
        style={{ fontSize: 10, fill: LABEL_CLR, fontFamily: 'monospace', textAnchor: 'middle' as const }}>
        +{waitingPatients.length - 16} more
      </text>
    )
  }

  // ── Zone counts
  const cntStyle = { fontSize: 11, fill: '#475569', fontFamily: 'monospace', textAnchor: 'middle' as const }
  els.push(
    <text key="cnt-t" x={TRIAGE_X  + TRIAGE_W  / 2} y={H - 6} style={cntStyle}>{triagePatients.length} in triage</text>,
    <text key="cnt-w" x={WAITING_X + WAITING_W / 2} y={H - 6} style={cntStyle}>{waitingPatients.length} waiting</text>,
    <text key="cnt-r" x={ROOMS_X   + ROOMS_W   / 2} y={H - 6} style={cntStyle}>{totalInRoom} in treatment</text>,
  )

  // ── Progress bar
  els.push(
    <rect key="pb-bg"   x={0} y={H - 2} width={W}        height={2} fill="#1e293b" />,
    <rect key="pb-fill" x={0} y={H - 2} width={progress} height={2} fill="#475569" />,
  )

  return { elements: els, tick }
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-900/60 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-400">
      <span className="font-mono text-slate-500 uppercase tracking-widest text-[10px] self-center">Legend</span>
      <div className="flex items-center gap-5 flex-wrap">
        <LegendGroup label="Patients">
          <Dot color="#ef4444" label="Critical (RED)" />
          <Dot color="#f59e0b" label="Urgent (YELLOW)" />
          <Dot color="#60a5fa" label="Standard (BLUE)" />
          <Dot color="#475569" label="Unclassified" />
        </LegendGroup>
        <div className="w-px h-4 bg-slate-700 hidden sm:block" />
        <LegendGroup label="Rooms">
          <Swatch color="#16a34a" label="Available" />
          <Swatch color="#d97706" label="Occupied" />
          <Swatch color="#dc2626" label="Full" />
        </LegendGroup>
        <div className="w-px h-4 bg-slate-700 hidden sm:block" />
        <LegendGroup label="Ethical events">
          <Ring color="#f59e0b" label="HIGH" />
          <Ring color="#ef4444" label="CRITICAL" />
        </LegendGroup>
        <div className="w-px h-4 bg-slate-700 hidden sm:block" />
        <LegendGroup label="Chat bubbles">
          <BubbleSample color="#334155" label="Triage" />
          <BubbleSample color="#1e3a5f" label="Admit" />
          <BubbleSample color="#7c3c0a" label="Ethics" />
          <BubbleSample color="#14532d" label="Discharge" />
        </LegendGroup>
      </div>
    </div>
  )
}

function LegendGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-600 text-[10px] font-mono uppercase tracking-widest mr-1">{label}:</span>
      {children}
    </div>
  )
}
function Dot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <svg width={10} height={10}><circle cx={5} cy={5} r={4} fill={color} opacity={0.9} /></svg>
      <span>{label}</span>
    </div>
  )
}
function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <svg width={10} height={10}><rect x={1} y={1} width={8} height={8} rx={2} fill="none" stroke={color} strokeWidth={1.5} /></svg>
      <span>{label}</span>
    </div>
  )
}
function Ring({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <svg width={10} height={10}><circle cx={5} cy={5} r={4} fill="none" stroke={color} strokeWidth={1.8} opacity={0.8} /></svg>
      <span>{label}</span>
    </div>
  )
}
function BubbleSample({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <svg width={14} height={10}>
        <rect x={1} y={1} width={12} height={7} rx={2} fill="#0c1525" stroke={color} strokeWidth={1} />
      </svg>
      <span>{label}</span>
    </div>
  )
}

// ── Sidebar event entry ────────────────────────────────────────────────────────

function sidebarLabel(ev: SimEvent): string {
  const p = ev.payload as Record<string, unknown>
  const type = norm(ev.event_type)
  if (type === 'ETHICS_INTERVENTION') return String(p.description ?? p.reason ?? 'Ethics intervention')
  if (type === 'HARM_EVENT')          return `${String(p.harm_type ?? 'harm').replace(/_/g, ' ')}: ${p.description ?? ''}`
  if (type === 'REFUSAL')             return `Refusal — ${p.reason ?? 'escalated'}`
  if (type === 'TENSION_SIGNAL')      return `Tension: ${String(p.tension_type ?? '').replace(/_/g, ' ')}`
  return ev.event_type.replace(/_/g, ' ')
}

function sidebarSeverity(ev: SimEvent): 'CRITICAL' | 'HIGH' | 'MED' {
  const s = (ev.payload.severity as string | undefined)?.toUpperCase()
  if (s === 'CRITICAL' || norm(ev.event_type) === 'HARM_EVENT') return 'CRITICAL'
  return 'HIGH'
}

// ── Rich hover tooltip ────────────────────────────────────────────────────────

function PatientTooltip({
  patient,
  profile,
}: {
  patient: PatientViz
  profile?: PatientProfile
}) {
  const triageColor = TRIAGE_CLR[patient.triage] ?? TRIAGE_CLR.UNKNOWN

  if (!profile) {
    // Basic tooltip — profiles still loading
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-slate-100 font-semibold text-sm">Patient {patient.id}</p>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ color: triageColor, border: `1px solid ${triageColor}40` }}>
            {patient.triage}
          </span>
        </div>
        <p className="text-slate-400 text-xs">Zone: <span className="text-slate-200">{patient.zone}</span></p>
        {patient.roomName && (
          <p className="text-slate-400 text-xs">Room: <span className="text-slate-200">{patient.roomName}</span></p>
        )}
        <p className="text-slate-600 text-[10px] italic mt-1">Loading profile…</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5 min-w-[240px] max-w-[280px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-slate-100 font-semibold text-sm leading-tight">
            Patient {patient.id}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {profile.age}y {profile.gender === 'M' ? '♂' : '♀'}
            {' · '}
            <span className="text-slate-300">{profile.arrival_gate ? 'Walk-in' : 'Ambulance / referred'}</span>
          </p>
        </div>
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0"
          style={{ color: triageColor, border: `1px solid ${triageColor}40`, background: `${triageColor}15` }}
        >
          {patient.triage}
        </span>
      </div>

      {/* Chief complaint */}
      <div className="border-t border-slate-700 pt-2">
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Chief complaint</p>
        <p className="text-xs text-slate-200 leading-relaxed">{profile.chief_complaint}</p>
      </div>

      {/* Vitals */}
      {profile.vitals && (
        <div className="border-t border-slate-700 pt-2">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1.5">Vitals</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {profile.vitals.bp && (
              <p className="text-[11px] text-slate-300">
                <span className="text-slate-500">BP </span>{profile.vitals.bp}
              </p>
            )}
            {profile.vitals.spo2 != null && (
              <p className="text-[11px]"
                style={{ color: profile.vitals.spo2 < 92 ? '#ef4444' : profile.vitals.spo2 < 95 ? '#f59e0b' : '#4ade80' }}>
                <span className="text-slate-500">SpO₂ </span>{profile.vitals.spo2}%
              </p>
            )}
            {profile.vitals.pulse != null && (
              <p className="text-[11px] text-slate-300">
                <span className="text-slate-500">PR </span>{profile.vitals.pulse}
              </p>
            )}
            {profile.vitals.temp != null && (
              <p className="text-[11px]"
                style={{ color: profile.vitals.temp > 101 ? '#f59e0b' : '#94a3b8' }}>
                <span className="text-slate-500">Temp </span>{profile.vitals.temp.toFixed(1)}°F
              </p>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {profile.history.length > 0 && (
        <div className="border-t border-slate-700 pt-2">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">History</p>
          <ul className="space-y-0.5">
            {profile.history.map((h, i) => (
              <li key={i} className="text-[11px] text-slate-400 before:content-['·'] before:mr-1.5 before:text-slate-600">
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Clinical notes */}
      {profile.clinical_notes && (
        <div className="border-t border-slate-700 pt-2">
          <p className="text-[11px] text-slate-400 italic leading-relaxed">
            &ldquo;{profile.clinical_notes}&rdquo;
          </p>
        </div>
      )}

      {/* Zone + room */}
      <div className="border-t border-slate-700 pt-1.5 flex items-center gap-3">
        <p className="text-[10px] text-slate-500">
          Zone: <span className="text-slate-300">{patient.zone}</span>
        </p>
        {patient.roomName && (
          <p className="text-[10px] text-slate-500">
            Room: <span className="text-slate-300">{patient.roomName}</span>
          </p>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface HospitalFloorProps {
  report: SimulationReport
  patientProfiles?: Record<string, PatientProfile>
  erCapacity?: number
  opdCapacity?: number
  patientsPerHour?: number
}

export default function HospitalFloor({
  report, patientProfiles, erCapacity, opdCapacity, patientsPerHour,
}: HospitalFloorProps) {
  const events = report.event_log ?? []
  const rooms  = roomsForCapacity(
    report.institutional_profile,
    erCapacity  ?? report.capacity?.er_capacity  ?? 2,
    opdCapacity ?? report.capacity?.opd_capacity ?? 4,
  )
  const pph = patientsPerHour ?? report.capacity?.patients_per_hour

  const sorted = useMemo(
    () => [...events].sort((a, b) => a.timestamp - b.timestamp),
    [events]
  )
  const maxTimestamp = sorted.length > 0 ? sorted[sorted.length - 1].timestamp : 0

  // ── Animation state
  const [currentTs, setCurrentTs]   = useState(0)
  const [playing, setPlaying]       = useState(true)
  const [speed, setSpeed]           = useState<0.25 | 0.5 | 1 | 2 | 4>(0.5)
  const [autoPause, setAutoPause]   = useState(false)
  const [criticalBanner, setCriticalBanner] = useState<SimEvent | null>(null)

  const rafRef          = useRef<number | null>(null)
  const lastRealRef     = useRef<number>(Date.now())
  const currentTsRef    = useRef(0)
  const autoPauseRef    = useRef(false)
  const lastCriticalId  = useRef<string | null>(null)

  useEffect(() => { autoPauseRef.current = autoPause }, [autoPause])

  // ── Hover state
  const containerRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<HoverTooltip | null>(null)

  const handleHoverEnter = useCallback((id: string, cx: number, cy: number) => {
    setHover({ patientId: id, clientX: cx, clientY: cy })
  }, [])
  const handleHoverLeave = useCallback(() => setHover(null), [])

  // ── Derived frame
  const frame = computeFrame(sorted, currentTs)
  const { elements, tick } = renderFloor({
    frame, rooms,
    currentTimestamp: currentTs,
    maxTimestamp,
    patientsPerHour: pph,
    patientProfiles,
    onHoverEnter: handleHoverEnter,
    onHoverLeave: handleHoverLeave,
  })

  // ── Sidebar events
  const sidebarEvents = useMemo(() => {
    return sorted
      .filter(ev =>
        ev.timestamp <= currentTs &&
        (isEthical(norm(ev.event_type)) ||
          ['HIGH', 'CRITICAL'].includes(String(ev.payload.severity ?? '').toUpperCase()))
      )
      .slice().reverse().slice(0, 40)
  }, [sorted, currentTs])

  const currentEvent = useMemo(() => {
    const past = sorted.filter(e => e.timestamp <= currentTs)
    return past.length > 0 ? past[past.length - 1] : null
  }, [sorted, currentTs])

  // ── Animation loop
  const animate = useCallback(() => {
    const now  = Date.now()
    const dtMs = now - lastRealRef.current
    lastRealRef.current = now

    if (maxTimestamp > 0) {
      const advance = (maxTimestamp / 12000) * dtMs * speed
      const next = Math.min(currentTsRef.current + advance, maxTimestamp)

      if (autoPauseRef.current) {
        const critical = sorted.find(
          ev =>
            ev.timestamp > currentTsRef.current &&
            ev.timestamp <= next &&
            flashSeverity(ev) === 'CRITICAL' &&
            ev.event_id !== lastCriticalId.current
        )
        if (critical) {
          lastCriticalId.current = critical.event_id
          currentTsRef.current = critical.timestamp
          setCurrentTs(critical.timestamp)
          setPlaying(false)
          setCriticalBanner(critical)
          return
        }
      }

      currentTsRef.current = next
      setCurrentTs(next)
      if (next >= maxTimestamp) { setPlaying(false); return }
    }
    rafRef.current = requestAnimationFrame(animate)
  }, [maxTimestamp, speed, sorted])

  useEffect(() => {
    if (playing) {
      lastRealRef.current = Date.now()
      rafRef.current = requestAnimationFrame(animate)
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [playing, animate])

  function togglePlay() {
    if (criticalBanner) { setCriticalBanner(null); setPlaying(true); return }
    if (!playing && currentTsRef.current >= maxTimestamp) {
      currentTsRef.current = 0; setCurrentTs(0)
      lastCriticalId.current = null
    }
    setPlaying(v => !v)
  }

  function handleScrub(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value)
    currentTsRef.current = v
    setCurrentTs(v)
    setCriticalBanner(null)
  }

  function jumpToEvent(ev: SimEvent) {
    currentTsRef.current = ev.timestamp
    setCurrentTs(ev.timestamp)
    setPlaying(false)
    setCriticalBanner(null)
  }

  // ── Tooltip position
  const hoveredPatient = hover ? frame.patients.get(hover.patientId) : null
  const tooltipStyle = hover && containerRef.current ? (() => {
    const rect = containerRef.current!.getBoundingClientRect()
    const left = Math.min(hover.clientX - rect.left + 14, rect.width - 300)
    const top  = Math.max(hover.clientY - rect.top  - 80, 8)
    return { left, top }
  })() : null

  if (events.length === 0) {
    return (
      <div className="border border-slate-800 rounded-lg p-6 text-sm text-slate-500 text-center">
        No event log available — floor visualization requires event data.
      </div>
    )
  }

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950" ref={containerRef}>

      {/* ── CRITICAL auto-pause banner ── */}
      {criticalBanner && (
        <div className="bg-red-950/80 border-b border-red-800 px-4 py-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-red-400 uppercase tracking-widest mb-0.5">
              Simulation paused — CRITICAL at tick {Math.round(criticalBanner.timestamp / 5)}
            </p>
            <p className="text-sm text-red-200">{sidebarLabel(criticalBanner)}</p>
          </div>
          <button onClick={togglePlay}
            className="text-xs font-mono text-red-300 border border-red-700 px-3 py-1.5 rounded hover:bg-red-900 transition-colors shrink-0">
            ► Continue
          </button>
        </div>
      )}

      {/* ── Controls bar ── */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-800 bg-slate-900 flex-wrap">
        <button onClick={togglePlay}
          className="text-xs font-mono text-slate-300 border border-slate-700 px-2.5 py-1 rounded hover:bg-slate-800 transition-colors">
          {playing ? '⏸ Pause' : '► Play'}
        </button>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 font-mono mr-1">Speed</span>
          {([0.25, 0.5, 1, 2, 4] as const).map(s => (
            <button key={s} onClick={() => setSpeed(s)}
              className={`text-xs font-mono px-2 py-0.5 rounded transition-colors ${
                speed === s ? 'bg-slate-600 text-slate-100' : 'text-slate-500 hover:text-slate-300'
              }`}>
              {s}×
            </button>
          ))}
        </div>

        <input type="range" min={0} max={maxTimestamp} step={maxTimestamp / 200} value={currentTs}
          onChange={handleScrub} onMouseDown={() => setPlaying(false)}
          className="w-36 accent-slate-500" />

        <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
          <input type="checkbox" checked={autoPause} onChange={e => setAutoPause(e.target.checked)}
            className="accent-red-500" />
          <span className="text-xs text-slate-400">Auto-pause CRITICAL</span>
        </label>

        {patientProfiles && Object.keys(patientProfiles).length > 0 && (
          <span className="text-[10px] font-mono text-emerald-600 border border-emerald-900 px-1.5 py-0.5 rounded">
            {Object.keys(patientProfiles).length} profiles loaded
          </span>
        )}
      </div>

      {/* ── Floor + sidebar ── */}
      <div className="flex">
        {/* SVG floor */}
        <div className="flex-1 relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            style={{ display: 'block', background: '#020617' }}
            aria-label="Hospital floor simulation"
          >
            {elements}
          </svg>

          {/* Rich hover tooltip */}
          {hoveredPatient && tooltipStyle && (
            <div
              className="absolute z-50 bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 pointer-events-none shadow-2xl"
              style={tooltipStyle}
            >
              <PatientTooltip
                patient={hoveredPatient}
                profile={patientProfiles?.[hoveredPatient.id]}
              />
            </div>
          )}
        </div>

        {/* Event log sidebar */}
        <div className="w-52 border-l border-slate-800 bg-slate-900/50 flex flex-col shrink-0">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest px-3 py-2 border-b border-slate-800">
            Event log
          </p>
          <div className="overflow-y-auto flex-1" style={{ maxHeight: H }}>
            {sidebarEvents.length === 0 ? (
              <p className="text-xs text-slate-600 px-3 py-4">No events yet…</p>
            ) : (
              sidebarEvents.map((ev, i) => {
                const sev = sidebarSeverity(ev)
                const color  = sev === 'CRITICAL' ? 'text-red-400'   : 'text-amber-400'
                const border = sev === 'CRITICAL' ? 'border-red-900/50' : 'border-amber-900/40'
                return (
                  <button key={ev.event_id + i} onClick={() => jumpToEvent(ev)}
                    className={`w-full text-left px-3 py-2 border-b ${border} hover:bg-slate-800/60 transition-colors`}>
                    <p className={`text-[10px] font-mono ${color} mb-0.5`}>
                      T:{Math.round(ev.timestamp / 5).toString().padStart(3, '0')} · {sev}
                    </p>
                    <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                      {sidebarLabel(ev)}
                    </p>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Current event display ── */}
      <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/40 min-h-[34px] flex items-center">
        {currentEvent ? (
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            {formatCurrentEvent(currentEvent, tick)}
          </p>
        ) : (
          <p className="text-xs text-slate-600 font-mono">Awaiting first event…</p>
        )}
      </div>

      <Legend />
    </div>
  )
}

// ── Loading animation ─────────────────────────────────────────────────────────

const LOADING_EVENTS: SimEvent[] = [
  { run_id: 'loading', event_id: 'l01', timestamp: 10,  sequence: 1,  event_type: 'patient_arrival',     payload: { patient_id: 'L1', acuity: 1 } },
  { run_id: 'loading', event_id: 'l02', timestamp: 22,  sequence: 2,  event_type: 'patient_arrival',     payload: { patient_id: 'L2', acuity: 3 } },
  { run_id: 'loading', event_id: 'l03', timestamp: 28,  sequence: 3,  event_type: 'triage_decision',     payload: { patient_id: 'L1', triage_score: 1, triage: 'RED' } },
  { run_id: 'loading', event_id: 'l04', timestamp: 38,  sequence: 4,  event_type: 'patient_arrival',     payload: { patient_id: 'L3', acuity: 5 } },
  { run_id: 'loading', event_id: 'l05', timestamp: 44,  sequence: 5,  event_type: 'triage_decision',     payload: { patient_id: 'L2', triage_score: 3, triage: 'YELLOW' } },
  { run_id: 'loading', event_id: 'l06', timestamp: 52,  sequence: 6,  event_type: 'ethics_intervention', payload: { patient_id: 'L1', severity: 'HIGH', description: 'Value conflict flagged' } },
  { run_id: 'loading', event_id: 'l07', timestamp: 62,  sequence: 7,  event_type: 'patient_admitted',    payload: { patient_id: 'L1', room: 'Emergency 1', triage: 'RED' } },
  { run_id: 'loading', event_id: 'l08', timestamp: 72,  sequence: 8,  event_type: 'triage_decision',     payload: { patient_id: 'L3', triage_score: 5, triage: 'BLUE' } },
  { run_id: 'loading', event_id: 'l09', timestamp: 82,  sequence: 9,  event_type: 'patient_admitted',    payload: { patient_id: 'L2', room: 'OPD 1',       triage: 'YELLOW' } },
  { run_id: 'loading', event_id: 'l10', timestamp: 92,  sequence: 10, event_type: 'patient_arrival',     payload: { patient_id: 'L4', acuity: 2 } },
  { run_id: 'loading', event_id: 'l11', timestamp: 100, sequence: 11, event_type: 'patient_discharge',   payload: { patient_id: 'L1', outcome: 'stable' } },
  { run_id: 'loading', event_id: 'l12', timestamp: 108, sequence: 12, event_type: 'ethics_intervention', payload: { severity: 'CRITICAL', description: 'Capacity breach detected' } },
  { run_id: 'loading', event_id: 'l13', timestamp: 118, sequence: 13, event_type: 'patient_admitted',    payload: { patient_id: 'L4', room: 'Emergency 2', triage: 'YELLOW' } },
  { run_id: 'loading', event_id: 'l14', timestamp: 130, sequence: 14, event_type: 'patient_discharge',   payload: { patient_id: 'L2', outcome: 'stable' } },
]
const LOADING_MAX = LOADING_EVENTS[LOADING_EVENTS.length - 1].timestamp

export function HospitalFloorLoading() {
  const rooms = roomsForCapacity('Government Hospital', 2, 4)
  const [currentTs, setCurrentTs] = useState(0)
  const rafRef       = useRef<number | null>(null)
  const lastRealRef  = useRef<number>(Date.now())
  const currentTsRef = useRef(0)

  const frame = computeFrame(LOADING_EVENTS, currentTs)
  const { elements, tick } = renderFloor({
    frame, rooms,
    currentTimestamp: currentTs,
    maxTimestamp: LOADING_MAX,
    onHoverEnter: () => {},
    onHoverLeave: () => {},
  })

  const animate = useCallback(() => {
    const now  = Date.now()
    const dtMs = now - lastRealRef.current
    lastRealRef.current = now
    const advance = (LOADING_MAX / 8000) * dtMs * 2
    const next = currentTsRef.current + advance
    if (next >= LOADING_MAX) { currentTsRef.current = 0; setCurrentTs(0) }
    else { currentTsRef.current = next; setCurrentTs(next) }
    rafRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    lastRealRef.current = Date.now()
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [animate])

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900">
        <span className="text-xs font-mono text-slate-500 tracking-widest animate-pulse">
          SIMULATING PATIENT FLOW…
        </span>
        <span className="text-xs font-mono text-slate-500 tabular-nums">T: {String(tick).padStart(3, '0')}</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block', background: '#020617' }}
        aria-label="Hospital floor simulation running"
      >
        {elements}
      </svg>
      <Legend />
    </div>
  )
}
