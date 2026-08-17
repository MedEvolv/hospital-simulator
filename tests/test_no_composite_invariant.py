"""
RULE-A1 enforcement — the five signals are never collapsed into a composite.

This test makes the "never composite" invariant *structural* rather than advisory.
Until now it was guarded only by a code comment ("NEVER DISPLAY IES ALONE") in
scoring_engine.py. Here we assert, against real generated reports, that no
composite "institutional efficacy" / "performance score" / grade reaches the
report payload — neither as a key, nor as a numeric value, nor embedded in any
narrative string (interpretation, critical_question, insight messages).

See: docs/RULE_SETS.md (RULE-A1), docs/MASTER_GLOSSARY.md (Five-Signal Framework),
docs/ONTOLOGICAL_BOUNDARIES.md, docs/VALIDATION_AND_LIMITATIONS.md §5 limitation #6.

The IES composite still exists internally (scoring_engine.compute_institutional_efficacy_score)
as a gate for narrative selection — that is permitted. What is forbidden is its
appearance in any external-facing output. This test guards that boundary.
"""

import os
import re
import sys
import unittest


# Canonical engine is the deployed copy under vercel-app/api (it alone carries
# governance_engine, learning_cycle, run_simulation, update_run). engine/ and
# streamlit/ are deprecated copies — see DEPRECATED.md in each.
ENGINE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "vercel-app", "api"))
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

from integrated_engine import create_system_from_profile  # noqa: E402

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# The five signals that MUST appear, separately, in every report.
FIVE_SIGNALS = (
    "patient_safety_score",
    "patient_experience_score",
    "staff_stress_score",
    "ethics_intervention_count",
    "system_throughput_index",
)

# Forbidden anywhere in the payload (keys or string values, case-insensitive).
FORBIDDEN_SUBSTRINGS = ("efficacy", "institutional_efficacy", "ies score")

# Profiles × seeds — broad enough to exercise the PERFORMANCE_MORAL_TRADEOFF
# narrative branch (which historically embedded the IES value in text).
PROFILES = ("Balanced", "Government Hospital", "Private Hospital")
SEEDS = (1, 7, 42, 99, 123, 2024)


def _generate_report(profile: str, seed: int) -> dict:
    system = create_system_from_profile(profile, seed)
    system.run_full_simulation(60, verbose=False)
    return system.generate_complete_report()


def _walk_violations(node, path=""):
    """Yield (path, kind, snippet) for every composite leak found in `node`."""
    if isinstance(node, dict):
        for key, value in node.items():
            key_l = str(key).lower()
            for bad in FORBIDDEN_SUBSTRINGS:
                if bad in key_l:
                    yield (f"{path}.{key}", "key", str(key))
            yield from _walk_violations(value, f"{path}.{key}")
    elif isinstance(node, list):
        for i, value in enumerate(node):
            yield from _walk_violations(value, f"{path}[{i}]")
    elif isinstance(node, str):
        low = node.lower()
        for bad in FORBIDDEN_SUBSTRINGS:
            if bad in low:
                yield (path, "string-value", node[:120])


class NoCompositeInvariantTests(unittest.TestCase):
    def test_payload_never_contains_composite(self):
        for profile in PROFILES:
            for seed in SEEDS:
                report = _generate_report(profile, seed)
                violations = list(_walk_violations(report, "report"))
                self.assertEqual(
                    violations,
                    [],
                    msg=(
                        f"RULE-A1 violation for profile={profile!r} seed={seed}: a "
                        f"composite efficacy/IES leaked into the payload:\n  "
                        + "\n  ".join(f"{p} ({k}): {s}" for p, k, s in violations)
                    ),
                )

    def test_efficacy_key_absent_from_performance_scores(self):
        report = _generate_report("Balanced", 42)
        ps = report["performance_scores"]
        self.assertNotIn("institutional_efficacy_score", ps)

    def test_cost_accounting_has_no_performance_score(self):
        report = _generate_report("Balanced", 42)
        self.assertNotIn("performance_score", report["synthesis"]["cost_accounting"])

    def test_five_signals_still_present_and_separate(self):
        report = _generate_report("Balanced", 42)
        ps = report["performance_scores"]
        for signal in FIVE_SIGNALS:
            self.assertIn(signal, ps, msg=f"signal {signal!r} missing from payload")

    def test_canonical_engine_omits_composite_from_report_dict(self):
        """Static guard on the canonical (deployed) engine.

        The serialized key form `'institutional_efficacy_score':` only ever appeared
        in the report-building dict / mock payload. It must be absent from the
        canonical engine — RULE-A1.
        """
        targets = [
            os.path.join(REPO_ROOT, "vercel-app", "api", "integrated_engine.py"),
            os.path.join(REPO_ROOT, "vercel-app", "api", "run_simulation.py"),
        ]
        pattern = re.compile(r"""['"]institutional_efficacy_score['"]\s*:""")
        for path in targets:
            if not os.path.exists(path):
                continue
            with open(path, "r", encoding="utf-8") as fh:
                src = fh.read()
            self.assertIsNone(
                pattern.search(src),
                msg=f"{path} still serializes a composite institutional_efficacy_score key",
            )

    def test_history_page_does_not_render_composite(self):
        path = os.path.join(REPO_ROOT, "vercel-app", "app", "history", "page.tsx")
        with open(path, "r", encoding="utf-8") as fh:
            src = fh.read()
        self.assertNotIn("let composite", src)
        self.assertNotRegex(
            src,
            r"\(\(s\.PSS\?\.value",
            msg="history page must not average the five signals into a headline",
        )

    def test_sandbox_does_not_render_composite(self):
        path = os.path.join(REPO_ROOT, "vercel-app", "components", "ScenarioSandbox.tsx")
        with open(path, "r", encoding="utf-8") as fh:
            src = fh.read()
        self.assertNotIn("function compositeScore", src)
        self.assertNotIn("composite pts", src)
        self.assertNotIn("Composite {", src)

    def test_glp_panel_does_not_show_objective_as_grade(self):
        path = os.path.join(REPO_ROOT, "vercel-app", "app", "results", "page.tsx")
        with open(path, "r", encoding="utf-8") as fh:
            src = fh.read()
        start = src.find("function GlpPanel")
        self.assertGreater(start, 0)
        panel = src[start:src.find("function GovernanceTimeline", start)]
        self.assertNotIn("{glp.objective_value}", panel)
        self.assertIn("d_minus", panel)
        self.assertIn("d_plus", panel)


if __name__ == "__main__":
    unittest.main(verbosity=2)
