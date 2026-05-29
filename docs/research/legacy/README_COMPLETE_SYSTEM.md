# Living Hospital Orchestration Simulator - Complete System

## 🎯 Overview

A **production-grade, event-sourced hospital simulation system** with complete governance review capabilities. Built following rigorous engineer implementation specifications (Parts 1-6).

**What this is:**
- ✅ Institutional decision-making simulator
- ✅ Governance-ready audit system
- ✅ Ethics review platform
- ✅ Administrative planning tool

**What this is NOT:**
- ❌ Clinical diagnosis system
- ❌ Treatment recommendation engine
- ❌ Patient outcome predictor
- ❌ ML-powered optimizer

---

## 📦 Complete Deliverables

### Core Engines (Production-Grade)

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `event_sourced_engine.py` | Event-sourced simulation (Parts 1-2) | ~700 | ✅ Complete |
| `playback_engine.py` | Visualization playback (Part 3) | ~500 | ✅ Complete |
| `scoring_engine.py` | Evaluation framework (Part 5) | ~400 | ✅ Complete |
| `complete_ui.py` | Integrated Streamlit UI (Parts 3-6) | ~800 | ✅ Complete |

### Previous Implementations (Reference)

| File | Purpose | Status |
|------|---------|--------|
| `hospital_simulator_part4.py` | Enhanced UI with Decision Inspector | ✅ Complete |
| Original implementations | Parts 1-3 baseline | ✅ Complete |

### Documentation (Comprehensive)

| File | Content |
|------|---------|
| `COMPLETE_IMPLEMENTATION_GUIDE.md` | Master reference for Parts 1-6 |
| `EVENT_SOURCED_GUIDE.md` | Event-sourcing architecture deep dive |
| `PART4_GUIDE.md` | Decision support & explainability |
| `COMPARISON.md` | Version comparison guide |

### Data

| File | Content |
|------|---------|
| `sample_patient_dataset.csv` | 25-patient test dataset |

---

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
pip install streamlit pandas --break-system-packages

# Verify installation
python3 event_sourced_engine.py
python3 playback_engine.py
python3 scoring_engine.py
```

### Running the Complete UI

```bash
streamlit run complete_ui.py
```

Opens browser at `localhost:8501` with:
- ✅ Simulation Mode (create & run)
- ✅ Governance Review Mode (audit & compare)
- ✅ Full playback controls
- ✅ Decision inspector
- ✅ Scoring dashboard
- ✅ Side-by-side comparison

---

## 🏗️ System Architecture

### Three-Layer Separation

```
┌─────────────────────────────────────────┐
│  UI Layer (Streamlit)                   │
│  - complete_ui.py                       │
│  - Visualization only                   │
│  - Reads snapshots                      │
│  - Never mutates simulation             │
└──────────────┬──────────────────────────┘
               │ reads via controller
               ▼
┌─────────────────────────────────────────┐
│  Playback Layer                         │
│  - playback_engine.py                   │
│  - EventPlaybackController              │
│  - Pure reducers                        │
│  - State reconstruction                 │
│  - Multi-run comparison                 │
└──────────────┬──────────────────────────┘
               │ consumes events
               ▼
┌─────────────────────────────────────────┐
│  Simulation Layer                       │
│  - event_sourced_engine.py              │
│  - Immutable event log (truth)          │
│  - Frozen parameters per run            │
│  - Deterministic execution              │
└──────────────┬──────────────────────────┘
               │ scores with
               ▼
