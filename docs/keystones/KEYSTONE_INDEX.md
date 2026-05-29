# KEYSTONE DOCUMENTS - Complete Index

**Living Hospital Orchestration Simulator**  
**Version:** 2.0 (Moral Reckoning Edition)  
**Date:** January 27, 2026  
**Status:** Production-Ready, Governance-Grade

---

## What These Documents Are

The **Keystone Documents** define the non-negotiable architectural, ethical, and governance principles of the Living Hospital Orchestration Simulator.

They are called "keystones" because:
- They bear the weight of the entire system
- Remove any one, and the structure fails
- They define what the system IS and IS NOT
- They protect against mission drift and misuse

**These are not feature specs. These are guardrails for institutional trust.**

---

## Complete Document Set

### Core System Definition (Keystones 1-4)

**[KEYSTONE 1: Problem Framing, Scope, and Explicit Non-Goals](KEYSTONE_01_Problem_Framing.md)**
- What problem this solves (institutional moral reckoning)
- What this system IS (mirror for truth-telling)
- What this system IS NOT (optimizer, ranker, predictor)
- Success criteria and anti-success indicators
- The critical question: "What did this cost us, and why?"

**Status:** ✅ **COMPLETE** - Updated with moral reckoning layer  
**Priority:** CRITICAL - Read this first

---

**[KEYSTONE 2: System Boundary, Data Posture, and ABDM Alignment](KEYSTONE_02_System_Boundary.md)**
- Synthetic data only (no PHI, no real patients)
- ABDM conceptual alignment (not technical integration)
- Historical data as context, present conditions as authority
- Data flow architecture (three-layer separation)
- Privacy and patient identity (numeric IDs only)
- Moral reckoning data boundaries

**Status:** ✅ **COMPLETE** - Updated with moral data structures  
**Priority:** CRITICAL - Defines data safety

---

**[KEYSTONE 3: System Architecture, Separation of Powers, Control Surfaces](KEYSTONE_03_System_Architecture.md)**
- Four-layer architecture (simulation → playback → interpretation → presentation)
- "No layer both decides and explains"
- Event log as spine
- Deterministic execution
- Parameter immutability
- Integration with moral reckoning layer

**Status:** ✅ **COMPLETE** - Updated with moral integration  
**Priority:** CRITICAL - Defines architectural integrity

---

**[KEYSTONE 4: Simulation Engine Specification](KEYSTONE_04_Simulation_Engine.md)**
- Discrete event simulation (time-stepped, deterministic)
- Immutable agent loop (PERCEIVE→CLASSIFY→ORDER→CHECK→SURFACE→LOG)
- State model (derived from events, never stored)
- Patient object and queue model
- Triage logic (signals vs non-signals)
- Decision rules and safety overrides
- Performance characteristics (stress tested)

**Status:** ✅ **COMPLETE** - Updated with moral processing  
**Priority:** CRITICAL - Defines simulation mechanics

---

### Decision Logic and Evaluation (Keystones 5-6)

**[KEYSTONE 5: Orchestration Logic, Decision Rules, Safety Overrides](KEYSTONE_05_Summary.md)**
- Explicit signals (complaint, age, history)
- Non-signals (no diagnosis, outcomes, economics)
- Core actions (queue, room, escalate, defer, refer)
- FIFO within urgency
- Safety overrides (automatic, irrevocable, logged)
- Deferral and referral logic
- Human override contract

**Status:** ⚠️ **SUMMARY** - Full specs being compiled  
**Priority:** HIGH - Defines decision boundaries

---

**[KEYSTONE 6: Metrics, Scoring Framework, Institutional Efficacy](KEYSTONE_06_Summary.md)**
- Five metrics (PSS, PES, SSS, EIC, STI)
- Composite IES (never shown alone)
- Three institutional profiles (Government, Private, Balanced)
- NOT scoring diagnostic correctness or outcomes
- Trade-offs made visible, not resolved
- Integration with value drift detection

**Status:** ⚠️ **SUMMARY** - Full specs being compiled  
**Priority:** HIGH - Defines evaluation framework

---

### Presentation and Governance (Keystones 7-10)

