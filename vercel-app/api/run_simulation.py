"""
Vercel Python serverless endpoint for the Institutional Mirror simulator.

POST /api/run_simulation
Body: { "profile": str, "duration_ticks": int, "seed": int }
Returns: complete simulation report as JSON (includes run_id_db if Supabase is configured)
"""

import sys
import os
import json
import threading
import urllib.request
from http.server import BaseHTTPRequestHandler

# ---------------------------------------------------------------------------
# MOCK MODE — flip to False when deploying with the real engine
# ---------------------------------------------------------------------------
MOCK_MODE = False

MOCK_RESPONSE = {
    "run_id": "mock-001",
    "institutional_profile": "Government Hospital",
    "timestamp": "2026-04-25T10:00:00",
    "seed": 42,
    "performance_scores": {
        "patient_safety_score": 61.4,
        "patient_experience_score": 54.7,
        "staff_stress_score": 38.2,
        "ethics_intervention_count": 7,
        "system_throughput_index": 72.1,
        # RULE-A1: no composite institutional_efficacy_score in the payload.
        "interpretation": (
            "System throughput was maintained at the cost of staff stress and patient experience. "
            "Seven ethical overrides were recorded — above baseline for this profile."
        ),
    },
    "moral_reckoning": {
        "declared_values": {
            "dignity": 0.85,
            "equity": 0.80,
            "efficiency": 0.70,
            "safety": 0.90,
        },
        "value_drift": {
            "maximum_drift": 0.41,
            "average_drift": 0.23,
            "primary_misalignment": "dignity",
            "dignity_drift": 0.41,
            "equity_drift": 0.28,
            "efficiency_drift": 0.12,
            "safety_drift": 0.19,
            "interpretation": (
                "Dignity drift was the largest deviation. The institution declared it as a "
                "primary value but consistently deprioritised it under load — a structural "
                "pattern, not an individual failure."
            ),
        },
        "ethical_debt": {
            "current_debt": 312.0,
            "interpretation": (
                "Ethical debt accrued primarily in ticks 40–80 when triage pressure was highest. "
                "It reflects decisions made under constraint, not negligence."
            ),
            "category_breakdown": {
                "dignity_violations": 140.0,
                "equity_shortfalls": 98.0,
                "safety_compromises": 74.0,
            },
            "accrual_log": [
                {"tick": 44, "reason": "Triage override: capacity breach", "amount": 42.0},
                {"tick": 61, "reason": "Bed denied: no available room", "amount": 38.0},
                {"tick": 77, "reason": "Delayed pain management", "amount": 55.0},
                {"tick": 89, "reason": "Repeated triage downgrade", "amount": 31.0},
            ],
        },
        "tension_signals": {
            "active": {"active_count": 3, "types": ["efficiency_vs_dignity", "equity_vs_throughput", "safety_vs_capacity"]},
            "history": [
                {"type": "efficiency_vs_dignity", "severity": 0.7, "tick": 44, "contributing_factors": ["high occupancy", "understaffing"]},
                {"type": "equity_vs_throughput", "severity": 0.5, "tick": 61, "contributing_factors": ["admission queue", "private-pay priority"]},
                {"type": "safety_vs_capacity", "severity": 0.9, "tick": 77, "contributing_factors": ["room shortage", "acuity spike"]},
            ],
        },
        "harm_classifications": {
            "summary": {
                "total_harms_classified": 9,
                "forced_count": 4,
                "avoidable_count": 5,
                "by_type": {
                    "delayed_care": 4,
                    "dignity_violation": 3,
                    "equity_breach": 2,
                },
            },
            "details": [
                {
                    "harm_type": "delayed_care",
                    "justification": "No available room at time of triage. Capacity was the binding constraint.",
                    "avoidable_with": None,
                    "tick": 44,
                },
                {
                    "harm_type": "dignity_violation",
                    "justification": "Patient held in corridor for 40 minutes without status update.",
                    "avoidable_with": "Communication protocol for waiting patients",
                    "alternative_actions": ["Assign status liaison", "Implement 15-min check-in rule"],
                    "tick": 61,
                },
                {
                    "harm_type": "delayed_care",
                    "justification": "Pain management delayed pending senior sign-off unavailable for 25 minutes.",
                    "avoidable_with": "Delegated prescribing protocol",
                    "tick": 77,
                },
                {
                    "harm_type": "equity_breach",
                    "justification": "Triage score identical to admitted patient; admission declined due to insurance status.",
                    "avoidable_with": "Equity-blind triage enforcement",
                    "tick": 89,
                },
                {
                    "harm_type": "dignity_violation",
                    "justification": "Patient family not notified of deterioration for 50 minutes.",
                    "avoidable_with": "Family communication standard",
                    "tick": 95,
                },
            ],
        },
        "refusals": {
            "summary": {"total_refusals": 3},
            "details": [
                {
                    "reason": "value_conflict",
                    "description": "Automated triage would have admitted by ability-to-pay proxy. Overridden — equity constraint triggered.",
                    "requires_human": True,
                    "alternative_suggestions": ["Manual equity review", "Blind admission queue"],
                    "tick": 52,
                },
                {
                    "reason": "insufficient_context",
                    "description": "Discharge decision lacked attending sign-off. Action deferred pending human review.",
                    "requires_human": True,
                    "tick": 68,
                },
                {
                    "reason": "safety_threshold",
                    "description": "Acuity reclassification would have lowered priority without clinical basis. Refused.",
                    "requires_human": True,
                    "alternative_suggestions": ["Senior triage review"],
                    "tick": 91,
                },
            ],
        },
        "unavoidable_harm_summary": {
            "harms_that_occurred": [
                "Delayed care for 4 patients due to room saturation",
                "1 dignity violation with no alternative given bed shortage",
            ],
            "values_not_honored": [
                "Dignity (0.41 drift)",
                "Equity (0.28 drift)",
            ],
            "trade_offs_unresolved": [
                "Safety vs. capacity: room shortage forced triage compromise",
                "Efficiency vs. dignity: throughput maintained at cost of corridor waits",
            ],
            "summary": (
                "4 of 9 harms were unavoidable given room capacity. "
                "5 were avoidable with protocol or staffing changes."
            ),
            "forced_harms": 4,
            "avoidable_harms": 5,
        },
    },
    "synthesis": {
        "insights": [
            {
                "type": "value_drift",
                "severity": "CRITICAL",
                "message": (
                    "Dignity drift reached 0.41 — the highest recorded for this profile. "
                    "This is a structural pattern: dignity is declared but not resourced."
                ),
                "data": {"drift_value": 0.41, "declared_weight": 0.85},
            },
            {
                "type": "ethical_debt",
                "severity": "HIGH",
                "message": (
                    "312 units of ethical debt accrued. 45% concentrated in a 37-tick window "
                    "(ticks 40–77) when occupancy exceeded 90%."
                ),
                "data": {"total_debt": 312, "peak_window": "ticks 40-77"},
            },
            {
                "type": "refusal_pattern",
                "severity": "MEDIUM",
                "message": (
                    "All 3 refusals required human escalation. The system identified value "
                    "conflicts it could not resolve autonomously — this is expected and correct."
                ),
                "data": {"total_refusals": 3, "requires_human": 3},
            },
            {
                "type": "throughput_equity_tension",
                "severity": "INFO",
                "message": (
                    "System throughput index (72.1) was above profile average. "
                    "The equity-vs-throughput tension signal suggests this came at a distributional cost."
                ),
                "data": {"throughput_index": 72.1},
            },
        ],
        "recommendation": (
            "Prioritise dignity-preserving protocols at high-occupancy thresholds — "
            "specifically corridor wait communication and delegated pain management. "
            "These are avoidable harms with known mitigation paths."
        ),
        "cost_accounting": {
            # RULE-A1: no composite performance/efficacy score in the payload.
            "ethical_debt": 312.0,
            "forced_harms": 4,
            "avoidable_harms": 5,
            "value_drift_average": 0.23,
            "value_drift_maximum": 0.41,
            "active_tensions": 3,
        },
        "critical_question": (
            "Your throughput is above average. Your dignity drift is at a four-run high. "
            "Is this institution trading dignity for throughput — and if so, has that trade "
            "been made consciously?"
        ),
    },
    "event_log": [
        {
            "run_id": "mock-001", "event_id": "evt-001", "timestamp": 12.0, "sequence": 1,
            "event_type": "patient_arrival",
            "payload": {"patient_id": "P001", "acuity": 3, "chief_complaint": "chest pain"},
        },
        {
            "run_id": "mock-001", "event_id": "evt-002", "timestamp": 13.5, "sequence": 2,
            "event_type": "triage_decision",
            "payload": {"patient_id": "P001", "triage_score": 2, "queue_position": 1, "ethical_flag": False},
        },
        {
            "run_id": "mock-001", "event_id": "evt-003", "timestamp": 44.0, "sequence": 3,
            "event_type": "ethics_intervention",
            "payload": {
                "patient_id": "P004", "reason": "value_conflict",
                "description": "Automated triage would have admitted by ability-to-pay proxy.",
                "severity": "HIGH", "requires_human": True,
            },
        },
        {
            "run_id": "mock-001", "event_id": "evt-004", "timestamp": 52.0, "sequence": 4,
            "event_type": "refusal",
            "payload": {
                "reason": "value_conflict",
                "description": "Admission declined on equity grounds. Human review requested.",
                "severity": "HIGH", "requires_human": True,
            },
        },
        {
            "run_id": "mock-001", "event_id": "evt-005", "timestamp": 61.0, "sequence": 5,
            "event_type": "harm_event",
            "payload": {
                "patient_id": "P007", "harm_type": "dignity_violation",
                "description": "Patient held in corridor 40 min without status update.",
                "severity": "CRITICAL", "avoidable": True,
            },
        },
        {
            "run_id": "mock-001", "event_id": "evt-006", "timestamp": 77.0, "sequence": 6,
            "event_type": "harm_event",
            "payload": {
                "patient_id": "P011", "harm_type": "delayed_care",
                "description": "Pain management delayed 25 min pending unavailable sign-off.",
                "severity": "HIGH", "avoidable": True,
            },
        },
        {
            "run_id": "mock-001", "event_id": "evt-007", "timestamp": 89.0, "sequence": 7,
            "event_type": "tension_signal",
            "payload": {
                "tension_type": "equity_vs_throughput", "severity_score": 0.5,
                "description": "Identical triage score; admission denied on insurance status.",
                "severity": "MEDIUM",
            },
        },
        {
            "run_id": "mock-001", "event_id": "evt-008", "timestamp": 110.0, "sequence": 8,
            "event_type": "patient_discharge",
            "payload": {"patient_id": "P001", "outcome": "stable", "length_of_stay": 98.0},
        },
    ],
    "glp_optimal": {
        "status": "optimal",
        "total_rooms": 4,
        "objective_value": 0.0312,
        "deviations": {
            "PSS": {"target": 1.80, "optimal": 1.80, "actual": 1.46, "d_minus": 0.34, "d_plus": 0.0},
            "PES": {"target": 1.20, "optimal": 1.20, "actual": 1.09, "d_minus": 0.11, "d_plus": 0.0},
            "SSS": {"target": 0.60, "optimal": 0.60, "actual": 0.38, "d_minus": 0.22, "d_plus": 0.0},
            "STI": {"target": 0.40, "optimal": 0.40, "actual": 0.72, "d_minus": 0.0,  "d_plus": 0.32},
        },
        "forced_deviations": [
            "PSS: 0.34 unit gap — room capacity is the binding constraint",
        ],
        "avoidable_deviations": [
            "SSS: 0.22 unit gap — allocation decision, not a capacity constraint",
            "STI: 0.32 unit gap — allocation decision, not a capacity constraint",
        ],
        "eic_note": (
            "Ethics Intervention Count: 7 events. "
            "EIC is a raw count of ethical override events — it is not an allocation dimension "
            "and is excluded from the GLP objective. It provides independent governance signal."
        ),
    },
}
# ---------------------------------------------------------------------------

