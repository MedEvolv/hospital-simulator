# KEYSTONE 11: The Moral Reckoning Layer

**Version:** 1.0 (New in System v2.0)  
**Date:** January 27, 2026  
**Status:** Governance-Critical Architecture Document

---

## What This Layer Is

**The Moral Reckoning Layer transforms the simulator from a technical system into a mirror for institutional truth-telling.**

It answers the question: **"What did this cost us, and why?"**

Not: "Did we succeed?"  
Not: "How efficient were we?"  
But: **"What moral weight are we carrying, and is our behavior aligned with our stated values?"**

---

## The Seven Priorities

### Priority 1: Value Drift Detection

**Purpose:** Track the gap between what institutions CLAIM to value and what they ACTUALLY do under pressure.

**Why It Matters:**
> "Institutions rarely break because they choose the wrong trade-off. They break because they lose sight of the gap between who they believe they are and how they are behaving under pressure."

**Implementation:**

```python
@dataclass
class DeclaredValues:
    """What the institution CLAIMS to stand for"""
    patient_dignity: float = 0.9
    fairness: float = 0.8
    transparency: float = 0.95
    safety_primacy: float = 1.0
    staff_welfare: float = 0.7

@dataclass  
class ObservedBehavior:
    """What the institution ACTUALLY does"""
    dignity_score: float  # From unexplained reorders
    fairness_score: float  # From FCFS violations
    transparency_score: float  # From logged decisions
    safety_score: float  # From safety adherence
    staff_welfare_score: float  # From stress duration

@dataclass
class ValueDriftResult:
    """The measured gap"""
    dignity_drift: float  # abs(declared - observed)
    fairness_drift: float
    transparency_drift: float
    maximum_drift: float
    primary_misalignment: str
    interpretation: str
```

**Output:**
```
Current behavior is diverging from declared value: Patient Dignity (drift: 0.45)
- Declared dignity commitment: 0.90
- Observed dignity score: 0.45
- Gap: Institution is not honoring its stated values
```

**This is not optimization. This is self-awareness.**

---

### Priority 2: Ethical Debt Accumulation

**Purpose:** Track cumulative moral weight that lingers over time.

**Why It Matters:**
- Single overrides are survivable
- Repeated compromises accumulate
- Chronic ethical strain without resolution causes moral injury
- Debt decays slowly - moral weight lingers

**Implementation:**

```python
class EthicalDebt:
    current_debt: float
    decay_rate: float = 0.005  # Slow decay
    accrual_log: List[EthicalDebtEntry]
    
    def accrue(self, amount: float, reason: str, category: str):
        """Add ethical debt"""
        self.current_debt += amount
        self.accrual_log.append(Entry(...))
    
    def decay(self, current_tick: int):
        """Slowly decay debt over time"""
        self.current_debt *= (1 - self.decay_rate) ** ticks_elapsed
```

**Accrual Triggers:**
- +5: Unexplained queue reorder
- +3: Action without rule justification  
- +2/tick: Sustained staff stress
- +10: Promise without follow-through
- +5: Sustained tension (severity-dependent)

**Interpretation:**
```
< 10:   Minimal moral weight
10-30:  Moderate - some compromises
30-60:  Significant - repeated compromises
60-100: Heavy - substantial ethical cost
100+:   Critical - severe ethical strain
```

**Key Property:** Ethical debt is descriptive, not normative. It's not "good" or "bad" - it IS.

---

### Priority 3: Pre-Collapse Tension Detection

**Purpose:** Detect when the system is coping instead of responding.

**Why It Matters:**
> "Silence is more dangerous than error."

The most harmful state is quiet absorption:
- Queues grow but no escalation
- Staff stress rises but nothing changes
- Complaints repeat but policy stays static
- System absorbs pressure instead of responding

**Five Tension Types:**

1. **ABSORBING_PRESSURE**
   - Near-threshold waits without escalation
   - System at 85%+ of limits for >30s
   - Example: 2 RED patients at 125s wait, no action

