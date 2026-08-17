/**
 * lib/domain — the canonical Institutional Mirror domain model.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE DOCS-AS-TYPES BRIDGE
 * ─────────────────────────────────────────────────────────────────────────────
 * These types ARE the documented spine, expressed in code. The documentation is the
 * source of truth; this module is its compile-time mirror:
 *
 *   docs/MASTER_GLOSSARY.md            → signals.ts (the five signals; EIC = count)
 *   docs/MORAL_RECKONING_SPECIFICATION → moral-reckoning.ts (the 7 priorities + NaHzHaR)
 *   docs/IMPLEMENTATION_COMPLETE.md    → run-result.ts (the engine↔UI contract)
 *   docs/RULE_SETS.md                  → encoded invariants (RULE-A1: no composite field)
 *
 * When the docs change, these types change. When the types drift from the docs, the build
 * is the alarm. This is the canon discipline (CANON_ALIGNMENT §7) made STRUCTURAL, not
 * advisory — the mechanism that stops the documentation from becoming a "beautiful corpse".
 *
 * Canonical signal model confirmed by bhai 2026-06-13 (the documented definitions, NOT the
 * drifted lib/types/simulation.ts names). This module supersedes that drift.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export * from './signals'
export * from './moral-reckoning'
export * from './run-result'
export * from './saved-run'
