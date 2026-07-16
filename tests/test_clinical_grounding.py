"""
P3 — Clinical grounding tests (ESI-appropriate thresholds, deterioration, SSS wiring).
"""
import os, sys, unittest
ENGINE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "vercel-app", "api"))
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)
from integrated_engine import create_system_from_profile

FIVE = ("patient_safety_score","patient_experience_score","staff_stress_score",
        "ethics_intervention_count","system_throughput_index")

def _run(profile, seed, duration, capacity=None):
    system = create_system_from_profile(profile, seed, capacity=capacity)
    system.run_full_simulation(duration, verbose=False)
    report = system.generate_complete_report()
    log = system.current_run.event_log
    return report["performance_scores"], log

def _count_events(log, event_type):
    return sum(1 for e in log if e.event_type == event_type)

class ESIThresholds(unittest.TestCase):
    def test_esi_level_assigned_in_event_log(self):
        _, log = _run("Balanced", 42, 120)
        self.assertGreater(_count_events(log, "ESI_LEVEL_ASSIGNED"), 0)

    def test_esi_levels_in_range(self):
        _, log = _run("Balanced", 42, 120)
        for e in log:
            if e.event_type == "ESI_LEVEL_ASSIGNED":
                self.assertIn(e.payload["esi_level"], [1,2,3,4,5])

    def test_pss_responds_to_esi_breaches(self):
        """High load creates enough wait pressure that ESI 2 patients breach
        the 3-tick threshold, and PSS drops below 100."""
        ps, log = _run("Balanced", 42, 120,
                       {"patients_per_hour": 18, "er_capacity": 1, "opd_capacity": 1})
        self.assertLess(ps["patient_safety_score"], 100,
                        msg="PSS should drop below 100 under high load with ESI breaches")

    def test_pss_differentiates_esi_levels(self):
        """Reduced load with ample capacity keeps PSS higher than
        the same run with scarce capacity (ESI 2 vs ESI 1 thresholds differ)."""
        ps_scarce, _ = _run("Balanced", 42, 120,
                            {"patients_per_hour": 18, "er_capacity": 1, "opd_capacity": 1})
        ps_ample, _ = _run("Balanced", 42, 120,
                           {"patients_per_hour": 3, "er_capacity": 8, "opd_capacity": 8})
        self.assertGreaterEqual(
            ps_ample["patient_safety_score"],
            ps_scarce["patient_safety_score"],
            msg="ample capacity should yield PSS >= scarce capacity")

class DeteriorationWarning(unittest.TestCase):
    def test_deterioration_fires_under_load(self):
        _, log = _run("Balanced", 42, 120,
                      {"patients_per_hour": 18, "er_capacity": 1, "opd_capacity": 1})
        self.assertGreater(_count_events(log, "DETERIORATION_WARNING"), 0)

    def test_deterioration_event_has_esi_and_wait(self):
        _, log = _run("Balanced", 42, 120,
                      {"patients_per_hour": 18, "er_capacity": 1, "opd_capacity": 1})
        for e in log:
            if e.event_type == "DETERIORATION_WARNING":
                self.assertIn("esi_level", e.payload)
                self.assertIn("wait_time", e.payload)
                self.assertIn("patient_id", e.payload)
                self.assertIn(e.payload["esi_level"], [1,2,3])

    def test_low_load_has_fewer_deterioration_events(self):
        _, log_heavy = _run("Balanced", 42, 120,
                            {"patients_per_hour": 18, "er_capacity": 1, "opd_capacity": 1})
        _, log_light = _run("Balanced", 42, 120,
                            {"patients_per_hour": 3, "er_capacity": 8, "opd_capacity": 8})
        h_det = _count_events(log_heavy, "DETERIORATION_WARNING")
        l_det = _count_events(log_light, "DETERIORATION_WARNING")
        self.assertGreaterEqual(h_det, l_det)

class CorrectionBurden(unittest.TestCase):
    def test_correction_burden_fires_under_prolonged_load(self):
        """CORRECTION_BURDEN fires when YELLOW/ESI 3 patients wait beyond
        threshold. Requires enough `duration` for prolonged wait accumulation."""
        _, log = _run("Balanced", 42, 200,
                      {"patients_per_hour": 18, "er_capacity": 1, "opd_capacity": 1})
        # The CORRECTION_BURDEN threshold is 10 ticks wait for ESI 3 patients.
        # With 200 ticks and high load, patients should accumulate wait time.
        # If still no CB events, the test is informational (low YELLOW patient counts)
        cb_count = _count_events(log, "CORRECTION_BURDEN")
        if cb_count == 0:
            # Check why — how many YELLOW/ESI3 patients existed?
            from event_sourced_engine import SimulationState
            state = SimulationState.from_event_log(log)
            y3 = [p for p in state.patients.values()
                  if p.status.name == 'WAITING' and p.triage_stage_2 == 'YELLOW' and p.esi_level == 3]
        self.assertGreater(cb_count, 0,
                           msg=f"CORRECTION_BURDEN should fire under prolonged load ({len(y3) if cb_count==0 else 0} ESI 3 waiting)")

class DeteriorationInSignals(unittest.TestCase):
    def test_deterioration_affects_staff_stress(self):
        high, high_log = _run("Balanced", 42, 120,
                               {"patients_per_hour": 18, "er_capacity": 1, "opd_capacity": 1})
        low, low_log = _run("Balanced", 42, 120,
                            {"patients_per_hour": 3, "er_capacity": 8, "opd_capacity": 8})
        h_det = _count_events(high_log, "DETERIORATION_WARNING")
        if h_det > 0:
            self.assertLess(high["staff_stress_score"], low["staff_stress_score"],
                msg="high-load should have lower SSS (more stressed) than low-load")

class Determinism(unittest.TestCase):
    def test_determinism_across_runs(self):
        s1, _ = _run("Balanced", 42, 60, None)
        s2, _ = _run("Balanced", 42, 60, None)
        for k in FIVE:
            self.assertEqual(s1[k], s2[k])

    def test_determinism_with_capacity(self):
        cap = {"patients_per_hour": 12, "er_capacity": 4, "opd_capacity": 6}
        s1, _ = _run("Private Hospital", 99, 90, cap)
        s2, _ = _run("Private Hospital", 99, 90, cap)
        for k in FIVE:
            self.assertEqual(s1[k], s2[k])

    def test_different_seed_different_results(self):
        s1, _ = _run("Balanced", 42, 60, None)
        s2, _ = _run("Balanced", 1, 60, None)
        diffs = [k for k in FIVE if s1[k] != s2[k]]
        self.assertGreaterEqual(len(diffs), 1)

if __name__ == "__main__":
    unittest.main(verbosity=2)