# Ensure co-located engine files are importable
sys.path.insert(0, os.path.dirname(__file__))

# Room counts are profile-specific — derived from SimulationState._initialize_rooms().
# InstitutionalParameters has no total_rooms field; this lookup lives here only.
PROFILE_ROOM_COUNTS = {
    "Government Hospital": 4,
    "Private Hospital": 5,
    "Balanced": 5,
}

VALID_PROFILES = set(PROFILE_ROOM_COUNTS.keys())


# ---------------------------------------------------------------------------
# Supabase helpers — all wrapped in try/except so DB unavailability never
# breaks the simulation response.
# ---------------------------------------------------------------------------

def _service_key() -> str:
    return (
        os.environ.get('SUPABASE_SERVICE_KEY', '').strip()
        or os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '').strip()
    )


def _supabase_url() -> str:
    return (
        os.environ.get('SUPABASE_URL', '').strip()
        or os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '').strip()
    )


def _supabase_configured() -> bool:
    """True when a URL and either service-key name is present. Keep both names."""
    url = _supabase_url()
    key = _service_key()
    if not url or not key:
        print("SUPABASE NOT CONFIGURED: URL or service key missing. "
              "Config fetch skipped. Set SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY.")
        return False
    return True


def _fetch_sim_config() -> dict:
    """Return live simulation_config key-value pairs, or {} on any error."""
    if not _supabase_configured():
        return {}
    try:
        from supabase import create_client
        sb = create_client(_supabase_url(), _service_key())
        rows = sb.table('simulation_config').select('key, value').execute()
        return {r['key']: r['value'] for r in (rows.data or [])}
    except Exception as e:
        import traceback
        print(f"SUPABASE CONFIG ERROR: {e}")
        print(traceback.format_exc())
        return {}


