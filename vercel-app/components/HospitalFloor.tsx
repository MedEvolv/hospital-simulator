'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import type { SimulationReport, SimEvent, PatientProfile } from '@/lib/types'

const W = 1200
const H = 560
const HDR = 52
const STATS_H = 40
const FLOOR_Y = HDR + STATS_H
const FLOOR_H = H - FLOOR_Y

const TRIAGE_X  = 0
const TRIAGE_W  = 250
const WAITING_X = TRIAGE_W + 18
const WAITING_W = 330
const ROOMS_X   = WAITING_X + WAITING_W + 18
const ROOMS_W   = W - ROOMS_X

const TOKEN_R      = 16
const LABEL_FS     = 13
const FLASH_WINDOW = 60
const BUBBLE_TICKS = 120

// Medical colour palette — light, institutional, readable
const ZONE_BG   = { triage: '#f1f5f9', waiting: '#e2e8f0', room: '#f8fafc' }
const SEP_COLOR = '#cbd5e1'

const TRIAGE_CLR: Record<string, string> = {
  RED: '#dc2626', YELLOW: '#d97706', BLUE: '#2563eb', UNKNOWN: '#64748b',
}

const BUBBLE_BORDER: Record<string, string> = {
  triage: '#94a3b8', admit: '#3b82f6', ethics: '#d97706', discharge: '#16a34a', arrival: '#64748b',
}
const BUBBLE_TEXT_CLR: Record<string, string> = {
  triage: '#475569', admit: '#1d4ed8', ethics: '#92400e', discharge: '#166534', arrival: '#334155',
}

const ROOM_FILL_ER = (load: number, max: number) => {
  if (load === 0) return '#ecfdf5'
  if (load < max) return '#fef3c7'
  return '#fee2e2'
}
const ROOM_STROKE_ER = (load: number, max: number) => {
  if (load === 0) return '#10b981'
  if (load < max) return '#f59e0b'
  return '#ef4444'
}
const ROOM_FILL_OPD = (load: number, max: number) => {
  if (load === 0) return '#eff6ff'
  if (load < max) return '#e0e7ff'
  return '#fce7f3'
}
const ROOM_STROKE_OPD = (load: number, max: number) => {
  if (load === 0) return '#3b82f6'
  if (load < max) return '#6366f1'
  return '#ec4899'
}

type TriageColor = 'RED' | 'YELLOW' | 'BLUE' | 'UNKNOWN'
type Zone = 'triage' | 'waiting' | 'room' | 'gone'

interface PatientViz {
  id: string; zone: Zone; triage: TriageColor; arrivedAt: number; roomName?: string; lastEventType?: string
}
interface PatientBubble {
  text: string; eventTs: number; kind: 'triage' | 'admit' | 'ethics' | 'discharge' | 'arrival'
}
interface RoomDef {
  name: string; label: string; maxOccupancy: number
}
interface FrameState {
  patients: Map<string, PatientViz>
  roomLoads: Map<string, number>
  ethicalFlashes: Array<{ patientId?: string; severity: 'HIGH' | 'CRITICAL' }>
  bubbles: Map<string, PatientBubble>
}
interface HoverTooltip {
  patientId: string; clientX: number; clientY: number
}

function roomsForCapacity(profile: string, erCapacity = 2, opdCapacity = 4): RoomDef[] {
  const rooms: RoomDef[] = []
  const erCap = Math.max(1, Math.min(8, erCapacity))
  const opdCap = Math.max(1, Math.min(12, opdCapacity))
  const erOcc = profile === 'Private Hospital' ? 2 : 1
  const opdOcc = profile === 'Private Hospital' ? 3 : 2
  for (let i = 0; i < erCap; i++) rooms.push({ name: `Emergency ${i + 1}`, label: `ER ${i + 1}`, maxOccupancy: erOcc })
  for (let i = 0; i < opdCap; i++) rooms.push({ name: `OPD ${i + 1}`, label: `OPD ${i + 1}`, maxOccupancy: opdOcc })
  return rooms
}

function roomRect(index: number, total: number) {
  const COLS = 2, GAP = 10
  const rows = Math.ceil(total / COLS)
  const col = index % COLS
  const row = Math.floor(index / COLS)
  const w = Math.floor((ROOMS_W - GAP * (COLS + 1)) / COLS)
  const h = Math.min(120, Math.floor((FLOOR_H - GAP * (rows + 1)) / rows))
  return { x: ROOMS_X + GAP + col * (w + GAP), y: FLOOR_Y + GAP + row * (h + GAP), w, h }
}

function triageSlot(slot: number) {
  const col = slot % 3, row = Math.floor(slot / 3)
  return { x: TRIAGE_X + 42 + col * 80, y: FLOOR_Y + 88 + row * 110 }
}

function waitingSlot(slot: number) {
  const col = slot % 4, row = Math.floor(slot / 4)
  return { x: WAITING_X + 34 + col * 76, y: FLOOR_Y + 88 + row * 90 }
}

function norm(t: string): string { return t.toUpperCase().replace(/[-\s]/g, '_') }

function parseTriageColor(payload: Record<string, unknown>): TriageColor {
  const t = (payload.triage as string | undefined)?.toUpperCase()
  if (t === 'RED') return 'RED'; if (t === 'YELLOW') return 'YELLOW'; if (t === 'BLUE') return 'BLUE'
  const score = Number(payload.triage_score ?? payload.acuity ?? NaN)
  if (!isNaN(score)) { if (score <= 1) return 'RED'; if (score <= 3) return 'YELLOW'; return 'BLUE' }
  const sev = (payload.severity as string | undefined)?.toUpperCase()
  if (sev === 'CRITICAL') return 'RED'; if (sev === 'HIGH') return 'YELLOW'; return 'UNKNOWN'
}

