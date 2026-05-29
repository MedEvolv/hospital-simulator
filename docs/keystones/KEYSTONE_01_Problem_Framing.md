# KEYSTONE 1: Problem Framing, Scope, and Explicit Non-Goals

**Version:** 2.0 (Updated with Moral Reckoning Layer)  
**Date:** January 27, 2026  
**Status:** Governance-Critical Architecture Document

---

## The Central Problem

**Healthcare institutions operate under irreducible uncertainty while making decisions that carry moral weight.** They face:

1. **Resource constraints** that force trade-offs between competing goods
2. **Time pressure** that demands action before complete information
3. **Ethical complexity** where every choice has moral implications
4. **Institutional drift** where stated values diverge from actual behavior under pressure
5. **Cumulative strain** where repeated compromises accumulate into moral injury

### What This System Addresses

This simulator makes **institutional decision-making visible** so that:
- Trade-offs are explicit rather than hidden
- Ethical costs accumulate rather than disappear
- Value drift surfaces before becoming crisis
- Forced harm is distinguished from avoidable harm
- Institutions cannot deceive themselves about what they're doing

**This is not optimization. This is institutional moral reckoning.**

---

## Core Scope

### What This System IS

1. **A Discrete Event Simulation**
   - Models hospital queue dynamics over time
   - Tracks patient flow through triage, queuing, admission
   - Captures staff workload and stress accumulation
   - Records all decisions in immutable event log

2. **A Decision Visibility Tool**
   - Surfaces when queues become unsafe
   - Reveals conflicts between fairness and safety
   - Shows accumulation of staff stress
   - Provides structured explanations for every action
   - Makes ethical overrides explicit and auditable

3. **A Trade-Off Exposition Framework**
   - Five-dimensional scoring (Safety, Experience, Staff, Ethics, Throughput)
   - Never collapses to single metric
   - Preserves asymmetry between incommensurable values
   - Shows cost of every decision across all dimensions

4. **An Institutional Mirror** (NEW in v2.0)
   - **Value Drift Detection:** Tracks gap between declared values and observed behavior
   - **Ethical Debt Accumulation:** Cumulative moral weight that lingers over time
   - **Pre-Collapse Tension Signals:** Early warnings when system absorbs pressure silently
   - **Forced vs Chosen Harm:** Distinguishes unavoidable from capacity-induced harm
   - **Refusal to Act:** System refuses when it cannot decide safely
   - **Unavoidable Harm Summary:** Post-run accounting of what cost was paid
   - **Ontological Protection:** Explicit boundaries on what system will not become

5. **A Governance Support Tool**
   - Enables ethics committee review
   - Supports institutional self-assessment
   - Facilitates comparative analysis across profiles
   - Provides audit trails for decision reconstruction
   - Surfaces uncomfortable truths for leadership confrontation

### What This System IS NOT

#### ❌ Clinical Scope Exclusions

**NOT a diagnostic system**
- Does not diagnose medical conditions
- Does not interpret clinical findings
- Does not evaluate diagnostic accuracy
- Does not predict patient outcomes

**NOT a treatment system**
- Does not prescribe medications
- Does not recommend clinical interventions
- Does not guide therapeutic decisions
- Does not evaluate treatment effectiveness

**NOT a triage replacement**
- Does not replace clinical triage judgment
- Does not automate triage decisions
- Supports but never supplants human clinicians
- Human override must always be possible and prominent

**NOT an outcomes predictor**
- Does not predict mortality
- Does not forecast morbidity
- Does not estimate clinical trajectories
- Does not claim prognostic capability

#### ❌ Technical Scope Exclusions

**NOT an optimizer**
- Does not maximize metrics
- Does not collapse ethics into penalties
- Does not claim to find "optimal" solutions
- Resists turning dignity into "tolerable deviation"

**NOT an AI decision-maker**
- Does not make autonomous clinical choices
- Does not learn from patient outcomes
- Does not adapt behavior without human approval
- Does not claim superior judgment to humans

**NOT a predictive system**
- Does not forecast future arrivals
- Does not predict capacity needs
- Does not anticipate clinical deterioration
- Does not use machine learning on live data

**NOT a real-time system**
- Does not consume live ABDM data
- Does not integrate with production EHR systems
- Does not use actual patient information
- Simulation only, never deployment

#### ❌ Ethical Scope Exclusions (NEW in v2.0)

**NOT a performance ranking tool**
- Does not compare institutions for competitive ranking
- Does not produce league tables
- Does not gamify care delivery
- Does not create performance hierarchies

**NOT a justification engine for austerity**
- Does not legitimize under-resourcing
- Does not normalize capacity-induced harm as inevitable
- Explicitly flags when harm is avoidable with resources
- Distinguishes forced from chosen harm

**NOT a moral arbiter**
- Does not claim to know "the right answer"
- Does not reduce morality to algorithms
- Does not flatten value pluralism
- Does not prescribe ethical conclusions

