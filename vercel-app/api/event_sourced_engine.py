"""
This simulation engine models institutional decision-making under operational stress.
It is deterministic, event-sourced, and auditable by design.
It does not diagnose, prescribe, or replace clinical judgment.

ARCHITECTURE:
- Event log is the ONLY source of truth
- State is derived from events, never mutated directly
- Parameters are frozen per SimulationRun
- Deterministic: same seed + params = identical event log
- Replayable: event log can reconstruct full state

This event schema is intentionally verbose.
Operational systems earn trust by being inspectable.
"""

import uuid
import json
import random
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Any
from enum import Enum
from datetime import datetime

# ============================================================================
# 1. EVENT SCHEMA (CANONICAL)
# ============================================================================

@dataclass
class Event:
    """
    Canonical event structure.
    
    Rule: If it's not in the event log, it did not happen.
    
    Events obey:
    - Strict timestamp ordering
    - Stable ordering for same timestamp (sequence number)
    - No two events share the same (timestamp, sequence)
    """
    run_id: str
    event_id: str
    timestamp: int  # simulated seconds since run start
    sequence: int  # monotonic counter per run
    event_type: str
    payload: Dict[str, Any]
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)

# ============================================================================
# 2. SIMULATION RUN (TOP-LEVEL ABSTRACTION)
# ============================================================================

@dataclass
class InstitutionalParameters:
    """
    Parameters are frozen per run.
    Changing parameters = creating a new SimulationRun.
    
    These control behavior WITHOUT changing logic.
    """
    # Wait time thresholds (seconds)
    max_wait_red: int = 0
    max_wait_yellow: int = 180
    max_wait_blue: int = 600
    
    # Scoring weights (must sum to 1.0)
    safety_weight: float = 0.45
    experience_weight: float = 0.30
    staff_weight: float = 0.15
    throughput_weight: float = 0.10
    
    # Capacity parameters
    room_intake_modifier: float = 1.0
    escalation_sensitivity: float = 1.0
    
    # Governance thresholds
    red_clustering_threshold: int = 3
    queue_pressure_threshold: int = 15
    
    def __post_init__(self):
        total = self.safety_weight + self.experience_weight + self.staff_weight + self.throughput_weight
        if abs(total - 1.0) > 1e-6:
            raise ValueError(
                f"Scoring weights must sum to 1.0, got {total:.6f} "
                f"(safety={self.safety_weight}, experience={self.experience_weight}, "
                f"staff={self.staff_weight}, throughput={self.throughput_weight})"
            )

    def to_dict(self) -> Dict:
        return asdict(self)

@dataclass
class SimulationRun:
    """
    Each SimulationRun represents one complete institutional reality.

    Key principle: Changing parameters creates a NEW run, never modifies existing.
    """
    run_id: str
    seed: int
    parameters: InstitutionalParameters
    institutional_profile: str  # "Government Hospital" | "Private Hospital" | "Balanced"
    start_time: str  # ISO timestamp
    event_log: List[Event] = field(default_factory=list)
    sequence_counter: int = 0
    current_sim_time: int = 0  # authoritative clock; set by engine before emitting events

    def add_event(self, event_type: str, payload: Dict) -> Event:
        """Add event to log. This is the ONLY way to record state changes."""
        event = Event(
            run_id=self.run_id,
            event_id=str(uuid.uuid4()),
            timestamp=self.current_sim_time,
            sequence=self.sequence_counter,
            event_type=event_type,
            payload=payload
        )
        self.event_log.append(event)
        self.sequence_counter += 1
        return event

    @property
    def current_timestamp(self) -> int:
        """Current simulation time in seconds. Authoritative clock, not derived from log."""
        return self.current_sim_time
    
    def to_dict(self) -> Dict:
        """Export complete run for serialization."""
        return {
            "run_metadata": {
                "run_id": self.run_id,
                "seed": self.seed,
                "institutional_profile": self.institutional_profile,
                "start_time": self.start_time
            },
            "parameters": self.parameters.to_dict(),
            "event_log": [e.to_dict() for e in self.event_log]
        }

# ============================================================================
# 3. DOMAIN OBJECTS (STATE DERIVED FROM EVENTS)
# ============================================================================

class PatientStatus(Enum):
    WAITING = "WAITING"
    ADMITTED = "ADMITTED"
    TRANSFERRED = "TRANSFERRED"
    DEFERRED = "DEFERRED"