function isEthical(type: string): boolean {
  return ['ETHICS_INTERVENTION', 'HARM_EVENT', 'REFUSAL', 'ESCALATION_SUGGESTED'].some(k => type.includes(k))
}

function flashSeverity(ev: SimEvent): 'HIGH' | 'CRITICAL' | null {
  const sev = (ev.payload.severity as string | undefined)?.toUpperCase()
  const type = norm(ev.event_type)
  if (sev === 'CRITICAL' || type === 'HARM_EVENT') return 'CRITICAL'
  if (sev === 'HIGH' || isEthical(type)) return 'HIGH'
  return null
}

function trunc(s: string, max: number): string { return s.length > max ? s.slice(0, max - 1) + '…' : s }

function formatCurrentEvent(ev: SimEvent, tick: number): string {
  const p = ev.payload as Record<string, unknown>
  const type = norm(ev.event_type)
  const pid = p.patient_id ? String(p.patient_id) : null
  if (type === 'PATIENT_ARRIVAL') return `Tick ${tick} — ${pid ? `Patient ${pid} arrived` : 'Patient arrived'} — acuity ${p.acuity ?? '?'}`
  if (type.includes('TRIAGE') || type === 'TRIAGE_DECISION') return `Tick ${tick} — ${pid ? `Patient ${pid}` : 'Patient'} triaged as ${(p.triage as string ?? '').toUpperCase() || `score ${p.triage_score ?? '?'}`}`
  if (type === 'PATIENT_ADMITTED') return `Tick ${tick} — ${pid ? `Patient ${pid}` : 'Patient'} admitted to ${p.room ?? 'treatment room'}`
  if (type === 'PATIENT_DISCHARGE') return `Tick ${tick} — ${pid ? `Patient ${pid}` : 'Patient'} discharged — outcome: ${p.outcome ?? 'unknown'}`
  if (type === 'ETHICS_INTERVENTION') return `Tick ${tick} — Ethics intervention: ${p.description ?? p.reason ?? 'flagged'}`
  if (type === 'HARM_EVENT') return `Tick ${tick} — Harm: ${String(p.harm_type ?? '').replace(/_/g, ' ')} — ${p.description ?? ''}`
  if (type === 'REFUSAL') return `Tick ${tick} — Refusal: ${p.reason ?? 'escalated'} — human review required`
  return `Tick ${tick} — ${ev.event_type.replace(/_/g, ' ')}`
}

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
        if (color !== 'UNKNOWN') { pat.triage = color; bubbles.set(id, { text: `Triage: ${color}`, eventTs: ev.timestamp, kind: 'triage' }) }
        pat.lastEventType = type
      }
    }
    if (type === 'QUEUE_REORDER' || type === 'QUEUE_ASSIGNMENT') {
      for (const [, pat] of patients) { if (pat.zone === 'triage') { pat.zone = 'waiting'; pat.lastEventType = type } }
    }
    if (type === 'PATIENT_ADMITTED') {
      const id = String(p.patient_id ?? '')
      const pat = patients.get(id)
      if (pat) {
        pat.zone = 'room'; pat.roomName = p.room as string | undefined
        const c = parseTriageColor(p)
        if (c !== 'UNKNOWN') pat.triage = c
        pat.lastEventType = type
        bubbles.set(id, { text: `→ ${(p.room as string) ?? 'treatment'}`, eventTs: ev.timestamp, kind: 'admit' })
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
        bubbles.set(id, { text: `↑ ${String(p.outcome ?? 'discharged')}`, eventTs: ev.timestamp, kind: 'discharge' })
        pat.zone = 'gone'; pat.lastEventType = type
      }
    }
    if (isEthical(type)) {
      const id = p.patient_id != null ? String(p.patient_id) : null
      const desc = String(p.description ?? p.reason ?? 'ethical flag')
      if (id) bubbles.set(id, { text: trunc(desc, 28), eventTs: ev.timestamp, kind: 'ethics' })
      if (ev.timestamp > upTo - FLASH_WINDOW) {
        const sev = flashSeverity(ev)
        if (sev) ethicalFlashes.push({ patientId: id ?? undefined, severity: sev })
      }
    }
  }
  return { patients, roomLoads, ethicalFlashes, bubbles }
}

function renderChatBubble(k: string, cx: number, cy: number, text: string, kind: PatientBubble['kind'], opacity: number) {
  const BW = 148, BH = 26
  const bx = cx - BW / 2, by = cy - TOKEN_R - BH - 10
  const border = BUBBLE_BORDER[kind] ?? BUBBLE_BORDER.triage
  const clr = BUBBLE_TEXT_CLR[kind] ?? BUBBLE_TEXT_CLR.triage
  return (
    <g key={k} opacity={opacity} style={{ pointerEvents: 'none' }}>
      <rect x={bx} y={by} width={BW} height={BH} rx={5} fill="white" stroke={border} strokeWidth={1.5} />
      <polygon points={`${cx - 5},${by + BH} ${cx + 5},${by + BH} ${cx},${by + BH + 8}`} fill="white" stroke={border} strokeWidth={1.5} strokeLinejoin="round" />
      <rect x={cx - 6} y={by + BH - 1} width={12} height={3} fill="white" />
      <text x={bx + BW / 2} y={by + BH / 2 + 4} style={{ fontSize: 11, fill: clr, fontFamily: 'system-ui, sans-serif', textAnchor: 'middle', userSelect: 'none', fontWeight: 500 }}>{text}</text>
    </g>
  )
}