**NOT a sales demo for efficiency**
- Does not celebrate throughput optimization
- Does not treat speed as inherently good
- Does not hide costs of efficiency
- Does not market "AI-powered healthcare"

---

## Explicit Design Principles

### 1. Transparency Over Optimization

**Principle:** Make trade-offs visible rather than resolving them.

**Implementation:**
- Five separate scores, never combined
- Ethical overrides logged and surfaced
- Staff stress accumulates and shows
- Value drift computed and displayed
- Ethical debt tracked over time
- Tensions flagged when detected

**Anti-Pattern to Avoid:**
```
❌ Single "hospital performance score"
❌ Hidden optimization objective
❌ Automatic resolution of conflicts
❌ Efficiency metrics without cost accounting
```

### 2. Safety Primacy (Non-Negotiable)

**Principle:** Safety violations trigger immediate, irrevocable escalation.

**Implementation:**
- RED patients cannot be downgraded
- Safety overrides are logged as AGENT_ACTION events
- Max wait thresholds are hard stops
- Deterioration triggers automatic escalation
- Safety primacy weight in scoring (≥40%)

**Anti-Pattern to Avoid:**
```
❌ Safety as one factor among many
❌ "Acceptable" safety threshold violations
❌ Throughput optimization that defers safety actions
```

### 3. Human Authority (Always)

**Principle:** Every automated decision must have human override path.

**Implementation:**
- `human_override_allowed` flag in all AGENT_ACTION events
- Governance Review Mode for retrospective approval
- Decision Inspector shows override opportunities
- Event log exports for human review
- Refusal to act when system is uncertain (NEW)

**Anti-Pattern to Avoid:**
```
❌ Autonomous final decisions
❌ Hidden or obfuscated override mechanisms
❌ "Trust the algorithm" culture
❌ System claiming superior judgment
```

### 4. Auditability (Complete)

**Principle:** Every decision must be reconstructible from event log.

**Implementation:**
- Event log is immutable and append-only
- Each event contains full decision context
- Timestamps, sequences, and patient IDs link actions
- Payloads include signals, rules, thresholds, policy context
- Harm classifications preserve full justification (NEW)

**Anti-Pattern to Avoid:**
```
❌ Lost decision context
❌ "Black box" reasoning
❌ Incomplete or probabilistic traces
❌ Decisions that cannot be explained
```

### 5. Epistemic Humility (NEW in v2.0)

**Principle:** System must refuse to act when it cannot do so safely.

**Implementation:**
- **Conflicting Signals:** Refuses when triage conflicts with history
- **Insufficient Data:** Refuses when critical information missing
- **Policy Ambiguity:** Refuses when multiple policies apply equally
- **Harm Threshold:** Refuses when action would cause unacceptable harm
- **Epistemic Uncertainty:** Refuses when fundamental uncertainty exists

**Anti-Pattern to Avoid:**
```
❌ Always providing an answer
❌ Hiding uncertainty behind confidence
❌ Automation bias ("system must decide")
❌ Overreach beyond reliable knowledge
```

### 6. Institutional Honesty (NEW in v2.0)

**Principle:** System prevents institutional self-deception.

**Implementation:**
- **Value Drift:** Computes gap between declared and observed values
- **Ethical Debt:** Tracks cumulative moral weight over time
- **Tension Signals:** Detects silent absorption of pressure
- **Harm Classification:** Distinguishes forced from avoidable
- **Unavoidable Harm Summary:** Post-run honest accounting

**Anti-Pattern to Avoid:**
```
❌ "We're doing fine" when values are violated
❌ Optimization theater (good metrics, hidden costs)
❌ Normalizing avoidable harm as "efficient"
❌ Celebrating throughput while staff burns out
```

---

## Success Criteria

### Technical Success

✅ System runs deterministically (same seed → same results)  
✅ All decisions are reconstructible from event log  
✅ Five-metric scoring exposes trade-offs  
✅ Human override paths always available  
✅ No PHI used, synthetic data only  
✅ Stress tested to 200+ ticks  
✅ Perfect consistency across runs (0.000 variance)

### Governance Success

✅ Ethics committees can review all decisions  
✅ Institutional profiles capture different value weightings  
✅ Decision Inspector enables deep interrogation  
✅ Event logs export for formal review  
✅ Persistent disclaimers prevent clinical misuse  
✅ Value drift surfaces before becoming crisis (NEW)  
✅ Ethical debt makes moral cost visible (NEW)

### Moral Success (NEW in v2.0)

✅ System makes uncomfortable truths visible  
✅ Gap between stated values and actual behavior surfaced  
✅ Cumulative ethical strain tracked over time  
✅ Forced harm distinguished from chosen compromise  
✅ Pre-collapse tensions detected early  
✅ System refuses when it cannot act safely  
✅ Post-run accounting is honest about costs

### Anti-Success (What Would Indicate Failure)

❌ System is used to rank hospitals competitively  
❌ System is used to justify staffing cuts  
❌ System automates triage without human oversight  
❌ System claims diagnostic or prognostic capability  
❌ Ethical overrides are hidden or minimized  
❌ Single performance score becomes dominant metric  
❌ Value drift is ignored or explained away (NEW)  
❌ Ethical debt is treated as "just a number" (NEW)

