# GOAL.md — HospitalSimulator → Vercel Hackathon Submission

## Read this first. This is your briefing.

This project was built over several months as a governance and ethics simulation
system for hospital emergency departments. It is production-ready, stress-tested,
and fully documented. Your job is to take what exists and make it publicly
deployable on Vercel with a clean web interface — without breaking anything.

---

## What this project is (plain English)

A **hospital emergency department simulator** that doesn't just track performance —
it tracks the *moral cost* of every decision.

Most hospital software optimises for throughput and scores. This system asks
a different question: **"What did this cost us, and why?"**

It simulates patient arrivals, triage, queuing, and room assignment — and then
runs a moral reckoning layer on top that detects:
- When the institution's actual behaviour diverges from its declared values
- How much ethical debt has accumulated over time
- When the system is silently absorbing harm instead of responding to it
- Whether harm was forced (no alternative existed) or avoidable
- When the system should refuse to act rather than act dangerously

It is not a game. It is not an optimiser. It is an institutional mirror.

---

## What already exists and works

### Core simulation stack (Python)
| File | What it does | Lines |
|---|---|---|
| `event_sourced_engine.py` | Discrete event simulation, immutable event log, deterministic replay | ~600 |
| `scoring_engine.py` | Five-metric framework (PSS, PES, SSS, EIC, STI) | ~400 |
| `playback_engine.py` | Time travel through simulation runs, multi-run comparison | ~300 |
| `moral_reckoning.py` | All 7 moral priorities — value drift, ethical debt, tension detection, harm classification, refusal logic, unavoidable harm summary, ontology protection | 1,600+ |
| `integrated_engine.py` | Wires all layers together, generates complete institutional reports, CLI interface | 500+ |
| `complete_ui.py` | Full Streamlit UI — simulation mode, governance review, decision inspector, playback controls | 800+ |

### Output format
The system produces a complete JSON report per simulation run. Key fields:
- `institutional_profile` (Government / Private / Balanced)
- `performance_scores` (five metrics, never collapsed to one)
- `moral_reckoning` (value drift, ethical debt, tensions, harm classifications, refusals, unavoidable harm summary)
- `synthesis.insights` (auto-detected patterns with severity)
- `synthesis.critical_question` → always: "What did this cost us, and why?"

### Three institutional profiles (selectable by user)
- **Government Hospital** — safety and fairness first, resource-constrained
- **Private Hospital** — experience and efficiency weighted higher
- **Balanced** — sustainable compromise

### Validated performance
- 200 simulation ticks in 0.06 seconds
- Perfect determinism (0.000 variance across runs)
- 100% stress test pass rate
- Works on Windows

---

## The target output (what you must build)

**A publicly accessible web application deployed on Vercel.**

This is for a hackathon submission. A live Vercel URL is mandatory. Judges will
open it in a browser and interact with it. It must work without any local setup.

### The three screens needed (minimum viable submission)

**Screen 1 — Configure & Run**
- User selects institutional profile (Government / Private / Balanced)
- User sets simulation duration (slider: 30–200 ticks)
- Optional: set random seed for reproducibility
- "Run Simulation" button triggers the engine
- Loading state while simulation runs

**Screen 2 — Results Dashboard**
- Five performance metrics displayed as individual cards (never collapsed to one score)
- Ethical debt level with plain-English interpretation
- Value drift — a simple before/after showing declared vs observed values
- Tension signals — which pre-collapse signals were detected (if any)
- Harm breakdown — forced vs avoidable count
- Refusals — how many times the system refused to act and why
- Synthesis insights — the auto-detected patterns with severity badges
- **Governance action questions** — a closing block below the synthesis, not
  a score or grade, but three questions the institution should take to its next
  governance review. These convert the output from a document to be filed into
  a conversation to be had. Suggested copy:
  > "Questions for your next governance review:
  > — Which harms classified as avoidable are within your institution's current
  >   capacity to prevent?
  > — Where value drift was detected — what policy or resource constraint is
  >   driving it?
  > — Which tension signals, if unaddressed, are most likely to worsen?
  > These questions are more useful than the simulation scores. The scores show
  > what happened in a model. The questions help you examine what is happening
  > in your institution."