function renderToken(k: string, x: number, y: number, triage: TriageColor, pid: string, flashing: boolean, flashSev?: 'HIGH' | 'CRITICAL', pulse?: boolean, onEnter?: (id: string, cx: number, cy: number) => void, onLeave?: () => void) {
  const fill = TRIAGE_CLR[triage] ?? TRIAGE_CLR.UNKNOWN
  const ring = flashSev === 'CRITICAL' ? '#ef4444' : '#f59e0b'
  const sid = pid.replace(/^([A-Za-z]+)0*(\d+)$/, '$1$2').slice(0, 3)
  return (
    <g key={k} style={{ cursor: 'pointer' }} onMouseEnter={e => onEnter?.(pid, e.clientX, e.clientY)} onMouseLeave={() => onLeave?.()}>
      {flashing && (<circle cx={x} cy={y} r={TOKEN_R + 7} fill="none" stroke={ring} strokeWidth={2} opacity={0.7}><animate attributeName="r" values={`${TOKEN_R + 5};${TOKEN_R + 12};${TOKEN_R + 5}`} dur="0.8s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.8;0.2;0.8" dur="0.8s" repeatCount="indefinite" /></circle>)}
      {pulse && !flashing && (<circle cx={x} cy={y} r={TOKEN_R + 4} fill={fill} opacity={0.15}><animate attributeName="r" values={`${TOKEN_R + 3};${TOKEN_R + 8};${TOKEN_R + 3}`} dur="2.5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.15;0.04;0.15" dur="2.5s" repeatCount="indefinite" /></circle>)}
      <circle cx={x} cy={y} r={TOKEN_R} fill="white" stroke={fill} strokeWidth={2.5} />
      <circle cx={x} cy={y} r={TOKEN_R - 2} fill={fill} opacity={0.9} />
      <text x={x} y={y + LABEL_FS * 0.38} style={{ fontSize: LABEL_FS, fill: '#fff', fontFamily: 'system-ui, sans-serif', textAnchor: 'middle', fontWeight: 700, userSelect: 'none', pointerEvents: 'none' }}>{sid}</text>
    </g>
  )
}

function renderBed(x: number, y: number, occupied: boolean) {
  const w = 18, h = 28
  const fill = occupied ? '#e2e8f0' : 'white'
  const stroke = occupied ? '#94a3b8' : '#cbd5e1'
  return (
    <g key={`b-${x}-${y}`}>
      <rect x={x} y={y} width={w} height={h} rx={3} fill={fill} stroke={stroke} strokeWidth={1} />
      <rect x={x + 2} y={y + 2} width={w - 4} height={6} rx={1.5} fill={occupied ? '#cbd5e1' : '#f1f5f9'} />
      <line x1={x + 2} y1={y + 14} x2={x + w - 2} y2={y + 14} stroke={stroke} strokeWidth={0.8} opacity={0.5} />
    </g>
  )
}

interface RenderProps { frame: FrameState; rooms: RoomDef[]; currentTimestamp: number; maxTimestamp: number; patientsPerHour?: number; patientProfiles?: Record<string, PatientProfile>; onHoverEnter: (id: string, cx: number, cy: number) => void; onHoverLeave: () => void }

