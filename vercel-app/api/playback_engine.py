"""
This playback engine reconstructs institutional behavior from immutable events.
It does not simulate, infer, or decide.

ARCHITECTURE:
The visualization is a reader, not a participant.

Event Log → Reducers → State Snapshot → Renderer

All visuals are driven by events. No logic, no inference, no mutation.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any, Tuple
from enum import Enum
import copy

# Import from event-sourced engine
from event_sourced_engine import (
    Event, SimulationRun, InstitutionalParameters,
    PatientStatus, Patient, Room
)

# ============================================================================
# 1. STATE SNAPSHOT (DERIVED FROM EVENTS)
# ============================================================================

@dataclass
class ChatBubble:
    """Chat bubble derived from events."""
    timestamp: int
    actor: str  # "Patient" | "Staff" | "Doctor" | "System"
    message: str
    context: str
    severity: str = "low"  # "low" | "medium" | "high"
    patient_id: Optional[int] = None
    room: Optional[str] = None

@dataclass
class AgentAction:
    """Agent action derived from AGENT_ACTION events."""
    timestamp: int
    action: str
    patient_id: Optional[int]
    rules_triggered: List[str]
    policy_context: Dict
    human_override_allowed: bool

@dataclass
class StateSnapshot:
    """
    Complete state snapshot at a point in time.
    Fully derived from event log up to current position.
    """
    time: int
    
    # Core state
    patients: Dict[int, Patient]
    queues: Dict[str, List[int]]  # {"RED": [id1, id2], ...}
    rooms: List[Room]
    
    # Metrics (from METRIC_UPDATE events)
    metrics: Dict[str, Any]
    
    # Social layer
    chat_bubbles: List[ChatBubble]
    
    # Agent visibility
    recent_agent_actions: List[AgentAction]
    
    # Derived counts
    total_patients: int = 0
    admitted_count: int = 0
    waiting_count: int = 0

# ============================================================================
# 2. PURE REDUCERS (DETERMINISTIC STATE TRANSITIONS)
# ============================================================================

def patient_state_reducer(patients: Dict[int, Patient], event: Event) -> Dict[int, Patient]:
    """
    Pure reducer for patient state.
    
    Rules:
    - Deterministic
    - Idempotent
    - Never inspects future events
    """
    patients = copy.deepcopy(patients)
    payload = event.payload
    
    if event.event_type == "PATIENT_ARRIVAL":
        patient_id = payload["patient_id"]
        patients[patient_id] = Patient(
            id=patient_id,
            arrival_time=event.timestamp,
            chief_complaint=payload.get("chief_complaint", ""),
            age=payload.get("age", 0),
            history=payload.get("history", [])
        )
    
    elif event.event_type == "TRIAGE_STAGE_1_ASSIGNED":
        patient_id = payload["patient_id"]
        if patient_id in patients:
            patients[patient_id].triage_stage_1 = payload["triage"]
    
    elif event.event_type == "TRIAGE_STAGE_2_ASSIGNED":
        patient_id = payload["patient_id"]
        if patient_id in patients:
            patients[patient_id].triage_stage_2 = payload["triage"]
    
    elif event.event_type == "PATIENT_ADMITTED":
        patient_id = payload["patient_id"]
        if patient_id in patients:
            patients[patient_id].status = PatientStatus.ADMITTED
    
    return patients

def queue_state_reducer(queues: Dict[str, List[int]], event: Event) -> Dict[str, List[int]]:
    """Pure reducer for queue state."""
    queues = copy.deepcopy(queues)
    payload = event.payload
    
    if event.event_type == "QUEUE_ASSIGNMENT":
        patient_id = payload["patient_id"]
        queue_name = payload["queue"]
        if patient_id not in queues[queue_name]:
            queues[queue_name].append(patient_id)
    
    elif event.event_type == "QUEUE_REORDER":
        # Rebuild from payload
        if "new_state" in payload:
            queues = copy.deepcopy(payload["new_state"])
    
    elif event.event_type == "PATIENT_ADMITTED":
        # Remove from all queues
        patient_id = payload["patient_id"]
        for queue_name in queues:
            if patient_id in queues[queue_name]:
                queues[queue_name].remove(patient_id)
    
    return queues

def room_state_reducer(rooms: List[Room], event: Event) -> List[Room]:
    """Pure reducer for room state."""
    rooms = copy.deepcopy(rooms)
    payload = event.payload
    
    if event.event_type == "RUN_STARTED":
        # Initialize rooms from profile
        profile = payload.get("institutional_profile", "Balanced")
        rooms = _initialize_rooms(profile)
    
    elif event.event_type == "PATIENT_ADMITTED":
        room_name = payload.get("room")
        for room in rooms:
            if room.name == room_name:
                room.current_load += 1
    
    elif event.event_type == "ROOM_DISCHARGE":
        room_name = payload.get("room_name")
        for room in rooms:
            if room.name == room_name:
                room.current_load = max(0, room.current_load - 1)
    
    return rooms

def _initialize_rooms(profile: str) -> List[Room]:
    """Initialize rooms from profile."""
    if profile == "Government Hospital":
        return [
            Room("Emergency 1", "Emergency", 1),
            Room("Emergency 2", "Emergency", 1),
            Room("OPD 1", "General OPD", 2),
            Room("OPD 2", "General OPD", 2),
        ]
    elif profile == "Private Hospital":
        return [
            Room("Emergency 1", "Emergency", 2),
            Room("Emergency 2", "Emergency", 2),
            Room("OPD 1", "General OPD", 3),
            Room("OPD 2", "General OPD", 3),
            Room("Preventive Care", "Preventive Care", 2),
        ]
    else:  # Balanced
        return [
            Room("Emergency 1", "Emergency", 1),
            Room("Emergency 2", "Emergency", 2),
            Room("OPD 1", "General OPD", 2),
            Room("OPD 2", "General OPD", 3),
            Room("Preventive Care", "Preventive Care", 1),
        ]

def metrics_state_reducer(metrics: Dict[str, Any], event: Event) -> Dict[str, Any]:
    """Pure reducer for metrics state."""
    if event.event_type == "METRIC_UPDATE":
        return copy.deepcopy(event.payload)
    return metrics

def chat_state_reducer(chat_bubbles: List[ChatBubble], event: Event) -> List[ChatBubble]:
    """Pure reducer for chat bubble state."""
    chat_bubbles = list(chat_bubbles)  # Copy
    
    # Generate chat bubbles from specific events
    if event.event_type == "QUEUE_REORDER":
        chat_bubbles.append(ChatBubble(
            timestamp=event.timestamp,
            actor="Patient",
            message="Why did that person go ahead of me?",
            context="Queue reordered",
            severity="medium"
        ))
    
    elif event.event_type == "ESCALATION_SUGGESTED":
        chat_bubbles.append(ChatBubble(
            timestamp=event.timestamp,
            actor="System",
            message="Alert: Capacity threshold exceeded",
            context="Governance escalation",
            severity="high"
        ))
    
    elif event.event_type == "PATIENT_ADMITTED":
        if event.payload.get("triage") == "RED":
            chat_bubbles.append(ChatBubble(
                timestamp=event.timestamp,
                actor="Doctor",
                message="Prioritizing critical case",
                context="Emergency admission",
                severity="high",
                patient_id=event.payload.get("patient_id")
            ))
    
    # Keep only recent bubbles (last 20)
    return chat_bubbles[-20:]

def agent_action_reducer(actions: List[AgentAction], event: Event) -> List[AgentAction]:
    """Pure reducer for agent actions."""
    actions = list(actions)  # Copy
    
    if event.event_type == "AGENT_ACTION":
        payload = event.payload
        actions.append(AgentAction(
            timestamp=event.timestamp,
            action=payload["action"],
            patient_id=payload.get("patient_id"),
            rules_triggered=payload.get("rules_triggered", []),
            policy_context=payload.get("policy_context", {}),
            human_override_allowed=payload.get("human_override_allowed", True)
        ))
    
    # Keep only recent actions (last 10)
    return actions[-10:]

# ============================================================================
# 3. EVENT PLAYBACK CONTROLLER
# ============================================================================

class EventPlaybackController:
    """
    Dedicated controller for event playback.
    
    Responsibilities:
    - Advance pointer through events
    - Rebuild state deterministically
    - Expose state snapshots to renderer
    
    This is a reader, not a participant.
    """
    
    def __init__(self, run: SimulationRun):
        self.run = run
        self.event_log = run.event_log
        self.current_event_index = 0
        self.current_time = 0
        
        # Initialize empty state
        self._patients: Dict[int, Patient] = {}
        self._queues: Dict[str, List[int]] = {"RED": [], "YELLOW": [], "BLUE": []}
        self._rooms: List[Room] = []
        self._metrics: Dict[str, Any] = {}
        self._chat_bubbles: List[ChatBubble] = []
        self._agent_actions: List[AgentAction] = []
        
        # Rebuild initial state
        self._rebuild_to_index(0)
    
    def get_current_snapshot(self) -> StateSnapshot:
        """Get current state snapshot."""
        return StateSnapshot(
            time=self.current_time,
            patients=copy.deepcopy(self._patients),
            queues=copy.deepcopy(self._queues),
            rooms=copy.deepcopy(self._rooms),
            metrics=copy.deepcopy(self._metrics),
            chat_bubbles=list(self._chat_bubbles),
            recent_agent_actions=list(self._agent_actions),
            total_patients=len(self._patients),
            admitted_count=sum(1 for p in self._patients.values() if p.status == PatientStatus.ADMITTED),
            waiting_count=sum(len(q) for q in self._queues.values())
        )
    
    def step_forward(self, num_ticks: int = 1) -> bool:
        """
        Advance by N ticks.
        Returns True if advanced, False if at end.
        """
        target_time = self.current_time + num_ticks
        return self.scrub_to_time(target_time)
    
    def scrub_to_time(self, target_time: int) -> bool:
        """
        Scrub to specific timestamp.
        Replays events, does NOT re-simulate.
        """
        if target_time < 0:
            target_time = 0
        
        # Find target index
        target_index = 0
        for i, event in enumerate(self.event_log):
            if event.timestamp > target_time:
                break
            target_index = i + 1
        
        # Rebuild state to target
        self._rebuild_to_index(target_index)
        
        return target_index < len(self.event_log)
    
    def scrub_to_sequence(self, target_sequence: int) -> bool:
        """Scrub to specific event sequence."""
        target_index = min(target_sequence, len(self.event_log))
        self._rebuild_to_index(target_index)
        return target_index < len(self.event_log)
    
    def _rebuild_to_index(self, target_index: int):
        """
        Rebuild state from events[0:target_index].
        This is pure state reconstruction.
        """
        # Reset state
        self._patients = {}
        self._queues = {"RED": [], "YELLOW": [], "BLUE": []}
        self._rooms = []
        self._metrics = {}
        self._chat_bubbles = []
        self._agent_actions = []
        
        # Apply reducers
        for i in range(target_index):
            event = self.event_log[i]
            
            self._patients = patient_state_reducer(self._patients, event)
            self._queues = queue_state_reducer(self._queues, event)
            self._rooms = room_state_reducer(self._rooms, event)
            self._metrics = metrics_state_reducer(self._metrics, event)
            self._chat_bubbles = chat_state_reducer(self._chat_bubbles, event)
            self._agent_actions = agent_action_reducer(self._agent_actions, event)
        
        # Update pointer
        self.current_event_index = target_index
        if target_index > 0:
            self.current_time = self.event_log[target_index - 1].timestamp
        else:
            self.current_time = 0
    
    def is_at_end(self) -> bool:
        """Check if playback is at end."""
        return self.current_event_index >= len(self.event_log)
    
    def get_max_time(self) -> int:
        """Get maximum timestamp in log."""
        if not self.event_log:
            return 0
        return self.event_log[-1].timestamp
    
    def get_events_at_time(self, timestamp: int) -> List[Event]:
        """Get all events at specific timestamp."""
        return [e for e in self.event_log if e.timestamp == timestamp]
    
    def get_events_by_type(self, event_type: str) -> List[Event]:
        """Filter events by type."""
        return [e for e in self.event_log if e.event_type == event_type]
    
    def get_events_by_patient(self, patient_id: int) -> List[Event]:
        """Filter events by patient ID."""
        events = []
        for event in self.event_log:
            if event.payload.get("patient_id") == patient_id:
                events.append(event)
        return events

# ============================================================================
# 4. PLAYBACK SPEED CONTROLLER
# ============================================================================

class PlaybackSpeed(Enum):
    """Playback speed affects event consumption rate only."""
    SLOW = 0.5
    NORMAL = 1.0
    FAST = 2.0
    FASTER = 4.0

# ============================================================================
# 5. MULTI-RUN COMPARISON ENGINE
# ============================================================================

class MultiRunComparison:
    """
    Compare two simulation runs side-by-side.
    
    Rules:
    - No cross-pollination of state
    - No blended metrics
    - Explicit labeling
    """
    
    def __init__(self, run1: SimulationRun, run2: SimulationRun):
        self.run1 = run1
        self.run2 = run2
        self.controller1 = EventPlaybackController(run1)
        self.controller2 = EventPlaybackController(run2)
    
    def get_comparison_at_time(self, timestamp: int) -> Dict:
        """Get side-by-side comparison at timestamp."""
        self.controller1.scrub_to_time(timestamp)
        self.controller2.scrub_to_time(timestamp)
        
        snap1 = self.controller1.get_current_snapshot()
        snap2 = self.controller2.get_current_snapshot()
        
        return {
            "timestamp": timestamp,
            "run1": {
                "run_id": self.run1.run_id,
                "profile": self.run1.institutional_profile,
                "patients": snap1.total_patients,
                "admitted": snap1.admitted_count,
                "waiting": snap1.waiting_count,
                "metrics": snap1.metrics
            },
            "run2": {
                "run_id": self.run2.run_id,
                "profile": self.run2.institutional_profile,
                "patients": snap2.total_patients,
                "admitted": snap2.admitted_count,
                "waiting": snap2.waiting_count,
                "metrics": snap2.metrics
            }
        }
    
    def get_divergence_points(self) -> List[Tuple[int, str]]:
        """
        Identify points where runs diverge significantly.
        Returns list of (timestamp, reason) tuples.
        """
        divergences = []
        
        max_time = min(self.controller1.get_max_time(), 
                      self.controller2.get_max_time())
        
        for t in range(0, max_time, 30):  # Check every 30 seconds
            comparison = self.get_comparison_at_time(t)
            
            # Check for significant differences
            diff_waiting = abs(comparison["run1"]["waiting"] - 
                             comparison["run2"]["waiting"])
            
            if diff_waiting >= 5:
                divergences.append((t, f"Queue pressure differs by {diff_waiting}"))
        
        return divergences

# ============================================================================
# 6. EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    from event_sourced_engine import EventSourcedSimulationEngine, InstitutionalParameters
    
    # Create simulation run
    engine = EventSourcedSimulationEngine(
        institutional_profile="Balanced",
        seed=42
    )
    run = engine.run_simulation()
    
    # Create playback controller
    controller = EventPlaybackController(run)
    
    # Get initial state
    snapshot = controller.get_current_snapshot()
    print(f"Initial state: {snapshot.total_patients} patients")
    
    # Step forward
    controller.step_forward(30)  # Advance 30 seconds
    snapshot = controller.get_current_snapshot()
    print(f"At 30s: {snapshot.total_patients} patients, {snapshot.waiting_count} waiting")
    
    # Scrub to specific time
    controller.scrub_to_time(120)
    snapshot = controller.get_current_snapshot()
    print(f"At 120s: {snapshot.total_patients} patients, {snapshot.admitted_count} admitted")
    
    # Compare two runs
    params2 = InstitutionalParameters(safety_weight=0.60)
    engine2 = EventSourcedSimulationEngine(
        institutional_profile="Balanced",
        parameters=params2,
        seed=42
    )
    run2 = engine2.run_simulation()
    
    comparison = MultiRunComparison(run, run2)
    result = comparison.get_comparison_at_time(60)
    print(f"\nComparison at 60s:")
    print(f"Run 1: {result['run1']['waiting']} waiting")
    print(f"Run 2: {result['run2']['waiting']} waiting")