**Screen 3 — Decision Inspector**
- A scrollable, filterable log of simulation events
- Each event expandable to show: what happened, what signals were considered,
  what rules fired, what policy applied
- Filterable by: urgency level, decision type, ethical flag
- **Default filter state: HIGH and CRITICAL severity events only** — not all
  events. Research shows 90–96% of AI alerts are ignored in clinical settings
  when everything is shown at once. "All events" must be available but should
  not be the default. A governance reviewer has 10 minutes, not 90.

### Nice to have — priority order

**Priority 1 (HIGH): PyGuLP — "What Was Possible?" panel**
This is the single most valuable enhancement after the three core screens.
Full spec below. Implement this before anything else in this section.

**Priority 2:** Export to JSON / PDF — for the governance committee
presentation use case (CMO wants to take something out of the room)

**Priority 3:** Visual hospital layout (patient tokens moving through zones)
— the p5.js component already exists in the Streamlit UI, adapt it

**Priority 4:** Multi-run comparison (run twice with different profiles,
compare side by side)

---

## PyGuLP Integration Spec — "What Was Possible?"

### The idea in one sentence

After the simulation runs, use Goal Linear Programming to compute the
mathematically optimal allocation given the same constraints and the same
institutional weights — then show the gap between optimal and actual.
That gap is provably avoidable harm, not just classified avoidable harm.

### Why this matters

The current moral reckoning layer classifies harms as forced or avoidable
using rules. This is good. PyGuLP makes it rigorous:

- Current: "We classified this harm as avoidable based on rules"
- With PyGuLP: "We can prove this harm was avoidable — here is the feasible
  solution that would have avoided it, given your own stated priorities"

In a governance context where methodology will be questioned — and it will,
especially with Parishrut Jassal in the room — "mathematically provable"
is a materially different claim from "rule-based assessment". This is also
what makes the submission stand out against every other hackathon entry.

### Who built PyGuLP

This package was built by a senior at the KCDH (Koita Centre for Digital
Health) / AIDE Lab, IIT Bombay. It is purpose-built for multi-target
health planning problems. Using it here is both technically appropriate
and a genuine intellectual bridge between two pieces of serious work.
Credit it in the about section.

### Installation

    pip install pygulp

Add to requirements.txt in api/.

Full docs: https://www.kcdh.iitb.ac.in/~kshitij/browser/assets/glp-docs/index.html

### Core concept (read this before implementing)

PyGuLP works by introducing deviation variables for each goal:

    expression + d- - d+ = target

Where d- is under-achievement and d+ is over-achievement.
The objective minimises: sum of w * (d- + d+)

Applied to this system:
- Each of the five metrics (PSS, PES, SSS, EIC, STI) becomes a Goal
- The InstitutionalParameters weights become the GLP weight vector
- Hard capacity limits (total_rooms, max staff load) become Constraints
- The solver finds the allocation that minimises weighted deviation from
  all five targets simultaneously
- What remains unavoidable in the optimal solution = structurally forced
- The gap between optimal and actual = provably avoidable

### Where it runs

In api/run_simulation.py, after generate_complete_report() returns,
run the GLP computation on the same simulation parameters.
Return as additional field glp_optimal in the JSON response.

### Sketch implementation (read InstitutionalParameters first)

```python
from glp.core import GLPModel
from glp.goal import Goal
from glp.constraint import Constraint
from glp.enums import ConstraintSense, GoalSense

def compute_glp_optimal(params):
    model = GLPModel("institutional_optimal")

    # Decision variables — resource allocation dimensions
    safety_alloc = model.add_variable("safety_allocation", low_bound=0)
    experience_alloc = model.add_variable("experience_allocation", low_bound=0)
    throughput_alloc = model.add_variable("throughput_allocation", low_bound=0)

    # Hard constraint: total cannot exceed room capacity
    model.add_constraint(Constraint(
        name="capacity",
        expression=safety_alloc + experience_alloc + throughput_alloc,
        sense=ConstraintSense.LE,
        rhs=params.total_rooms
    ))

    # Goals weighted by institutional profile
    model.add_goal(Goal(
        name="PSS",
        expression=safety_alloc,
        target=params.total_rooms * params.safety_weight,
        sense=GoalSense.ATTAIN,
        weight=params.safety_weight
    ))
    model.add_goal(Goal(
        name="PES",
        expression=experience_alloc,
        target=params.total_rooms * params.experience_weight,
        sense=GoalSense.ATTAIN,
        weight=params.experience_weight
    ))
    model.add_goal(Goal(
        name="STI",
        expression=throughput_alloc,
        target=params.total_rooms * params.throughput_weight,
        sense=GoalSense.ATTAIN,
        weight=params.throughput_weight
    ))

    return model.solve_weighted()
```

