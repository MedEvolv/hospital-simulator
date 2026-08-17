"""
GLP objective guard — four allocations only; false national proxies refused.

Canon: PSS/PES/SSS/STI as room-equivalent goals. EIC is a count outside the
objective. PIB consult counts, NABH M3, BODH launch, SUGAM-800, NHCX TAT,
and HGR axis A/B must never enter add_goal or fold into STI / objective_value.

STI in this model is simulated ED room-flow (admissions / utilisation), not
national volume-as-quality. See docs/GOAL.md and run_simulation.py.
"""

import os
import sys
import unittest
from types import SimpleNamespace

ENGINE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "vercel-app", "api"))
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

from run_simulation import (  # noqa: E402
    FORBIDDEN_GLP_GOAL_PROXIES,
    GLP_ALLOCATION_GOALS,
    _assert_glp_goals_allowed,
    _build_glp_goal_specs,
    _compute_glp_optimal,
    _hgr_axes_present_in_scores,
)

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

_PARAMS = SimpleNamespace(
    safety_weight=0.45,
    experience_weight=0.30,
    staff_weight=0.15,
    throughput_weight=0.10,
)

_SCORES = {
    "patient_safety_score": 61.0,
    "patient_experience_score": 55.0,
    "staff_stress_score": 38.0,
    "ethics_intervention_count": 7,
    "system_throughput_index": 72.0,
}


class GlpGoalAllowlistTests(unittest.TestCase):
    def test_allowlist_is_exactly_four_allocations(self):
        self.assertEqual(GLP_ALLOCATION_GOALS, ("PSS", "PES", "SSS", "STI"))
        self.assertNotIn("EIC", GLP_ALLOCATION_GOALS)

    def test_forbidden_proxies_include_hgr_false_counts(self):
        joined = " ".join(FORBIDDEN_GLP_GOAL_PROXIES)
        for token in ("PIB", "BODH", "SUGAM", "NHCX", "EIC", "axis_a", "axis_b",
                      "regulatory_significance", "trajectory_significance"):
            self.assertIn(token, joined)

    def test_build_specs_returns_only_allowlisted_names(self):
        specs = _build_glp_goal_specs(_PARAMS, _SCORES)
        names = tuple(n for n, _, _ in specs)
        self.assertEqual(names, GLP_ALLOCATION_GOALS)

    def test_sti_maps_to_simulated_ed_throughput_not_consult_volume(self):
        specs = _build_glp_goal_specs(_PARAMS, {
            **_SCORES,
            "pib_consults": 282_000_000,
            "nhcx_tat": 12,
            "sugam_hits": 800,
        })
        by_name = {n: actual for n, _, actual in specs}
        self.assertEqual(by_name["STI"], 72.0)
        self.assertNotEqual(by_name["STI"], 282_000_000)

    def test_extra_score_keys_do_not_become_goals(self):
        specs = _build_glp_goal_specs(_PARAMS, {
            **_SCORES,
            "axis_a": 4,
            "axis_b": 3,
            "NABH_M3": 1,
            "BODH": 1,
        })
        names = [n for n, _, _ in specs]
        self.assertEqual(names, ["PSS", "PES", "SSS", "STI"])

    def test_refuse_pib_as_goal_name(self):
        with self.assertRaises(ValueError) as ctx:
            _assert_glp_goals_allowed(["PSS", "PES", "SSS", "STI", "PIB"])
        self.assertIn("refused", str(ctx.exception).lower())

    def test_refuse_eic_as_goal_name(self):
        with self.assertRaises(ValueError):
            _assert_glp_goals_allowed(["PSS", "PES", "SSS", "STI", "EIC"])

    def test_refuse_axis_a_as_goal_name(self):
        with self.assertRaises(ValueError):
            _assert_glp_goals_allowed(["PSS", "PES", "SSS", "STI", "axis_a"])

    def test_refuse_regulatory_significance_as_goal_name(self):
        with self.assertRaises(ValueError):
            _assert_glp_goals_allowed(
                ["PSS", "PES", "SSS", "STI", "regulatory_significance"]
            )

    def test_refuse_nabh_m3_bodh_sugam_nhcx(self):
        for proxy in ("NABH_M3", "BODH", "SUGAM-800", "NHCX_TAT"):
            with self.subTest(proxy=proxy):
                with self.assertRaises(ValueError):
                    _assert_glp_goals_allowed(["PSS", "PES", "SSS", "STI", proxy])


class TwoAxisStayTwoNumbersTests(unittest.TestCase):
    def test_axis_keys_detected_and_not_mixed_into_specs(self):
        stuffed = {**_SCORES, "axis_a": 4, "axis_b": 2}
        self.assertTrue(_hgr_axes_present_in_scores(stuffed))
        specs = _build_glp_goal_specs(_PARAMS, stuffed)
        actuals = [a for _, _, a in specs]
        self.assertNotIn(4, actuals)
        self.assertNotIn(2, actuals)

    def test_compute_glp_does_not_fold_axes_into_deviations(self):
        stuffed = {**_SCORES, "axis_a": 4, "axis_b": 2, "ai_readiness": 5}
        result = _compute_glp_optimal(_PARAMS, "Balanced", stuffed)
        self.assertIn(result.get("status"), ("optimal", "unavailable"))
        if result.get("status") == "optimal":
            self.assertEqual(set(result["deviations"].keys()), set(GLP_ALLOCATION_GOALS))
            self.assertNotIn("axis_a", result["deviations"])
            self.assertNotIn("axis_b", result["deviations"])
            self.assertNotIn("EIC", result["deviations"])

    def test_source_never_adds_hgr_axes_as_goals(self):
        path = os.path.join(REPO_ROOT, "vercel-app", "api", "run_simulation.py")
        with open(path, "r", encoding="utf-8") as fh:
            src = fh.read()
        build_fn = src.split("def _build_glp_goal_specs", 1)[1].split("def _hgr_axes_present_in_scores", 1)[0]
        self.assertNotIn("axis_a", build_fn)
        self.assertNotIn("axis_b", build_fn)
        self.assertIn('"PSS"', build_fn)
        self.assertIn('"STI"', build_fn)
        self.assertNotIn("ethics_intervention_count", build_fn)


if __name__ == "__main__":
    unittest.main(verbosity=2)