function renderFloor({ frame, rooms, currentTimestamp, maxTimestamp, patientsPerHour, patientProfiles, onHoverEnter, onHoverLeave }: RenderProps) {
  const { patients, roomLoads, ethicalFlashes, bubbles } = frame
  const triageP: PatientViz[] = [], waitingP: PatientViz[] = [], roomP = new Map<string, PatientViz[]>()
  for (const pat of patients.values()) { if (pat.zone === 'triage') triageP.push(pat); if (pat.zone === 'waiting') waitingP.push(pat); if (pat.zone === 'room') { const rn = pat.roomName ?? 'unknown'; if (!roomP.has(rn)) roomP.set(rn, []); roomP.get(rn)!.push(pat) } }
  triageP.sort((a, b) => a.arrivedAt - b.arrivedAt); waitingP.sort((a, b) => a.arrivedAt - b.arrivedAt)
  const flashedIds = new Set(ethicalFlashes.flatMap(f => f.patientId ? [f.patientId] : []))
  const globalFlash = ethicalFlashes.find(f => !f.patientId)
  const progress = maxTimestamp > 0 ? (currentTimestamp / maxTimestamp) * W : 0
  const tick = maxTimestamp > 0 ? Math.round(currentTimestamp / 5) : 0
  const totalActive = Array.from(patients.values()).filter(p => p.zone !== 'gone').length
  const totalInRoom = Array.from(patients.values()).filter(p => p.zone === 'room').length
  const erLoad = rooms.filter(r => r.name.startsWith('Emergency')).reduce((s, r) => s + (roomLoads.get(r.name) ?? 0), 0)
  const erMax = rooms.filter(r => r.name.startsWith('Emergency')).reduce((s, r) => s + r.maxOccupancy, 0)
  const opdLoad = rooms.filter(r => r.name.startsWith('OPD')).reduce((s, r) => s + (roomLoads.get(r.name) ?? 0), 0)
  const opdMax = rooms.filter(r => r.name.startsWith('OPD')).reduce((s, r) => s + r.maxOccupancy, 0)

  const els: React.ReactNode[] = []
  els.push(<rect key="bg-t" x={TRIAGE_X} y={FLOOR_Y} width={TRIAGE_W} height={FLOOR_H} fill={ZONE_BG.triage} rx={6} />)
  els.push(<rect key="bg-w" x={WAITING_X} y={FLOOR_Y} width={WAITING_W} height={FLOOR_H} fill={ZONE_BG.waiting} rx={6} />)
  els.push(<rect key="bg-r" x={ROOMS_X} y={FLOOR_Y} width={ROOMS_W} height={FLOOR_H} fill={ZONE_BG.room} rx={6} />)
  els.push(<line key="s1" x1={WAITING_X - 4} y1={FLOOR_Y + 8} x2={WAITING_X - 4} y2={H - 8} stroke={SEP_COLOR} strokeWidth={2} strokeDasharray="6 4" opacity={0.6} />)
  els.push(<line key="s2" x1={ROOMS_X - 4} y1={FLOOR_Y + 8} x2={ROOMS_X - 4} y2={H - 8} stroke={SEP_COLOR} strokeWidth={2} strokeDasharray="6 4" opacity={0.6} />)

  const zs = { fontSize: 18, fontFamily: 'system-ui, sans-serif', textAnchor: 'middle' as const, fontWeight: 700, letterSpacing: 2 }
  els.push(<text key="zl-t" x={TRIAGE_X + TRIAGE_W / 2} y={FLOOR_Y + 26} style={{ ...zs, fill: '#dc2626' }}>TRIAGE</text>)
  els.push(<text key="zl-w" x={WAITING_X + WAITING_W / 2} y={FLOOR_Y + 26} style={{ ...zs, fill: '#d97706' }}>WAITING AREA</text>)
  els.push(<text key="zl-r" x={ROOMS_X + ROOMS_W / 2} y={FLOOR_Y + 26} style={{ ...zs, fill: '#2563eb' }}>TREATMENT ROOMS</text>)

  const sy = HDR; els.push(<rect key="sb" x={0} y={sy} width={W} height={STATS_H} fill="#f1f5f9" />)
  els.push(<line key="ss" x1={0} y1={sy + STATS_H} x2={W} y2={sy + STATS_H} stroke="#cbd5e1" strokeWidth={1} />)
  const si = [{ l: 'ER', v: `${erLoad}/${erMax}`, c: erLoad >= erMax ? '#dc2626' : erLoad > 0 ? '#d97706' : '#16a34a' }, { l: 'OPD', v: `${opdLoad}/${opdMax}`, c: opdLoad >= opdMax ? '#db2777' : opdLoad > 0 ? '#6366f1' : '#3b82f6' }, { l: 'Active', v: String(totalActive), c: '#334155' }, ...(patientsPerHour ? [{ l: 'Pts/hr', v: String(patientsPerHour), c: '#64748b' }] : []), { l: 'Tick', v: String(tick).padStart(4, '0'), c: '#475569' }]
  si.forEach((it, i) => { const sx = 16 + i * 130; els.push(<text key={`sl-${i}`} x={sx} y={sy + STATS_H / 2 - 8} style={{ fontSize: 13, fill: '#475569', fontFamily: 'system-ui, sans-serif', fontWeight: 600 }}>{it.l}</text>); els.push(<text key={`sv-${i}`} x={sx} y={sy + STATS_H / 2 + 12} style={{ fontSize: 16, fill: it.c, fontFamily: 'monospace', fontWeight: 700 }}>{it.v}</text>) })

  rooms.forEach((room, i) => {
    const rect = roomRect(i, rooms.length)
    const load = roomLoads.get(room.name) ?? 0
    const isER = room.name.startsWith('Emergency')
    const fill = isER ? ROOM_FILL_ER(load, room.maxOccupancy) : ROOM_FILL_OPD(load, room.maxOccupancy)
    const stroke = isER ? ROOM_STROKE_ER(load, room.maxOccupancy) : ROOM_STROKE_OPD(load, room.maxOccupancy)
    const accent = isER ? '#dc2626' : '#2563eb'
    els.push(<rect key={`rs-${i}`} x={rect.x + 2} y={rect.y + 2} width={rect.w} height={rect.h} rx={5} fill="#e2e8f0" opacity={0.4} />)
    els.push(<rect key={`rr-${i}`} x={rect.x} y={rect.y} width={rect.w} height={rect.h} fill={fill} stroke={stroke} strokeWidth={2} rx={5} />)
    els.push(<rect key={`ra-${i}`} x={rect.x} y={rect.y} width={rect.w} height={4} fill={accent} rx={2} />)
    const badgeBg = isER ? '#fef2f2' : '#eff6ff'; const badgeTxt = isER ? '#dc2626' : '#2563eb'
    const erIdx = rooms.filter((_, j) => rooms[j].name.startsWith('Emergency') && j <= i).length
    const opdIdx = i - rooms.filter((_, j) => rooms[j].name.startsWith('Emergency') && j <= i).length + 1
    els.push(<rect key={`rb-${i}`} x={rect.x + 8} y={rect.y + 10} width={54} height={20} rx={4} fill={badgeBg} stroke={badgeTxt} strokeWidth={1} opacity={0.8} />)
    els.push(<text key={`rt-${i}`} x={rect.x + 35} y={rect.y + 24} style={{ fontSize: 12, fill: badgeTxt, fontFamily: 'system-ui, sans-serif', textAnchor: 'middle', fontWeight: 700 }}>{isER ? `ER ${erIdx}` : `OPD ${opdIdx}`}</text>)
    els.push(<text key={`rc-${i}`} x={rect.x + rect.w - 10} y={rect.y + 24} style={{ fontSize: 13, fill: stroke, fontFamily: 'monospace', textAnchor: 'end', fontWeight: 700 }}>{load}/{room.maxOccupancy}</text>)
    const bedsRow = 2, bsx = rect.x + 12, bsy = rect.y + 40, bgx = 26, bgy = 34
    for (let b = 0; b < room.maxOccupancy; b++) els.push(renderBed(bsx + (b % bedsRow) * bgx, bsy + Math.floor(b / bedsRow) * bgy, b < load))
    const inRoom = roomP.get(room.name) ?? []
    inRoom.forEach((pat, j) => {
      const px = bsx + (j % bedsRow) * bgx + 9, py = bsy + Math.floor(j / bedsRow) * bgy + 14
      els.push(renderToken(`rp-${pat.id}`, px, py, pat.triage, pat.id, flashedIds.has(pat.id), ethicalFlashes[0]?.severity, false, onHoverEnter, onHoverLeave))
      const bub = bubbles.get(pat.id)
      if (bub) { const age = (currentTimestamp - bub.eventTs) / BUBBLE_TICKS; if (age < 1) { const op = age < 0.65 ? 1 : 1 - (age - 0.65) / 0.35; els.push(renderChatBubble(`brp-${pat.id}`, px, py, bub.kind === 'triage' && patientProfiles?.[pat.id] ? trunc(patientProfiles[pat.id].chief_complaint, 30) : bub.text, bub.kind, op)) } }
    })
  })

  triageP.slice(0, 9).forEach((pat, i) => { const { x, y } = triageSlot(i); els.push(renderToken(`tp-${pat.id}`, x, y, pat.triage, pat.id, flashedIds.has(pat.id) || !!globalFlash, ethicalFlashes[0]?.severity, false, onHoverEnter, onHoverLeave)); const bub = bubbles.get(pat.id); if (bub) { const age = (currentTimestamp - bub.eventTs) / BUBBLE_TICKS; if (age < 1) els.push(renderChatBubble(`btp-${pat.id}`, x, y, bub.kind === 'triage' && patientProfiles?.[pat.id] ? trunc(patientProfiles[pat.id].chief_complaint, 30) : bub.text, bub.kind, age < 0.65 ? 1 : 1 - (age - 0.65) / 0.35)) } })
  if (triageP.length > 9) els.push(<text key="to" x={TRIAGE_X + TRIAGE_W / 2} y={H - 12} style={{ fontSize: 14, fill: '#475569', fontFamily: 'system-ui, sans-serif', textAnchor: 'middle', fontWeight: 600 }}>+{triageP.length - 9} more</text>)

  waitingP.slice(0, 16).forEach((pat, i) => { const { x, y } = waitingSlot(i); els.push(renderToken(`wp-${pat.id}`, x, y, pat.triage, pat.id, flashedIds.has(pat.id) || !!globalFlash, ethicalFlashes[0]?.severity, true, onHoverEnter, onHoverLeave)); const bub = bubbles.get(pat.id); if (bub) { const age = (currentTimestamp - bub.eventTs) / BUBBLE_TICKS; if (age < 1) els.push(renderChatBubble(`bwp-${pat.id}`, x, y, bub.kind === 'triage' && patientProfiles?.[pat.id] ? trunc(patientProfiles[pat.id].chief_complaint, 30) : bub.text, bub.kind, age < 0.65 ? 1 : 1 - (age - 0.65) / 0.35)) } })
  if (waitingP.length > 16) els.push(<text key="wo" x={WAITING_X + WAITING_W / 2} y={H - 12} style={{ fontSize: 14, fill: '#475569', fontFamily: 'system-ui, sans-serif', textAnchor: 'middle', fontWeight: 600 }}>+{waitingP.length - 16} more</text>)

  const cs = { fontSize: 14, fill: '#475569', fontFamily: 'system-ui, sans-serif', textAnchor: 'middle' as const, fontWeight: 600 }
  els.push(<text key="ct" x={TRIAGE_X + TRIAGE_W / 2} y={H - 6} style={cs}>{triageP.length} in triage</text>)
  els.push(<text key="cw" x={WAITING_X + WAITING_W / 2} y={H - 6} style={cs}>{waitingP.length} waiting</text>)
  els.push(<text key="cr" x={ROOMS_X + ROOMS_W / 2} y={H - 6} style={cs}>{totalInRoom} in treatment</text>)
  els.push(<rect key="pb-bg" x={0} y={H - 2} width={W} height={2} fill="#e2e8f0" />)
  els.push(<rect key="pb-f" x={0} y={H - 2} width={progress} height={2} fill="#3b82f6" />)
  return { elements: els, tick }
}