┌─────────────────────────────────────────┐
│  Evaluation Layer                       │
│  - scoring_engine.py                    │
│  - Five orthogonal metrics              │
│  - Composite IES                        │
│  - Time-series analysis                 │
│  - Trade-off visibility                 │
└─────────────────────────────────────────┘
```

**Key Principle:** *"The visualization is a reader, not a participant."*

---

## 🎮 User Guide

### Simulation Mode

**Purpose:** Create and run simulations

**Features:**
1. **Create New Run**
   - Select hospital profile (Govt/Private/Balanced)
   - Advanced parameter tuning (optional)
   - Set random seed for determinism
   - Click "Start New Simulation Run"

2. **Playback Controls**
   - ▶️ **Play** - Auto-advance through time
   - ⏸️ **Pause** - Freeze at current moment
   - ⏭️ **Step** - Advance 5 seconds
   - ⏭️⏭️ **Jump** - Advance 30 seconds
   - ⏱️ **Scrubber** - Jump to any timestamp
   - ⏩ **Speed** - 0.5×, 1×, 2×, 4×

3. **Live Visualization**
   - 🏥 Live View - Queue status & room utilization
   - 📋 Events - Real-time event log
   - 💬 Chat - Social layer bubbles
   - 🏠 Rooms - Capacity visualization
   - 📊 Metrics - Live scoring

### Governance Review Mode

**Purpose:** Audit, analyze, and compare completed runs

**Features:**
1. **Decision Inspector**
   - Select any agent action
   - View structured explanation:
     - Action taken
     - Rules triggered
     - Policy context
     - Human override status

2. **Event Log**
   - Filter by event type
   - Filter by patient ID
   - Complete audit trail
   - Searchable history

3. **Ethical Analysis**
   - Queue reorder analysis
   - Governance escalations
   - Safety vs fairness trade-offs
   - Explanation coverage

4. **Scoring Dashboard**
   - Patient Safety Score (PSS)
   - Patient Experience Score (PES)
   - Staff Stress Score (SSS)
   - Ethics Intervention Count (EIC)
   - System Throughput Index (STI)
   - Institutional Efficacy Score (IES)
   - Time-series visualization

5. **Side-by-Side Comparison**
   - Select two runs
   - Compare at any timestamp
   - Divergence point analysis
   - Scoring comparison
   - Insight generation

---

## 💡 Use Cases

### 1. Ethics Committee Review

**Scenario:** Review a contentious triage decision

**Workflow:**
1. Switch to Governance Review Mode
2. Select run from dropdown
3. Navigate to Decision Inspector tab
4. Filter for "AGENT_ACTION" events
5. Select specific decision
6. Review:
   - What action was taken
   - Which rules triggered it
   - Policy context at that time
   - Whether human override was allowed
7. Export decision trace for documentation

**Value:** Complete transparency, no ambiguity

### 2. Administrative Planning

**Scenario:** Compare Government vs Private hospital profiles

**Workflow:**
1. Simulation Mode
2. Create Run 1: Government profile, seed=42
3. Create Run 2: Private profile, seed=42 (same seed!)
4. Switch to Governance Review Mode
5. Enable Comparison Mode
6. Select both runs
7. Scrub through timeline
8. Compare:
   - Queue lengths
   - Wait times
   - Safety scores
   - Experience scores
9. Generate insights
10. Export reports

**Value:** Data-driven policy decisions

### 3. Clinical Training

**Scenario:** Teach staff about triage reasoning

**Workflow:**
1. Create run with test dataset
2. Use playback controls to step through
3. Pause at key moments
4. Show Decision Inspector for each triage
5. Discuss rules and policy context
6. Compare with clinical protocols (ESI/NEWS2 references)
7. Replay "what if" scenarios

**Value:** Structured learning with real-world alignment

### 4. Regulatory Demonstration

**Scenario:** Prove system is governance-safe

**Workflow:**
1. Show event-sourced architecture
2. Demonstrate determinism (same seed = identical results)
3. Walk through decision traces
4. Show parameter immutability
5. Display persistent disclaimers
6. Export complete audit trail
7. Emphasize:
   - No autonomous decisions
   - Complete explainability
   - Human authority preserved

**Value:** Regulatory confidence, compliance evidence

---

## 🔑 Key Features

### Event Sourcing

**Every state change is an event:**
```python
# Traditional (BAD)
patient.status = PatientStatus.ADMITTED  # Hidden mutation