@dataclass
class Patient:
    """
    Patient state - derived from events, never modified directly.
    No PHI - only opaque numeric IDs.
    """
    id: int
    arrival_time: int
    chief_complaint: str
    age: int
    history: List[str]
    
    # Derived state (reconstructed from events)
    triage_stage_1: Optional[str] = None
    triage_stage_2: Optional[str] = None
    status: PatientStatus = PatientStatus.WAITING
    queue_position: Optional[int] = None
    current_queue: Optional[str] = None

@dataclass
class Room:
    """Room state - derived from events."""
    name: str
    room_type: str
    max_occupancy: int  # maximum concurrent patients this room can hold
    current_load: int = 0

# ============================================================================
# 4. STATE RECONSTRUCTION (EVENT REPLAY)
# ============================================================================

class SimulationState:
    """
    Complete state derived ONLY from event log.
    
    State reconstruction contract:
    - Start from empty state
    - Replay events in order
    - Apply deterministic reducers
    - No hidden state
    """
    
    def __init__(self):
        self.patients: Dict[int, Patient] = {}
        self.rooms: List[Room] = []
        self.queue: Dict[str, List[int]] = {"RED": [], "YELLOW": [], "BLUE": []}
        self.metrics: Dict[str, float] = {}
        
    def apply_event(self, event: Event):
        """
        Apply single event to state.
        This is a pure reducer - deterministic state transitions.
        """
        payload = event.payload
        
        if event.event_type == "RUN_STARTED":
            # Initialize rooms based on profile
            self._initialize_rooms(payload.get("institutional_profile"))
        
        elif event.event_type == "PATIENT_ARRIVAL":
            patient_id = payload["patient_id"]
            self.patients[patient_id] = Patient(
                id=patient_id,
                arrival_time=event.timestamp,
                chief_complaint=payload.get("chief_complaint", ""),
                age=payload.get("age", 0),
                history=payload.get("history", [])
            )
        
        elif event.event_type == "TRIAGE_STAGE_1_ASSIGNED":
            patient_id = payload["patient_id"]
            if patient_id in self.patients:
                self.patients[patient_id].triage_stage_1 = payload["triage"]
        
        elif event.event_type == "TRIAGE_STAGE_2_ASSIGNED":
            patient_id = payload["patient_id"]
            if patient_id in self.patients:
                self.patients[patient_id].triage_stage_2 = payload["triage"]
        
        elif event.event_type == "QUEUE_ASSIGNMENT":
            patient_id = payload["patient_id"]
            queue_name = payload["queue"]
            if patient_id in self.patients:
                self.patients[patient_id].current_queue = queue_name
                if patient_id not in self.queue[queue_name]:
                    self.queue[queue_name].append(patient_id)
        
        elif event.event_type == "QUEUE_REORDER":
            # Rebuild queue from payload
            if "new_state" in payload:
                for queue_name, patient_ids in payload["new_state"].items():
                    self.queue[queue_name] = patient_ids
        
        elif event.event_type == "PATIENT_ADMITTED":
            patient_id = payload["patient_id"]
            room_name = payload.get("room")
            if patient_id in self.patients:
                self.patients[patient_id].status = PatientStatus.ADMITTED
                # Remove from queue
                for queue_name in self.queue:
                    if patient_id in self.queue[queue_name]:
                        self.queue[queue_name].remove(patient_id)
                # Update room load
                for room in self.rooms:
                    if room.name == room_name:
                        room.current_load += 1
        
        elif event.event_type == "ROOM_DISCHARGE":
            room_name = payload.get("room_name")
            for room in self.rooms:
                if room.name == room_name:
                    room.current_load = max(0, room.current_load - 1)
        
        elif event.event_type == "METRIC_UPDATE":
            self.metrics = payload
    
    def _initialize_rooms(self, profile: str):
        """Initialize rooms from profile."""
        if profile == "Government Hospital":
            self.rooms = [
                Room("Emergency 1", "Emergency", 1),
                Room("Emergency 2", "Emergency", 1),
                Room("OPD 1", "General OPD", 2),
                Room("OPD 2", "General OPD", 2),
            ]
        elif profile == "Private Hospital":
            self.rooms = [
                Room("Emergency 1", "Emergency", 2),
                Room("Emergency 2", "Emergency", 2),
                Room("OPD 1", "General OPD", 3),
                Room("OPD 2", "General OPD", 3),
                Room("Preventive Care", "Preventive Care", 2),
            ]
        else:  # Balanced
            self.rooms = [
                Room("Emergency 1", "Emergency", 1),
                Room("Emergency 2", "Emergency", 2),
                Room("OPD 1", "General OPD", 2),
                Room("OPD 2", "General OPD", 3),
                Room("Preventive Care", "Preventive Care", 1),
            ]
    
    @classmethod
    def from_event_log(cls, events: List[Event]) -> 'SimulationState':
        """
        Reconstruct complete state from event log.
        This is the state reconstruction contract.
        """
        state = cls()
        for event in events:
            state.apply_event(event)
        return state