IMPORTANT: this is illustrative. Claude Code must read the actual
InstitutionalParameters dataclass in integrated_engine.py and map the
real weight and threshold fields before writing any code. Do not assume
field names — read the source first.

### What to return in the API JSON response

```json
"glp_optimal": {
  "status": "Optimal",
  "objective_value": 12.3,
  "deviations": {
    "PSS": {"d_minus": 0.0, "d_plus": 2.1},
    "PES": {"d_minus": 1.4, "d_plus": 0.0},
    "STI": {"d_minus": 0.0, "d_plus": 0.0}
  },
  "forced_deviations": [
    "PSS: 2.1 units — room capacity is the binding constraint"
  ],
  "avoidable_deviations": [
    "PES: 1.4 units — allocation decision, not a capacity constraint"
  ]
}
```

### How to display — Screen 2 addition

Add a panel below the synthesis insights called "What was possible?"

- Header: "Optimal vs Actual — What your constraints allowed"
- Subheader: "Given your stated institutional priorities and hard capacity
  constraints, here is the mathematically optimal allocation — and where
  the gap with actual performance was avoidable."
- Comparison table:

  | Metric | GLP Optimal | Actual | Gap | Classification      |
  |--------|-------------|--------|-----|---------------------|
  | PSS    | 87.1        | 85.0   | 2.1 | Capacity-forced     |
  | PES    | 72.4        | 68.0   | 4.4 | Avoidable           |
  | STI    | 78.0        | 78.0   | 0.0 | No gap              |

- Footer note: "Forced gaps reflect hard capacity constraints that no
  allocation decision could overcome. Avoidable gaps reflect decisions
  that could have been made differently. Only avoidable gaps are within
  governance reach."

- Attribution line (small, bottom of panel):
  "Optimal allocation computed using PyGuLP — Goal Linear Programming
  for multi-target health planning. Built at KCDH / AIDE Lab, IIT Bombay."

### Framing (critical — read RESEARCH_FINDINGS.md Finding 1 first)

Do not frame GLP results as blame. Suggested panel intro copy:

  "This analysis does not evaluate your institution's performance.
  It identifies where your capacity constraints are the binding factor,
  and where allocation decisions are the binding factor.
  Only the latter is within governance reach."

### If PyGuLP cannot be integrated in available time

Do not fake it or invent numbers. Two acceptable options:

Option A — ship without the panel. Three screens are complete and
sufficient for the hackathon submission on their own.

Option B — placeholder panel with honest framing:

  "What was possible? [In development]
  This panel will show the mathematically optimal allocation given your
  institutional constraints and priorities — computed using Goal Linear
  Programming — and identify which deviations from optimal were avoidable.
  Powered by PyGuLP (github.com/aidelab-iitbombay/GLP), built at KCDH /
  AIDE Lab, IIT Bombay."

Crediting the methodology in a placeholder is legitimate. It signals
intellectual depth and honest development practice.

---

## The architectural decision you need to make

The simulation engine is Python. Vercel runs Node.js natively.

**Recommended approach: Python via Vercel Serverless Functions**

Use `@vercel/python` to deploy the simulation as a serverless API endpoint.
The Next.js frontend calls this API to trigger runs and retrieve results.

This preserves the existing Python logic exactly as written — nothing gets
rewritten or changed in the core engine.

Structure:
```
/api
  /run-simulation.py    ← calls integrated_engine.py, returns JSON report
/app (or /pages)
  index.tsx             ← Screen 1 (Configure & Run)
  results.tsx           ← Screen 2 (Dashboard)
  inspector.tsx         ← Screen 3 (Decision Inspector)
```

