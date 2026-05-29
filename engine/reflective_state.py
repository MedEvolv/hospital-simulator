"""
Reflective State Coordinator.

Builds Phase 1 reflective snapshots from existing simulation events without
altering the core engine. This is the public additive API for trust, hidden
strain, and governance state.
"""

from typing import Any, Iterable, List

from governance_state import compute_governance_state
from hidden_strain import compute_hidden_strain
from operational_trust import compute_operational_trust
from state_models import (
    HumanState,
    OperationalState,
    ReflectiveObservation,
    ReflectiveSnapshot,
    clamp,
)


def _norm(event_type: str) -> str:
    return event_type.upper().replace("-", "_").replace(" ", "_")


def _payload(event: Any) -> dict:
    return getattr(event, "payload", {}) or {}


def _tick(event: Any) -> int:
    return int(round(float(getattr(event, "timestamp", 0)) / 5))


def compute_operational_state(events: Iterable[Any]) -> OperationalState:
    """Derive a minimal normalized mechanical state from event history."""
    patient_locations: dict[str, str] = {}
    patient_arrivals: dict[str, float] = {}
    patient_waiting: dict[str, float] = {}
    waiting_times: dict[str, float] = {}
    room_occupancy: dict[str, int] = {}
    queue_lengths = {"triage": 0, "waiting": 0, "treatment": 0}
    active_bottlenecks: list[str] = []
    escalation_queue_depth = 0
    admitted = 0
    discharged = 0
    last_timestamp = 0.0

    for event in events:
        event_type = _norm(getattr(event, "event_type", ""))
        payload = _payload(event)
        timestamp = float(getattr(event, "timestamp", 0.0))
        last_timestamp = max(last_timestamp, timestamp)

        if event_type == "PATIENT_ARRIVAL":
            patient_id = str(payload.get("patient_id", getattr(event, "event_id", "")))
            patient_locations[patient_id] = "triage"
            patient_arrivals[patient_id] = timestamp
            patient_waiting[patient_id] = timestamp

        elif "TRIAGE" in event_type:
            patient_id = str(payload.get("patient_id", ""))
            if patient_id:
                patient_locations[patient_id] = "waiting"
                patient_waiting.setdefault(patient_id, timestamp)

        elif event_type in {"QUEUE_REORDER", "QUEUE_ASSIGNMENT"}:
            for patient_id, location in list(patient_locations.items()):
                if location == "triage":
                    patient_locations[patient_id] = "waiting"
                    patient_waiting.setdefault(patient_id, timestamp)

        elif event_type == "PATIENT_ADMITTED":
            patient_id = str(payload.get("patient_id", ""))
            room = str(payload.get("room") or payload.get("room_name") or payload.get("room_type") or "treatment")
            if patient_id:
                patient_locations[patient_id] = room
                if patient_id in patient_waiting:
                    waiting_times[patient_id] = max(0.0, timestamp - patient_waiting[patient_id])
                    patient_waiting.pop(patient_id, None)
            room_occupancy[room] = room_occupancy.get(room, 0) + 1
            admitted += 1

        elif event_type in {"ROOM_DISCHARGE", "PATIENT_DISCHARGE"}:
            patient_id = str(payload.get("patient_id", ""))
            if patient_id:
                patient_locations[patient_id] = "gone"
                patient_waiting.pop(patient_id, None)
            room = str(payload.get("room") or payload.get("room_name") or payload.get("room_type") or "")
            if room:
                room_occupancy[room] = max(0, room_occupancy.get(room, 0) - 1)
            discharged += 1

        if "ESCALATION" in event_type or event_type == "REFUSAL":
            if event_type in {"ESCALATION_RESOLVED", "INTERVENTION_APPLIED"} or payload.get("resolved") is True:
                escalation_queue_depth = max(0, escalation_queue_depth - 1)
            else:
                escalation_queue_depth += 1

    for patient_id, start_ts in patient_waiting.items():
        waiting_times[patient_id] = max(0.0, last_timestamp - start_ts)

    for location in patient_locations.values():
        if location == "triage":
            queue_lengths["triage"] += 1
        elif location == "waiting":
            queue_lengths["waiting"] += 1
        elif location != "gone":
            queue_lengths["treatment"] += 1

    if queue_lengths["waiting"] >= 8:
        active_bottlenecks.append("waiting_area")
    if escalation_queue_depth >= 3:
        active_bottlenecks.append("governance_escalation")
    if sum(room_occupancy.values()) >= 6:
        active_bottlenecks.append("treatment_capacity")

    throughput_rate = admitted / max(1.0, last_timestamp / 60.0)
    overload_level = clamp(
        queue_lengths["waiting"] / 12
        + escalation_queue_depth / 10
        + max(0, sum(room_occupancy.values()) - 5) / 10
    )

    return OperationalState(
        current_tick=_tick(type("EventProxy", (), {"timestamp": last_timestamp})()),
        active_patients=sum(1 for loc in patient_locations.values() if loc != "gone"),
        patient_locations=patient_locations,
        queue_lengths=queue_lengths,
        room_occupancy=room_occupancy,
        waiting_times=waiting_times,
        active_bottlenecks=active_bottlenecks,
        throughput_rate=throughput_rate,
        escalation_queue_depth=escalation_queue_depth,
        overload_level=overload_level,
    )


