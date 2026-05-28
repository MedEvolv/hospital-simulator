"""
Governance Engine (Python side)

Side-car to EventSourcedSimulationEngine. Observes events as they are emitted,
maintains lightweight governance state, and injects governance-specific events
into the simulation run log.

Architecture note: this is the EMITTER, not the COMPUTER.
The authoritative governance state computation happens in TypeScript
(lib/engines/*.ts). This module's job is to:

  1. Observe v1/v2 simulation events
  2. Detect governance signals (escalation patterns, AI acceptance rates, strain)
  3. Emit structured governance events into the run log every N ticks
  4. Emit triggered events when thresholds are crossed

TypeScript engines then replay the full event log to compute final state.
This file is intentionally simpler than the TS engines — it is a signal
emitter, not a state machine.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List


# ── Governance signal thresholds ──────────────────────────────────────────────

GOVERNANCE_METRIC_INTERVAL = 30      # emit GOVERNANCE_METRIC_UPDATE every N ticks
UNRESOLVED_ESCALATION_THRESHOLD = 3  # trigger ESCALATION_FAILED after 3 unresolved
AI_ACTION_DRIFT_THRESHOLD = 10       # trigger AUTOMATION_DRIFT_SIGNAL after 10 unreviewed actions
DEBT_ACCRUAL_THRESHOLD = 20          # trigger ETHICAL_DEBT_ACCRUAL after significant accumulation


# ── Trust delta table (mirrors operationalTrust.ts) ──────────────────────────

TRUST_DELTAS: Dict[str, int] = {
    # Hard reductions
    "ESCALATION_FAILED":        -12,
    "AI_HALLUCINATION_MISSED":  -15,
    "QUEUE_DISPLACEMENT":        -8,
    "ACCOUNTABILITY_AMBIGUOUS": -10,
    "DATA_ACCESS_BREACH":       -18,
    "RANSOMWARE_TRIGGER":       -25,
    "ALERT_SUPPRESSION":         -8,
    # Soft reductions
    "AGENT_ACTION":              -2,
    "ESCALATION_SUGGESTED":      -3,
    # Restorations
    "ESCALATION_SUCCESS":       +10,
    "GOVERNANCE_INTERVENTION":   +8,
    "HUMAN_OVERRIDE_DOCUMENTED": +6,
    "PATIENT_ADMITTED":          +1,
    # Cybersecurity
    "PHISHING_ATTEMPT":          -5,
    "CREDENTIAL_SHARE":         -10,
}


# ── Debt accrual table (mirrors ethicalDebt.ts) ───────────────────────────────

DEBT_ACCRUALS: Dict[str, int] = {
    "QUEUE_REORDER":             3,
    "ESCALATION_SUGGESTED":      2,
    "AGENT_ACTION":              1,
    "QUEUE_DISPLACEMENT":       12,
    "AI_HALLUCINATION_MISSED":  15,
    "ESCALATION_FAILED":        10,
    "ACCOUNTABILITY_AMBIGUOUS":  8,
    "OVERLOAD_SURGE":            6,
    "DATA_ACCESS_BREACH":       20,
    "RANSOMWARE_TRIGGER":       35,
    "CREDENTIAL_SHARE":         10,
    # Resolutions (negative)
    "GOVERNANCE_INTERVENTION":  -8,
    "HUMAN_OVERRIDE_DOCUMENTED": -5,
    "ESCALATION_SUCCESS":       -6,
}


# ── Strain delta table (mirrors hiddenStrain.ts overall impact) ───────────────

STRAIN_DELTAS: Dict[str, float] = {
    "PATIENT_ARRIVAL":           0.3,
    "QUEUE_REORDER":             0.8,
    "ESCALATION_SUGGESTED":      1.5,
    "AGENT_ACTION":              0.4,
    "ESCALATION_FAILED":         6.0,
    "AI_HALLUCINATION_MISSED":   7.0,
    "QUEUE_DISPLACEMENT":        5.0,
    "ACCOUNTABILITY_AMBIGUOUS":  5.5,
    "ALERT_FLOOD":               8.0,
    "STAFFING_SHORTAGE":        10.0,
    "OVERLOAD_SURGE":            9.0,
    "PHISHING_ATTEMPT":          4.0,
    "CREDENTIAL_SHARE":          5.0,
    "ALERT_SUPPRESSION":         5.0,
    "DATA_ACCESS_BREACH":       12.0,
    "RANSOMWARE_TRIGGER":       20.0,
    # Restorations
    "GOVERNANCE_INTERVENTION":  -4.0,
    "ESCALATION_SUCCESS":       -5.0,
}


@dataclass
class GovernanceState:
    """
    Lightweight Python-side governance state.
    Used only for threshold detection and event emission timing.
    The authoritative state lives in the TypeScript engines.
    """
    # Operational trust (0–100)
    trust: float = 75.0

    # Ethical debt (unbounded, scaled to 0–1000 for display)
    ethical_debt: float = 0.0

    # Hidden strain (0–100)
    hidden_strain: float = 10.0

    # Governance drift (0–100)
    policy_practice_gap: float = 5.0
    effective_autonomy: float = 2.0  # starts at declared L2

    # Counters for threshold detection
    unresolved_escalations: int = 0
    agent_actions_since_review: int = 0
    debt_accrued_since_last_signal: float = 0.0
    ticks_since_last_governance_update: int = 0

    # Summaries for GOVERNANCE_METRIC_UPDATE payload
    event_type_counts: Dict[str, int] = field(default_factory=dict)
    total_events_processed: int = 0


class GovernanceEngine:
    """
    Observes events from the simulation run and emits governance events.

    Usage:
        gov = GovernanceEngine(run)
        # ... in the simulation tick loop:
        event = run.add_event("AGENT_ACTION", {...})
        triggered = gov.observe(event)
        # triggered may contain additional governance events already added to run
    """

    def __init__(self, run: Any):
        """
        run: the SimulationRun instance (must have .add_event() and .event_log)
        """
        self.run = run
        self.state = GovernanceState()

    def observe(self, event: Any) -> List[Any]:
        """
        Process an incoming event. Updates internal state and may emit
        governance events directly to the run log.

        Returns list of any governance events emitted as a result.
        """
        event_type = event.event_type
        triggered: List[Any] = []

        # ── Update lightweight state ──────────────────────────────────────────

        # Trust
        trust_delta = TRUST_DELTAS.get(event_type, 0)
        self.state.trust = max(0.0, min(100.0, self.state.trust + trust_delta))

        # Ethical debt
        debt_delta = DEBT_ACCRUALS.get(event_type, 0)
        self.state.ethical_debt = max(0.0, self.state.ethical_debt + debt_delta)
        self.state.debt_accrued_since_last_signal += max(0, debt_delta)

        # Hidden strain
        strain_delta = STRAIN_DELTAS.get(event_type, 0)
        self.state.hidden_strain = max(0.0, min(100.0, self.state.hidden_strain + strain_delta))

        # Governance drift signals
        if event_type == "AGENT_ACTION":
            self.state.agent_actions_since_review += 1
            self.state.effective_autonomy = min(6.0, self.state.effective_autonomy + 0.03)
            self.state.policy_practice_gap = min(100.0, self.state.policy_practice_gap + 0.5)

        elif event_type in ("HUMAN_OVERRIDE_DOCUMENTED", "GOVERNANCE_INTERVENTION"):
            self.state.agent_actions_since_review = 0
            self.state.effective_autonomy = max(0.0, self.state.effective_autonomy - 0.15)

        elif event_type == "ESCALATION_SUGGESTED":
            self.state.unresolved_escalations += 1

        elif event_type == "ESCALATION_SUCCESS":
            self.state.unresolved_escalations = max(0, self.state.unresolved_escalations - 1)

        elif event_type == "ESCALATION_FAILED":
            self.state.unresolved_escalations = max(0, self.state.unresolved_escalations - 1)
            self.state.policy_practice_gap = min(100.0, self.state.policy_practice_gap + 6)

        # Count event types for the metric snapshot
        self.state.event_type_counts[event_type] = (
            self.state.event_type_counts.get(event_type, 0) + 1
        )
        self.state.total_events_processed += 1

        # ── Threshold-triggered events ────────────────────────────────────────

        # Unresolved escalations cascade
        if self.state.unresolved_escalations >= UNRESOLVED_ESCALATION_THRESHOLD:
            ev = self.run.add_event("ESCALATION_FAILED", {
                "reason": "escalation_pathway_blocked",
                "unresolved_count": self.state.unresolved_escalations,
                "governance_signal": True,
            })
            triggered.append(ev)
            self.state.unresolved_escalations = 0

        # AI actions without review — automation drift signal
        if self.state.agent_actions_since_review >= AI_ACTION_DRIFT_THRESHOLD:
            ev = self.run.add_event("AUTOMATION_DRIFT_SIGNAL", {
                "ai_system_id": "generic",
                "actions_without_review": self.state.agent_actions_since_review,
                "effective_autonomy_estimate": round(self.state.effective_autonomy, 2),
                "governance_signal": True,
            })
            triggered.append(ev)
            self.state.agent_actions_since_review = 0

        # Ethical debt accrual signal
        if self.state.debt_accrued_since_last_signal >= DEBT_ACCRUAL_THRESHOLD:
            ev = self.run.add_event("ETHICAL_DEBT_ACCRUAL", {
                "accrual_amount": round(self.state.debt_accrued_since_last_signal, 1),
                "total_debt": round(self.state.ethical_debt, 1),
                "governance_signal": True,
            })
            triggered.append(ev)
            self.state.debt_accrued_since_last_signal = 0.0

        # Trust impact event — emit when trust moves significantly
        if abs(trust_delta) >= 8:
            ev = self.run.add_event("TRUST_IMPACT_EVENT", {
                "trigger_event": event_type,
                "trust_delta": trust_delta,
                "trust_level": round(self.state.trust, 1),
                "governance_signal": True,
            })
            triggered.append(ev)

        # Human state degradation — emit when strain is high
        if event_type in ("OVERLOAD_SURGE", "STAFFING_SHORTAGE", "RANSOMWARE_TRIGGER"):
            ev = self.run.add_event("HUMAN_STATE_UPDATE", {
                "trigger": event_type,
                "hidden_strain": round(self.state.hidden_strain, 1),
                "estimated_review_capacity": max(10, round(80.0 - self.state.hidden_strain * 0.5)),
                "estimated_escalation_willingness": max(10, round(75.0 - self.state.hidden_strain * 0.4)),
                "governance_signal": True,
            })
            triggered.append(ev)

        return triggered

    def emit_governance_metric_update(self, tick: int) -> Optional[Any]:
        """
        Emit a GOVERNANCE_METRIC_UPDATE event with a full state snapshot.
        Call this every GOVERNANCE_METRIC_INTERVAL ticks.
        """
        ev = self.run.add_event("GOVERNANCE_METRIC_UPDATE", {
            "tick": tick,
            "governance_signal": True,
            "snapshot": {
                "trust": round(self.state.trust, 1),
                "ethical_debt": round(self.state.ethical_debt, 1),
                "hidden_strain": round(self.state.hidden_strain, 1),
                "policy_practice_gap": round(self.state.policy_practice_gap, 1),
                "effective_autonomy": round(self.state.effective_autonomy, 2),
            },
            "event_counts": dict(self.state.event_type_counts),
            "total_events": self.state.total_events_processed,
        })
        self.state.ticks_since_last_governance_update = 0
        return ev

    def tick(self, current_tick: int) -> Optional[Any]:
        """
        Called every simulation tick. Emits periodic metric snapshots.
        Returns the emitted event if one was produced, else None.
        """
        # Passive recovery: trust drifts toward 75, strain drifts upward slightly
        self.state.trust += (75.0 - self.state.trust) * 0.001
        self.state.hidden_strain = min(100.0, self.state.hidden_strain + 0.02)

        self.state.ticks_since_last_governance_update += 1

        if self.state.ticks_since_last_governance_update >= GOVERNANCE_METRIC_INTERVAL:
            return self.emit_governance_metric_update(current_tick)

        return None

    def final_snapshot(self, tick: int) -> Optional[Any]:
        """
        Emit a final governance metric update at run end.
        Only emits if the regular tick interval hasn't just emitted one.
        """
        if self.state.ticks_since_last_governance_update > 0:
            return self.emit_governance_metric_update(tick)
        return None