**[KEYSTONE 7: Visualization, Human Legibility, Cognitive Safety](KEYSTONE_07_Summary.md)**
- SimCity-lite aesthetic (not game-like)
- Patient tokens (color for urgency, shape for state)
- Anonymous numeric IDs
- Ethical overrides visible
- Discrete time (no smooth animation)
- Playback controls (play, pause, step, reset)
- Chat bubbles as signals
- No agent avatar, no gamification
- Visual simulation with p5.js integration

**Status:** ⚠️ **SUMMARY** - Full specs being compiled  
**Priority:** MEDIUM - Defines user interface

---

**[KEYSTONE 8: Explainability, Auditability, Decision Inspection](KEYSTONE_08_Summary.md)**
- Decision Inspector (mandatory for every action)
- DecisionTrace structure (signals, rules, thresholds, policy)
- No LLM prose, no probabilities
- Clinical protocol anchoring (ESI, NEWS2)
- Persistent disclaimers
- Event-to-decision linking
- Export capability for governance review

**Status:** ⚠️ **SUMMARY** - Full specs being compiled  
**Priority:** HIGH - Defines audit capability

---

**[KEYSTONE 9: Parameter Tuning, Institutional Profiles, Controlled Learning](KEYSTONE_09_Summary.md)**
- "Change parameters, never logic"
- Tunable parameters explicit (thresholds, weights, modifiers)
- Non-tunable frozen (action types, rules, safety)
- Three profiles required (distinct value weightings)
- Tuning requires restart (new SimulationRun)
- TuningLog structure
- "Improvement allowed. Drift not."

**Status:** ⚠️ **SUMMARY** - Full specs being compiled  
**Priority:** MEDIUM - Defines controlled adaptation

---

**[KEYSTONE 10: Demo Narrative, Review Protocol, Institutional Adoption](KEYSTONE_10_Summary.md)**
- Demo flow (emptiness→load→fairness fail→orchestration→inspection)
- Governance Review Mode
- Profile switching and comparison
- Side-by-side analysis
- Ethics committee support
- "Better questions, not deployment"

**Status:** ⚠️ **SUMMARY** - Full specs being compiled  
**Priority:** MEDIUM - Defines institutional use

---

### Moral Reckoning Layer (Keystones 11-12) - NEW in v2.0

**[KEYSTONE 11: The Moral Reckoning Layer](KEYSTONE_11_Moral_Reckoning_Layer.md)**
- **Priority 1:** Value Drift Detection (declared vs observed)
- **Priority 2:** Ethical Debt Accumulation (cumulative moral weight)
- **Priority 3:** Pre-Collapse Tension Signals (silent absorption)
- **Priority 4:** Forced vs Chosen Harm (avoidability classification)
- **Priority 5:** Refusal to Act States (epistemic humility)
- **Priority 6:** Unavoidable Harm Summary (honest accounting)
- **Priority 7:** Ontology Protection (system boundaries)
- Complete export structure
- Use cases for ethics committees
- Validation and stress testing (100% pass rate)

**Status:** ✅ **COMPLETE** - Production-ready  
**Priority:** CRITICAL - Defines moral truth-telling

---

**[KEYSTONE 12: Ontological Boundaries (Priority 7 Detail)](KEYSTONE_12_Ontological_Boundaries.md)**
- What this system IS (stance toward uncertainty, refusal of closure)
- What this system IS NOT (optimizer, ranker, predictor, sales demo)
- Forbidden features (explicit NO list)
- Protection mechanisms
- Why boundaries matter
- How to enforce boundaries

**Status:** ✅ **COMPLETE** - Non-negotiable guardrails  
**Priority:** CRITICAL - Prevents misuse

---

## Document Status Summary

| Status | Count | Documents |
|--------|-------|-----------|
| ✅ Complete | 6 | KS 1, 2, 3, 4, 11, 12 |
| ⚠️ Summary | 6 | KS 5, 6, 7, 8, 9, 10 |

**Critical Path:** Keystones 1-4, 11-12 are complete and define the core system.

**In Progress:** Keystones 5-10 have summary placeholders and are being detailed based on:
- Original governance requirements
- Current implementation validation
- Stress test results
- Moral reckoning integration

---

## How to Read These Documents

### For First-Time Readers

**Start here:**
1. **KEYSTONE 1** - Understand the problem and what success means
2. **KEYSTONE 12** - Understand the boundaries (what this will NEVER be)
3. **KEYSTONE 11** - Understand the moral reckoning capability
4. **KEYSTONE 3** - Understand the architecture
5. Then read others as needed

