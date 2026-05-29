# System Architecture - Living Hospital Simulator

## Overview

The simulator follows a strict **three-layer architecture** that separates concerns and ensures transparency.

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (Streamlit)               │
│  ┌───────────┐  ┌────────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Controls │  │ Live View  │  │  Metrics │  │ Reports │ │
│  └───────────┘  └────────────┘  └──────────┘  └─────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │ User Actions (Play/Pause/Step)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              VISUAL STATE ADAPTER (Read-Only)               │
│                                                              │
│  Transforms simulation state into visual representation:    │
│  • arrival_gate: [patient_ids]                             │
│  • queues: {RED: [...], YELLOW: [...], BLUE: [...]}       │
│  • rooms: {name: {capacity, occupied, time_to_free}}       │
│  • chat_bubbles: [recent social layer events]              │
│  • metrics: {live performance indicators}                   │
│  • agent_actions: [recent decisions with reasoning]         │
│                                                              │
│  ⚠️  NO BUSINESS LOGIC - Pure transformation only           │
└────────────────────────┬────────────────────────────────────┘
                         │ Read State
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                SIMULATION CORE (Source of Truth)            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        THE IMMUTABLE AGENT LOOP (every tick)          │  │
│  │                                                        │  │
│  │   1. PERCEIVE   →  Detect new patient arrivals       │  │
│  │   2. CLASSIFY   →  Perform two-stage triage          │  │
│  │   3. ORDER      →  Organize queues by urgency        │  │
│  │   4. CHECK      →  Run governance monitoring         │  │
│  │   5. SURFACE    →  Show recommendations              │  │
│  │   6. LOG        →  Record all events                 │  │
│  │                                                        │  │
│  │   ⚠️  No step may be skipped or reordered            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  State Objects:                                             │
│  • patients: List[Patient]                                 │
│  • queue: Dict[str, List[Patient]]                         │
│  • rooms: List[Room]                                       │
│  • events: List[Event]                                     │
│  • chat_bubbles: List[ChatBubble]                          │
│  • patient_metrics: Dict[int, PatientMetrics]              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Forward Flow (Simulation → UI)

```
Simulation Tick
      │
      ├─→ Update patient states
      ├─→ Perform triage
      ├─→ Reorder queues
      ├─→ Check governance
      ├─→ Process admissions
      ├─→ Log events
      │
      ▼
Visual State Adapter
      │
      ├─→ Extract arrival_gate patients
      ├─→ Map queue structure
      ├─→ Calculate room utilization
      ├─→ Collect recent chat bubbles
      ├─→ Compute live metrics
      │
      ▼
UI Renderer
      │
      ├─→ Draw patient tokens
      ├─→ Show queue lanes
      ├─→ Display room status
      ├─→ Render chat messages
      ├─→ Update metric panels
      │
      ▼
User sees current state
```

### Backward Flow (User → Simulation)

```
User Action (Button Click)
      │
      ├─→ Play/Pause
      ├─→ Step forward
      ├─→ Reset simulation
      │
      ▼
Session State Update
      │
      ├─→ st.session_state.running = True/False
      ├─→ sim.tick() called
      ├─→ st.rerun() triggered
      │
      ▼
Simulation executes Agent Loop
      │
      ▼
Visual update triggered
```

## Core Components

### 1. Domain Objects (Immutable Structure)

```python
@dataclass
class Patient:
    id: int
    arrival_time: int
    chief_complaint: str
    age: int
    history: List[str]
    triage_stage_1: Optional[str]  # "RED" | "NOT_RED"
    triage_stage_2: Optional[str]  # "RED" | "YELLOW" | "BLUE"
    status: PatientStatus           # WAITING | ADMITTED | etc.
    condition_worsening: bool = False

@dataclass
class Room:
    name: str
    room_type: str              # "Emergency" | "General OPD" | etc.
    capacity_per_minute: int
    current_load: int = 0
    time_to_next_free: int = 30

@dataclass
class Event:
    timestamp: int
    type: str
    entity_id: Optional[int]
    details: Dict

@dataclass
class ChatBubble:
    timestamp: int
    actor: str                  # "Patient" | "Staff" | "Doctor" | "System"
    message: str
    context: str
    severity: str = "low"       # "low" | "medium" | "high"
```