2. **SILENT_STRAIN**  
   - Rising staff stress without policy response
   - Multiple overload events, no escalation
   - Pattern of stress without relief

3. **NORMALIZED_HARM**
   - Repeated complaints without action
   - Fairness violations becoming routine
   - What was exception is now normal

4. **THRESHOLD_HOVERING**
   - Repeatedly approaching but not crossing limits
   - System at capacity edge continuously
   - Hovering at 80-95% of threshold

5. **ESCALATION_AVOIDANCE**
   - Conditions warrant escalation but system doesn't respond
   - Avoidance pattern detected
   - Should escalate but won't

**Output:**
```
⚠️ TENSION DETECTED: ABSORBING_PRESSURE
Severity: 0.67
System absorbing pressure: 2 RED patients near threshold without escalation
Contributing factors:
  • Patient 1 at 125s wait
  • Patient 2 at 120s wait
Duration: 30s sustained
```

---

### Priority 4: Forced vs Chosen Harm Distinction

**Purpose:** Classify every harmful decision as forced or avoidable.

**Why It Matters:**
- Ethics committees care deeply about this
- High override count may indicate proper danger response, not failure
- Sharpens post-incident review
- Enables meaningful improvement

**Four Harm Types:**

1. **PHYSICALLY_FORCED**
   - No alternative existed
   - All rooms full, no capacity anywhere
   - Unavoidable given constraints
   - Avoidable with: None

2. **CAPACITY_INDUCED**
   - Avoidable with more resources
   - System at high utilization
   - Avoidable with: "Additional rooms or staff"

3. **POLICY_CONSTRAINED**
   - Avoidable with different policy
   - Institutional rules forced choice
   - Avoidable with: "Policy revision"

4. **INFORMATION_LIMITED**
   - Uncertain due to data gaps
   - Insufficient information to decide safely
   - Avoidable with: "Better data quality"

**Output:**
```
Harm Classification:
  Event: QUEUE_REORDER at 30s
  Type: CAPACITY_INDUCED
  Justification: "High utilization, room shortage"
  Avoidable with: "2 additional ER rooms"
  Alternative actions:
    • Maintain FCFS order (would violate safety)
    • External referral (not available)
```

---

### Priority 5: Refusal to Act State

**Purpose:** System explicitly refuses when it cannot act safely.

**Why It Matters:**
- Encodes epistemic humility
- Prevents overreach and automation bias
- Mirrors real clinical ethics
- Preserves human authority

**Five Refusal Reasons:**

1. **CONFLICTING_SIGNALS**
   ```
   Triage says urgent, history says false alarm
   Cannot determine safe action
   ```

2. **INSUFFICIENT_DATA**
   ```
   Critical information missing
   Cannot proceed without it
   ```

3. **POLICY_AMBIGUITY**
   ```
   Multiple policies apply with equal priority
   Cannot determine precedence
   ```

4. **HARM_THRESHOLD_EXCEEDED**
   ```
   Proposed action would cause unacceptable harm
   Must find alternative
   ```

5. **EPISTEMIC_UNCERTAINTY**
   ```
   Fundamental uncertainty in situation
   Human judgment required
   ```

**Output:**
```
🛑 SYSTEM REFUSED TO ACT
Reason: CONFLICTING_SIGNALS
Description: Triage assessment conflicts with patient history
Requires human: True
Alternative suggestions:
  • Request senior clinician review
  • Obtain additional vital signs
  • Escalate to ethics committee
```

**This is proper restraint, not failure.**

---

### Priority 6: Unavoidable Harm Summary

**Purpose:** Post-run honest accounting of what happened and why.

**Why It Matters:**
- Reframes from "Did we succeed?" to "What did this cost us?"
- Provides governance-grade honesty
- Supports ethics committee review
- Enables institutional learning

**Report Structure:**

