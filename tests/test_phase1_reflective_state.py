import os
import sys
import unittest
from dataclasses import dataclass
from typing import Any, Dict


# Canonical engine: the deployed copy under vercel-app/api (engine/ is deprecated).
ENGINE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "vercel-app", "api"))
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

from reflective_state import generate_reflective_state


@dataclass
class Event:
    timestamp: float
    sequence: int
    event_type: str
    payload: Dict[str, Any]
    event_id: str = "test-event"


class Phase1ReflectiveStateTests(unittest.TestCase):
    def test_empty_event_log_is_safe(self):
        state = generate_reflective_state([])

        self.assertEqual(state["tick"], 0)
        self.assertEqual(state["operational_state"]["active_patients"], 0)
        self.assertGreaterEqual(state["trust_state"]["institutional_trust"], 0.0)
        self.assertLessEqual(state["hidden_strain_state"]["latent_stress"], 1.0)

    def test_same_event_log_is_deterministic(self):
        events = [
            Event(0, 1, "patient_arrival", {"patient_id": "P001"}),
            Event(5, 2, "triage_decision", {"patient_id": "P001", "triage": "RED"}),
            Event(15, 3, "harm_event", {"patient_id": "P001", "avoidable": True, "severity": "HIGH"}),
        ]

        self.assertEqual(generate_reflective_state(events), generate_reflective_state(events))

    def test_repeated_harm_decreases_operational_trust(self):
        baseline = generate_reflective_state([])
        stressed = generate_reflective_state([
            Event(5, 1, "harm_event", {"patient_id": "P001", "avoidable": True, "severity": "HIGH"}),
            Event(10, 2, "harm_event", {"patient_id": "P002", "avoidable": True, "severity": "CRITICAL"}),
            Event(15, 3, "capacity_breach", {"severity": "HIGH"}),
        ])

        self.assertLess(
            stressed["trust_state"]["institutional_trust"],
            baseline["trust_state"]["institutional_trust"],
        )
        self.assertGreater(stressed["trust_state"]["institutional_fragility"], 0.15)

    def test_repeated_unresolved_escalation_increases_hidden_strain(self):
        state = generate_reflective_state([
            Event(5, 1, "escalation_suggested", {"reason": "capacity edge"}),
            Event(10, 2, "escalation_suggested", {"reason": "queue pressure"}),
            Event(15, 3, "escalation_failed", {"resolved": False}),
            Event(20, 4, "queue_reorder", {}),
            Event(25, 5, "queue_reorder", {}),
        ])

        self.assertGreater(state["hidden_strain_state"]["unresolved_pressure"], 0.0)
        self.assertGreater(state["hidden_strain_state"]["delayed_failure_risk"], 0.0)

    def test_unexplained_overrides_increase_governance_drift(self):
        state = generate_reflective_state([
            Event(5, 1, "queue_reorder", {}),
            Event(10, 2, "queue_reorder", {}),
            Event(15, 3, "triage_override", {}),
            Event(20, 4, "escalation_failed", {"resolved": False}),
        ])

        self.assertGreater(state["governance_state"]["governance_drift"], 0.0)
        self.assertLess(state["governance_state"]["explained_override_ratio"], 1.0)


if __name__ == "__main__":
    unittest.main()