### 2. Triage System (Two-Stage)

```
┌────────────────────────────────────────┐
│      STAGE 1: Early Coarse Triage     │
│                                         │
│  Trigger: On arrival                   │
│  Method: Keyword matching              │
│  Conservative: Fail-open               │
│  Output: "RED" or "NOT_RED"            │
│                                         │
│  Red flags:                             │
│  • chest pain, stroke, unconscious     │
│  • severe bleeding, choking            │
│  • difficulty breathing                │
│  • etc. (full list in code)            │
└────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│      STAGE 2: Late Refined Triage     │
│                                         │
│  Trigger:                               │
│  • At front of queue, OR               │
│  • After 60s wait threshold            │
│                                         │
│  Method:                                │
│  • Age-based risk (>65 or <5)          │
│  • History-based risk                  │
│  • Complaint severity                  │
│                                         │
│  Output: "RED" | "YELLOW" | "BLUE"     │
│                                         │
│  ⚠️  IRREVOCABLE RED RULE:             │
│     Once RED, stays RED forever        │
└────────────────────────────────────────┘
```

### 3. Queue Structure (No Global Sorting)

```
┌──────────────────┐
│   WAITING AREA   │
│                  │
│  ┌────────────┐  │
│  │    RED     │  │  ← Critical/Emergency
│  │ FIFO queue │  │     Always served first
│  └────────────┘  │
│                  │
│  ┌────────────┐  │
│  │   YELLOW   │  │  ← Urgent
│  │ FIFO queue │  │     Served after RED
│  └────────────┘  │
│                  │
│  ┌────────────┐  │
│  │    BLUE    │  │  ← Routine/Preventive
│  │ FIFO queue │  │     Served after YELLOW
│  └────────────┘  │
│                  │
└──────────────────┘

Rules:
• FIFO within each band
• No inter-band sorting
• No priority scores
• Reordering only via triage changes
```

### 4. Governance System (Monitoring Only)

```
┌─────────────────────────────────────────────────┐
│            GOVERNANCE GATE                       │
│                                                   │
│  Monitors:                                       │
│  ┌─────────────────────────────────────────┐    │
│  │  Separation Monitor                      │    │
│  │  • Detects RED clustering                │    │
│  │  • Threshold: 3+ RED waiting             │    │
│  │  • Independent of queue ordering         │    │
│  └─────────────────────────────────────────┘    │
│                                                   │
│  ┌─────────────────────────────────────────┐    │
│  │  Capacity Monitor                        │    │
│  │  • Total queue pressure (15+ waiting)    │    │
│  │  • Emergency utilization (>85%)          │    │
│  │  • Sustained overload duration           │    │
│  └─────────────────────────────────────────┘    │
│                                                   │
│  Output: List[Recommendation]                    │
│  • SUGGEST_EXTERNAL_REFERRAL                    │
│  • SUGGEST_ROOM_MORPH                           │
│  • SUGGEST_REAPPOINTMENT                        │
│  • SUGGEST_CAPACITY_INCREASE                    │
│                                                   │
│  ⚠️  NEVER AUTO-EXECUTES                        │
│     All recommendations require human approval   │
└─────────────────────────────────────────────────┘
```

### 5. Social Layer (Effects, Not Causes)

```
┌──────────────────────────────────────┐
│         CHAT BUBBLE SYSTEM           │
│                                       │
│  Triggers:                            │
│  • Queue reordering                  │
│  • Long wait times                   │
│  • Triage assignments                │
│  • Room overload                     │
│  • Escalation alerts                 │
│                                       │
│  Actors:                              │
│  👤 Patient - Complaints, concerns   │
│  👨‍⚕️ Staff - Explanations, observations │
│  🩺 Doctor - Triage notes            │
│  🖥️ System - Governance alerts       │
│                                       │
│  Properties:                          │
│  • Deterministic (predefined phrases)│
│  • No LLMs or generative AI          │
│  • Probabilistic display (30% chance)│
│  • NEVER influences simulation logic │
│                                       │
│  Purpose:                             │
│  Humanize system, show friction,     │
│  surface fairness concerns           │
└──────────────────────────────────────┘
```