---

## The Question This System Answers

### NOT: "Did we succeed?"

### NOT: "How efficient were we?"

### NOT: "What's our score?"

### YES: **"What did this cost us, and why?"**

This reframing is fundamental. The system exists to make costs visible, not to hide them behind optimization.

---

## Use Cases (In Priority Order)

### 1. Ethics Committee Post-Incident Review

**Scenario:** A RED patient waited 45 minutes. Why?

**System Support:**
- Event log shows exact sequence
- Harm classification: Was it forced or capacity-induced?
- Value drift: Was this aligned with stated values?
- Ethical debt: How much moral weight accumulated?
- Decision Inspector: What signals, rules, thresholds applied?
- Alternative actions: What else could have happened?

**Output:** Complete reconstruction for ethics review, not just metrics.

### 2. Institutional Self-Assessment

**Scenario:** Hospital leadership wants to understand their actual values in practice.

**System Support:**
- **Declared Values:** What institution claims to value
- **Observed Behavior:** What institution actually does under pressure
- **Value Drift:** The gap between them
- **Primary Misalignment:** Which value is most violated
- **Ethical Debt:** Cumulative moral weight being carried
- **Tension Signals:** Where system is silently absorbing strain

**Output:** Mirror for institutional truth-telling, not performance ranking.

### 3. Policy Impact Assessment

**Scenario:** What happens if we change max_wait_yellow from 180s to 120s?

**System Support:**
- Run simulations with both parameters
- Compare: PSS, PES, SSS, EIC, STI
- Compare: Ethical debt accumulation
- Compare: Tension frequency
- Compare: Forced vs avoidable harms
- Compare: Value drift patterns

**Output:** Understanding of trade-offs, not recommendation to optimize.

### 4. Staff Moral Injury Prevention

**Scenario:** Staff report feeling ethically strained. Is this measurable?

**System Support:**
- **Ethical Debt Tracking:** Shows cumulative moral weight
- **Tension Detection:** Identifies silent strain patterns
- **Chronic Strain:** Detects sustained pressure without relief
- **Value Drift:** Shows when actions conflict with stated values
- **Staff Stress Score:** Quantifies workload accumulation

**Output:** Validation of staff experience, language for moral distress.

### 5. Governance Training

**Scenario:** Train new ethics committee members on decision complexity.

**System Support:**
- Run simulations with different profiles
- Show how same scenario → different outcomes
- Use Decision Inspector for deep dives
- Demonstrate value conflicts in action
- Show accumulation of ethical debt
- Discuss refusals to act (epistemic humility)

**Output:** Structured learning about moral decision-making.

---

## What This System Must Never Become

From **ONTOLOGICAL_BOUNDARIES.md** (see KEYSTONE 11):

### The answer is explicitly NO for:

❌ "Can we use this to rank hospitals by performance?"  
❌ "Can we optimize to reduce ethical override counts?"  
❌ "Can we train ML model on this to predict best actions?"  
❌ "Can we use this to justify staffing cuts?"  
❌ "Can we add predictive triage to reduce wait times?"  
❌ "Can we make this an autonomous agent?"

**If someone asks for these features, the answer is NO.**

---

## Version History

### Version 1.0 (Original)
- Core event-sourced architecture
- Five-metric scoring framework
- Decision inspector and audit trails
- Human override requirements
- Governance review support

### Version 2.0 (Current - Moral Reckoning Layer)
- ✅ Value Drift Detection (Priority 1)
- ✅ Ethical Debt Accumulation (Priority 2)
- ✅ Pre-Collapse Tension Signals (Priority 3)
- ✅ Forced vs Chosen Harm (Priority 4)
- ✅ Refusal to Act States (Priority 5)
- ✅ Unavoidable Harm Summary (Priority 6)
- ✅ Ontological Boundaries (Priority 7)
- ✅ Comprehensive stress testing (100% pass rate)
- ✅ Production-ready validation

---

## Related Documents

- **KEYSTONE 2:** System Boundary, Data Posture, ABDM Alignment
- **KEYSTONE 3:** System Architecture, Separation of Powers
- **KEYSTONE 4:** Simulation Engine Specification
- **KEYSTONE 5:** Orchestration Logic, Decision Rules
- **KEYSTONE 6:** Metrics, Scoring Framework
- **KEYSTONE 7:** Visualization, Human Legibility
- **KEYSTONE 8:** Explainability, Auditability
- **KEYSTONE 9:** Parameter Tuning, Controlled Learning
- **KEYSTONE 10:** Demo Narrative, Institutional Adoption
- **KEYSTONE 11:** Moral Reckoning Layer (NEW)
- **KEYSTONE 12:** Ontological Boundaries (NEW)

---

**This document defines what the system is for, what it will never become, and why these boundaries are non-negotiable.**

**"If a decision cannot be reconstructed, it must not be automated."**

**"What did this cost us, and why?"**
