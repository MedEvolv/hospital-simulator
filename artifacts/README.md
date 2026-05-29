# Living Hospital Orchestration Simulator

**Eka Care–aligned, Governance-Safe Healthcare Operations Simulator**

> *"If a decision cannot be explained in one sentence to a tired nurse at 2 a.m., it does not belong in this system."*

## Overview

This is a **symbolic spatial visualization** of hospital operations under resource constraint. It makes invisible operational stress, ethical trade-offs, and system behavior visible through a SimCity-like interface.

### What This Is
- ✅ A deterministic orchestration simulator
- ✅ A cognitive scaffolding tool for stakeholders
- ✅ An educational platform for hospital operations
- ✅ A governance-safe demonstration system

### What This Is NOT
- ❌ A game engine
- ❌ An animation project  
- ❌ A dashboard with ML/AI optimization
- ❌ A clinical decision support system

## Installation

### Requirements
- Python 3.8 or higher
- pip package manager

### Quick Start

1. **Install dependencies:**
```bash
pip install streamlit pandas --break-system-packages
```

2. **Run the simulator:**
```bash
streamlit run hospital_orchestration_simulator.py
```

3. **Open your browser** to the URL shown (typically `http://localhost:8501`)

## Features

### 🎯 Visual Metaphor: "Living Hospital"

The simulator uses a **top-down miniature map** representation:

- **🔴🟡🔵 Patient Tokens** = Colored circles representing urgency levels
  - 🔴 RED = Critical/Emergency
  - 🟡 YELLOW = Urgent
  - 🔵 BLUE = Routine/Preventive
  - ⚠️ Warning icon = Condition worsening

- **🏥 Rooms** = Buildings with explicit capacity slots
  - 🚑 Emergency (for RED patients)
  - 🩺 General OPD (for YELLOW/BLUE)
  - 🌱 Preventive Care (for BLUE)

- **📊 Queues** = Visible lanes showing congestion
  - Color-coded by urgency
  - FIFO within each band
  - RED always prioritized

- **💬 Chat Bubbles** = Patient/staff concerns (effects, not causes)
  - Patient complaints about wait times
  - Staff observations about overload
  - System governance alerts

### 🧠 The Immutable Agent Loop

Every simulation tick executes:

1. **PERCEIVE** → Detect new patient arrivals
2. **CLASSIFY** → Perform two-stage triage
3. **ORDER** → Organize queues by urgency bands
4. **CHECK** → Run governance monitoring
5. **SURFACE** → Show recommendations (never auto-execute)
6. **LOG** → Record everything for accountability

**No step may be skipped or reordered.**

### 🏥 Hospital Profiles

Three institutional configurations:

- **Government Hospital** - Limited resources, high safety priority
- **Private Hospital** - More resources, faster intake
- **Balanced/Eka-Ideal** - Moderate resources, transparent operations

### 📊 Patient Data Sources

1. **Built-in Test Dataset** (25 patients, deterministic)
2. **Random Generation** (procedural patient generation)
3. **Custom CSV Upload** (bring your own scenarios)

CSV format:
```csv
id,arrival_time,chief_complaint,age,history
1,0,severe chest pain radiating to left arm,62,"hypertension,hyperlipidemia"
2,5,routine blood pressure check,45,hypertension
```

## Core Principles

### 🛡️ Safety First
- **Irrevocable RED Rule**: Once a patient is classified as RED, they can never be demoted
- Conservative triage errs on side of safety
- Separation monitor detects dangerous clustering of critical patients

### 👥 Human Authority Preserved
- System **recommends**, never executes autonomously
- All escalations require human approval
- No black-box decisions

### 📝 Full Explainability
- Every action logged with timestamp and reason
- Complete audit trail
- Post-hoc review enabled through time controls

### ⚖️ Ethical Governance
- Transparent queue reordering
- Patient complaints surface fairness concerns
- Staff stress measured and visible

## Using the Simulator

### Time Controls

- ▶️ **Run** - Continuous simulation
- ⏸️ **Pause** - Freeze current state
- ⏭️ **Step (5s)** - Advance one tick
- ⏭️⏭️ **Jump (30s)** - Fast forward
- 🔄 **Reset** - Start over

### Live Views

**Queue Status**
- Real-time visualization of waiting patients
- Color-coded urgency bands
- Wait time tracking

**Event Log**
- Complete chronological record
- Filterable by event type
- Expandable details

**Social Layer (Chat)**
- Patient complaints
- Staff observations
- System alerts

**Room Status**
- Capacity utilization
- Time to next available slot
- Overload warnings

**Live Metrics**
- Average wait times by urgency
- Patient satisfaction
- Staff stress
- Ethics override count

**Agent Actions**
- Logged decisions
- Reasoning provided
- No avatar representation

### Post-Run Evaluation

After simulation completes, generate comprehensive report with:

**📊 Institutional Efficacy Score (IES)**
- Safety Preservation (0-100)
- Dignity & Fairness (0-100)
- Flow Stability (0-100)
- Capacity Adaptation (0-100)
- Human Authority Integrity (0-100)