def compute_human_state(
    operational_state: OperationalState,
    trust_observations: list[ReflectiveObservation],
    strain_score: float,
) -> HumanState:
    """Phase 1 aggregate human-state estimate from operational/trust/strain state."""
    overload = operational_state.overload_level
    avg_wait = (
        sum(operational_state.waiting_times.values()) / len(operational_state.waiting_times)
        if operational_state.waiting_times else 0.0
    )
    wait_pressure = clamp(avg_wait / 180.0)
    trust_degradation_signals = len(trust_observations)

    state = HumanState(
        patient_frustration=clamp(wait_pressure * 0.55 + overload * 0.35 + strain_score * 0.10),
        patient_trust=clamp(0.78 - wait_pressure * 0.25 - strain_score * 0.18),
        patient_anxiety=clamp(overload * 0.25 + wait_pressure * 0.45 + trust_degradation_signals * 0.04),
        patient_abandonment_risk=clamp(0.05 + wait_pressure * 0.35 + strain_score * 0.25),
        complaint_probability=clamp(0.06 + wait_pressure * 0.30 + strain_score * 0.20),
        staff_fatigue=clamp(overload * 0.45 + strain_score * 0.35),
        staff_burnout=clamp(strain_score * 0.40 + overload * 0.25),
        staff_cognitive_load=clamp(overload * 0.55 + operational_state.escalation_queue_depth * 0.04),
        procedural_compliance=clamp(0.86 - strain_score * 0.28 - overload * 0.18),
        override_tendency=clamp(overload * 0.22 + strain_score * 0.18),
        escalation_willingness=clamp(0.76 - strain_score * 0.22 + (1 - overload) * 0.08),
    )
    return state.normalized()


def generate_reflective_snapshot(events: Iterable[Any]) -> ReflectiveSnapshot:
    """Generate the latest reflective snapshot for an event stream."""
    event_list = sorted(list(events), key=lambda event: (getattr(event, "timestamp", 0), getattr(event, "sequence", 0)))
    operational_state = compute_operational_state(event_list)
    trust_state, trust_observations = compute_operational_trust(event_list)
    hidden_strain_state, strain_observations = compute_hidden_strain(event_list)
    governance_state, governance_observations = compute_governance_state(event_list)
    human_state = compute_human_state(
        operational_state=operational_state,
        trust_observations=trust_observations,
        strain_score=hidden_strain_state.delayed_failure_risk,
    )

    observations = trust_observations + strain_observations + governance_observations
    return ReflectiveSnapshot(
        tick=operational_state.current_tick,
        operational_state=operational_state,
        human_state=human_state,
        governance_state=governance_state,
        trust_state=trust_state,
        hidden_strain_state=hidden_strain_state,
        observations=observations,
    )


def generate_reflective_state(events: Iterable[Any]) -> dict:
    """Convenience serializer for reports and APIs."""
    return generate_reflective_snapshot(events).to_dict()


def generate_reflective_snapshots(events: Iterable[Any]) -> List[ReflectiveSnapshot]:
    """
    Generate a snapshot after each event.

    This is useful for replay/visualization. It is intentionally simple for
    Phase 1 and can be optimized later if long simulations need it.
    """
    event_list = sorted(list(events), key=lambda event: (getattr(event, "timestamp", 0), getattr(event, "sequence", 0)))
    snapshots: List[ReflectiveSnapshot] = []
    for index in range(len(event_list) + 1):
        snapshots.append(generate_reflective_snapshot(event_list[:index]))
    return snapshots