# Event-Sourced (GOOD)
run.add_event("PATIENT_ADMITTED", {
    "patient_id": 42,
    "room": "Emergency 1",
    "wait_time": 90
})
# State derived from events!
```

**Benefits:**
- ✅ Complete audit trail
- ✅ Time travel (replay to any moment)
- ✅ Deterministic (reproducible)
- ✅ Counterfactual analysis
- ✅ No hidden state

### Parameter Immutability

**Changing parameters creates NEW run:**
```python
# Run 1 with safety_weight=0.45
params1 = InstitutionalParameters(safety_weight=0.45)
run1 = engine1.run_simulation()

# Run 2 with safety_weight=0.60
params2 = InstitutionalParameters(safety_weight=0.60)
run2 = engine2.run_simulation()

# Compare outcomes
comparison = ScoringEngine.compare_runs(run1, run2)
```

**Benefits:**
- ✅ No mid-run mutations
- ✅ Fair comparison
- ✅ Causality preserved
- ✅ Trust-building

### Playback Controls

**Scrubbing replays events, not logic:**
```python
controller = EventPlaybackController(run)

# Jump to 60 seconds
controller.scrub_to_time(60)
# This replays events[0:target], applies reducers

# Jump to 120 seconds
controller.scrub_to_time(120)
# State perfectly reconstructed

# Jump back to 30 seconds
controller.scrub_to_time(30)
# Time travel!
```

**Benefits:**
- ✅ Review any moment
- ✅ No re-simulation
- ✅ Perfect reconstruction
- ✅ Ethics-ready

### Multi-Dimensional Scoring

**Five orthogonal metrics:**

1. **Patient Safety Score (PSS)**
   - Measures: High-risk patient protection
   - HIGH SCORE = Danger not ignored

2. **Patient Experience Score (PES)**
   - Measures: Fairness & predictability
   - KEY: Unexplained reordering is penalty

3. **Staff Stress Score (SSS)**
   - Measures: Cognitive load
   - Warning signal, not failure

4. **Ethics Intervention Count (EIC)**
   - Measures: Safety > fairness overrides
   - High count isn't bad if explained

5. **System Throughput Index (STI)**
   - Measures: Flow efficiency
   - Speed without fetishizing

**Composite: Institutional Efficacy Score (IES)**
- Weighted combination
- NEVER shown alone
- Always with individual metrics

**Benefits:**
- ✅ Trade-offs visible
- ✅ No single metric optimization
- ✅ Multi-stakeholder perspective
- ✅ Honest assessment

---

## 🧪 Testing & Validation

### Determinism Test

```python
# Same seed = identical outcomes
engine1 = EventSourcedSimulationEngine(seed=42)
engine2 = EventSourcedSimulationEngine(seed=42)

run1 = engine1.run_simulation()
run2 = engine2.run_simulation()

assert run1.event_log == run2.event_log  # ✅ Pass
```

### Replay Test

```python
# Direct execution
state1 = engine.get_current_state()

# Replay from events
controller = EventPlaybackController(run)
controller.scrub_to_time(run.event_log[-1].timestamp)
state2 = controller.get_current_snapshot()

assert state1.total_patients == state2.total_patients  # ✅ Pass
```

### Parameter Immutability Test

```python
params = InstitutionalParameters(safety_weight=0.45)
run = SimulationRun(..., parameters=params)

original = run.parameters.safety_weight
params.safety_weight = 0.60  # Attempt mutation

