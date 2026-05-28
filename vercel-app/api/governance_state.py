"""
Governance State Engine.

Derives whether institutional safeguards are functioning under pressure. This is
read-only Phase 1 infrastructure: no core simulation behaviour is changed.
"""

from typing import Any, Dict, Iterable, Tuple

from state_models import GovernanceState, ReflectiveObservation, clamp


def _norm(event_type: str) -> str:
    return event_type.upper().replace("-", "_").replace(" ", "_")


def _payload(event: Any) -> Dict[str, Any]:
    return getattr(event, "payload", {}) or {}


def _tick(event: Any) -> int:
    return int(round(float(getattr(event, "timestamp", 0)) / 5))


def _explained(payload: Dict[str, Any]) -> bool:
    return any(str(payload.get(field, "")).strip() for field in ("reason", "description", "justification", "explanation"))


def compute_governance_state(
    events: Iterable[Any],
) -> Tuple[GovernanceState, list[ReflectiveObservation]]:
    """Compute governance coordination state from events."""
    overrides = 0
    explained_overrides = 0
    escalation_total = 0
    escalation_resolved = 0
    escalation_failed = 0
    fairness_interventions = 0
    accountability_events = 0
    traceable_events = 0
    tension_weight = 0.0
    last_tick = 0

    observations: list[ReflectiveObservation] = []

    for event in events:
        event_type = _norm(getattr(event, "event_type", ""))
        payload = _payload(event)
        last_tick = max(last_tick, _tick(event))

        if event_type in {"QUEUE_REORDER", "TRIAGE_OVERRIDE", "AGENT_ACTION", "REFUSAL"}:
            overrides += 1
            if _explained(payload):
                explained_overrides += 1

        if "ESCALATION" in event_type or event_type == "REFUSAL":
            escalation_total += 1
            if event_type in {"ESCALATION_RESOLVED", "INTERVENTION_APPLIED"} or payload.get("resolved") is True:
                escalation_resolved += 1
            elif event_type in {"ESCALATION_FAILED", "ESCALATION_TIMEOUT"} or payload.get("resolved") is False:
                escalation_failed += 1

        if "FAIRNESS" in event_type or "EQUITY" in event_type:
            if event_type in {"FAIRNESS_INTERVENTION", "EQUITY_INTERVENTION"}:
                fairness_interventions += 1
            else:
                tension_weight += 0.8

        if event_type == "TENSION_SIGNAL":
            score = float(payload.get("severity_score", 0.5) or 0.5)
            tension_weight += score

        accountability_events += 1
        if _explained(payload) or event_type in {"PATIENT_ARRIVAL", "PATIENT_ADMITTED", "ROOM_DISCHARGE", "RUN_STARTED"}:
            traceable_events += 1

    explained_ratio = explained_overrides / overrides if overrides else 1.0
    escalation_success_rate = escalation_resolved / escalation_total if escalation_total else 0.0
    escalation_failure_rate = escalation_failed / escalation_total if escalation_total else 0.0
    unresolved_escalations = max(0, escalation_total - escalation_resolved)
    escalation_congestion = clamp(unresolved_escalations / 8)
    trace_completeness = traceable_events / accountability_events if accountability_events else 1.0

    governance_drift = clamp(
        (1 - explained_ratio) * 0.28
        + escalation_failure_rate * 0.24
        + escalation_congestion * 0.22
        + min(1.0, tension_weight / 6) * 0.18
        + (1 - trace_completeness) * 0.08
    )
    policy_adherence = clamp(0.9 - governance_drift * 0.55 - overrides * 0.01)
    governance_stability = clamp(0.85 - governance_drift * 0.65 - escalation_congestion * 0.12)

    state = GovernanceState(
        policy_adherence=policy_adherence,
        override_count=overrides,
        explained_override_ratio=explained_ratio,
        escalation_success_rate=escalation_success_rate,
        escalation_failure_rate=escalation_failure_rate,
        escalation_congestion=escalation_congestion,
        fairness_interventions=fairness_interventions,
        governance_stability=governance_stability,
        governance_drift=governance_drift,
        accountability_trace_completeness=trace_completeness,
    ).normalized()

    evidence = {
        "override_count": overrides,
        "explained_overrides": explained_overrides,
        "escalation_total": escalation_total,
        "escalation_resolved": escalation_resolved,
        "escalation_failed": escalation_failed,
        "unresolved_escalations": unresolved_escalations,
        "fairness_interventions": fairness_interventions,
        "tension_weight": tension_weight,
        "accountability_trace_completeness": trace_completeness,
    }

    if state.governance_drift > 0.25:
        observations.append(
            ReflectiveObservation(
                type="governance_drift",
                severity="HIGH" if state.governance_drift >= 0.45 else "MEDIUM",
                message=(
                    "Governance drift was detected: formal safeguards appear to be weakening "
                    "under operational pressure."
                ),
                evidence=evidence,
                governance_implication=(
                    "Review whether overrides, escalation, and fairness safeguards are being resolved "
                    "or merely recorded."
                ),
                tick=last_tick,
            )
        )

    if state.escalation_congestion > 0.3:
        observations.append(
            ReflectiveObservation(
                type="escalation_congestion",
                severity="MEDIUM",
                message=(
                    "Escalation congestion is rising. Issues requiring review are accumulating faster "
                    "than governance pathways are closing them."
                ),
                evidence=evidence,
                governance_implication="Clarify ownership and response time for escalated decisions.",
                tick=last_tick,
            )
        )

    return state, observations
