# KEYSTONE 2: System Boundary, Data Posture, and ABDM Alignment

**Version:** 2.0 (Updated with Moral Reckoning Layer)  
**Date:** January 27, 2026  
**Status:** Governance-Critical Architecture Document

---

## System Boundary

### What Data This System Touches

**SYNTHETIC DATA ONLY - NO REAL PATIENT INFORMATION**

This is a simulation system. It:
- ✅ Generates synthetic patients
- ✅ Uses fictional medical histories
- ✅ Creates hypothetical scenarios
- ❌ Does NOT consume real ABDM data
- ❌ Does NOT integrate with live EHR systems
- ❌ Does NOT use actual patient records

### Data Classification

| Data Type | Status | Justification |
|-----------|--------|---------------|
| Patient PHI (names, DOB, address) | ❌ **NEVER** | Simulation only, no real patients |
| Clinical outcomes | ❌ **NEVER** | Cannot predict, evaluate, or learn from |
| ABDM integration | ❌ **NEVER** | Conceptual alignment only, no real connection |
| Synthetic complaints | ✅ **YES** | For triage signal generation |
| Synthetic histories | ✅ **YES** | For context, not authority |
| Numeric patient IDs | ✅ **YES** | Ephemeral, simulation-scoped only |
| Event logs | ✅ **YES** | Decisions, timestamps, sequences |
| Institutional parameters | ✅ **YES** | Weights, thresholds, modifiers |

---

## The ABDM Boundary

### Conceptual Alignment (NOT Technical Integration)

**India's ABDM (Ayushman Bharat Digital Mission)** envisions unified health records. This simulator:

✅ **Respects the philosophy:** Historical data as context, present condition as authority  
✅ **Uses similar structures:** FHIR-inspired event schemas  
✅ **Models reconciliation:** Simulates checking history against current complaint  
❌ **Does NOT integrate:** No actual ABDM API calls  
❌ **Does NOT validate:** No claim of FHIR compliance  
❌ **Does NOT consume:** No real ABDM records

### Why This Boundary Matters

**Clinical governance requires:**
1. Systems that handle real patient data undergo rigorous approval
2. Integration with ABDM requires MoHFW certification
3. This simulator makes NO such claims
4. It exists to explore *governance questions*, not deploy solutions

### The "ABDM-Inspired" Architecture

```
Conceptual Flow (Simulated):
1. Patient arrives → Chief complaint captured
2. System "checks" synthetic history (simulated ABDM fetch)
3. Reconciliation: Does history align with complaint?
4. Flags raised if mismatch detected
5. Triage performed using reconciled signals

Reality:
- No actual ABDM API called
- No real patient record accessed
- All data is synthetic, generated at runtime
- This models the *workflow*, not the integration
```

---

## Data Posture: Historical Data as Context, Not Authority

### Core Principle

**"Present conditions determine action. Historical data provides context."**

This means:
- A patient's **current vital signs** override historical stability
- A patient's **current complaint** matters more than past diagnoses
- **Deterioration** triggers action regardless of history
- **History** helps interpret ambiguity, not override safety

### Implementation

```python
def early_triage(complaint: str, age: int, history: List[str]) -> str:
    """
    Triage logic that uses history as context, not authority.
    """
    
    # Present condition determines base urgency
    if "chest pain" in complaint.lower():
        base_urgency = "RED"
    elif "difficulty breathing" in complaint.lower():
        base_urgency = "RED"
    elif "severe injury" in complaint.lower():
        base_urgency = "RED"
    # ... more complaint patterns
    
    # History MODIFIES but does not OVERRIDE
    if "cardiac" in str(history).lower() and base_urgency == "YELLOW":
        # Escalate yellow to red if cardiac history + concerning complaint
        return "RED"
    
    # Age MODIFIES but does not OVERRIDE
    if age > 65 and base_urgency == "YELLOW":
        # Elderly patients escalated from YELLOW to RED
        return "RED"
    
    # But if present condition is already RED, history doesn't downgrade
    return base_urgency
```

**Key Insight:** History can escalate urgency but never downgrade it. Present condition is authority.

---

## Data Flow Architecture

### Three-Layer Separation

```
┌─────────────────────────────────────────┐
│   SIMULATION LAYER (event_sourced_engine.py)   │
│   - Generates synthetic patients                │
│   - Performs triage using complaint/age/history │
│   - Records all decisions as events              │
│   - NO scoring, NO visualization                 │
└───────────────┬─────────────────────────┘
                │ Event Log (immutable)
                ↓
┌─────────────────────────────────────────┐
│   INTERPRETATION LAYER (scoring_engine.py, moral_reckoning.py)   │
│   - Reads event log (never writes)               │
│   - Computes metrics (PSS, PES, SSS, EIC, STI) │
│   - Computes moral reckoning (value drift, debt) │
│   - NO simulation state mutation                 │
└───────────────┬─────────────────────────┘
                │ Computed Metrics
                ↓
┌─────────────────────────────────────────┐
│   PRESENTATION LAYER (complete_ui.py)            │
│   - Displays metrics                             │
│   - Provides playback controls                   │
│   - Enables decision inspection                  │
│   - NO business logic                            │
└─────────────────────────────────────────┘
```