def _persist_run(profile: str, duration_ticks: int, seed: int,
                 result: dict, event_log: list, survey_data: dict | None = None) -> str | None:
    """Python hop returns a report only. OTP persist lives in TypeScript runs-db."""
    return None


def _build_declared_values(profile: str, survey_data: dict):
    """
    Map survey answers onto DeclaredValues so that value drift measures the gap
    between what *this institution* said it stands for and what the simulation
    observed — not the gap against a generic profile default.

    We only import DeclaredValues inside the handler path so that the module
    import doesn't fail if survey_data is absent.
    """
    from moral_reckoning import DeclaredValues

    # Profile defaults — mirrors _default_declared_values in integrated_engine.py
    profile_defaults = {
        'Government Hospital': dict(patient_dignity=0.85, fairness=0.95, transparency=0.90, safety_primacy=1.0, staff_welfare=0.65),
        'Private Hospital':    dict(patient_dignity=0.90, fairness=0.70, transparency=0.85, safety_primacy=1.0, staff_welfare=0.75),
    }.get(profile, dict(patient_dignity=0.90, fairness=0.80, transparency=0.95, safety_primacy=1.0, staff_welfare=0.70))

    d = dict(profile_defaults)

    # values_priority: the user's stated value to prioritise under pressure
    vp = survey_data.get('values_priority', '')
    if vp == 'dignity_first':
        d['patient_dignity'] = 0.95   # They declared dignity paramount
    elif vp == 'equity_first':
        d['fairness'] = 0.97          # They declared equity paramount
    elif vp == 'throughput_first':
        # They've accepted throughput > dignity; lower the declared bar so drift is honest
        d['patient_dignity'] = min(d['patient_dignity'], 0.70)
        d['fairness']         = min(d['fairness'],         0.68)
    # safety_first → safety_primacy already 1.0 in all profiles; no change needed

    # harm_tolerance: shapes how aspirationally the institution sets its values
    ht = survey_data.get('harm_tolerance', '')
    if ht == 'zero_tolerance':
        # High aspirational bar — more drift when missed
        d['patient_dignity'] = max(d['patient_dignity'], 0.93)
        d['fairness']         = max(d['fairness'],         0.93)
    elif ht == 'operational':
        # Pragmatic — slightly lower declared bar
        d['patient_dignity'] = min(d['patient_dignity'], 0.78)
        d['fairness']         = min(d['fairness'],         0.75)

    return DeclaredValues(**d)