# ============================================================================
# 5. TRIAGE LOGIC (PURE FUNCTIONS)
# ============================================================================

RED_FLAG_KEYWORDS = [
    "chest pain", "unconscious", "severe bleeding", "stroke", "heart attack",
    "difficulty breathing", "choking", "severe trauma", "unresponsive",
    "seizure", "head injury", "severe burn", "collapse", "sweating",
    "radiating", "chest tightness", "shortness of breath", "neck swelling"
]

def early_triage(chief_complaint: str, age: int, history: List[str]) -> str:
    """
    Early coarse triage - conservative, fail-open.
    Returns: "RED" or "NOT_RED"
    """
    complaint_lower = chief_complaint.lower()
    for keyword in RED_FLAG_KEYWORDS:
        if keyword in complaint_lower:
            return "RED"
    return "NOT_RED"

def refined_triage(chief_complaint: str, age: int, history: List[str], 
                  triage_stage_1: str) -> str:
    """
    Late refined triage with age/history/complaint.
    Returns: "RED" | "YELLOW" | "BLUE"
    
    IRREVOCABLE RED RULE: Once RED, stays RED.
    """
    if triage_stage_1 == "RED":
        return "RED"
    
    complaint_lower = chief_complaint.lower()
    high_risk_age = age > 65 or age < 5
    high_risk_history = any(
        condition in " ".join(history).lower()
        for condition in ["diabetes", "hypertension", "cardiac", "respiratory",
                         "hyperlipidemia", "smoking"]
    )
    
    yellow_keywords = [
        "fracture", "infection", "high fever", "moderate pain", "severe pain",
        "vomiting", "dizziness", "rash", "wound", "abdominal pain",
        "loose motion", "swelling", "accident", "fell", "tooth came out"
    ]
    
    is_yellow = any(keyword in complaint_lower for keyword in yellow_keywords)
    
    if high_risk_age and (high_risk_history or is_yellow):
        return "YELLOW"
    elif is_yellow:
        return "YELLOW"
    else:
        return "BLUE"

# ============================================================================
# 6. SIMULATION ENGINE (EVENT-SOURCED)
# ============================================================================