assert run.parameters.safety_weight == original  # ✅ Pass
```

---

## 📋 Validation Checklist

### Core Engine (Parts 1-2)
- [x] Every state change emits event
- [x] No parameter mutation mid-run
- [x] Event log reconstructs full state
- [x] Different params → different logs
- [x] Same params + seed → identical logs

### Playback Engine (Part 3)
- [x] Entire simulation replayable
- [x] Scrubbing changes only time
- [x] State at T=120s reconstructable exactly
- [x] All visuals driven by events
- [x] UI can be rewritten without touching core

### Decision Support (Part 4)
- [x] Decision traces for all agent actions
- [x] Clinical protocol references (ESI/NEWS2)
- [x] Parameter tuning creates new runs
- [x] Tuning logs maintained
- [x] Complete audit trail

### Scoring (Part 5)
- [x] Scores degrade visibly under stress
- [x] Different profiles → different scores
- [x] Two runs comparable
- [x] Scores explainable without math
- [x] Clinicians recognize tensions

### Governance Review (Part 6)
- [x] Reviewer can interrogate decisions
- [x] Can replay critical moments
- [x] Can compare institutional choices
- [x] Everything read-only in review mode
- [x] Feels sober, not impressive

---

## 🎓 Advanced Topics

### Institutional Profiles

#### Government Hospital
```python
{
    "safety_weight": 0.55,      # Highest priority
    "experience_weight": 0.20,  # Lower priority
    "room_intake_modifier": 0.8,  # Slower
    "red_clustering_threshold": 2  # More sensitive
}
```
**Outcome:** Safety preserved, longer waits

#### Private Hospital
```python
{
    "safety_weight": 0.40,
    "experience_weight": 0.40,  # Equal to safety
    "room_intake_modifier": 1.3,  # Faster
    "red_clustering_threshold": 4  # Less sensitive
}
```
**Outcome:** Smooth flow, higher cost

#### Balanced / Eka-Ideal
```python
{
    "safety_weight": 0.45,
    "experience_weight": 0.30,
    "room_intake_modifier": 1.0,
    "red_clustering_threshold": 3
}
```
**Outcome:** Trust-preserving trade-offs

### Event Types Reference

| Event | Triggers | Payload |
|-------|----------|---------|
| `RUN_STARTED` | Simulation start | seed, profile, parameters |
| `PATIENT_ARRIVAL` | New patient | patient_id, complaint, age, history |
| `TRIAGE_STAGE_1_ASSIGNED` | Early triage | patient_id, triage |
| `TRIAGE_STAGE_2_ASSIGNED` | Refined triage | patient_id, triage, wait_time |
| `QUEUE_REORDER` | Queue change | previous_state, new_state |
| `PATIENT_ADMITTED` | Room assignment | patient_id, room, wait_time |
| `AGENT_ACTION` | System decision | action, rules, policy_context |
| `ESCALATION_SUGGESTED` | Governance alert | recommendations |
| `METRIC_UPDATE` | Periodic scoring | all metrics |

### Reducer Pattern

**Pure functions for state transitions:**

```python
def patient_state_reducer(patients: Dict, event: Event) -> Dict:
    """
    Deterministic patient state transitions.
    - No side effects
    - Idempotent
    - Never inspects future events
    """
    if event.event_type == "PATIENT_ARRIVAL":
        patients[event.payload["patient_id"]] = Patient(...)
    
    elif event.event_type == "PATIENT_ADMITTED":
        patients[event.payload["patient_id"]].status = PatientStatus.ADMITTED
    
    return patients