```
HARMS THAT OCCURRED:
  • 3 patients waited beyond safe threshold due to capacity
  • 2 dignity violations during overload period
  • Staff stress exceeded sustainable levels for 90s

VALUES NOT HONORED:
  • Patient Dignity - 4 unexplained deprioritizations
  • Fairness - FCFS violated 6 times under load
  • Transparency - 2 hidden decisions

TRADE-OFFS UNRESOLVED:
  • Safety vs Experience tension remains
  • No policy adjustment made

QUANTITATIVE SUMMARY:
  Safety violations: 3
  Dignity violations: 4
  Fairness violations: 6
  Forced (unavoidable): 8
  Avoidable (capacity/policy): 4

Note: 8 harms were physically forced - no alternative existed.
Note: 4 harms were capacity-induced - potentially avoidable.
```

**This is complete institutional honesty.**

---

### Priority 7: Ontology Protection

**Purpose:** Define what this system IS and IS NOT, with explicit boundaries.

**Why It Matters:**
- Prevents mission drift
- Resists optimization pressure
- Protects institutional purpose
- Makes refusal explicit

**What System IS:**
- ✅ Stance toward irreducible uncertainty
- ✅ Refusal of premature closure
- ✅ Visible tension over false resolution
- ✅ Mirror for institutional self-awareness

**What System IS NOT:**
- ❌ NOT a rules engine
- ❌ NOT an optimizer
- ❌ NOT a performance ranking tool
- ❌ NOT a justification for austerity
- ❌ NOT a predictive triage system
- ❌ NOT a sales demo

**If someone asks for these: The answer is explicitly NO.**

(See KEYSTONE 12: Ontological Boundaries for full details)

---

## How Priorities Integrate

### Data Flow

```
Simulation Events
    ↓
MoralReckoningEngine.process_tick()
    ↓
┌─────────────────────────────────────┐
│ 1. Decay ethical debt               │
│ 2. Process events for moral impact  │
│ 3. Detect tensions                  │
│ 4. Classify harms                   │
│ 5. Evaluate refusals                │
│ 6. Update observed behavior         │
└─────────────────────────────────────┘
    ↓
Complete Moral Reckoning
    ↓
Combined Report (Performance + Moral)
```

### Synthesis Insights

The system automatically generates:

1. **VALUE_MISALIGNMENT** (High severity if drift > 0.3)
2. **ETHICAL_STRAIN** (High severity if debt > 60)
3. **AVOIDABLE_HARM** (High severity if avoidable > forced)
4. **ACTIVE_TENSION** (High severity if 2+ tensions)
5. **PERFORMANCE_MORAL_TRADEOFF** ⚠️ (CRITICAL)
   - High performance score + high value drift
   - **This is institutional self-deception**
6. **CHRONIC_STRAIN** (Pattern → burnout)
7. **EPISTEMIC_HUMILITY** (Proper refusals - positive)

**The Critical Insight:**
```
If performance score is high but value drift is high:
"System is succeeding on metrics while failing on values.
This represents institutional self-deception."
```

---

## Complete Export Structure

```json
{
  "run_id": "uuid",
  "institutional_profile": "Balanced",
  
  "performance_scores": {
    "institutional_efficacy_score": 72.5,
    ...
  },
  
  "moral_reckoning": {
    "declared_values": {...},
    "value_drift": {
      "dignity_drift": 0.45,
      "maximum_drift": 0.45,
      "interpretation": "Behavior diverging from Patient Dignity"
    },
    "ethical_debt": {
      "current_debt": 47.3,
      "interpretation": "Significant moral weight...",
      "category_breakdown": {...}
    },
    "tension_signals": {
      "active": {...},
      "history": [...]
    },
    "harm_classifications": {
      "summary": {
        "forced_count": 8,
        "avoidable_count": 4
      },
      "details": [...]
    },
    "refusals": {...},
    "unavoidable_harm_summary": {...}
  },
  
  "synthesis": {
    "insights": [
      {
        "type": "PERFORMANCE_MORAL_TRADEOFF",
        "severity": "CRITICAL",
        "message": "High performance at cost of value drift"
      }
    ],
    "recommendation": "CRITICAL: Governance review required",
    "cost_accounting": {
      "performance_score": 72.5,
      "ethical_debt": 47.3,
      "forced_harms": 8,
      "avoidable_harms": 4,
      "value_drift": 0.35
    },
    "critical_question": "What did this cost us, and why?"
  }
}
```