class EventSourcedSimulationEngine:
    """
    Pure event-sourced simulation engine.
    
    Key principles:
    - Event log is the ONLY source of truth
    - State is derived, never mutated directly
    - Parameters frozen per run
    - Deterministic and replayable
    
    Agent Loop (IMMUTABLE):
    PERCEIVE → CLASSIFY → ORDER → CHECK → SURFACE → LOG
    """
    
    def __init__(self, 
                 institutional_profile: str = "Balanced",
                 parameters: Optional[InstitutionalParameters] = None,
                 seed: int = 42,
                 patient_dataset: Optional[List[Dict]] = None):
        
        # Create new simulation run
        self.run = SimulationRun(
            run_id=str(uuid.uuid4()),
            seed=seed,
            parameters=parameters or InstitutionalParameters(),
            institutional_profile=institutional_profile,
            start_time=datetime.utcnow().isoformat()
        )
        
        # Set random seed for determinism
        random.seed(seed)
        
        # Configuration
        self.max_ticks = 300  # 5 minutes
        self.current_tick = 0
        self.patient_dataset = patient_dataset or []
        self.patient_id_counter = 0
        
        # Emit RUN_STARTED event
        self.run.add_event("RUN_STARTED", {
            "seed": seed,
            "institutional_profile": institutional_profile,
            "parameters": self.run.parameters.to_dict()
        })
    
    def get_current_state(self) -> SimulationState:
        """Derive current state from event log."""
        return SimulationState.from_event_log(self.run.event_log)
    
    def tick(self):
        """
        Execute one simulation tick.

        IMMUTABLE AGENT LOOP:
        1. PERCEIVE - detect arrivals
        2. CLASSIFY - perform triage
        3. ORDER - organize queues
        4. CHECK - governance monitoring
        5. SURFACE - emit recommendations
        6. LOG - all handled via add_event()
        """
        self.current_tick += 1
        # Advance authoritative clock BEFORE emitting any events this tick.
        # All events in tick N are stamped with N*5 (seconds).
        self.run.current_sim_time = self.current_tick * 5
        
        # Get current state (derived from events)
        state = self.get_current_state()
        
        # 1. PERCEIVE - patient arrivals
        self._perceive(state)
        
        # 2. CLASSIFY - triage
        self._classify(state)
        
        # 3. ORDER - queue management
        self._order(state)
        
        # 4. CHECK - governance
        self._check_governance(state)
        
        # 5. SURFACE - handled via events
        
        # 6. Admissions
        self._process_admissions(state)
        
        # Room discharge cycle
        if self.current_tick % 30 == 0:
            for room in state.rooms:
                if room.current_load > 0:
                    self.run.add_event("ROOM_DISCHARGE", {
                        "room_type": room.room_type,
                        "room_name": room.name
                    })
    
    def _perceive(self, state: SimulationState):
        """PERCEIVE: Detect new patient arrivals."""
        # Generate patient (from dataset or random)
        if self.patient_dataset and self.current_tick < len(self.patient_dataset):
            patient_data = self.patient_dataset[self.current_tick]
            if patient_data.get("arrival_time", 0) == self.current_tick:
                self._emit_patient_arrival(patient_data)
        elif self.current_tick % 5 == 0 and self.current_tick < self.max_ticks:
            # Random generation every 5 seconds
            self._emit_random_patient_arrival()
    
    def _emit_patient_arrival(self, patient_data: Dict):
        """Emit patient arrival event."""
        patient_id = patient_data.get("id", self.patient_id_counter)
        self.patient_id_counter = max(self.patient_id_counter, patient_id) + 1
        
        # PATIENT_ARRIVAL event
        self.run.add_event("PATIENT_ARRIVAL", {
            "patient_id": patient_id,
            "arrival_gate": True,
            "chief_complaint": patient_data.get("chief_complaint", ""),
            "age": patient_data.get("age", 0),
            "history": patient_data.get("history", [])
        })
        
        # Immediate early triage
        triage_result = early_triage(
            patient_data.get("chief_complaint", ""),
            patient_data.get("age", 0),
            patient_data.get("history", [])
        )
        
        self.run.add_event("TRIAGE_STAGE_1_ASSIGNED", {
            "patient_id": patient_id,
            "triage": triage_result,
            "method": "keyword_matching",
            "conservative": True
        })
    
    def _emit_random_patient_arrival(self):
        """Generate random patient arrival."""
        self.patient_id_counter += 1
        patient_id = self.patient_id_counter
        
        # Random complaint
        complaints = [
            "chest pain", "difficulty breathing", "fracture",
            "high fever", "headache", "cough and cold", "routine checkup"
        ]
        complaint = random.choice(complaints)
        
        # Random age
        age = random.randint(18, 80)
        
        # History based on age
        history = []
        if age > 50:
            if random.random() < 0.4:
                history.append("hypertension")
            if random.random() < 0.3:
                history.append("diabetes")
        
        self._emit_patient_arrival({
            "id": patient_id,
            "chief_complaint": complaint,
            "age": age,
            "history": history
        })
    
    def _classify(self, state: SimulationState):
        """CLASSIFY: Perform refined triage."""
        wait_threshold = 60
        
        for patient in state.patients.values():
            if patient.status != PatientStatus.WAITING:
                continue
            
            if patient.triage_stage_2 is None:
                wait_time = self.current_tick - patient.arrival_time
                
                # Conditions for refined triage
                at_front = any(
                    queue and queue[0] == patient.id 
                    for queue in state.queue.values()
                )
                waited_long = wait_time > wait_threshold
                
                if at_front or waited_long:
                    triage_result = refined_triage(
                        patient.chief_complaint,
                        patient.age,
                        patient.history,
                        patient.triage_stage_1 or "NOT_RED"
                    )
                    
                    self.run.add_event("TRIAGE_STAGE_2_ASSIGNED", {
                        "patient_id": patient.id,
                        "triage": triage_result,
                        "wait_time": wait_time,
                        "reason": "At front" if at_front else "Wait threshold"
                    })
    
    def _order(self, state: SimulationState):
        """ORDER: Organize queues by triage bands."""
        prev_state = {
            band: list(patients)
            for band, patients in state.queue.items()
        }
        
        # Rebuild queues (FIFO within band)
        new_queue = {"RED": [], "YELLOW": [], "BLUE": []}
        
        for patient in state.patients.values():
            if patient.status == PatientStatus.WAITING and patient.triage_stage_2:
                new_queue[patient.triage_stage_2].append(patient.id)
        
        # Check if reordering occurred
        if prev_state != new_queue:
            self.run.add_event("QUEUE_REORDER", {
                "previous_state": prev_state,
                "new_state": new_queue
            })
    
    def _check_governance(self, state: SimulationState):
        """CHECK: Governance monitoring."""
        recommendations = []
        
        # Separation monitor
        red_waiting = len(state.queue["RED"])
        if red_waiting >= self.run.parameters.red_clustering_threshold:
            recommendations.extend([
                "SUGGEST_EXTERNAL_REFERRAL",
                "SUGGEST_ROOM_MORPH",
                "SUGGEST_REAPPOINTMENT"
            ])
            
            self.run.add_event("AGENT_ACTION", {
                "action": "SEPARATION_ALERT",
                "rules_triggered": ["RED_CLUSTERING_THRESHOLD"],
                "policy_context": {
                    "threshold": self.run.parameters.red_clustering_threshold,
                    "red_waiting": red_waiting
                },
                "human_override_allowed": True
            })
        
        # Queue pressure
        total_waiting = sum(len(q) for q in state.queue.values())
        if total_waiting > self.run.parameters.queue_pressure_threshold:
            recommendations.append("SUGGEST_CAPACITY_INCREASE")
        
        # Emit escalation if recommendations exist
        if recommendations:
            self.run.add_event("ESCALATION_SUGGESTED", {
                "recommendations": recommendations,
                "reason": "Governance threshold exceeded"
            })
    
    def _process_admissions(self, state: SimulationState):
        """Process patient admissions to rooms."""
        priority_order = ["RED", "YELLOW", "BLUE"]
        
        for band in priority_order:
            for patient_id in list(state.queue[band]):
                patient = state.patients.get(patient_id)
                if not patient:
                    continue
                
                # Try to admit
                if band == "RED":
                    # Emergency rooms
                    for room in state.rooms:
                        if room.room_type == "Emergency" and room.current_load < room.max_occupancy:
                            wait_time = self.current_tick - patient.arrival_time
                            
                            self.run.add_event("PATIENT_ADMITTED", {
                                "patient_id": patient_id,
                                "room": room.name,
                                "room_type": room.room_type,
                                "wait_time": wait_time,
                                "triage": patient.triage_stage_2
                            })
                            
                            self.run.add_event("AGENT_ACTION", {
                                "action": "ADMIT_TO_EMERGENCY",
                                "patient_id": patient_id,
                                "rules_triggered": ["RED_PRIORITY_ADMISSION"],
                                "policy_context": {
                                    "safety_weight": self.run.parameters.safety_weight
                                },
                                "human_override_allowed": False
                            })
                            break
                else:
                    # OPD/Preventive
                    for room in state.rooms:
                        if room.room_type in ["General OPD", "Preventive Care"] and \
                           room.current_load < room.max_occupancy:
                            wait_time = self.current_tick - patient.arrival_time
                            
                            self.run.add_event("PATIENT_ADMITTED", {
                                "patient_id": patient_id,
                                "room": room.name,
                                "room_type": room.room_type,
                                "wait_time": wait_time,
                                "triage": patient.triage_stage_2
                            })
                            break
    
    def run_simulation(self) -> SimulationRun:
        """Run complete simulation."""
        while self.current_tick < self.max_ticks:
            self.tick()
        
        # Emit final metrics
        state = self.get_current_state()
        self._emit_final_metrics(state)
        
        return self.run
    
    def _emit_final_metrics(self, state: SimulationState):
        """Emit final metric update."""
        total_patients = len(state.patients)
        admitted = sum(1 for p in state.patients.values() if p.status == PatientStatus.ADMITTED)
        waiting = sum(len(q) for q in state.queue.values())
        
        self.run.add_event("METRIC_UPDATE", {
            "total_patients": total_patients,
            "admitted": admitted,
            "waiting": waiting,
            "timestamp": self.current_tick
        })
    
    def export_run(self) -> Dict:
        """Export complete run for serialization."""
        return self.run.to_dict()