**Critical Property:** No layer both decides and explains.

---

## Patient Identity and Privacy

### Numeric IDs Only

```python
@dataclass
class Patient:
    id: int  # Ephemeral, simulation-scoped
    arrival_time: int  # Simulation timestamp
    chief_complaint: str  # Synthetic
    age: int  # Synthetic
    history: List[str]  # Synthetic
    triage_stage_1: str  # "RED" | "YELLOW" | "BLUE"
    triage_stage_2: str  # Refined after ABDM check
    status: PatientStatus  # WAITING | ADMITTED | DISCHARGED
```

**No PHI:**
- ❌ No names
- ❌ No dates of birth
- ❌ No addresses
- ❌ No medical record numbers
- ❌ No identifiable information

**Why Numeric IDs:**
- Temporary scope (single simulation run)
- No persistence across runs
- No external linkage possible
- Governance-safe demonstration

---

## Synthetic Data Generation

### Complaint Templates

```python
SYNTHETIC_COMPLAINTS = [
    "chest pain",
    "difficulty breathing",
    "abdominal pain",
    "severe headache",
    "minor injury",
    "fever",
    "dizziness",
    "back pain",
    # ... more templates
]
```

### History Templates

```python
SYNTHETIC_HISTORIES = [
    ["hypertension"],
    ["diabetes", "cardiac"],
    ["asthma"],
    ["no significant history"],
    ["previous MI", "stent placement"],
    # ... more templates
]
```

### Age Distribution

```python
def generate_synthetic_age() -> int:
    """Generate age weighted toward realistic ED distribution"""
    # Bimodal: young adults + elderly
    if random.random() < 0.4:
        return random.randint(18, 35)  # Young adults
    elif random.random() < 0.7:
        return random.randint(36, 64)  # Middle age
    else:
        return random.randint(65, 90)  # Elderly (higher risk)
```

**Key Property:** Distributions are realistic but completely synthetic.

---

## The "No Real Integration" Principle

### What We Model (Conceptually)

1. **ABDM Record Retrieval:**
   - Simulate checking whether patient has ABDM record
   - Simulate extracting history from record
   - Simulate reconciliation with stated complaint

2. **History-Complaint Reconciliation:**
   - Check if history aligns with complaint
   - Flag mismatches (e.g., "chest pain" with no cardiac history vs. "chest pain" with MI history)
   - Use flags to modify triage

3. **Temporal Context:**
   - Recent visits (simulated)
   - Medication compliance (simulated)
   - Previous diagnoses (simulated)

### What We NEVER Do (In Reality)

❌ Call actual ABDM APIs  
❌ Fetch real patient records  
❌ Validate FHIR resources  
❌ Integrate with production systems  
❌ Store data persistently  
❌ Link across simulations

**This is pure simulation. Always.**

---

## Data Validation and Integrity

### Input Validation

```python
def validate_patient_data(patient: Dict) -> bool:
    """Ensure synthetic patient data is well-formed"""
    
    required_fields = ["id", "chief_complaint", "age", "history"]
    
    # Check required fields
    for field in required_fields:
        if field not in patient:
            raise ValueError(f"Missing required field: {field}")
    
    # Age must be reasonable
    if not (0 < patient["age"] < 120):
        raise ValueError(f"Invalid age: {patient['age']}")
    
    # Complaint must be non-empty
    if not patient["chief_complaint"].strip():
        raise ValueError("Chief complaint cannot be empty")
    
    # History must be list
    if not isinstance(patient["history"], list):
        raise ValueError("History must be a list")
    
    return True
```

### Event Log Integrity

```python
@dataclass
class Event:
    """Every state change is an event. Events are immutable."""
    
    run_id: str  # Links to SimulationRun
    event_id: str  # UUID, globally unique
    timestamp: int  # Simulation time in seconds
    sequence: int  # Order within run
    event_type: str  # "PATIENT_ARRIVED", "QUEUE_REORDER", etc.
    payload: Dict  # Event-specific data
    
    def __post_init__(self):
        # Events are frozen after creation
        object.__setattr__(self, '__frozen__', True)
    
    def __setattr__(self, name, value):
        if getattr(self, '__frozen__', False):
            raise AttributeError("Events are immutable")
        super().__setattr__(name, value)
```

**Key Property:** Event log is append-only. No mutation, no deletion.

---