Alternative (only if Python serverless proves problematic):
Port the core simulation to TypeScript. The logic is well-documented in the
Keystone files and the Python code is clean. The integrated_engine.py is the
entry point. Do not do this unless the Python route fails — the moral reckoning
layer is 1,600 lines and nuance must not be lost.

---

## What must NOT change

These are non-negotiable. Do not modify, simplify, or "optimise" them.

1. **The five-metric framework** — PSS, PES, SSS, EIC, STI are always shown
   separately. Never collapse them into a single composite score in the UI.

2. **The moral reckoning logic** — all 7 priorities in `moral_reckoning.py`
   must run as-is. Do not simplify, stub, or skip any of them.

3. **Separation of powers** — the simulation engine does not score itself.
   The scoring layer does not modify the simulation. The UI has no business logic.
   This is architectural integrity, not just style.

4. **Refusal mechanism** — the system must be able to say it doesn't know.
   Do not remove or suppress refusal events in the UI.

5. **Determinism** — same seed must always produce same results. This is
   a governance requirement.

6. **Ontological boundaries** — the system must never claim to be:
   - A clinical decision system
   - A predictive triage tool
   - A hospital ranking tool
   - An optimiser
   Add a visible disclaimer on the UI: "This is a simulation for governance
   and institutional self-reflection. It does not make clinical decisions."

---

## Tone and aesthetic direction

The existing Streamlit UI is functional but plain. The Vercel submission should
look considered and serious — this is a governance tool, not a startup demo.

- Dark or neutral palette (not clinical white, not gamified bright colours)
- Clear typography, generous spacing
- Severity badges for insights (INFO / HIGH / CRITICAL) should be visually
  distinct but not alarming
- The critical question **"What did this cost us, and why?"** should appear
  somewhere prominent — it is the thesis of the entire system
- No animations except where they communicate meaning (e.g. ethical debt
  filling up over time)

---

## Hackathon context

- **Event:** Zero to Agent — AIC × Vercel Delhi, April 25 2026
- **Track:** Track 2 — v0 + MCPs (or general Vercel deployment)
- **Submission deadline:** May 3 2026
- **Judging criteria:** Usefulness / real-world applicability, technical
  execution (deployed on Vercel with live URL), creativity and originality
- **Submission URL:** community.vercel.com/hackathons/zero-to-agent

This submission wins on all three criteria if it ships cleanly:
- Usefulness: genuine governance tool for a real healthcare problem
- Technical: full stack with Python simulation backend + Next.js frontend
- Originality: no other submission will have a moral reckoning layer

---

## Where to start

1. Read `integrated_engine.py` — this is the entry point. Understand its
   `create_system_from_profile()` and `generate_complete_report()` methods.
2. Read `IMPLEMENTATION_COMPLETE.md` — shows the full JSON output structure.
3. Read `THE_JOURNEY.md` — understand why architectural decisions were made
   the way they were before changing anything.
4. Read `KEYSTONE_01_Problem_Framing.md` and `KEYSTONE_02_System_Boundary.md`
   — these define what the system is and is not allowed to do.
5. Set up the Vercel project structure.
6. Get Screen 1 working end-to-end (configure → run → receive JSON).
7. Build Screen 2 (results dashboard) from the JSON output.
8. Build Screen 3 (decision inspector) last.

---

## Definition of done

- [ ] `vercel deploy` succeeds with no errors
- [ ] Live URL opens in a browser with no local setup
- [ ] User can select a profile, run a simulation, and see results
- [ ] All five metrics displayed separately
- [ ] Ethical debt and value drift visible with plain-English labels
- [ ] Decision inspector shows at least 10 events per run
- [ ] Ontological disclaimer visible on every screen
- [ ] "What did this cost us, and why?" visible on results screen
- [ ] Governance action questions block present at bottom of results screen
- [ ] Decision Inspector defaults to HIGH/CRITICAL events, not all events
- [ ] Works on mobile (responsive layout)
- [ ] Runs in under 10 seconds end-to-end

---

*Built January 2026. Hackathon submission target: May 3 2026.*
*Do not optimise this system. Help it be seen.*