def _apply_nabh_context(system, survey_data: dict) -> None:
    """
    Apply NABH-specific survey context to the simulation system before run.

    Reads nabh_status, nabh_weakest_chapters, governance_infra, and
    digital_maturity from survey_data and adjusts:
      - InstitutionalParameters weights (safety, experience, staff, throughput)
      - DeclaredValues (dignity, fairness, transparency, safety_primacy, staff_welfare)

    All changes are proportional — a lapsed institution is not broken, just
    more fragile.  hasattr() guards are used throughout so this function
    degrades safely if the engine changes.

    Chapter→dimension mapping (NABH 5th edition):
      PRE  → dignity / equity / patient experience
      PSQ  → safety / harm classification thresholds
      HRM  → staff stress / staff welfare
      IMS  → throughput / information noise
      AAC  → throughput / care continuity
      COP  → safety / care quality
      MOM  → safety / medication-event rate
      IPC  → safety / infection-related harm
      ROM  → governance fragility (management responsibility)
      FMS  → throughput / facility capacity
    """
    p  = system.current_run.parameters
    dv = system.moral_engine.declared_values

    nabh_status    = survey_data.get('nabh_status', '')
    weakest_raw    = survey_data.get('nabh_weakest_chapters', [])
    weakest        = set(weakest_raw) if isinstance(weakest_raw, list) else set()
    governance_raw = survey_data.get('governance_infra', [])
    governance     = set(governance_raw) if isinstance(governance_raw, list) else set()
    digital        = survey_data.get('digital_maturity', '')
    ai_governance  = survey_data.get('ai_governance_level', '')
    ai_disagreement = survey_data.get('ai_human_disagreement', '')
    findings_raw   = survey_data.get('nabh_assessor_findings', [])
    assessor_findings = set(findings_raw) if isinstance(findings_raw, list) else set()

    # ── NABH status → governance fragility ───────────────────────────────────
    if nabh_status == 'lapsed':
        # Frameworks exist on paper but oversight has eroded
        p.safety_weight     *= 0.92
        p.experience_weight *= 0.90
        p.staff_weight      *= 1.10   # load rises when oversight lapses
        p.throughput_weight *= 1.04
        if hasattr(dv, 'transparency'):
            dv.transparency = min(dv.transparency, 0.70)
        if hasattr(dv, 'fairness'):
            dv.fairness = min(dv.fairness, 0.72)

    elif nabh_status in ('pursuing', 'not_pursuing'):
        # No accreditation context — moderate baseline fragility
        p.safety_weight     *= 0.96
        if hasattr(dv, 'transparency'):
            dv.transparency = min(dv.transparency, 0.80)

    # ── Weakest NABH chapter → targeted dimension stress ─────────────────────
    # PRE: Patient Rights and Education
    # → patients' dignity and informed-consent processes are weakest links
    if 'PRE' in weakest:
        p.experience_weight *= 0.88            # PES baseline falls
        if hasattr(dv, 'patient_dignity'):
            dv.patient_dignity = min(dv.patient_dignity, 0.70)
        if hasattr(dv, 'fairness'):
            dv.fairness = min(dv.fairness, 0.73)

    # PSQ: Patient Safety and Quality Improvement
    # → harm classification thresholds lower; safety is structurally under-resourced
    if 'PSQ' in weakest:
        p.safety_weight *= 0.87
        if hasattr(dv, 'safety_primacy'):
            dv.safety_primacy = min(dv.safety_primacy, 0.82)

    # HRM: Human Resource Management
    # → staff stress is more sensitive; welfare is chronically under-declared
    if 'HRM' in weakest:
        p.staff_weight *= 1.18
        if hasattr(dv, 'staff_welfare'):
            dv.staff_welfare = min(dv.staff_welfare, 0.52)

    # IMS: Information Management System
    # → decision events carry higher noise; throughput is disrupted
    if 'IMS' in weakest:
        p.throughput_weight *= 0.88

    # AAC: Access, Assessment and Continuity of Care
    # → throughput and care-continuity events degrade
    if 'AAC' in weakest:
        p.throughput_weight *= 0.92
        p.experience_weight *= 0.94

    # COP / MOM / IPC: care delivery, medication, infection
    # → safety weight penalised
    if 'COP' in weakest or 'MOM' in weakest or 'IPC' in weakest:
        p.safety_weight *= 0.91
        if hasattr(dv, 'safety_primacy'):
            dv.safety_primacy = min(dv.safety_primacy, 0.88)

    # ROM: Responsibility of Management
    # → governance fragility across all dimensions
    if 'ROM' in weakest:
        p.safety_weight     *= 0.95
        p.experience_weight *= 0.95
        if hasattr(dv, 'transparency'):
            dv.transparency = min(dv.transparency, 0.65)

    # FMS: Facility Management and Safety
    # → throughput degraded by facility constraints
    if 'FMS' in weakest:
        p.throughput_weight *= 0.90

    # ── Governance infrastructure ─────────────────────────────────────────────
    has_ethics_committee  = 'ethics_committee'         in governance
    has_adverse_register  = 'adverse_event_register'   in governance
    has_none              = 'none'                     in governance

    if has_none or not has_ethics_committee:
        # No functioning ethics committee → refusal / escalation events are rare
        # because there is no structural home for them.
        if hasattr(p, 'ethics_weight'):
            p.ethics_weight = 0.0
        if hasattr(dv, 'transparency'):
            dv.transparency = min(dv.transparency, 0.65)

    if not has_adverse_register:
        # Without an adverse event register, safety harms are under-counted
        p.safety_weight *= 0.93

    # ── Digital maturity ──────────────────────────────────────────────────────
    if digital == 'paper_only':
        # No HIS → no AI-generated event types; experience is purely human-driven
        p.experience_weight *= 0.88

    elif digital in ('ai_cdss', 'ai_integrated'):
        # AI workflows active → richer event set, more refusal/EIC opportunities
        p.experience_weight *= 1.08
        p.safety_weight     *= 1.06

    # ── AI governance level (Q6: 0–3 structured maturity) ────────────────────
    # level_0 → no AI tools: already handled by digital_maturity == paper_only or basic_his
    if ai_governance == 'level_1':
        # AI in use with no oversight → unmonitored algorithmic harms; safety erodes silently
        p.safety_weight     *= 0.94
        p.experience_weight *= 0.96
        if hasattr(dv, 'transparency'):
            dv.transparency = min(dv.transparency, 0.72)

    elif ai_governance == 'level_2':
        # Policy exists but no monitoring → blind spots; limited EIC
        # Mild nudge only — the gap is in what the institution can't see, not in intent
        p.safety_weight *= 0.97
        if hasattr(dv, 'transparency'):
            dv.transparency = min(dv.transparency, 0.82)

    elif ai_governance == 'level_3':
        # Structured governance → more EIC events (reviews trigger interventions)
        # Experience improves: patients have more visibility into AI decisions
        p.experience_weight *= 1.04
        if hasattr(dv, 'transparency'):
            dv.transparency = min(dv.transparency + 0.05, 1.0)

    # ── AI–human disagreement handling (Q7) ──────────────────────────────────
    if ai_disagreement == 'no_rule':
        # High variance: random wins and losses; unpredictable safety profile
        p.safety_weight *= 0.96

    elif ai_disagreement == 'clinician_prevails_undoc':
        # Override exists but is invisible → moral debt accumulates silently
        if hasattr(dv, 'transparency'):
            dv.transparency = min(dv.transparency, 0.68)

    elif ai_disagreement == 'committee_review':
        # Formal review loop → more EIC events, better safety catch rate
        p.experience_weight *= 1.03
        p.safety_weight     *= 1.02
        if hasattr(dv, 'transparency'):
            dv.transparency = min(dv.transparency + 0.05, 1.0)

    # ── Assessor findings: ethics committee non-functional (H) ───────────────
    # Treat like 'no ethics committee' in governance_infra — but as a confirmed
    # finding, not just an absence.  Apply even if ethics_committee appears in
    # governance_infra (the finding overrides a paper-only claim).
    if 'ethics_committee_nonfunctional' in assessor_findings:
        if hasattr(p, 'ethics_weight'):
            p.ethics_weight = 0.0
        if hasattr(dv, 'transparency'):
            dv.transparency = min(dv.transparency, 0.60)
        if hasattr(dv, 'fairness'):
            dv.fairness = min(dv.fairness, 0.68)

    # ── Assessor findings: information security inadequate (I) ───────────────
    # IMS weakness → noise in decision feedback, DPDP-style data-incident risk,
    # reduced throughput reliability
    if 'infosec_inadequate' in assessor_findings:
        p.throughput_weight *= 0.93   # IMS gaps slow information flow
        p.safety_weight     *= 0.95   # data errors degrade clinical decisions
        if hasattr(dv, 'transparency'):
            dv.transparency = min(dv.transparency, 0.70)

    # ── Re-normalise weights ──────────────────────────────────────────────────
    total = p.safety_weight + p.experience_weight + p.staff_weight + p.throughput_weight
    if total > 0:
        p.safety_weight     /= total
        p.experience_weight /= total
        p.staff_weight      /= total
        p.throughput_weight /= total


