"""
Hidden Strain Engine.

Tracks accumulation before visible collapse: silent overload, normalized
dysfunction, fatigue memory, invisible suffering, and delayed failure risk.
"""

from collections import Counter
from typing import Any, Dict, Iterable, Tuple

from state_models import HiddenStrainState, ReflectiveObservation, clamp


def _norm(event_type: str) -> str:
    return event_type.upper().replace("-", "_").replace(" ", "_")


def _payload(event: Any) -> Dict[str, Any]:
    return getattr(event, "payload", {}) or {}


def _tick(event: Any) -> int:
    return int(round(float(getattr(event, "timestamp", 0)) / 5))


def compute_hidden_strain(
    events: Iterable[Any],
) -> Tuple[HiddenStrainState, list[ReflectiveObservation]]:
    """Derive hidden strain from a simulation event stream."""
    evidence: Dict[str, float] = {
        "queue_pressure_events": 0.0,
        "overload_events": 0.0,
        "unresolved_escalations": 0.0,
        "harm_events": 0.0,
        "dignity_events": 0.0,
        "repeated_tensions": 0.0,
        "recovery_events": 0.0,
    }
    hotspots: Counter[str] = Counter()
    repeated_types: Counter[str] = Counter()
    observations: list[ReflectiveObservation] = []

    latent_stress = 0.0
    silent_overload = 0.0
    normalized_dysfunction = 0.0
    fatigue_memory = 0.0
    invisible_suffering = 0.0
    unresolved_pressure = 0.0
    last_tick = 0

    for event in events:
        event_type = _norm(getattr(event, "event_type", ""))
        payload = _payload(event)
        last_tick = max(last_tick, _tick(event))
        repeated_types[event_type] += 1
        severity = str(payload.get("severity", "")).upper()

        # Slow decay keeps memory alive without making it permanent.
        latent_stress *= 0.995
        silent_overload *= 0.997
        unresolved_pressure *= 0.996

        if event_type in {"QUEUE_REORDER", "QUEUE_ASSIGNMENT"}:
            evidence["queue_pressure_events"] += 1
            latent_stress += 0.018
            unresolved_pressure += 0.012
            hotspots["waiting_area"] += 1

        if event_type in {"ROOM_OVERLOAD", "CAPACITY_BREACH"} or "OVERLOAD" in event_type:
            evidence["overload_events"] += 1
            latent_stress += 0.04
            silent_overload += 0.055
            fatigue_memory += 0.035
            hotspots["treatment_rooms"] += 2

        if "ESCALATION" in event_type:
            if event_type in {"ESCALATION_RESOLVED", "INTERVENTION_APPLIED"} or payload.get("resolved") is True:
                evidence["recovery_events"] += 1
                latent_stress -= 0.035
                unresolved_pressure -= 0.04
                silent_overload -= 0.025
            else:
                evidence["unresolved_escalations"] += 1
                unresolved_pressure += 0.035
                fatigue_memory += 0.02
                hotspots["governance_queue"] += 2

        if event_type == "HARM_EVENT" or "HARM" in event_type:
            evidence["harm_events"] += 1
            latent_stress += 0.035
            invisible_suffering += 0.045
            fatigue_memory += 0.025
            hotspots["patient_experience"] += 2
            harm_type = str(payload.get("harm_type", "")).lower()
            if "dignity" in harm_type:
                evidence["dignity_events"] += 1
                invisible_suffering += 0.04
                hotspots["waiting_area"] += 2

        if event_type == "TENSION_SIGNAL":
            tension = str(payload.get("tension_type", "general_tension"))
            score = float(payload.get("severity_score", 0.5) or 0.5)
            evidence["repeated_tensions"] += score
            latent_stress += 0.025 * score
            unresolved_pressure += 0.025 * score
            hotspots[tension] += 1

        if repeated_types[event_type] >= 4 and event_type not in {"METRIC_UPDATE", "RUN_STARTED"}:
            normalized_dysfunction += 0.01

        if severity == "CRITICAL":
            latent_stress += 0.04
            invisible_suffering += 0.03
            fatigue_memory += 0.025
        elif severity == "HIGH":
            latent_stress += 0.02
            fatigue_memory += 0.015

    delayed_failure_risk = (
        latent_stress * 0.28
        + silent_overload * 0.22
        + normalized_dysfunction * 0.18
        + fatigue_memory * 0.18
        + unresolved_pressure * 0.14
    )

    state = HiddenStrainState(
        latent_stress=clamp(latent_stress),
        silent_overload=clamp(silent_overload),
        normalized_dysfunction=clamp(normalized_dysfunction),
        fatigue_memory=clamp(fatigue_memory),
        delayed_failure_risk=clamp(delayed_failure_risk),
        invisible_suffering=clamp(invisible_suffering),
        unresolved_pressure=clamp(unresolved_pressure),
        strain_hotspots={key: clamp(value / 8) for key, value in hotspots.items()},
        evidence=evidence,
    ).normalized()

    if state.silent_overload > 0.25:
        observations.append(
            ReflectiveObservation(
                type="silent_overload",
                severity="HIGH" if state.silent_overload < 0.55 else "CRITICAL",
                message=(
                    "Silent overload is accumulating. The institution may be absorbing pressure "
                    "without producing enough visible escalation or recovery."
                ),
                evidence={"silent_overload": state.silent_overload, **evidence},
                governance_implication="Look for areas where staff have normalized working at capacity edge.",
                tick=last_tick,
            )
        )

    if state.normalized_dysfunction > 0.2:
        observations.append(
            ReflectiveObservation(
                type="normalized_dysfunction",
                severity="MEDIUM",
                message=(
                    "A repeated operational pattern is becoming routine. This is a signal to examine "
                    "whether the institution is adapting to dysfunction rather than resolving it."
                ),
                evidence={"normalized_dysfunction": state.normalized_dysfunction, **evidence},
                governance_implication="Name the repeated pattern and decide whether it should trigger review.",
                tick=last_tick,
            )
        )

    if state.delayed_failure_risk > 0.35:
        observations.append(
            ReflectiveObservation(
                type="delayed_failure_risk",
                severity="HIGH" if state.delayed_failure_risk < 0.65 else "CRITICAL",
                message=(
                    "Delayed failure risk is rising. Current operations may appear stable while unresolved "
                    "pressure is accumulating underneath."
                ),
                evidence={"delayed_failure_risk": state.delayed_failure_risk, **evidence},
                governance_implication="Prioritise relief before visible failure emerges.",
                tick=last_tick,
            )
        )

    return state, observations
