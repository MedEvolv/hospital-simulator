import { NextResponse } from 'next/server'

const MOCK_RESPONSE = {
  run_id: 'mock-001',
  institutional_profile: 'Government Hospital',
  timestamp: '2026-04-25T10:00:00',
  seed: 42,
  performance_scores: {
    patient_safety_score: 61.4,
    patient_experience_score: 54.7,
    staff_stress_score: 38.2,
    ethics_intervention_count: 7,
    system_throughput_index: 72.1,
    institutional_efficacy_score: 58.3,
    interpretation:
      'System throughput was maintained at the cost of staff stress and patient experience. ' +
      'Seven ethical overrides were recorded — above baseline for this profile.',
  },
  moral_reckoning: {
    declared_values: {
      dignity: 0.85,
      equity: 0.80,
      efficiency: 0.70,
      safety: 0.90,
    },
    value_drift: {
      maximum_drift: 0.41,
      average_drift: 0.23,
      primary_misalignment: 'dignity',
      dignity_drift: 0.41,
      equity_drift: 0.28,
      efficiency_drift: 0.12,
      safety_drift: 0.19,
      interpretation:
        'Dignity drift was the largest deviation. The institution declared it as a ' +
        'primary value but consistently deprioritised it under load — a structural ' +
        'pattern, not an individual failure.',
    },
    ethical_debt: {
      current_debt: 312.0,
      interpretation:
        'Ethical debt accrued primarily in ticks 40–80 when triage pressure was highest. ' +
        'It reflects decisions made under constraint, not negligence.',
      category_breakdown: {
        dignity_violations: 140.0,
        equity_shortfalls: 98.0,
        safety_compromises: 74.0,
      },
      accrual_log: [
        { tick: 44, reason: 'Triage override: capacity breach', amount: 42.0 },
        { tick: 61, reason: 'Bed denied: no available room', amount: 38.0 },
        { tick: 77, reason: 'Delayed pain management', amount: 55.0 },
        { tick: 89, reason: 'Repeated triage downgrade', amount: 31.0 },
      ],
    },
    tension_signals: {
      active: {
        active_count: 3,
        types: ['efficiency_vs_dignity', 'equity_vs_throughput', 'safety_vs_capacity'],
      },
      history: [
        { type: 'efficiency_vs_dignity', severity: 0.7, tick: 44, contributing_factors: ['high occupancy', 'understaffing'] },
        { type: 'equity_vs_throughput', severity: 0.5, tick: 61, contributing_factors: ['admission queue', 'private-pay priority'] },
        { type: 'safety_vs_capacity', severity: 0.9, tick: 77, contributing_factors: ['room shortage', 'acuity spike'] },
      ],
    },
    harm_classifications: {
      summary: {
        total_harms_classified: 9,
        forced_count: 4,
        avoidable_count: 5,
        by_type: { delayed_care: 4, dignity_violation: 3, equity_breach: 2 },
      },
      details: [
        {
          harm_type: 'delayed_care',
          justification: 'No available room at time of triage. Capacity was the binding constraint.',
          avoidable_with: null,
          tick: 44,
        },
        {
          harm_type: 'dignity_violation',
          justification: 'Patient held in corridor for 40 minutes without status update.',
          avoidable_with: 'Communication protocol for waiting patients',
          alternative_actions: ['Assign status liaison', 'Implement 15-min check-in rule'],
          tick: 61,
        },
        {
          harm_type: 'delayed_care',
          justification: 'Pain management delayed pending senior sign-off unavailable for 25 minutes.',
          avoidable_with: 'Delegated prescribing protocol',
          tick: 77,
        },
        {
          harm_type: 'equity_breach',
          justification: 'Triage score identical to admitted patient; admission declined due to insurance status.',
          avoidable_with: 'Equity-blind triage enforcement',
          tick: 89,
        },
        {
          harm_type: 'dignity_violation',
          justification: 'Patient family not notified of deterioration for 50 minutes.',
          avoidable_with: 'Family communication standard',
          tick: 95,
        },
      ],
    },
    refusals: {
      summary: { total_refusals: 3 },
      details: [
        {
          reason: 'value_conflict',
          description: 'Automated triage would have admitted by ability-to-pay proxy. Overridden — equity constraint triggered.',
          requires_human: true,
          alternative_suggestions: ['Manual equity review', 'Blind admission queue'],
          tick: 52,
        },
        {
          reason: 'insufficient_context',
          description: 'Discharge decision lacked attending sign-off. Action deferred pending human review.',
          requires_human: true,
          tick: 68,
        },
        {
          reason: 'safety_threshold',
          description: 'Acuity reclassification would have lowered priority without clinical basis. Refused.',
          requires_human: true,
          alternative_suggestions: ['Senior triage review'],
          tick: 91,
        },
      ],
    },
    unavoidable_harm_summary: {
      harms_that_occurred: [
        'Delayed care for 4 patients due to room saturation',
        '1 dignity violation with no alternative given bed shortage',
      ],
      values_not_honored: ['Dignity (0.41 drift)', 'Equity (0.28 drift)'],
      trade_offs_unresolved: [
        'Safety vs. capacity: room shortage forced triage compromise',
        'Efficiency vs. dignity: throughput maintained at cost of corridor waits',
      ],
      summary: '4 of 9 harms were unavoidable given room capacity. 5 were avoidable with protocol or staffing changes.',
      forced_harms: 4,
      avoidable_harms: 5,
    },
  },
  synthesis: {
    insights: [
      {
        type: 'value_drift',
        severity: 'CRITICAL',
        message:
          'Dignity drift reached 0.41 — the highest recorded for this profile. ' +
          'This is a structural pattern: dignity is declared but not resourced.',
        data: { drift_value: 0.41, declared_weight: 0.85 },
      },
      {
        type: 'ethical_debt',
        severity: 'HIGH',
        message:
          '312 units of ethical debt accrued. 45% concentrated in a 37-tick window ' +
          '(ticks 40–77) when occupancy exceeded 90%.',
        data: { total_debt: 312, peak_window: 'ticks 40-77' },
      },
      {
        type: 'refusal_pattern',
        severity: 'MEDIUM',
        message:
          'All 3 refusals required human escalation. The system identified value ' +
          'conflicts it could not resolve autonomously — this is expected and correct.',
        data: { total_refusals: 3, requires_human: 3 },
      },
      {
        type: 'throughput_equity_tension',
        severity: 'INFO',
        message:
          'System throughput index (72.1) was above profile average. ' +
          'The equity-vs-throughput tension signal suggests this came at a distributional cost.',
        data: { throughput_index: 72.1 },
      },
    ],
    recommendation:
      'Prioritise dignity-preserving protocols at high-occupancy thresholds — ' +
      'specifically corridor wait communication and delegated pain management. ' +
      'These are avoidable harms with known mitigation paths.',
    cost_accounting: {
      performance_score: 58.3,
      ethical_debt: 312.0,
      forced_harms: 4,
      avoidable_harms: 5,
      value_drift_average: 0.23,
      value_drift_maximum: 0.41,
      active_tensions: 3,
    },
    critical_question:
      'Your throughput is above average. Your dignity drift is at a four-run high. ' +
      'Is this institution trading dignity for throughput — and if so, has that trade ' +
      'been made consciously?',
  },
  event_log: [
    {
      run_id: 'mock-001', event_id: 'evt-001', timestamp: 12.0, sequence: 1,
      event_type: 'patient_arrival',
      payload: { patient_id: 'P001', acuity: 3, chief_complaint: 'chest pain' },
    },
    {
      run_id: 'mock-001', event_id: 'evt-002', timestamp: 13.5, sequence: 2,
      event_type: 'triage_decision',
      payload: { patient_id: 'P001', triage_score: 2, queue_position: 1, ethical_flag: false },
    },
    {
      run_id: 'mock-001', event_id: 'evt-003', timestamp: 44.0, sequence: 3,
      event_type: 'ethics_intervention',
      payload: {
        patient_id: 'P004', reason: 'value_conflict',
        description: 'Automated triage would have admitted by ability-to-pay proxy.',
        severity: 'HIGH', requires_human: true,
      },
    },
    {
      run_id: 'mock-001', event_id: 'evt-004', timestamp: 52.0, sequence: 4,
      event_type: 'refusal',
      payload: {
        reason: 'value_conflict',
        description: 'Admission declined on equity grounds. Human review requested.',
        severity: 'HIGH', requires_human: true,
      },
    },
    {
      run_id: 'mock-001', event_id: 'evt-005', timestamp: 61.0, sequence: 5,
      event_type: 'harm_event',
      payload: {
        patient_id: 'P007', harm_type: 'dignity_violation',
        description: 'Patient held in corridor 40 min without status update.',
        severity: 'CRITICAL', avoidable: true,
      },
    },
    {
      run_id: 'mock-001', event_id: 'evt-006', timestamp: 77.0, sequence: 6,
      event_type: 'harm_event',
      payload: {
        patient_id: 'P011', harm_type: 'delayed_care',
        description: 'Pain management delayed 25 min pending unavailable sign-off.',
        severity: 'HIGH', avoidable: true,
      },
    },
    {
      run_id: 'mock-001', event_id: 'evt-007', timestamp: 89.0, sequence: 7,
      event_type: 'tension_signal',
      payload: {
        tension_type: 'equity_vs_throughput', severity_score: 0.5,
        description: 'Identical triage score; admission denied on insurance status.',
        severity: 'MEDIUM',
      },
    },
    {
      run_id: 'mock-001', event_id: 'evt-008', timestamp: 110.0, sequence: 8,
      event_type: 'patient_discharge',
      payload: { patient_id: 'P001', outcome: 'stable', length_of_stay: 98.0 },
    },
  ],
  glp_optimal: {
    status: 'optimal',
    total_rooms: 4,
    objective_value: 0.0312,
    deviations: {
      PSS: { target: 1.80, optimal: 1.80, actual: 1.46, d_minus: 0.34, d_plus: 0.0 },
      PES: { target: 1.20, optimal: 1.20, actual: 1.09, d_minus: 0.11, d_plus: 0.0 },
      SSS: { target: 0.60, optimal: 0.60, actual: 0.38, d_minus: 0.22, d_plus: 0.0 },
      STI: { target: 0.40, optimal: 0.40, actual: 0.72, d_minus: 0.0,  d_plus: 0.32 },
    },
    forced_deviations: [
      'PSS: 0.34 unit gap — room capacity is the binding constraint',
    ],
    avoidable_deviations: [
      'SSS: 0.22 unit gap — allocation decision, not a capacity constraint',
      'STI: 0.32 unit gap — allocation decision, not a capacity constraint',
    ],
    eic_note:
      'Ethics Intervention Count: 7 events. ' +
      'EIC is a raw count of ethical override events — it is not an allocation dimension ' +
      'and is excluded from the GLP objective. It provides independent governance signal.',
  },
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  return NextResponse.json({
    ...MOCK_RESPONSE,
    institutional_profile: (body as Record<string, unknown>).profile ?? 'Government Hospital',
    seed: (body as Record<string, unknown>).seed ?? 42,
  })
}