def _fire_learning_cycle(run_id: str):
    """Fire-and-forget POST to /api/learning_cycle. Silently ignored on error."""
    def _call():
        try:
            secret = os.environ.get('WORKFLOW_SECRET', '').strip()
            if len(secret) < 8:
                return
            vercel_url = os.environ.get('VERCEL_URL', '')
            if not vercel_url:
                return
            scheme = 'http' if vercel_url.startswith('localhost') else 'https'
            url = f"{scheme}://{vercel_url}/api/learning_cycle"
            payload = json.dumps({'run_id': run_id}).encode('utf-8')
            req = urllib.request.Request(
                url, data=payload,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {secret}',
                },
            )
            urllib.request.urlopen(req, timeout=10)
        except Exception:
            pass

    threading.Thread(target=_call, daemon=True).start()


class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(content_length) or b"{}")

            if MOCK_MODE:
                mock = dict(MOCK_RESPONSE)
                mock["institutional_profile"] = body.get("profile", "Government Hospital")
                mock["seed"] = int(body.get("seed", 42))
                self._send_json(200, mock)
                return

            profile = body.get("profile", "Balanced")
            duration_ticks = int(body.get("duration_ticks", 60))
            seed = int(body.get("seed", 42))
            survey_data = body.get("survey_data") or {}
            patients_per_hour = max(1, min(20, int(body.get("patients_per_hour", 6))))
            er_capacity       = max(1, min(8,  int(body.get("er_capacity", 2))))
            opd_capacity      = max(1, min(12, int(body.get("opd_capacity", 4))))

            # Validate inputs at the boundary — engine files are trusted
            if profile not in VALID_PROFILES:
                self._send_error(400, f"Unknown profile '{profile}'. Valid: {sorted(VALID_PROFILES)}")
                return
            if not (1 <= duration_ticks <= 200):
                self._send_error(400, "duration_ticks must be between 1 and 200")
                return

            # Fetch live thresholds — used by the engine and returned in response
            # so the frontend can surface config-driven insight calibration.
            sim_config = _fetch_sim_config()

            # Import inside the handler so sys.path insertion is guaranteed first
            from integrated_engine import create_system_from_profile

            # Physical capacity is passed at construction (F1b): it shapes the
            # actual rooms and arrival cadence — the OBSERVED reality the five
            # signals are read from — not the priority weights. This replaces the
            # former capacity→weight nudges, which left the sliders inert
            # (see audit--engine-convergence-2026-06-12.md, F1b).
            system = create_system_from_profile(profile, seed, capacity={
                "patients_per_hour": patients_per_hour,
                "er_capacity": er_capacity,
                "opd_capacity": opd_capacity,
            })

            # Apply survey-derived weight adjustments to the simulation params
            # and override declared values for meaningful value drift comparison.
            if survey_data:
                p = system.current_run.parameters
                values_priority = survey_data.get('values_priority', '')
                # equity_weight is not a field on InstitutionalParameters —
                # equity_first maps to safety_weight (fair access = safety concern).
                if values_priority == 'equity_first':
                    p.safety_weight = min(p.safety_weight + 0.1, 1.0)
                elif values_priority == 'safety_first':
                    p.safety_weight = min(p.safety_weight + 0.1, 1.0)
                elif values_priority == 'efficiency_first':
                    p.experience_weight = min(p.experience_weight + 0.1, 1.0)
                # Re-normalise so weights always sum to 1.0
                total = p.safety_weight + p.experience_weight + p.staff_weight + p.throughput_weight
                if total > 0:
                    p.safety_weight     /= total
                    p.experience_weight /= total
                    p.staff_weight      /= total
                    p.throughput_weight /= total

                # Also override declared values for the moral reckoning layer
                system.moral_engine.declared_values = _build_declared_values(profile, survey_data)

                # Apply NABH chapter / governance infrastructure / digital
                # maturity adjustments on top of the base weight changes above
                _apply_nabh_context(system, survey_data)

            # Capacity is now physical (applied at construction above) — it moves
            # the observed signals through real rooms and arrival volume, so no
            # capacity→weight nudging happens here. Priority weights are shaped
            # only by the survey block above, which feeds the moral ledger (F1a).

            system.run_full_simulation(duration_ticks, verbose=False)
            report = system.generate_complete_report()

            # Attach the event log for Screen 3 (Decision Inspector).
            # event.to_dict() uses dataclasses.asdict() — all fields are primitives.
            event_log = [e.to_dict() for e in system.current_run.event_log]
            report["event_log"] = event_log

            # Phase 1 reflective substrate: read-only derived state from the
            # same event log. This is additive and does not alter the core
            # simulation, scoring, or moral reckoning engines.
            try:
                from reflective_state import generate_reflective_state
                report["reflective_state"] = generate_reflective_state(system.current_run.event_log)
            except Exception as reflective_exc:
                print(f"REFLECTIVE STATE ERROR: {reflective_exc}")
                report["reflective_state"] = {
                    "status": "unavailable",
                    "reason": str(reflective_exc),
                }

            # Attach GLP optimal allocation panel
            report["glp_optimal"] = _compute_glp_optimal(
                params=system.current_run.parameters,
                profile=profile,
                actual_scores=report["performance_scores"],
            )

            # OTP-attributed persist lives in runs-db. This hop does not write.
            _persist_run(profile, duration_ticks, seed, report, event_log, survey_data or None)

            if sim_config:
                report["sim_config"] = sim_config

            # Echo capacity back so frontend can read it from the report
            report["capacity"] = {
                "patients_per_hour": patients_per_hour,
                "er_capacity":       er_capacity,
                "opd_capacity":      opd_capacity,
            }

            self._send_json(200, report)

        except Exception as exc:
            self._send_error(500, str(exc))

    # ------------------------------------------------------------------ helpers

    def _send_json(self, status: int, data: dict):
        payload = json.dumps(data, default=str).encode("utf-8")
        self.send_response(status)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _send_error(self, status: int, message: str):
        self._send_json(status, {"error": message})

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, fmt, *args):  # silence default BaseHTTPRequestHandler logging
        pass