## Time Model

### Discrete Ticks (No Continuous Time)

```
Time = 0s
    │
    ├─→ Tick 1 (Agent Loop)
    │   • PERCEIVE
    │   • CLASSIFY
    │   • ORDER
    │   • CHECK
    │   • SURFACE
    │   • LOG
    │
Time = 1s
    │
    ├─→ Tick 2 (Agent Loop)
    │   • ...
    │
Time = 2s
    │
    ├─→ ...
    │
    ▼
Time = 300s (End)
```

### User Controls

```
▶️  RUN      →  Auto-advance with 200ms delay
⏸️  PAUSE    →  Freeze at current tick
⏭️  STEP     →  Advance exactly 1 tick (5s)
⏭️⏭️  JUMP    →  Advance 6 ticks (30s)
🔄  RESET    →  Return to Time = 0s
```

## Metrics Calculation

### Live Metrics (During Simulation)

```python
def calculate_live_metrics():
    """Computed every tick for display only"""
    
    # Average wait by color
    for color in ["RED", "YELLOW", "BLUE"]:
        waiting_patients = queue[color]
        avg_wait[color] = mean(current_time - p.arrival_time 
                              for p in waiting_patients)
    
    # Patient satisfaction (simplified)
    total_waiting = sum(len(q) for q in queue.values())
    patient_satisfaction = max(0, 100 - (total_waiting * 3))
    
    # Staff stress (simplified)
    overloaded_rooms = count(r for r in rooms 
                            if r.current_load >= r.capacity)
    staff_stress = min(100, overloaded_rooms * 25)
    
    # Ethics overrides
    ethics_overrides = count(e for e in events 
                            if e.type in ["QUEUE_REORDERED", 
                                         "ESCALATION_SUGGESTED"])
```

### Post-Run Metrics (After Completion)

```python
def calculate_final_scores():
    """Computed once at end of simulation"""
    
    # IES - Institutional Efficacy Score (5 pillars)
    safety_score = (red_admitted / red_total) * 100
    dignity_score = 100 - (queue_reorders * 3)
    flow_score = 100 - (avg_wait_time / 2)
    adaptation_score = escalations * 15 (clamped)
    authority_score = 100  # Always 100 by design
    
    # PSS - Patient Satisfaction Score (formula)
    PSS = 0.30*SAC + 0.25*ESC + 0.20*DTC + 0.15*CPC + 0.10*EPC
    
    # SSS - Staff Satisfaction Score (cognitive load)
    SSS = mean(explanation_load, alert_density, 
              deescalation, override_complexity)
```

## Visual Grammar

### Patient Token Representation

```
🔴  RED urgency + Stable
🔴⚠️  RED urgency + Worsening condition
🟡  YELLOW urgency + Stable
🟡⚠️  YELLOW urgency + Worsening
🔵  BLUE urgency + Stable
⚪  Untriaged (stage 2 not yet complete)
```

### Room Status Colors

```
✅ Green   (< 80% utilization)   → Available
🟡 Yellow  (80-99% utilization)  → High load
🔴 Red     (100%+ utilization)   → Full/Overload
```

### Chat Bubble Severity

```
Blue border    (low)     → Informational
Orange border  (medium)  → Concern
Red border     (high)    → Alert/Warning
```

## File Structure

