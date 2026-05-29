/**
 * POST /api/patient-profiles
 *
 * Called client-side after a simulation run to enrich the raw event-log
 * patient IDs with realistic synthetic profiles via DeepSeek.
 *
 * Body:
 *   patient_ids  — string[]                     (e.g. ["P1","P2",...])
 *   triage_map   — Record<string,string>         (patient_id → "RED"|"YELLOW"|"BLUE")
 *   profile      — string                        (e.g. "Government Hospital")
 *
 * Response:
 *   { profiles: Record<string, PatientProfile> }
 *
 * Deliberately uses DeepSeek liberally — this is the richest synthetic dataset
 * layer and should produce varied, realistic Indian hospital patients.
 */

import OpenAI from 'openai'
import type { PatientProfile } from '@/lib/types'

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
  baseURL: 'https://api.deepseek.com',
})

// ── Chief-complaint pools per triage level (fallback if DeepSeek fails) ────────

const FALLBACK_COMPLAINTS: Record<string, string[]> = {
  RED: [
    'Acute chest pain with diaphoresis and radiation to left arm',
    'Sudden onset right-sided hemiplegia and aphasia — suspected stroke',
    'Polytrauma following road traffic accident — unstable vitals',
    'Severe respiratory distress with SpO2 78% — suspected pulmonary embolism',
    'Diabetic ketoacidosis with Kussmaul breathing and altered sensorium',
    'Septic shock — source unknown, MAP 55, fever 104°F',
    'Ruptured ectopic pregnancy with intra-abdominal haemorrhage',
    'Severe anaphylaxis after bee sting — stridor and urticaria',
  ],
  YELLOW: [
    'Closed fracture shaft femur after fall from two-wheeler',
    'High-grade fever for 4 days with positive NS1 antigen — dengue suspected',
    'Acute abdomen — rebound tenderness, guarding in right iliac fossa',
    'Head injury with loss of consciousness for 2 minutes — now confused',
    'Snake bite — local swelling, coagulopathy workup in progress',
    'Moderate burns 25% BSA following LPG cylinder blast',
    'Exacerbation of COPD — accessory muscle use, SpO2 88% on air',
    'Acute gastroenteritis with moderate dehydration — unable to hold fluids',
  ],
  BLUE: [
    'Low-grade fever for 2 days, mild sore throat, no respiratory distress',
    'Minor laceration on right palm — wound cleaning and suturing needed',
    'Recurrent back pain, ambulatory, known lumbar disc disease',
    'Prescription refill request for anti-hypertensives — stable BP 140/92',
    'Mild allergic reaction — urticaria on trunk, no respiratory involvement',
    'Cough and cold for 3 days — no fever, mild congestion',
    'Dysuria and frequency since yesterday — uncomplicated UTI suspected',
    'Follow-up wound dressing change — healing laceration, no signs of infection',
  ],
  UNKNOWN: [
    'Presenting complaint unclear — triage assessment in progress',
    'Referred from peripheral centre — records awaited',
  ],
}

const HISTORY_POOL = [
  'Type 2 Diabetes Mellitus on oral medications',
  'Hypertension on amlodipine 5 mg',
  'Ischaemic heart disease — previous PTCA 2018',
  'COPD — ex-smoker, on inhaler therapy',
  'Chronic Kidney Disease Stage 3',
  'Epilepsy on phenytoin',
  'Rheumatoid arthritis on DMARDs',
  'Pulmonary tuberculosis — completed treatment 2021',
  'Hypothyroidism on levothyroxine',
  'Bronchial asthma since childhood',
  'Alcoholic liver disease',
  'Chronic low back pain — known L4-L5 disc prolapse',
  'Previous Caesarean section ×2',
  'Sickle cell disease — known since childhood',
]