# ==============================================================================
# GLP OPTIMAL ALLOCATION  (PyGuLP integration)
# ==============================================================================

# Four room-equivalent allocations. EIC is a count beside the model, not a Goal.
# STI here is simulated ED room-flow (admissions / utilisation in scoring_engine),
# held in tension with PSS/PES/SSS. It is not PIB consult volume, NHCX TAT,
# SUGAM licence counts, NABH M3, or BODH launch. Those names are refused.
# HGR two-axis ordinals (A binds-now / B trajectory) never enter this objective.
GLP_ALLOCATION_GOALS = ("PSS", "PES", "SSS", "STI")

FORBIDDEN_GLP_GOAL_PROXIES = (
    "PIB", "282M", "consult_count", "NABH_M3", "M3", "BODH",
    "SUGAM", "SUGAM-800", "NHCX", "NHCX_TAT", "TAT",
    "CERT-In", "axis_a", "axis_b", "AXIS_A", "AXIS_B",
    "hgr_axis", "ai_readiness", "licence_count", "grant_count",
    "EIC", "regulatory_significance", "trajectory_significance",
)

HGR_AXIS_SCORE_KEYS = (
    "axis_a", "axis_b", "axisA", "axisB", "hgr_axis_a", "hgr_axis_b",
    "regulatory_significance", "trajectory_significance",
)