# ============================================================================
# 7. REPLAY ENGINE (STATE RECONSTRUCTION)
# ============================================================================

class ReplayEngine:
    """
    Replay engine for state reconstruction and analysis.
    
    Guarantees:
    - Replay at any timestamp
    - Pause at any event
    - Side-by-side comparison of two runs
    - Deterministic outcomes
    """
    
    @staticmethod
    def replay_to_timestamp(events: List[Event], target_timestamp: int) -> SimulationState:
        """Replay events up to target timestamp."""
        relevant_events = [e for e in events if e.timestamp <= target_timestamp]
        return SimulationState.from_event_log(relevant_events)
    
    @staticmethod
    def replay_to_sequence(events: List[Event], target_sequence: int) -> SimulationState:
        """Replay events up to target sequence."""
        relevant_events = [e for e in events if e.sequence <= target_sequence]
        return SimulationState.from_event_log(relevant_events)
    
    @staticmethod
    def compare_runs(run1: SimulationRun, run2: SimulationRun) -> Dict:
        """Compare two simulation runs side-by-side."""
        state1 = SimulationState.from_event_log(run1.event_log)
        state2 = SimulationState.from_event_log(run2.event_log)
        
        return {
            "run1": {
                "run_id": run1.run_id,
                "parameters": run1.parameters.to_dict(),
                "total_patients": len(state1.patients),
                "admitted": sum(1 for p in state1.patients.values() if p.status == PatientStatus.ADMITTED)
            },
            "run2": {
                "run_id": run2.run_id,
                "parameters": run2.parameters.to_dict(),
                "total_patients": len(state2.patients),
                "admitted": sum(1 for p in state2.patients.values() if p.status == PatientStatus.ADMITTED)
            }
        }
    
    @staticmethod
    def export_event_log_json(run: SimulationRun, filename: str):
        """Export event log to JSON file."""
        with open(filename, 'w') as f:
            json.dump(run.to_dict(), f, indent=2)
    
    @staticmethod
    def import_event_log_json(filename: str) -> SimulationRun:
        """Import event log from JSON file."""
        with open(filename, 'r') as f:
            data = json.load(f)
        
        # Reconstruct run
        run = SimulationRun(
            run_id=data["run_metadata"]["run_id"],
            seed=data["run_metadata"]["seed"],
            parameters=InstitutionalParameters(**data["parameters"]),
            institutional_profile=data["run_metadata"]["institutional_profile"],
            start_time=data["run_metadata"]["start_time"]
        )
        
        # Reconstruct events
        for event_data in data["event_log"]:
            event = Event(**event_data)
            run.event_log.append(event)
            run.sequence_counter = max(run.sequence_counter, event.sequence + 1)
        
        return run

# ============================================================================
# 8. EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    # Example: Create and run simulation
    engine = EventSourcedSimulationEngine(
        institutional_profile="Balanced",
        seed=42
    )
    
    # Run simulation
    completed_run = engine.run_simulation()
    
    # Export event log
    print("Event log exported:")
    print(json.dumps(completed_run.to_dict(), indent=2)[:500] + "...")
    
    # Replay to specific timestamp
    state_at_60s = ReplayEngine.replay_to_timestamp(completed_run.event_log, 60)
    print(f"\nState at 60s: {len(state_at_60s.patients)} patients")
    
    # Example: Compare two runs with different parameters
    params1 = InstitutionalParameters(safety_weight=0.45)
    params2 = InstitutionalParameters(safety_weight=0.60)
    
    engine1 = EventSourcedSimulationEngine("Balanced", params1, seed=42)
    engine2 = EventSourcedSimulationEngine("Balanced", params2, seed=42)
    
    run1 = engine1.run_simulation()
    run2 = engine2.run_simulation()
    
    comparison = ReplayEngine.compare_runs(run1, run2)
    print("\nRun comparison:")
    print(json.dumps(comparison, indent=2))