```

---

## ⚠️ Important Disclaimers

### Clinical Disclaimer (Persistent)

```
This system simulates institutional decision-making under operational stress.
It does NOT diagnose, prescribe, or replace clinical judgment.
```

**This disclaimer:**
- ✅ Appears on every screen
- ✅ Cannot be dismissed
- ✅ Protects all stakeholders
- ✅ Sets appropriate expectations

### What Is NOT Scored

Explicitly excluded from scoring:
- ❌ Diagnostic accuracy
- ❌ Mortality rates
- ❌ Treatment success
- ❌ Clinical outcomes

**Reason:** Ethically unsafe, out of scope, misleading in simulation

### Language Guidelines

**Use:**
- ✅ "System"
- ✅ "Policy"
- ✅ "Rules"
- ✅ "Signals"

**Avoid:**
- ❌ "AI decides"
- ❌ "Diagnoses"
- ❌ "Prescribes"
- ❌ "Replaces clinical judgment"

---

## 📥 Export Capabilities

### Event Log
```bash
# JSON format with complete audit trail
{
  "run_metadata": {...},
  "parameters": {...},
  "event_log": [
    {
      "run_id": "...",
      "event_id": "...",
      "timestamp": 60,
      "sequence": 42,
      "event_type": "PATIENT_ADMITTED",
      "payload": {...}
    },
    ...
  ]
}
```

### Scoring Report
```bash
# Complete evaluation with time series
{
  "run_id": "...",
  "patient_safety_score": 85.2,
  "patient_experience_score": 72.4,
  "staff_stress_score": 68.1,
  "ethics_intervention_count": 7,
  "system_throughput_index": 79.3,
  "institutional_efficacy_score": 76.8,
  "interpretation": "..."
}
```

### Decision Traces
```bash
# All agent actions with full context
[
  {
    "decision_id": "...",
    "timestamp": 90,
    "action": "ADMIT_TO_EMERGENCY",
    "patient_id": 42,
    "rules_triggered": ["RED_PRIORITY_ADMISSION"],
    "policy_context": {...},
    "human_override_allowed": false
  },
  ...
]
```

---

## 🚧 Troubleshooting

### Issue: Simulation doesn't start
**Solution:** Check that all dependencies are installed. Verify with:
```bash
python3 event_sourced_engine.py
```

### Issue: Playback is laggy
**Solution:** Reduce playback speed or increase step size. The system processes events in real-time.

### Issue: Can't see event details
**Solution:** In Governance Review Mode, ensure event type filters aren't hiding events. Reset filters to "all".

### Issue: Scores seem wrong
**Solution:** Scores reflect trade-offs, not absolute performance. Check individual metrics, not just IES.

### Issue: Comparison mode shows identical runs
**Solution:** Ensure runs use different parameters. Same seed + same params = identical outcomes (by design for determinism).

---

## 🎯 Summary: What You've Built

### A Complete System

1. **Event-Sourced Simulation Engine**
   - Immutable event log
   - Deterministic execution
   - Parameter immutability
   - Complete auditability

2. **Visualization Playback Engine**
   - Pure state reconstruction
   - Time travel capabilities
   - Multi-run comparison
   - No logic in UI

3. **Evaluation Framework**
   - Five orthogonal metrics
   - Composite IES
   - Time-series analysis
   - Trade-off visibility

4. **Governance Review Mode**
   - Decision inspection
   - Event filtering
   - Ethical analysis
   - Export capabilities

### Why This Architecture Matters

**Traditional systems fail because they:**
- ❌ Cannot be interrogated
- ❌ Cannot explain trade-offs
- ❌ Collapse complexity
- ❌ Hide decisions

**This system succeeds because it:**
- ✅ Glass box transparency
- ✅ Complete explainability
- ✅ Multi-dimensional assessment
- ✅ Governance-ready

### Who This Is For

**Hospital Leadership:** Institutional planning & policy  
**Ethics Committees:** Decision audit & review  
**Clinical Staff:** Training & understanding  
**Regulators:** Compliance demonstration  
**Eka Care:** Trust-building with stakeholders  

### The Foundation

**This is not just a demo.** This is a foundation for institutional trust.

It's designed to survive:
- ✅ Ethics committee interrogation
- ✅ Regulatory scrutiny
- ✅ Clinical questioning
- ✅ Executive comparison
- ✅ Legal examination

**Because it's built on principles:**
- Events as truth
- Parameters frozen
- Decisions explained
- Trade-offs visible
- Authority preserved

---

## 📞 Next Steps

1. **Run the system**
   ```bash
   streamlit run complete_ui.py
   ```

2. **Explore both modes**
   - Simulation Mode - Create runs
   - Governance Review Mode - Audit & compare

3. **Try different profiles**
   - Government Hospital
   - Private Hospital
   - Balanced / Eka-Ideal

4. **Export and share**
   - Event logs for audit
   - Scoring reports for review
   - Decision traces for documentation

5. **Customize parameters**
   - Adjust weights
   - Tune thresholds
   - Compare outcomes

---

*"If a decision cannot be explained in one sentence to a tired nurse at 2 a.m., it does not belong in this system."*

*"The visualization is a reader, not a participant."*

*"These scores represent trade-offs made visible. They are not measures of clinical truth."*

**Built with care, designed for trust, engineered for governance.**
