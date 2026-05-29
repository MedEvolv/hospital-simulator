"""
Operational Trust Engine.

Consumes existing event logs and derives trust as a system stability variable.
This module is intentionally heuristic and deterministic for Phase 1. It does
not make clinical claims and does not alter simulation decisions.
"""

from typing import Any, Dict, Iterable, Tuple

from state_models import ReflectiveObservation, TrustState, clamp


def _norm(event_type: str) -> str:
    return event_type.upper().replace("-", "_").replace(" ", "_")


def _payload(event: Any) -> Dict[str, Any]:
    return getattr(event, "payload", {}) or {}


def _tick(event: Any) -> int:
    return int(round(float(getattr(event, "timestamp", 0)) / 5))


def _has_explanation(payload: Dict[str, Any]) -> bool:
    fields = ("reason", "description", "justification", "explanation")
    return any(str(payload.get(field, "")).strip() for field in fields)


def compute_operational_trust(
    events: Iterable[Any],
) -> Tuple[TrustState, list[ReflectiveObservation]]:
    """
    Derive Operational Trust from a simulation event stream.

    Returns a TrustState plus reflective observations. The formula is deliberately
    inspectable: every adjustment is traceable to event evidence counts.
    """
    evidence: Dict[str, float] = {
        "delay_inequity": 0.0,
        "unexplained_overrides": 0.0,
        "overload": 0.0,
        "escalation_failures": 0.0,
        "fairness_drift": 0.0,
        "opacity": 0.0,
        "workload_imbalance": 0.0,
        "transparent_escalations": 0.0,
        "successful_interventions": 0.0,
    }

    observations: list[ReflectiveObservation] = []
    patient_trust = 0.78
    staff_trust = 0.76
    institutional_trust = 0.80
    degradation = 0.0
    recovery = 0.0
    last_tick = 0

    for event in events:
        event_type = _norm(getattr(event, "event_type", ""))
        payload = _payload(event)
        last_tick = max(last_tick, _tick(event))
        severity = str(payload.get("severity", "")).upper()

        if event_type in {"QUEUE_REORDER", "TRIAGE_OVERRIDE", "AGENT_ACTION"}:
            if _has_explanation(payload):
                evidence["transparent_escalations"] += 1
                patient_trust += 0.015
                institutional_trust += 0.01
                recovery += 0.01
            else:
                evidence["unexplained_overrides"] += 1
                evidence["opacity"] += 1
                patient_trust -= 0.035
                institutional_trust -= 0.03
                degradation += 0.03

        if "ESCALATION" in event_type:
            if event_type in {"ESCALATION_RESOLVED", "INTERVENTION_APPLIED"} or payload.get("resolved") is True:
                evidence["successful_interventions"] += 1
                staff_trust += 0.025
                institutional_trust += 0.02
                recovery += 0.02
            elif event_type in {"ESCALATION_FAILED", "ESCALATION_TIMEOUT"} or payload.get("resolved") is False:
                evidence["escalation_failures"] += 1
                staff_trust -= 0.045
                institutional_trust -= 0.035
                degradation += 0.04
            else:
                evidence["transparent_escalations"] += 0.5 if _has_explanation(payload) else 0.0

        if event_type in {"ROOM_OVERLOAD", "CAPACITY_BREACH"} or "OVERLOAD" in event_type:
            evidence["overload"] += 1
            patient_trust -= 0.025
            staff_trust -= 0.035
            institutional_trust -= 0.025
            degradation += 0.03

        if event_type == "HARM_EVENT" or "HARM" in event_type:
            avoidable = payload.get("avoidable")
            if avoidable is True or str(avoidable).lower() == "true":
                patient_trust -= 0.055
                institutional_trust -= 0.045
                degradation += 0.05
            else:
                patient_trust -= 0.025
                institutional_trust -= 0.015
                degradation += 0.02

        if "FAIRNESS" in event_type or "EQUITY" in event_type:
            if event_type in {"FAIRNESS_INTERVENTION", "EQUITY_INTERVENTION"}:
                evidence["successful_interventions"] += 1
                patient_trust += 0.025
                institutional_trust += 0.02
                recovery += 0.02
            else:
                evidence["fairness_drift"] += 1
                patient_trust -= 0.04
                institutional_trust -= 0.035
                degradation += 0.035

        if event_type == "TENSION_SIGNAL":
            tension = str(payload.get("tension_type", ""))
            score = float(payload.get("severity_score", 0.5) or 0.5)
            if "equity" in tension or "fairness" in tension:
                evidence["fairness_drift"] += score
            if "capacity" in tension or "throughput" in tension:
                evidence["workload_imbalance"] += score
            patient_trust -= 0.015 * score
            staff_trust -= 0.018 * score
            institutional_trust -= 0.015 * score
            degradation += 0.015 * score

        if severity == "CRITICAL":
            patient_trust -= 0.025
            staff_trust -= 0.02
            institutional_trust -= 0.02
            degradation += 0.02
        elif severity == "HIGH":
            patient_trust -= 0.012
            staff_trust -= 0.01
            degradation += 0.01

    trust = TrustState(
        patient_trust=clamp(patient_trust),
        staff_trust=clamp(staff_trust),
        institutional_trust=clamp(institutional_trust),
        trust_recovery_rate=clamp(recovery),
        trust_degradation_rate=clamp(degradation),
        evidence=evidence,
    )
    avg_trust = (trust.patient_trust + trust.staff_trust + trust.institutional_trust) / 3
    trust.compliance_probability = clamp(0.45 + avg_trust * 0.5)
    trust.escalation_willingness = clamp(0.25 + trust.staff_trust * 0.65 - evidence["escalation_failures"] * 0.03)
    trust.patient_abandonment_risk = clamp(0.08 + (1 - trust.patient_trust) * 0.55 + evidence["delay_inequity"] * 0.03)
    trust.institutional_fragility = clamp(0.15 + (1 - trust.institutional_trust) * 0.65 + evidence["overload"] * 0.025)
    trust.workflow_bypass_probability = clamp(0.05 + (1 - trust.staff_trust) * 0.6 + evidence["workload_imbalance"] * 0.025)
    trust.normalized()

    if trust.institutional_trust < 0.62:
        observations.append(
            ReflectiveObservation(
                type="operational_trust_degradation",
                severity="HIGH" if trust.institutional_trust >= 0.45 else "CRITICAL",
                message=(
                    "Operational trust appears to be degrading under pressure. "
                    "This reflects reliability strain across patients, staff, and governance pathways."
                ),
                evidence=evidence,
                governance_implication=(
                    "Review whether escalation, communication, and fairness safeguards are visible enough "
                    "to restore institutional reliability."
                ),
                tick=last_tick,
            )
        )

    if trust.workflow_bypass_probability > 0.35:
        observations.append(
            ReflectiveObservation(
                type="workflow_bypass_risk",
                severity="MEDIUM",
                message=(
                    "Workflow bypass probability is rising. This may indicate staff adapting around "
                    "processes that are not resolving operational pressure."
                ),
                evidence={"workflow_bypass_probability": trust.workflow_bypass_probability, **evidence},
                governance_implication="Check whether escalation channels are generating action or only extra work.",
                tick=last_tick,
            )
        )

    return trust, observations
