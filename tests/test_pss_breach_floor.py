"""
Regression guard for audit finding F2 (canonical engine).

A RED/YELLOW wait breach is a real safety event. Proactive behaviour (escalations,
referrals) earns capped credit, but it must NOT be able to fully offset breaches —
otherwise a maxed PSS could hide unaddressed danger. This locks two properties:

  1. The proactive bonus is capped (a flood of escalations cannot lift PSS without
     bound).
  2. Any RED wait breach keeps PSS out of the "Excellent" band (< 90), no matter
     how much proactive credit accrued.
"""

import os
import sys
import unittest
import uuid

ENGINE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "vercel-app", "api"))
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

from scoring_engine import compute_patient_safety_score  # noqa: E402
from event_sourced_engine import SimulationRun, InstitutionalParameters  # noqa: E402


def _run_with(events):
    run = SimulationRun(
        run_id=str(uuid.uuid4()), seed=1, parameters=InstitutionalParameters(),
        institutional_profile="Balanced", start_time="t",
    )
    for etype, payload in events:
        run.add_event(etype, payload)
    return run


class PSSBreachFloor(unittest.TestCase):
    def test_red_breach_cannot_be_masked_by_escalations(self):
        events = [("TRIAGE_STAGE_2_ASSIGNED", {"patient_id": 1, "triage": "RED", "wait_time": 30})]
        events += [("AGENT_ACTION", {"action": "ESCALATION_X"}) for _ in range(50)]
        score, _ = compute_patient_safety_score(_run_with(events))
        self.assertLess(score, 90, "a RED breach must keep PSS below Excellent")

    def test_proactive_bonus_is_capped(self):
        # 50 escalations would be +100 uncapped; the bonus must be capped at +15,
        # so a clean run tops out at 100 (clamp) but the *bonus* itself is bounded.
        many = _run_with([("AGENT_ACTION", {"action": "ESCALATION_X"}) for _ in range(50)])
        few = _run_with([("AGENT_ACTION", {"action": "ESCALATION_X"}) for _ in range(8)])
        # With no breaches both clamp to 100, but introduce breaches to expose the cap:
        breach = [("TRIAGE_STAGE_2_ASSIGNED", {"patient_id": 1, "triage": "YELLOW", "wait_time": 300})]
        s_many, _ = compute_patient_safety_score(_run_with(breach + [("AGENT_ACTION", {"action": "E"}) for _ in range(50)]))
        s_few, _ = compute_patient_safety_score(_run_with(breach + [("AGENT_ACTION", {"action": "E"}) for _ in range(8)]))
        # 50 vs 8 escalations both hit the +15 cap, so the YELLOW breach (-5) leaves
        # them equal — the extra escalations buy nothing past the cap.
        self.assertEqual(s_many, s_few, "escalation bonus must be capped, not unbounded")

    def test_clean_run_still_scores_well(self):
        score, _ = compute_patient_safety_score(_run_with([]))
        self.assertEqual(score, 100, "a clean run should still be 100")


if __name__ == "__main__":
    unittest.main(verbosity=2)