```
hospital_orchestration_simulator.py
├─ Imports & Setup
├─ Domain Objects
│  ├─ Patient
│  ├─ PatientMetrics
│  ├─ Event
│  ├─ Room
│  └─ ChatBubble
├─ Triage Logic
│  ├─ early_triage()
│  └─ refined_triage()
├─ Governance & Monitoring
│  ├─ separation_monitor()
│  └─ governance_check()
├─ Social Layer
│  ├─ CHAT_PHRASES (constants)
│  └─ generate_chat_bubble()
├─ Simulation Engine
│  ├─ __init__()
│  ├─ _initialize_rooms()
│  ├─ _generate_patient_*()
│  ├─ _log_event()
│  ├─ _perceive()  ──┐
│  ├─ _classify()    │
│  ├─ _order()       ├─ Agent Loop
│  ├─ _check()       │
│  ├─ _surface()     │
│  ├─ _admit()     ──┘
│  ├─ tick()  ← Executes Agent Loop
│  ├─ get_visual_state()  ← Adapter layer
│  └─ generate_report()   ← Post-run evaluation
└─ Streamlit UI
   ├─ render_patient_token()
   ├─ render_queue_lane()
   ├─ render_room()
   ├─ render_chat_bubble()
   └─ main()  ← Application entry point
```

## Key Design Principles

### 1. Separation of Concerns
- **Logic** never touches UI
- **UI** never mutates state
- **Adapter** is pure transformation

### 2. Explicit Over Implicit
- All state transitions logged
- All decisions have reasoning
- All metrics have formulas

### 3. Human Authority Sacred
- Recommendations shown, not executed
- Controls always available
- Post-hoc review enabled

### 4. Auditability First
- Event log is complete
- No hidden state
- Reproducible from seed

### 5. Cognitive Load Aware
- Discrete ticks (not continuous)
- High contrast visuals
- Minimal animation
- Light mode default

## Extension Points

### Adding New Triage Rules
1. Modify `refined_triage()` function
2. Add keywords/conditions
3. Log reasoning in event details
4. Test with custom CSV

### Adding New Room Types
1. Extend `_initialize_rooms()`
2. Update room routing in `_admit_patients()`
3. Add emoji in `render_room()`
4. Document in profile descriptions

### Adding New Metrics
1. Extend `_calculate_live_metrics()`
2. Add to visual state snapshot
3. Display in UI metrics tab
4. Include in post-run report

### Adding New Chat Triggers
1. Add phrases to `CHAT_PHRASES`
2. Extend `generate_chat_bubble()` conditions
3. Specify severity level
4. Test probabilistic display

## Security & Privacy

### No PHI (Protected Health Information)
- Patient IDs are integers only
- No names, no addresses
- Chief complaints are generic
- Synthetic data only

### No External Dependencies
- No database connections
- No API calls
- No cloud services
- Pure local execution

### Session Isolation
- Each browser session independent
- No shared state between users
- Session state cleared on reset

## Performance Considerations

### Optimization Strategies
- Event log kept in memory (not disk)
- Visual state recomputed each tick
- Chat bubbles limited to last 5-10
- UI updates throttled with sleep()

### Scalability Limits
- Designed for 300s simulations
- ~60 patients maximum
- Memory footprint minimal
- Single-threaded execution

## Testing Approach

### Unit Testing (Recommended)
```python
# Test triage classification
assert early_triage(chest_pain_patient) == "RED"
assert refined_triage(routine_checkup) == "BLUE"

# Test queue ordering
assert queue["RED"][0].triage_stage_2 == "RED"
assert len(queue["BLUE"]) > 0

# Test irrevocable RED rule
patient.triage_stage_2 = "RED"
patient.triage_stage_2 = refined_triage(patient)
assert patient.triage_stage_2 == "RED"  # Must stay RED
```

### Integration Testing (Via UI)
1. Load known CSV dataset
2. Run simulation
3. Verify expected outcomes
4. Check event log consistency
5. Validate score calculations

---

**Architecture Philosophy:**

> "This visualization is intentionally simplified. Its purpose is to make operational stress, ethical trade-offs, and system behavior visible to humans who make real decisions."

The architecture enforces this through strict separation, explicit contracts, and unwavering commitment to human authority.