// ── Legend ──────────────────────────────────────────────────────────────────────

function Legend() {
  return (<div className="px-4 py-2.5 border-t border-slate-200 bg-white/60 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-600">
    <span className="font-medium text-slate-500 uppercase tracking-widest text-[10px] self-center">Legend</span>
    <div className="flex items-center gap-5 flex-wrap">
      <LG label="Patients"><Dot color="#dc2626" label="Critical" /><Dot color="#d97706" label="Urgent" /><Dot color="#2563eb" label="Standard" /><Dot color="#64748b" label="Unclassified" /></LG>
      <div className="w-px h-4 bg-slate-200 hidden sm:block" />
      <LG label="Rooms"><Swatch color="#10b981" label="Available" /><Swatch color="#f59e0b" label="Occupied" /><Swatch color="#ef4444" label="Full" /></LG>
      <div className="w-px h-4 bg-slate-200 hidden sm:block" />
      <LG label="Events"><Ring color="#f59e0b" label="HIGH" /><Ring color="#ef4444" label="CRITICAL" /></LG>
    </div>
  </div>)
}
function LG({ label, children }: { label: string; children: React.ReactNode }) { return <div className="flex items-center gap-2"><span className="text-slate-600 text-[10px] uppercase tracking-widest font-medium mr-1">{label}:</span>{children}</div> }
function Dot({ color, label }: { color: string; label: string }) { return <div className="flex items-center gap-1"><svg width={10} height={10}><circle cx={5} cy={5} r={4} fill={color} opacity={0.9} /></svg><span>{label}</span></div> }
function Swatch({ color, label }: { color: string; label: string }) { return <div className="flex items-center gap-1"><svg width={10} height={10}><rect x={1} y={1} width={8} height={8} rx={2} fill="none" stroke={color} strokeWidth={1.5} /></svg><span>{label}</span></div> }
function Ring({ color, label }: { color: string; label: string }) { return <div className="flex items-center gap-1"><svg width={10} height={10}><circle cx={5} cy={5} r={4} fill="none" stroke={color} strokeWidth={1.8} opacity={0.8} /></svg><span>{label}</span></div> }

// ── Sidebar + Tooltip + Main component (unchanged logic) ───────────────────────

function sidebarLabel(ev: SimEvent): string {
  const p = ev.payload as Record<string, unknown>
  const type = norm(ev.event_type)
  if (type === 'ETHICS_INTERVENTION') return String(p.description ?? p.reason ?? 'Ethics intervention')
  if (type === 'HARM_EVENT') return `${String(p.harm_type ?? 'harm').replace(/_/g, ' ')}: ${p.description ?? ''}`
  if (type === 'REFUSAL') return `Refusal — ${p.reason ?? 'escalated'}`
  if (type === 'TENSION_SIGNAL') return `Tension: ${String(p.tension_type ?? '').replace(/_/g, ' ')}`
  return ev.event_type.replace(/_/g, ' ')
}

