"""
Phase 1 reflective state models for Institutional Mirror.

These dataclasses are additive. They do not alter the existing simulation engine;
they give derived systems a stable shape for trust, strain, governance, and
reflective observations computed from an event log.
"""

from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    """Clamp a numeric indicator into a bounded 0..1 range by default."""
    return max(low, min(high, float(value)))


@dataclass
class OperationalState:
    """Mechanical hospital state derived from events."""

    current_tick: int = 0
    active_patients: int = 0
    patient_locations: Dict[str, str] = field(default_factory=dict)
    queue_lengths: Dict[str, int] = field(default_factory=dict)
    room_occupancy: Dict[str, int] = field(default_factory=dict)
    waiting_times: Dict[str, float] = field(default_factory=dict)
    active_bottlenecks: List[str] = field(default_factory=list)
    throughput_rate: float = 0.0
    escalation_queue_depth: int = 0
    overload_level: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class HumanState:
    """Aggregate human-state indicators for patients and staff."""

    patient_frustration: float = 0.0
    patient_trust: float = 0.75
    patient_anxiety: float = 0.0
    patient_abandonment_risk: float = 0.0
    complaint_probability: float = 0.0
    staff_fatigue: float = 0.0
    staff_burnout: float = 0.0
    staff_cognitive_load: float = 0.0
    procedural_compliance: float = 0.85
    override_tendency: float = 0.0
    escalation_willingness: float = 0.75

    def normalized(self) -> "HumanState":
        for key, value in self.__dict__.items():
            setattr(self, key, clamp(value))
        return self

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self.normalized())


@dataclass
class GovernanceState:
    """Institutional coordination and safeguard state."""

    policy_adherence: float = 0.85
    override_count: int = 0
    explained_override_ratio: float = 1.0
    escalation_success_rate: float = 0.0
    escalation_failure_rate: float = 0.0
    escalation_congestion: float = 0.0
    fairness_interventions: int = 0
    governance_stability: float = 0.8
    governance_drift: float = 0.0
    accountability_trace_completeness: float = 0.85

    def normalized(self) -> "GovernanceState":
        bounded = [
            "policy_adherence",
            "explained_override_ratio",
            "escalation_success_rate",
            "escalation_failure_rate",
            "escalation_congestion",
            "governance_stability",
            "governance_drift",
            "accountability_trace_completeness",
        ]
        for key in bounded:
            setattr(self, key, clamp(getattr(self, key)))
        return self

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self.normalized())


@dataclass
class TrustState:
    """Operational Trust as a stabilizing systems variable."""

    patient_trust: float = 0.75
    staff_trust: float = 0.75
    institutional_trust: float = 0.8
    trust_fragmentation: float = 0.0
    trust_recovery_rate: float = 0.0
    trust_degradation_rate: float = 0.0
    compliance_probability: float = 0.85
    escalation_willingness: float = 0.75
    patient_abandonment_risk: float = 0.0
    institutional_fragility: float = 0.0
    workflow_bypass_probability: float = 0.0
    evidence: Dict[str, float] = field(default_factory=dict)

    def normalized(self) -> "TrustState":
        for key, value in self.__dict__.items():
            if key != "evidence":
                setattr(self, key, clamp(value))
        values = [self.patient_trust, self.staff_trust, self.institutional_trust]
        self.trust_fragmentation = clamp(max(values) - min(values))
        return self

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self.normalized())


@dataclass
class HiddenStrainState:
    """Invisible institutional pressure before overt collapse."""

    latent_stress: float = 0.0
    silent_overload: float = 0.0
    normalized_dysfunction: float = 0.0
    fatigue_memory: float = 0.0
    delayed_failure_risk: float = 0.0
    invisible_suffering: float = 0.0
    unresolved_pressure: float = 0.0
    strain_hotspots: Dict[str, float] = field(default_factory=dict)
    evidence: Dict[str, float] = field(default_factory=dict)

    def normalized(self) -> "HiddenStrainState":
        for key, value in self.__dict__.items():
            if key not in {"strain_hotspots", "evidence"}:
                setattr(self, key, clamp(value))
        self.strain_hotspots = {
            key: clamp(value) for key, value in self.strain_hotspots.items()
        }
        return self

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self.normalized())


@dataclass
class ReflectiveObservation:
    """A non-accusatory observation tied to event evidence."""

    type: str
    severity: str
    message: str
    evidence: Dict[str, Any] = field(default_factory=dict)
    governance_implication: str = ""
    tick: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ReflectiveSnapshot:
    """Complete Phase 1 derived reflective state at a point in time."""

    tick: int
    operational_state: OperationalState = field(default_factory=OperationalState)
    human_state: HumanState = field(default_factory=HumanState)
    governance_state: GovernanceState = field(default_factory=GovernanceState)
    trust_state: TrustState = field(default_factory=TrustState)
    hidden_strain_state: HiddenStrainState = field(default_factory=HiddenStrainState)
    observations: List[ReflectiveObservation] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tick": self.tick,
            "operational_state": self.operational_state.to_dict(),
            "human_state": self.human_state.to_dict(),
            "governance_state": self.governance_state.to_dict(),
            "trust_state": self.trust_state.to_dict(),
            "hidden_strain_state": self.hidden_strain_state.to_dict(),
            "observations": [obs.to_dict() for obs in self.observations],
        }