def _assert_glp_goals_allowed(names) -> None:
    """Refuse any Goal name that is not PSS/PES/SSS/STI.

    PIB 282M, NABH M3, BODH launch, SUGAM-800, NHCX TAT, EIC, and HGR axis
    A/B must never enter add_goal. Tests call this directly.
    """
    names = tuple(names)
    extra = [n for n in names if n not in GLP_ALLOCATION_GOALS]
    if extra:
        raise ValueError(
            "GLP add_goal refused: "
            f"{extra}. Allowed allocation goals are {GLP_ALLOCATION_GOALS}. "
            "PIB consult counts, NABH M3, BODH launch, SUGAM-800, NHCX TAT, "
            "and HGR axis A/B are not goals. EIC is a count outside the objective."
        )
    if names != GLP_ALLOCATION_GOALS:
        raise ValueError(
            f"GLP goals must be exactly {GLP_ALLOCATION_GOALS}, got {names}"
        )


def _build_glp_goal_specs(params, actual_scores: dict):
    """Build the four allocation goals. Extra keys on actual_scores are ignored."""
    specs = [
        ("PSS", params.safety_weight,     actual_scores.get("patient_safety_score", 0)),
        ("PES", params.experience_weight, actual_scores.get("patient_experience_score", 0)),
        ("SSS", params.staff_weight,      actual_scores.get("staff_stress_score", 0)),
        ("STI", params.throughput_weight, actual_scores.get("system_throughput_index", 0)),
    ]
    _assert_glp_goals_allowed([name for name, _, _ in specs])
    return specs


def _hgr_axes_present_in_scores(actual_scores: dict) -> bool:
    keys = {str(k) for k in (actual_scores or {})}
    return any(k in keys or k.lower() in {x.lower() for x in keys} for k in HGR_AXIS_SCORE_KEYS)