function sidebarSeverity(ev: SimEvent): 'CRITICAL' | 'HIGH' | 'MED' {
  const s = (ev.payload.severity as string | undefined)?.toUpperCase()
  if (s === 'CRITICAL' || norm(ev.event_type) === 'HARM_EVENT') return 'CRITICAL'
  return 'HIGH'
}

function PatientTooltip({ patient, profile }: { patient: PatientViz; profile?: PatientProfile }) {
  const tc = TRIAGE_CLR[patient.triage] ?? TRIAGE_CLR.UNKNOWN
  if (!profile) return (<div className="space-y-2 min-w-[200px]"><div className="flex items-center justify-between gap-3"><p className="font-medium text-slate-900 text-sm">Patient {patient.id}</p><span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: tc, border: `1px solid ${tc}50`, background: `${tc}15` }}>{patient.triage}</span></div><p className="text-sm text-slate-600">Zone: <span className="text-slate-800 font-medium">{patient.zone}</span></p>{patient.roomName && <p className="text-sm text-slate-600">Room: <span className="text-slate-800 font-medium">{patient.roomName}</span></p>}<p className="text-xs text-slate-500 italic mt-1">Loading profile…</p></div>)
  return (<div className="space-y-3 min-w-[280px] max-w-[320px]"><div className="flex items-start justify-between gap-2"><div><p className="font-bold text-slate-900 text-sm leading-tight">Patient {patient.id}</p><p className="text-xs text-slate-600 mt-1"><span className="text-slate-800 font-semibold">{profile.age}y</span> {profile.gender === 'M' ? '♂ Male' : '♀ Female'} · <span className="text-slate-700">{profile.arrival_gate ? 'Walk-in' : 'Ambulance / referred'}</span></p></div><span className="text-xs font-bold px-2 py-0.5 rounded-md shrink-0" style={{ color: tc, border: `1px solid ${tc}50`, background: `${tc}15` }}>{patient.triage}</span></div><div className="border-t border-slate-200 pt-2.5"><p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Chief complaint</p><p className="text-sm text-slate-900 leading-relaxed font-medium">{profile.chief_complaint}</p></div>{profile.vitals && (<div className="border-t border-slate-200 pt-2.5"><p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Vitals</p><div className="grid grid-cols-2 gap-x-4 gap-y-1.5">{profile.vitals.bp && <p className="text-sm text-slate-800"><span className="text-slate-500 text-xs">BP </span><span className="font-semibold">{profile.vitals.bp}</span></p>}{profile.vitals.spo2 != null && <p className="text-sm font-semibold" style={{ color: profile.vitals.spo2 < 92 ? '#ef4444' : profile.vitals.spo2 < 95 ? '#d97706' : '#16a34a' }}><span className="text-slate-500 font-normal text-xs">SpO₂ </span>{profile.vitals.spo2}%</p>}{profile.vitals.pulse != null && <p className="text-sm text-slate-800"><span className="text-slate-500 text-xs">PR </span><span className="font-semibold">{profile.vitals.pulse}</span></p>}{profile.vitals.temp != null && <p className="text-sm font-semibold" style={{ color: profile.vitals.temp > 101 ? '#d97706' : '#64748b' }}><span className="text-slate-500 font-normal text-xs">Temp </span>{profile.vitals.temp.toFixed(1)}°F</p>}</div></div>)}{profile.history.length > 0 && (<div className="border-t border-slate-200 pt-2.5"><p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Past history</p><ul className="space-y-1">{profile.history.map((h, i) => <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5"><span className="text-slate-400 shrink-0 mt-0.5">·</span><span>{h}</span></li>)}</ul></div>)}{profile.clinical_notes && <div className="border-t border-slate-200 pt-2.5"><p className="text-xs text-slate-500 italic leading-relaxed">&ldquo;{profile.clinical_notes}&rdquo;</p></div>}<div className="border-t border-slate-200 pt-2 flex items-center gap-4"><p className="text-xs text-slate-500">Zone: <span className="text-slate-800 font-medium">{patient.zone}</span></p>{patient.roomName && <p className="text-xs text-slate-500">Room: <span className="text-slate-800 font-medium">{patient.roomName}</span></p>}</div></div>)
}

interface HospitalFloorProps { report: SimulationReport; patientProfiles?: Record<string, PatientProfile>; erCapacity?: number; opdCapacity?: number; patientsPerHour?: number }

export default function HospitalFloor({ report, patientProfiles, erCapacity, opdCapacity, patientsPerHour }: HospitalFloorProps) {
  const events = report.event_log ?? []
  const rooms = roomsForCapacity(report.institutional_profile, erCapacity ?? report.capacity?.er_capacity ?? 2, opdCapacity ?? report.capacity?.opd_capacity ?? 4)
  const pph = patientsPerHour ?? report.capacity?.patients_per_hour
  const sorted = useMemo(() => [...events].sort((a, b) => a.timestamp - b.timestamp), [events])
  const maxTimestamp = sorted.length > 0 ? sorted[sorted.length - 1].timestamp : 0
  const [currentTs, setCurrentTs] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState<0.25 | 0.5 | 1 | 2 | 4>(0.5)
  const [autoPause, setAutoPause] = useState(false)
  const [criticalBanner, setCriticalBanner] = useState<SimEvent | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastRealRef = useRef<number>(Date.now())
  const currentTsRef = useRef(0)
  const autoPauseRef = useRef(false)
  const lastCriticalId = useRef<string | null>(null)
  useEffect(() => { autoPauseRef.current = autoPause }, [autoPause])
  const containerRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<HoverTooltip | null>(null)
  const handleHoverEnter = useCallback((id: string, cx: number, cy: number) => setHover({ patientId: id, clientX: cx, clientY: cy }), [])
  const handleHoverLeave = useCallback(() => setHover(null), [])
  const frame = computeFrame(sorted, currentTs)
  const { elements, tick } = renderFloor({ frame, rooms, currentTimestamp: currentTs, maxTimestamp, patientsPerHour: pph, patientProfiles, onHoverEnter: handleHoverEnter, onHoverLeave: handleHoverLeave })
  const sidebarEvents = useMemo(() => sorted.filter(ev => ev.timestamp <= currentTs && (isEthical(norm(ev.event_type)) || ['HIGH', 'CRITICAL'].includes(String(ev.payload.severity ?? '').toUpperCase()))).slice().reverse().slice(0, 40), [sorted, currentTs])
  const currentEvent = useMemo(() => { const past = sorted.filter(e => e.timestamp <= currentTs); return past.length > 0 ? past[past.length - 1] : null }, [sorted, currentTs])

  const animate = useCallback(() => {
    const now = Date.now(); const dtMs = now - lastRealRef.current; lastRealRef.current = now
    if (maxTimestamp > 0) {
      const advance = (maxTimestamp / 12000) * dtMs * speed; const next = Math.min(currentTsRef.current + advance, maxTimestamp)
      if (autoPauseRef.current) { const critical = sorted.find(ev => ev.timestamp > currentTsRef.current && ev.timestamp <= next && flashSeverity(ev) === 'CRITICAL' && ev.event_id !== lastCriticalId.current); if (critical) { lastCriticalId.current = critical.event_id; currentTsRef.current = critical.timestamp; setCurrentTs(critical.timestamp); setPlaying(false); setCriticalBanner(critical); return } }
      currentTsRef.current = next; setCurrentTs(next); if (next >= maxTimestamp) { setPlaying(false); return }
    }
    rafRef.current = requestAnimationFrame(animate)
  }, [maxTimestamp, speed, sorted])

  useEffect(() => { if (playing) { lastRealRef.current = Date.now(); rafRef.current = requestAnimationFrame(animate) } else { if (rafRef.current) cancelAnimationFrame(rafRef.current) }; return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) } }, [playing, animate])

  function togglePlay() { if (criticalBanner) { setCriticalBanner(null); setPlaying(true); return }; if (!playing && currentTsRef.current >= maxTimestamp) { currentTsRef.current = 0; setCurrentTs(0); lastCriticalId.current = null }; setPlaying(v => !v) }
  function handleScrub(e: React.ChangeEvent<HTMLInputElement>) { const v = Number(e.target.value); currentTsRef.current = v; setCurrentTs(v); setCriticalBanner(null) }
  function jumpToEvent(ev: SimEvent) { currentTsRef.current = ev.timestamp; setCurrentTs(ev.timestamp); setPlaying(false); setCriticalBanner(null) }

  const hoveredPatient = hover ? frame.patients.get(hover.patientId) : null
  const tooltipStyle = hover && containerRef.current ? (() => { const rect = containerRef.current!.getBoundingClientRect(); return { left: Math.min(hover.clientX - rect.left + 14, rect.width - 300), top: Math.max(hover.clientY - rect.top - 80, 8) } })() : null

  if (events.length === 0) return <div className="border border-slate-200 rounded-lg p-6 text-sm text-slate-500 text-center">No event log available — floor visualization requires event data.</div>

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white" ref={containerRef}>
      {criticalBanner && (<div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-0.5">Simulation paused — CRITICAL at tick {Math.round(criticalBanner.timestamp / 5)}</p><p className="text-sm text-red-700">{sidebarLabel(criticalBanner)}</p></div><button onClick={togglePlay} className="text-xs font-semibold text-red-600 border border-red-300 px-3 py-1.5 rounded hover:bg-red-50 transition-colors shrink-0">▶ Continue</button></div>)}
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex-wrap">
        <button onClick={togglePlay} className="text-xs font-semibold text-slate-700 border border-slate-300 px-3 py-1.5 rounded hover:bg-white transition-colors">{playing ? '⏸ Pause' : '▶ Play'}</button>
        <div className="flex items-center gap-1.5"><span className="text-xs text-slate-500 font-medium mr-1">Speed</span>{([0.25, 0.5, 1, 2, 4] as const).map(s => <button key={s} onClick={() => setSpeed(s)} className={`text-xs font-semibold px-2 py-0.5 rounded transition-colors ${speed === s ? 'bg-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>{s}×</button>)}</div>
        <input type="range" min={0} max={maxTimestamp} step={maxTimestamp / 200} value={currentTs} onChange={handleScrub} onMouseDown={() => setPlaying(false)} className="w-36 accent-blue-600" />
        <label className="flex items-center gap-1.5 cursor-pointer ml-auto"><input type="checkbox" checked={autoPause} onChange={e => setAutoPause(e.target.checked)} className="accent-red-500" /><span className="text-xs text-slate-600">Auto-pause CRITICAL</span></label>
        {patientProfiles && Object.keys(patientProfiles).length > 0 && <span className="text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">{Object.keys(patientProfiles).length} profiles</span>}
      </div>
      <div className="flex">
        <div className="flex-1 relative">
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', background: '#ffffff' }} aria-label="Hospital floor simulation — showing triage, waiting area, and treatment rooms">{elements}</svg>
          {hoveredPatient && tooltipStyle && <div className="absolute z-50 bg-white border border-slate-300 rounded-xl px-4 py-3 pointer-events-none shadow-xl" style={tooltipStyle}><PatientTooltip patient={hoveredPatient} profile={patientProfiles?.[hoveredPatient.id]} /></div>}
        </div>
        <div className="w-56 border-l border-slate-200 bg-white flex flex-col shrink-0">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 py-2.5 border-b border-slate-200">Event log</p>
          <div className="overflow-y-auto flex-1" style={{ maxHeight: H }}>{sidebarEvents.length === 0 ? <p className="text-xs text-slate-500 px-3 py-4">No events yet…</p> : sidebarEvents.map((ev, i) => { const sev = sidebarSeverity(ev); return (<button key={ev.event_id + i} onClick={() => jumpToEvent(ev)} className={`w-full text-left px-3 py-2 border-b ${sev === 'CRITICAL' ? 'border-red-100' : 'border-amber-100'} hover:bg-slate-50 transition-colors`}><p className={`text-xs font-semibold ${sev === 'CRITICAL' ? 'text-red-600' : 'text-amber-600'} mb-0.5`}>T:{Math.round(ev.timestamp / 5).toString().padStart(3, '0')} · {sev}</p><p className="text-xs text-slate-700 leading-snug line-clamp-2">{sidebarLabel(ev)}</p></button>) })}</div>
        </div>
      </div>
      <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 min-h-[34px] flex items-center">{currentEvent ? <p className="text-sm text-slate-600 leading-relaxed font-medium">{formatCurrentEvent(currentEvent, tick)}</p> : <p className="text-sm text-slate-400">Awaiting first event…</p>}</div>
      <Legend />
    </div>
  )
}

const LOADING_EVENTS: SimEvent[] = [
  { run_id: 'l', event_id: 'l01', timestamp: 10, sequence: 1, event_type: 'patient_arrival', payload: { patient_id: 'L1', acuity: 1 } },
  { run_id: 'l', event_id: 'l02', timestamp: 22, sequence: 2, event_type: 'patient_arrival', payload: { patient_id: 'L2', acuity: 3 } },
  { run_id: 'l', event_id: 'l03', timestamp: 28, sequence: 3, event_type: 'triage_decision', payload: { patient_id: 'L1', triage_score: 1, triage: 'RED' } },
  { run_id: 'l', event_id: 'l04', timestamp: 38, sequence: 4, event_type: 'patient_arrival', payload: { patient_id: 'L3', acuity: 5 } },
  { run_id: 'l', event_id: 'l05', timestamp: 44, sequence: 5, event_type: 'triage_decision', payload: { patient_id: 'L2', triage_score: 3, triage: 'YELLOW' } },
  { run_id: 'l', event_id: 'l06', timestamp: 52, sequence: 6, event_type: 'ethics_intervention', payload: { patient_id: 'L1', severity: 'HIGH', description: 'Value conflict flagged' } },
  { run_id: 'l', event_id: 'l07', timestamp: 62, sequence: 7, event_type: 'patient_admitted', payload: { patient_id: 'L1', room: 'Emergency 1', triage: 'RED' } },
  { run_id: 'l', event_id: 'l08', timestamp: 72, sequence: 8, event_type: 'triage_decision', payload: { patient_id: 'L3', triage_score: 5, triage: 'BLUE' } },
  { run_id: 'l', event_id: 'l09', timestamp: 82, sequence: 9, event_type: 'patient_admitted', payload: { patient_id: 'L2', room: 'OPD 1', triage: 'YELLOW' } },
  { run_id: 'l', event_id: 'l10', timestamp: 92, sequence: 10, event_type: 'patient_arrival', payload: { patient_id: 'L4', acuity: 2 } },
  { run_id: 'l', event_id: 'l11', timestamp: 100, sequence: 11, event_type: 'patient_discharge', payload: { patient_id: 'L1', outcome: 'stable' } },
  { run_id: 'l', event_id: 'l12', timestamp: 108, sequence: 12, event_type: 'ethics_intervention', payload: { severity: 'CRITICAL', description: 'Capacity breach detected' } },
  { run_id: 'l', event_id: 'l13', timestamp: 118, sequence: 13, event_type: 'patient_admitted', payload: { patient_id: 'L4', room: 'Emergency 2', triage: 'YELLOW' } },
  { run_id: 'l', event_id: 'l14', timestamp: 130, sequence: 14, event_type: 'patient_discharge', payload: { patient_id: 'L2', outcome: 'stable' } },
]
const LOADING_MAX = LOADING_EVENTS[LOADING_EVENTS.length - 1].timestamp

export function HospitalFloorLoading() {
  const rooms = roomsForCapacity('Government Hospital', 2, 4)
  const [currentTs, setCurrentTs] = useState(0)
  const rafRef = useRef<number | null>(null); const lastRealRef = useRef<number>(Date.now()); const currentTsRef = useRef(0)
  const frame = computeFrame(LOADING_EVENTS, currentTs)
  const { elements, tick } = renderFloor({ frame, rooms, currentTimestamp: currentTs, maxTimestamp: LOADING_MAX, onHoverEnter: () => {}, onHoverLeave: () => {} })
  const animate = useCallback(() => { const now = Date.now(); const dtMs = now - lastRealRef.current; lastRealRef.current = now; const advance = (LOADING_MAX / 8000) * dtMs * 2; const next = currentTsRef.current + advance; if (next >= LOADING_MAX) { currentTsRef.current = 0; setCurrentTs(0) } else { currentTsRef.current = next; setCurrentTs(next) }; rafRef.current = requestAnimationFrame(animate) }, [])
  useEffect(() => { lastRealRef.current = Date.now(); rafRef.current = requestAnimationFrame(animate); return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) } }, [animate])
  return (<div className="border border-slate-200 rounded-lg overflow-hidden bg-white"><div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50"><span className="text-xs font-semibold text-slate-500 uppercase tracking-wider animate-pulse">Simulating patient flow…</span><span className="text-xs font-semibold text-slate-500 tabular-nums">T: {String(tick).padStart(4, '0')}</span></div><svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', background: '#ffffff' }} aria-label="Hospital floor simulation running — loading">{elements}</svg><Legend /></div>)
}