function fallbackProfile(id: string, triage: string): PatientProfile {
  const pool = FALLBACK_COMPLAINTS[triage] ?? FALLBACK_COMPLAINTS.UNKNOWN
  const complaint = pool[Math.floor(Math.random() * pool.length)]
  const age = triage === 'RED'
    ? 35 + Math.floor(Math.random() * 40)
    : triage === 'BLUE'
    ? 20 + Math.floor(Math.random() * 50)
    : 25 + Math.floor(Math.random() * 45)

  const histCount = Math.floor(Math.random() * 3)
  const shuffled = [...HISTORY_POOL].sort(() => Math.random() - 0.5)

  return {
    patient_id: id,
    age,
    gender: Math.random() > 0.45 ? 'M' : 'F',
    chief_complaint: complaint,
    arrival_gate: triage === 'RED' ? Math.random() > 0.6 : Math.random() > 0.2,
    history: shuffled.slice(0, histCount),
    vitals: {
      bp:    triage === 'RED' ? `${85 + Math.floor(Math.random() * 30)}/${50 + Math.floor(Math.random() * 20)}`
           : triage === 'YELLOW' ? `${110 + Math.floor(Math.random() * 30)}/${70 + Math.floor(Math.random() * 15)}`
           : `${115 + Math.floor(Math.random() * 25)}/${72 + Math.floor(Math.random() * 12)}`,
      spo2:  triage === 'RED' ? 85 + Math.floor(Math.random() * 10)
           : triage === 'YELLOW' ? 91 + Math.floor(Math.random() * 6)
           : 96 + Math.floor(Math.random() * 3),
      temp:  triage === 'RED' ? 99 + Math.random() * 4
           : triage === 'YELLOW' ? 99 + Math.random() * 2
           : 97.5 + Math.random() * 1.5,
      pulse: triage === 'RED' ? 100 + Math.floor(Math.random() * 40)
           : triage === 'YELLOW' ? 88 + Math.floor(Math.random() * 24)
           : 70 + Math.floor(Math.random() * 20),
    },
    clinical_notes: 'Fallback profile — DeepSeek enrichment unavailable.',
  }
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let patient_ids: string[]              = []
  let triage_map: Record<string, string> = {}
  let profile = 'Government Hospital'

  try {
    const body = await req.json()
    patient_ids = body.patient_ids  ?? []
    triage_map  = body.triage_map   ?? {}
    profile     = body.profile      ?? 'Government Hospital'

    if (patient_ids.length === 0) {
      return Response.json({ profiles: {} })
    }

    // Cap at 40 patients per call to stay within token limits
    const ids = patient_ids.slice(0, 40)

    const triageList = ids
      .map(id => `  ${id}: ${triage_map[id] ?? 'UNKNOWN'}`)
      .join('\n')

    const institutionContext = profile === 'Government Hospital'
      ? 'busy government district hospital in a tier-2 Indian city — high volume, resource-constrained, serving a mixed urban-rural population'
      : profile === 'Private Hospital'
      ? 'mid-sized private hospital in a tier-2 Indian city — moderate volume, better-resourced, serving middle-class urban patients'
      : 'balanced mid-sized hospital in India serving a mixed population'

    const prompt = `You are generating synthetic patient profiles for a hospital governance simulation. This is a ${institutionContext}.

Generate realistic patient profiles for exactly these ${ids.length} patients with their triage levels:
${triageList}

For each patient ID, generate a JSON object with these exact keys:
- patient_id (string, exactly as given above — do not modify)
- age (integer 0-85; include children 1-14, young adults 18-35, middle-aged 40-60, elderly 65+ — vary this significantly)
- gender ("M" or "F" — vary roughly 55% M / 45% F)
- chief_complaint (string, 8-20 words, specific and clinical — NOT generic like "fever" but rather "high-grade fever for 5 days with positive NS1 antigen" — USE Indian epidemiological context: dengue, malaria, enteric fever, TB, road traffic accidents, snakebite, industrial burns, LPG accidents, obstetric emergencies, pesticide poisoning)
- arrival_gate (boolean — false = arrived by ambulance or referred from another facility; RED patients should be 50-70% ambulance)
- history (array of 0-3 specific past medical conditions; empty array for young healthy patients; older patients may have HTN, T2DM, COPD, CAD, CKD, epilepsy, TB completed treatment)
- vitals object with: bp (string "SBP/DBP"), spo2 (integer), temp (float), pulse (integer)
- clinical_notes (string, exactly one sentence from the attending clinician's perspective, present tense)

Triage severity guidance:
- RED: immediately life-threatening — STEMI, massive stroke, respiratory failure, haemorrhagic shock, severe DKA, septic shock, eclampsia, severe poisoning
- YELLOW: urgent but not immediately life-threatening — fractures, moderate infection with systemic signs, moderate head injury, moderate burns, acute abdomen
- BLUE: semi-urgent / non-urgent — minor injuries, mild infections, stable chronic disease exacerbations, routine presentations

Vary the presentations significantly — do not repeat the same complaint type for more than 2 patients.

Return ONLY a single valid JSON object where each key is a patient_id and the value is the profile object. No markdown fences, no explanation, no extra keys.`

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a clinical data generator. Return only valid JSON, no markdown, no explanation.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.85,
      max_tokens: 6000,
      response_format: { type: 'json_object' },
    })

    const raw = response.choices[0].message.content ?? '{}'
    let parsed: Record<string, PatientProfile> = {}

    try {
      parsed = JSON.parse(raw)
    } catch {
      // If top-level parse fails, fall back to per-patient fallbacks
      for (const id of ids) {
        parsed[id] = fallbackProfile(id, triage_map[id] ?? 'UNKNOWN')
      }
      return Response.json({ profiles: parsed, source: 'fallback_parse_error' })
    }

    // Fill any IDs DeepSeek omitted or returned malformed
    for (const id of ids) {
      if (!parsed[id] || typeof parsed[id].age !== 'number') {
        parsed[id] = fallbackProfile(id, triage_map[id] ?? 'UNKNOWN')
      }
      // Ensure required fields are present
      parsed[id].patient_id = id
      if (!Array.isArray(parsed[id].history)) parsed[id].history = []
    }

    return Response.json({ profiles: parsed, source: 'deepseek' })

  } catch (err) {
    // Return fallback profiles rather than a 500 — the floor still works
    const profiles: Record<string, PatientProfile> = {}
    for (const id of patient_ids) {
      profiles[id] = fallbackProfile(id, triage_map[id] ?? 'UNKNOWN')
    }
    return Response.json({ profiles, source: 'fallback_exception', error: String(err) })
  }
}