### For Ethics Committees

**Focus on:**
- **KEYSTONE 1** - Problem framing and anti-success criteria
- **KEYSTONE 8** - Decision inspection and auditability
- **KEYSTONE 11** - Complete moral reckoning layer
- **KEYSTONE 12** - Ontological boundaries

### For Technical Teams

**Focus on:**
- **KEYSTONE 3** - System architecture and separation
- **KEYSTONE 4** - Simulation engine specification
- **KEYSTONE 2** - Data posture and boundaries
- **KEYSTONE 11** - Moral reckoning implementation

### For Leadership

**Focus on:**
- **KEYSTONE 1** - What problem this solves
- **KEYSTONE 11** - Value drift and ethical debt
- **KEYSTONE 12** - What this system will not become
- **KEYSTONE 6** - Metrics and scoring

---

## Key Principles Across All Keystones

### 1. Transparency Over Optimization

"Make trade-offs visible, not optimal."

**Implementation:**
- Five separate metrics (never combined into one)
- Ethical overrides logged and surfaced
- Value drift computed and shown
- Ethical debt tracked over time

### 2. Safety Primacy (Non-Negotiable)

"Safety violations trigger immediate escalation."

**Implementation:**
- RED patients cannot be downgraded
- Max wait thresholds are hard stops
- Safety overrides are irrevocable
- Safety weight ≥40% in scoring

### 3. Human Authority (Always)

"Every automated decision must have human override path."

**Implementation:**
- `human_override_allowed` flag in all actions
- Governance Review Mode for retrospective approval
- Decision Inspector shows override opportunities
- System refuses when uncertain (epistemic humility)

### 4. Auditability (Complete)

"Every decision must be reconstructible from event log."

**Implementation:**
- Event log is immutable and append-only
- Each event contains full decision context
- Harm classifications preserve justification
- Export capability for governance review

### 5. Epistemic Humility (NEW in v2.0)

"System must refuse to act when it cannot do so safely."

**Implementation:**
- Conflicting signals → refuse
- Insufficient data → refuse
- Policy ambiguity → refuse
- Harm threshold exceeded → refuse
- Uncertainty → call for human

### 6. Institutional Honesty (NEW in v2.0)

"System prevents institutional self-deception."

**Implementation:**
- Value drift detection (declared vs observed)
- Ethical debt accumulation (cumulative cost)
- Tension signals (silent absorption)
- Forced vs avoidable harm distinction
- Unavoidable harm summary

---

## The Critical Question

**This system exists to answer:**

### NOT: "Did we succeed?"
### NOT: "How efficient were we?"
### NOT: "What's our score?"

### YES: **"What did this cost us, and why?"**

This reframing is fundamental. It appears in:
- KEYSTONE 1: Problem Framing
- KEYSTONE 11: Moral Reckoning
- KEYSTONE 12: Ontological Boundaries

**This is the system's purpose. Everything else serves this question.**

---

## Version History

### Version 1.0 (Original)
- 10 keystone documents
- Core event-sourced architecture
- Five-metric scoring framework
- Decision inspection and audit
- Human override requirements
- Governance review support

### Version 2.0 (Current - Moral Reckoning Edition)
- **12 keystone documents** (added KS 11-12)
- All original keystones updated with moral integration
- **7 moral reckoning priorities fully implemented**
- **Stress tested: 100% pass rate, 200 ticks in 0.06s**
- Perfect determinism (0.000 variance)
- Production-ready validation
- Complete ontological boundary documentation

---

## Implementation Status

### Production-Ready Components

✅ **Event-Sourced Simulation Engine** (event_sourced_engine.py)
- Discrete event simulation
- Immutable event log
- Deterministic execution
- Stress tested: 200 ticks in 0.06s

✅ **Playback Engine** (playback_engine.py)
- Time travel capability
- Read-only state derivation
- Multi-run comparison

✅ **Scoring Engine** (scoring_engine.py)
- Five metrics: PSS, PES, SSS, EIC, STI
- Institutional Efficacy Score (IES)
- Three institutional profiles

✅ **Moral Reckoning Engine** (moral_reckoning.py)
- All 7 priorities operational
- 1,600+ lines of production code
- Complete data structures
- Stress tested: 100% pass

✅ **Integrated System** (integrated_engine.py)
- Combines simulation + moral reckoning
- Complete institutional reports
- Synthesis insights
- JSON export