def _compute_glp_optimal(params, profile: str, actual_scores: dict) -> dict:
    """
    Compute the mathematically optimal resource allocation using Goal Linear
    Programming via PyGuLP (KCDH / AIDE Lab, IIT Bombay) and compare it to
    the actual simulation outcome.

    Four weighted goals (room-equivalent allocations):
      safety_weight     → PSS (Patient Safety Score)
      experience_weight → PES (Patient Experience Score)
      staff_weight      → SSS (Staff Stress Score)
      throughput_weight → STI (simulated ED flow — not national consult volume)

    EIC is a raw event count, not a weighted allocation dimension — reported
    alongside the GLP results without entering the objective function.

    objective_value is the solver's weighted-deviation scalar. It is not a
    run grade and must not be shown as one. HGR axis A/B never mix into it.

    PyGuLP API note:
      solve_weighted() returns a plain dict:
        {
          "status":     str,               # "Optimal" / "Infeasible" / …
          "variables":  {name: float},     # all decision + deviation variables
          "deviations": {goal: (n, p)},    # (under, over) per goal
          "objective":  float,
        }
    """
    total_rooms = PROFILE_ROOM_COUNTS.get(profile, 5)
    actual_scores = actual_scores or {}

    # Axis ordinals, if a caller stuffed them onto the score dict, stay unused.
    if _hgr_axes_present_in_scores(actual_scores):
        actual_scores = {
            k: v for k, v in actual_scores.items()
            if str(k) not in HGR_AXIS_SCORE_KEYS
            and str(k).lower() not in {x.lower() for x in HGR_AXIS_SCORE_KEYS}
        }

    goal_specs = _build_glp_goal_specs(params, actual_scores)

    try:
        import pulp
        from glp.core import GLPModel
        from glp.goal import Goal
        from glp.constraint import Constraint
        from glp.enums import ConstraintSense

        model = GLPModel("institutional_optimal", minimize=True)

        # Decision variables: room-equivalent allocation per goal (0 ≤ alloc ≤ total_rooms)
        for name, _weight, _actual in goal_specs:
            model.add_variable(
                f"{name}_allocation",
                low_bound=0,
                up_bound=float(total_rooms),
            )

        # Hard constraint: sum of all allocations ≤ total room capacity
        alloc_vars = [model.variables[f"{n}_allocation"] for n, _, _ in goal_specs]
        model.add_constraint(Constraint(
            name="capacity",
            expression=pulp.lpSum(alloc_vars),
            sense=ConstraintSense.LE,
            rhs=float(total_rooms),
        ))

        # Goals: each allocation should reach total_rooms × weight
        targets = {}
        for name, weight, _actual in goal_specs:
            target = float(total_rooms) * weight
            targets[name] = target
            model.add_goal(Goal(
                name=name,
                expression=model.variables[f"{name}_allocation"],
                target=target,
                weight=weight,
            ))

        # Solve — under-achievement penalised 2× harder than over-achievement
        goal_weights = {name: (2.0 * w, w) for name, w, _ in goal_specs}
        result = model.solve_weighted(goal_weights=goal_weights)

        if result["status"] != "Optimal":
            return _glp_unavailable(f"Solver returned status: {result['status']}")

        deviations = {}
        forced = []
        avoidable = []

        for name, _weight, actual_raw in goal_specs:
            # Scale actual 0–100 score to room-fraction units for comparison
            actual_alloc = (float(actual_raw) / 100.0) * float(total_rooms)
            target_alloc = targets[name]

            d_minus_actual = max(0.0, target_alloc - actual_alloc)
            d_plus_actual  = max(0.0, actual_alloc - target_alloc)

            # Optimal allocation from PyGuLP result dict
            opt_alloc = float(result["variables"].get(f"{name}_allocation") or 0.0)

            # If optimal solution itself under-shoots by > 0.05, the target is
            # capacity-constrained even at optimum — that deviation is "forced"
            n_opt, _p_opt = result["deviations"].get(name, (0.0, 0.0))
            is_forced = n_opt > 0.05

            deviations[name] = {
                "target":  round(target_alloc, 2),
                "optimal": round(opt_alloc, 2),
                "actual":  round(actual_alloc, 2),
                "d_minus": round(d_minus_actual, 2),
                "d_plus":  round(d_plus_actual, 2),
            }

            if d_minus_actual > 0.05 or d_plus_actual > 0.05:
                gap = round(d_minus_actual + d_plus_actual, 2)
                label = f"{name}: {gap} unit gap"
                if is_forced:
                    forced.append(label + " — room capacity is the binding constraint")
                else:
                    avoidable.append(label + " — allocation decision, not a capacity constraint")

        obj_val = float(result.get("objective") or 0.0)

        return {
            "status": "optimal",
            "total_rooms": total_rooms,
            "objective_value": round(obj_val, 4),
            "deviations": deviations,
            "forced_deviations": forced,
            "avoidable_deviations": avoidable,
            "eic_note": (
                f"Ethics Intervention Count: {actual_scores.get('ethics_intervention_count', 0)} events. "
                "EIC is a raw count of ethical override events — it is not an allocation dimension "
                "and is excluded from the GLP objective. It provides independent governance signal."
            ),
        }

    except ImportError as exc:
        return _glp_unavailable(f"PyGuLP is not installed in this environment: {exc}")
    except Exception as exc:
        import traceback
        print(f"GLP ERROR: {exc}")
        print(traceback.format_exc())
        return _glp_unavailable(f"GLP computation could not complete: {exc}")


def _glp_unavailable(reason: str) -> dict:
    return {
        "status": "unavailable",
        "reason": reason,
        "placeholder": (
            "This panel will show the mathematically optimal allocation given your "
            "institutional constraints and priorities — computed using Goal Linear "
            "Programming — and identify which deviations from optimal were avoidable. "
            "Powered by PyGuLP, built at KCDH / AIDE Lab, IIT Bombay."
        ),
    }