## Moral Reckoning Data Boundaries (NEW in v2.0)

### What Moral Reckoning Tracks

The moral reckoning layer adds:

1. **Declared Values** (Institutional Claims)
   ```python
   DeclaredValues:
       patient_dignity: float = 0.9
       fairness: float = 0.8
       transparency: float = 0.95
       safety_primacy: float = 1.0
       staff_welfare: float = 0.7
   ```

2. **Observed Behavior** (Actual Actions)
   ```python
   ObservedBehavior:
       dignity_score: float  # Computed from unexplained reorders
       fairness_score: float  # Computed from FCFS violations
       transparency_score: float  # Computed from logged decisions
       safety_score: float  # Computed from safety adherence
       staff_welfare_score: float  # Computed from stress duration
   ```

3. **Ethical Debt** (Cumulative Moral Weight)
   ```python
   EthicalDebt:
       current_debt: float  # Accumulated moral cost
       decay_rate: float  # Slow decay over time
       accrual_log: List[EthicalDebtEntry]  # All accruals with reasons
   ```

4. **Tension Signals** (Pre-Collapse Warnings)
   ```python
   TensionSignal:
       tension_type: TensionType  # ABSORBING_PRESSURE, SILENT_STRAIN, etc.
       severity: float  # 0.0 to 1.0
       duration_ticks: int  # How long sustained
       contributing_factors: List[str]
   ```

5. **Harm Classifications** (Forced vs Chosen)
   ```python
   HarmClassification:
       harm_type: HarmType  # PHYSICALLY_FORCED, CAPACITY_INDUCED, etc.
       avoidable_with: Optional[str]  # What could have prevented
       alternative_actions: List[str]  # What else was possible
   ```

### Boundaries on Moral Data

**What moral reckoning DOES:**
- ✅ Computes gaps between declared and observed values
- ✅ Tracks cumulative ethical strain
- ✅ Detects patterns of silent absorption
- ✅ Distinguishes unavoidable from avoidable harm
- ✅ Flags when system cannot decide safely

**What moral reckoning DOES NOT:**
- ❌ Prescribe what values should be
- ❌ Claim to know "right answers"
- ❌ Rank institutions morally
- ❌ Justify under-resourcing
- ❌ Automate ethical decisions

**This is description, not prescription.**

---

## Data Export and Governance

### What Can Be Exported

1. **Event Log (Complete)**
   - All events with timestamps, sequences, payloads
   - Full decision reconstruction capability
   - JSON format, governance-ready

2. **Scoring Report**
   - Five metrics: PSS, PES, SSS, EIC, STI
   - Institutional Efficacy Score (IES)
   - Interpretation and thresholds

3. **Moral Reckoning Report** (NEW)
   - Value drift analysis
   - Ethical debt history
   - Tension signal log
   - Harm classifications
   - Unavoidable harm summary

4. **Decision Traces**
   - Per-decision breakdown
   - Signals, rules, thresholds, policy
   - Human override opportunities

### What CANNOT Be Exported

❌ Real patient data (none exists)  
❌ Actual ABDM records (not integrated)  
❌ Identifiable information (numeric IDs only)  
❌ Predictive models (none exist)  
❌ Learned patterns (no ML training)

---

## Compliance and Certification

### This System is NOT

❌ HIPAA-compliant (no real PHI)  
❌ ABDM-certified (no real integration)  
❌ FDA-cleared (not a medical device)  
❌ Clinically validated (simulation only)  
❌ Production-ready for deployment (governance tool only)

### This System IS

✅ Synthetic-data-only  
✅ Governance-safe for demonstration  
✅ Ethics-committee-ready  
✅ Audit-trail-complete  
✅ Deterministic and reproducible  
✅ Stress-tested and validated

---

## Version History

### Version 1.0 (Original)
- Synthetic patient generation
- Event-sourced architecture
- No PHI, numeric IDs only
- ABDM conceptual alignment
- Export capabilities

### Version 2.0 (Current - Moral Reckoning)
- ✅ Moral reckoning data structures
- ✅ Value drift tracking
- ✅ Ethical debt accumulation
- ✅ Tension signal logging
- ✅ Harm classification records
- ✅ Unavoidable harm summaries
- ✅ Explicit boundaries on moral data

---

## Related Documents

- **KEYSTONE 1:** Problem Framing, Scope
- **KEYSTONE 3:** System Architecture
- **KEYSTONE 4:** Simulation Engine
- **KEYSTONE 5:** Orchestration Logic
- **KEYSTONE 11:** Moral Reckoning Layer
- **KEYSTONE 12:** Ontological Boundaries

---

**This document defines what data the system touches, what it never touches, and why these boundaries protect both patients and institutions.**

**"Historical data provides context. Present conditions determine action."**

**"Synthetic data only. Always."**