✅ **User Interface** (complete_ui.py)
- Simulation Mode with visual simulation
- Governance Review Mode
- Decision Inspector
- Playback controls
- Metric displays
- Event log filtering

### Validation Status

✅ **Stress Testing: 100% Pass Rate**
- 10/10 tests passed
- High-volume simulation (200 ticks)
- Extreme overload scenarios
- Value drift detection
- Ethical debt tracking
- Tension detection
- Harm classification
- Refusal mechanisms
- Complete report generation
- Perfect consistency (0.000 variance)

✅ **Performance Validated**
- 200 ticks in 0.06 seconds
- No memory leaks
- No performance degradation
- Deterministic behavior confirmed

---

## Next Steps

### Immediate (Complete Documentation)

1. **Detail Keystones 5-10** with full specifications
2. Add code examples for each keystone
3. Cross-reference between keystones
4. Add governance review checklists

### Short-Term (Enhanced Capability)

1. Expand tension detection sensitivity
2. Add more harm classification triggers
3. Enhance deferral/referral logic
4. Deeper clinical protocol integration

### Long-Term (Institutional Adoption)

1. Ethics committee training materials
2. Institutional self-assessment guides
3. Comparative analysis workflows
4. Policy impact assessment templates

---

## Related Documents

### Technical Documentation
- `MORAL_RECKONING_DOCUMENTATION.md` - Complete technical guide
- `INTEGRATION_GUIDE.md` - Integration steps
- `STRESS_TEST_RESULTS.md` - Validation report
- `IMPLEMENTATION_COMPLETE.md` - Status summary

### Operational Documents
- `README_WINDOWS.md` - Windows deployment
- `VISUAL_SIMULATION_GUIDE.md` - Visual simulation usage
- `ENUM_ERROR_FIX.md`, `PROGRESS_BAR_FIX.md` - Bug fixes

---

## Contact and Governance

**For Ethics Committee Review:**
- Review KEYSTONES 1, 11, 12 first
- Focus on value drift and ethical debt
- Use Decision Inspector for case analysis
- Export complete reports for formal review

**For Technical Implementation:**
- Follow KEYSTONES 3, 4 for architecture
- Use stress test suite for validation
- Maintain separation of concerns
- Preserve event log immutability

**For Leadership Decision-Making:**
- Focus on KEYSTONE 11 (moral reckoning)
- Review value drift reports
- Understand ethical debt accumulation
- Use for policy impact assessment

---

## The Bottom Line

**These keystones define a system that:**
- ✅ Makes institutional trade-offs visible
- ✅ Tracks cumulative moral weight
- ✅ Detects value drift before crisis
- ✅ Distinguishes forced from avoidable harm
- ✅ Refuses when it cannot act safely
- ✅ Provides honest post-run accounting
- ✅ Prevents self-deception
- ✅ Preserves human authority
- ✅ Maintains complete auditability

**And explicitly refuses to become:**
- ❌ Performance ranking tool
- ❌ Justification for austerity
- ❌ Predictive triage system
- ❌ Moral arbiter
- ❌ Optimizer that hides costs

---

**"If a decision cannot be reconstructed, it must not be automated."**

**"What did this cost us, and why?"**

**"This system prevents institutions from lying to themselves."**

---

**Version 2.0 - Moral Reckoning Edition**  
**Status: Production-Ready, Governance-Grade**  
**Validation: 100% Stress Test Pass Rate**  
**Date: January 27, 2026**

---

### KEYSTONE 13: Risk Management, Safety Protocols, Response Procedures (NEW)

**[KEYSTONE 13: Risk Management, Safety Protocols, and Response Procedures](KEYSTONE_13_Risk_Management.md)**
- Consolidated medical safety boundaries
- Incident response protocols (4 severity levels)
- Escalation paths and procedures
- Training requirements (detailed)
- Ongoing validation schedules
- Emergency shutdown procedures
- Red flags and warning signs
- Institutional readiness assessment
- Legal and liability considerations
- Integration with hospital safety systems
- When to stop using system (sunset conditions)

**Status:** ✅ **COMPLETE** - Governance-critical safety requirements  
**Priority:** CRITICAL - Non-negotiable for any deployment

**This keystone is essential for:** Legal teams, risk management, hospital safety officers, ethics committees, anyone deploying the system

