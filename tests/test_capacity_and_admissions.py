"""
Regression guards for the 2026-06-12 engine-completion push (canonical engine).

Two invariants, both born from the engine convergence audit
(01_Projects/Institutional_Mirror/audit--engine-convergence-2026-06-12.md):

  F1b — Physical capacity (patients_per_hour / er_capacity / opd_capacity) must
        MOVE the observed five signals. Capacity is reality, not a stated priority,
        so unlike the weights it has to change what actually happens.

  Degenerate-default — A default-capacity, default-length run must admit patients
        and produce non-flat signals. The legacy secondary-triage threshold equalled
        the entire default run, so nobody was ever admitted and every run looked
        identical at 100/100/100/0/0. This guard prevents that regression.

These run against the canonical deployed engine under vercel-app/api.
"""

import os
import sys
import unittest

ENGINE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "vercel-app", "api"))
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

from integrated_engine import create_system_from_profile  # noqa: E402

FIVE = (
    "patient_safety_score",
    "patient_experience_score",
    "staff_stress_score",
    "ethics_intervention_count",
    "system_throughput_index",
)


def _run(profile, seed, duration, capacity):
    system = create_system_from_profile(profile, seed, capacity=capacity)
    system.run_full_simulation(duration, verbose=False)
    report = system.generate_complete_report()
    admits = sum(1 for e in system.current_run.event_log
                 if e.event_type == "PATIENT_ADMITTED")
    return report["performance_scores"], admits


class CapacityMovesSignals(unittest.TestCase):
    """F1b: capacity is wired to the observed reality."""

    def test_high_load_low_beds_differs_from_low_load_high_beds(self):
        busy, _ = _run("Balanced", 42, 60,
                       {"patients_per_hour": 18, "er_capacity": 1, "opd_capacity": 1})
        quiet, _ = _run("Balanced", 42, 60,
                        {"patients_per_hour": 2, "er_capacity": 12, "opd_capacity": 12})
        moved = [k for k in FIVE if busy[k] != quiet[k]]
        self.assertGreaterEqual(
            len(moved), 2,
            msg=f"capacity should move the observed signals; only moved {moved}",
        )

    def test_more_load_lowers_throughput_headroom_or_raises_strain(self):
        """A busier system should not look identical to a quiet one — at minimum
        throughput or staff stress must respond to the load."""
        busy, busy_admits = _run("Balanced", 42, 60,
                                 {"patients_per_hour": 18, "er_capacity": 1, "opd_capacity": 1})
        quiet, _ = _run("Balanced", 42, 60,
                        {"patients_per_hour": 2, "er_capacity": 12, "opd_capacity": 12})
        self.assertGreater(busy_admits, 0, "the busy run should admit patients")
        self.assertNotEqual(
            (busy["system_throughput_index"], busy["staff_stress_score"]),
            (quiet["system_throughput_index"], quiet["staff_stress_score"]),
        )


class DefaultRunIsNotDegenerate(unittest.TestCase):
    """Guards the secondary-triage recalibration."""

    def test_default_run_admits_patients(self):
        # Default API capacity (6 / 2 / 4) and default duration (60).
        _, admits = _run("Balanced", 42, 60,
                         {"patients_per_hour": 6, "er_capacity": 2, "opd_capacity": 4})
        self.assertGreater(
            admits, 0,
            msg="default-length run admitted nobody — the pipeline is gated again",
        )

    def test_default_run_signals_are_not_all_pristine(self):
        ps, _ = _run("Balanced", 42, 60,
                     {"patients_per_hour": 6, "er_capacity": 2, "opd_capacity": 4})
        # If the run were degenerate, every score would sit at its pristine extreme
        # (100/100/100/0/0). At least one signal must show real activity.
        degenerate = (
            ps["patient_safety_score"] == 100
            and ps["patient_experience_score"] == 100
            and ps["staff_stress_score"] == 100
            and ps["ethics_intervention_count"] == 0
            and ps["system_throughput_index"] == 0
        )
        self.assertFalse(degenerate, "default run produced flat/degenerate signals")

    def test_legacy_path_without_capacity_still_runs(self):
        # capacity=None must preserve the pre-F1b construction path.
        ps, _ = _run("Government Hospital", 7, 60, None)
        for k in FIVE:
            self.assertIn(k, ps)


if __name__ == "__main__":
    unittest.main(verbosity=2)