---

## Use Cases

### 1. Ethics Committee Post-Incident Review

**Question:** "A RED patient waited 45 minutes. Was this unavoidable?"

**System provides:**
- Harm classification: PHYSICALLY_FORCED vs CAPACITY_INDUCED
- Capacity state at time of event
- Alternative actions that were possible
- What could have prevented this
- Ethical debt accrued from this event

**Value:** Complete transparency for ethics review

### 2. Leadership Self-Assessment

**Question:** "Are we living our stated values?"

**System provides:**
- Declared values (what we claim)
- Observed behavior (what we do)
- Value drift (the gap)
- Primary misalignment identified
- Ethical debt carried
- Tension signals (where strain accumulates)

**Value:** Mirror for institutional honesty

### 3. Staff Moral Injury Prevention

**Question:** "Staff report feeling ethically strained. Is this measurable?"

**System provides:**
- Ethical debt tracking over time
- Chronic strain patterns
- Tension detection (silent absorption)
- Value drift (actions conflicting with values)

**Value:** Validation of moral distress, language for harm

### 4. Policy Impact Assessment

**Question:** "What's the moral cost of changing max_wait_yellow?"

**System provides:**
- Comparative ethical debt
- Comparative tension frequency
- Forced vs avoidable harm shifts
- Value drift patterns
- Staff stress changes

**Value:** Understanding trade-offs, not just metrics

---

## Validation and Testing

**Stress Test Results: 100% Pass Rate**

All 7 priorities tested comprehensively:
- ✅ Value drift correctly computed
- ✅ Ethical debt accumulates and decays
- ✅ Tensions detected (8 in high-stress scenario)
- ✅ Harms classified (forced vs avoidable)
- ✅ Refusals working (2 correct refusals)
- ✅ Unavoidable harm summary generated
- ✅ Ontology boundaries documented

**Performance:**
- 200 ticks in 0.06 seconds
- Perfect determinism (0.000 variance)
- 6KB JSON export
- Production-ready

---

## Critical Reminders

### This is NOT Optimization

- ❌ Not scoring hospitals
- ❌ Not ranking performance
- ❌ Not maximizing metrics
- ❌ Not collapsing ethics into penalties

### This IS Institutional Honesty

- ✅ Making trade-offs visible
- ✅ Tracking moral weight
- ✅ Preventing self-deception
- ✅ Surfacing uncomfortable truths
- ✅ Asking "What did this cost us?"

---

## Implementation Files

- `moral_reckoning.py` - Core engine (1,600+ lines)
- `integrated_engine.py` - Combined sim + moral (500+ lines)
- `demo_moral_reckoning.py` - Demonstration (400+ lines)
- `ONTOLOGICAL_BOUNDARIES.md` - Priority 7 documentation
- `MORAL_RECKONING_DOCUMENTATION.md` - Complete technical docs
- `STRESS_TEST_RESULTS.md` - Validation report

---

## Version History

### Version 1.0 (Current)
- All 7 priorities implemented
- Comprehensive stress testing (100% pass)
- Production-ready validation
- Complete documentation
- Integration with simulation engine
- Export capabilities

---

## Related Documents

- **KEYSTONE 1:** Problem Framing
- **KEYSTONE 6:** Metrics and Scoring
- **KEYSTONE 8:** Explainability and Auditability
- **KEYSTONE 12:** Ontological Boundaries

---

**This layer enables institutional moral reckoning.**

**It prevents self-deception.**

**It asks the hard question: "What did this cost us, and why?"**

**This is not a feature. This is the deepest work this system can do.**