**😊 Patient Satisfaction Score (PSS)**
- Measures fairness & predictability
- NOT happiness or wait time
- Weighted formula: SAC + ESC + DTC + CPC + EPC

**👨‍⚕️ Staff Satisfaction Score (SSS)**
- Measures cognitive load
- Alert burden
- De-escalation frequency

## System Architecture

### Separation of Concerns

```
┌─────────────────────────────────────┐
│   SIMULATION CORE (Logic)          │
│   - Patient state                   │
│   - Queue management                │
│   - Triage rules                    │
│   - Governance checks               │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│   VISUAL STATE ADAPTER              │
│   - Reads simulation state          │
│   - Produces visual snapshot        │
│   - No business logic               │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│   RENDERER (Streamlit UI)           │
│   - Consumes visual state           │
│   - Draws interface                 │
│   - Handles user controls           │
└─────────────────────────────────────┘
```

### Key Design Decisions

**No Smooth Animation**
- Discrete ticks emphasize decisions over physics
- Makes causality visible
- Reduces cognitive load

**Light Mode Default**
- Hospital-native aesthetic
- Fatigue-aware design
- Governance-safe appearance

**No Gamification**
- No leaderboards
- No sound effects
- No playful fonts
- Serious systems need serious interfaces

## FHIR/ABDM Compliance Note

This system operates at the **pre-interoperability orchestration layer**.

- All patient objects are losslessly mappable to FHIR R4 resources
- FHIR is treated as interchange format, not decision substrate
- ABDM data is not used for real-time logic (by design)

## Engineering Principles

### "If it's not logged, it didn't happen"
Every meaningful action produces an event in the audit trail.

### "These scores do not represent truth. They represent trade-offs made visible."
Metrics exist to surface tensions, not claim clinical certainty.

### "The visual style is intentionally simplified"
Reduces intimidation and invites exploration by non-technical stakeholders.

## Use Cases

### Clinical Training
- Triage decision simulation
- Resource allocation practice
- Ethical dilemma exploration

### Administrative Planning
- Capacity assessment
- Profile comparison
- Policy impact modeling

### Ethics Committee Review
- Post-incident analysis
- Decision transparency audit
- Fairness evaluation

### Policy Demonstration
- Stakeholder communication
- Constraint visualization
- Trade-off illustration

## Technical Details

### Triage System

**Stage 1: Early Coarse Triage**
- Keyword-based red flag detection
- Conservative (fail-open)
- Applied immediately on arrival
- Returns: "RED" or "NOT_RED"

**Stage 2: Late Refined Triage**
- Age + history + complaint analysis
- Applied when: at front of queue OR after 60s wait
- Returns: "RED" or "YELLOW" or "BLUE"
- **Irrevocable RED rule enforced**

### Governance Monitoring

**Separation Monitor**
- Detects unsafe clustering of RED patients
- Threshold: 3+ RED patients waiting simultaneously
- Triggers escalation recommendations

**Capacity Checks**
- Overall queue pressure (15+ total waiting)
- Emergency room utilization (>85%)
- Sustained overload duration

**Recommendations (never auto-executed)**
- External referral
- Room morphing
- Reappointment/deferral
- Capacity increase

## Troubleshooting

### Issue: Simulation runs too fast
**Solution**: Use the Pause and Step controls to inspect individual ticks

### Issue: Chat bubbles not appearing
**Solution**: Chat bubbles are probabilistic and event-driven - not all events generate bubbles

### Issue: Metrics seem low
**Solution**: Metrics reflect trade-offs - low scores highlight tensions, not failures

### Issue: CSV upload fails
**Solution**: Ensure CSV has all required columns: `id, arrival_time, chief_complaint, age, history`

## Export Options

- **Event Log (JSON)** - Complete audit trail
- **Simulation Report (JSON)** - Post-run evaluation scores
- **Custom CSV** - Create scenarios for reproducibility

## Philosophy

This simulator embodies a specific engineering philosophy:

> "Serious systems are best understood when they can be played with safely."

It does not:
- Optimize outcomes
- Make autonomous decisions
- Use ML/AI for predictions
- Access live ABDM data
- Claim clinical accuracy

It does:
- Make stress visible
- Surface ethical tensions
- Preserve human authority
- Enable post-hoc review
- Facilitate learning

## Credits

Based on the specification:
- **General-Purpose Operations Orchestration Simulator**
- **Visualization Design Spec** (SimCity-lite, Governance-safe)
- **Visual System, Time Model, and Interaction Contract**
- **Metrics, Scoring, Evaluation Framework**

Built with:
- Python 3.x
- Streamlit (interactive web framework)
- Dataclasses (domain modeling)
- JSON (data interchange)

## License

This code is provided as a demonstration and educational tool.

## Support

For issues, questions, or contributions:
1. Review the inline code comments (extensive documentation)
2. Check the SKILL.md files referenced in the spec
3. Examine the event log for debugging
4. Use time controls to step through problematic scenarios

---

**Remember:** If a decision cannot be explained in one sentence to a tired nurse at 2 a.m., it does not belong in this system.
