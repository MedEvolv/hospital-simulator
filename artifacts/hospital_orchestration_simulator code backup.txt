"""
Living Hospital Orchestration Simulator
Eka Care–aligned, Governance-Safe

Engineering Principle:
> If a decision cannot be explained in one sentence to a tired nurse at 2 a.m.,
  it does not belong in this system.

This visualization is intentionally simplified. Its purpose is to make operational
stress, ethical trade-offs, and system behavior visible to humans who make real
decisions.

VISUALIZATION PHILOSOPHY:
The visual style is intentionally simplified to reduce intimidation and invite
exploration by clinicians, administrators, and policy stakeholders. Serious
systems are best understood when they can be played with safely.

This is not a game engine.
This is not an animation project.
This is not a dashboard.
This is a symbolic spatial representation of an operational healthcare system under stress.
"""

import streamlit as st
import json
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from enum import Enum
import random
import time

# ============================================================================
# 1. CORE DOMAIN OBJECTS
# ============================================================================

class PatientStatus(Enum):
    """Patient status - transitions are explicit and logged."""
    WAITING = "WAITING"
    ADMITTED = "ADMITTED"
    TRANSFERRED = "TRANSFERRED"
    DEFERRED = "DEFERRED"

@dataclass
class Patient:
    """
    Core patient object - fields are LOCKED per specification.
    NOTE: This class represents REALITY, not measurement.
    """
    id: int
    arrival_time: int  # seconds since simulation start
    chief_complaint: str
    age: int
    history: List[str]
    triage_stage_1: Optional[str] = None  # "RED" | "NOT_RED"
    triage_stage_2: Optional[str] = None  # "RED" | "YELLOW" | "BLUE"
    status: PatientStatus = PatientStatus.WAITING
    condition_worsening: bool = False  # Visual indicator

@dataclass
class PatientMetrics:
    """Metrics derived from patient journey - separate from core domain."""
    patient_id: int
    admission_time: Optional[int] = None
    triage_2_start_time: Optional[int] = None
    wait_time_at_triage_2: int = 0

@dataclass
class Event:
    """Event log entry. Rule: If it's not logged, it did not happen."""
    timestamp: int
    type: str
    entity_id: Optional[int]
    details: Dict

@dataclass
class Room:
    """Hospital room with capacity constraints."""
    name: str
    room_type: str
    capacity_per_minute: int
    current_load: int = 0
    time_to_next_free: int = 30  # seconds until slot opens

@dataclass
class ChatBubble:
    """Social layer - effects only, never causes."""
    timestamp: int
    actor: str  # Patient | Staff | Doctor | System
    message: str
    context: str
    severity: str = "low"  # low | medium | high
    patient_id: Optional[int] = None
    room: Optional[str] = None

# ============================================================================
# 2. TRIAGE LOGIC
# ============================================================================

RED_FLAG_KEYWORDS = [
    "chest pain", "unconscious", "severe bleeding", "stroke", "heart attack",
    "difficulty breathing", "choking", "severe trauma", "unresponsive",
    "seizure", "head injury", "severe burn", "collapse", "sweating",
    "radiating", "chest tightness", "shortness of breath", "neck swelling"
]

def early_triage(patient: Patient) -> str:
    """Early coarse triage - conservative and dumb on purpose."""
    complaint_lower = patient.chief_complaint.lower()
    for keyword in RED_FLAG_KEYWORDS:
        if keyword in complaint_lower:
            return "RED"
    return "NOT_RED"

def refined_triage(patient: Patient) -> str:
    """
    Late Refined Triage with age, history, and complaint.
    IRREVOCABLE RED RULE: Once RED, stays RED.
    """
    if patient.triage_stage_1 == "RED":
        return "RED"
    
    complaint_lower = patient.chief_complaint.lower()
    high_risk_age = patient.age > 65 or patient.age < 5
    high_risk_history = any(
        condition in " ".join(patient.history).lower()
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
# 3. GOVERNANCE & MONITORING
# ============================================================================

def separation_monitor(queue: Dict[str, List[Patient]], current_time: int,
                      threshold: int = 3) -> bool:
    """Detect unsafe clustering of high-risk patients."""
    red_waiting = len(queue["RED"])
    return red_waiting >= threshold

def governance_check(queue: Dict[str, List[Patient]], rooms: List[Room],
                    current_time: int) -> List[str]:
    """Governance Gate - returns recommendations only."""
    recommendations = []
    
    if separation_monitor(queue, current_time):
        recommendations.extend([
            "SUGGEST_EXTERNAL_REFERRAL",
            "SUGGEST_ROOM_MORPH",
            "SUGGEST_REAPPOINTMENT"
        ])
    
    total_waiting = sum(len(q) for q in queue.values())
    if total_waiting > 15:
        recommendations.append("SUGGEST_CAPACITY_INCREASE")
    
    emergency_rooms = [r for r in rooms if r.room_type == "Emergency"]
    if emergency_rooms:
        total_capacity = sum(r.capacity_per_minute for r in emergency_rooms)
        total_load = sum(r.current_load for r in emergency_rooms)
        if total_capacity > 0:
            utilization = total_load / total_capacity
            if utilization > 0.85:
                recommendations.append("SUGGEST_EMERGENCY_BACKUP")
    
    return recommendations

# ============================================================================
# 4. CHAT BUBBLES (SOCIAL LAYER)
# ============================================================================

CHAT_PHRASES = {
    "patient_complaint_reorder": [
        "Why did that person go ahead of me?",
        "I've been waiting for so long...",
        "Is there a problem with my case?",
        "When will it be my turn?"
    ],
    "patient_complaint_wait": [
        "How much longer do I have to wait?",
        "I arrived before them, why are they going first?",
        "This waiting time is too long.",
        "My pain is getting worse."
    ],
    "staff_explanation": [
        "Your case is being carefully reviewed.",
        "We're managing multiple urgent cases right now.",
        "A doctor will see you as soon as possible.",
        "We prioritize based on medical urgency, not arrival time."
    ],
    "staff_overload": [
        "Emergency is full.",
        "We need more capacity.",
        "This patient should be escalated.",
        "We're overloaded."
    ],
    "system_escalation": [
        "Alert: High volume of urgent cases detected.",
        "Recommendation: Consider external referral options.",
        "System suggests capacity review.",
        "Warning: Emergency department at high utilization."
    ],
    "staff_reassurance_deferral": [
        "We can schedule you for tomorrow when we have more capacity.",
        "Your condition can be safely managed with a follow-up appointment.",
        "We'll ensure you get the care you need at the right time.",
        "Let's book you a proper appointment slot."
    ],
    "doctor_triage": [
        "Reviewing patient urgency levels.",
        "Assessing immediate medical needs.",
        "Prioritizing critical cases."
    ]
}

def generate_chat_bubble(event: Event, patient: Optional[Patient] = None,
                        rooms: List[Room] = None) -> Optional[ChatBubble]:
    """Generate chat bubbles based on events."""
    
    if event.type == "QUEUE_REORDERED" and patient:
        return ChatBubble(
            timestamp=event.timestamp,
            actor="Patient",
            message=random.choice(CHAT_PHRASES["patient_complaint_reorder"]),
            context="Queue reordered due to triage",
            severity="medium",
            patient_id=patient.id
        )
    
    elif event.type == "ESCALATION_SUGGESTED":
        return ChatBubble(
            timestamp=event.timestamp,
            actor="System",
            message=random.choice(CHAT_PHRASES["system_escalation"]),
            context="Governance escalation triggered",
            severity="high"
        )
    
    elif event.type == "PATIENT_DEFERRED" and patient:
        return ChatBubble(
            timestamp=event.timestamp,
            actor="Staff",
            message=random.choice(CHAT_PHRASES["staff_reassurance_deferral"]),
            context=f"Patient {patient.id} deferred",
            severity="low",
            patient_id=patient.id
        )
    
    elif event.type == "TRIAGE_STAGE_2_ASSIGNED" and patient:
        if random.random() < 0.3:
            if patient.triage_stage_2 == "RED":
                return ChatBubble(
                    timestamp=event.timestamp,
                    actor="Doctor",
                    message=random.choice(CHAT_PHRASES["doctor_triage"]),
                    context=f"Triaging patient {patient.id}",
                    severity="medium",
                    patient_id=patient.id
                )
            elif random.random() < 0.5:
                return ChatBubble(
                    timestamp=event.timestamp,
                    actor="Patient",
                    message=random.choice(CHAT_PHRASES["patient_complaint_wait"]),
                    context=f"Patient {patient.id} waiting",
                    severity="medium",
                    patient_id=patient.id
                )
    
    elif event.type == "ROOM_OVERLOAD" and rooms:
        return ChatBubble(
            timestamp=event.timestamp,
            actor="Staff",
            message=random.choice(CHAT_PHRASES["staff_overload"]),
            context="Room capacity exceeded",
            severity="high",
            room=event.details.get("room", "Unknown")
        )
    
    return None

# ============================================================================
# 5. SIMULATION ENGINE
# ============================================================================

class SimulationEngine:
    """
    Core simulation engine implementing deterministic orchestration.
    Agent Loop (IMMUTABLE): PERCEIVE → CLASSIFY → ORDER → CHECK → SURFACE → LOG
    """
    
    def __init__(self, profile: str = "Balanced", use_test_data: bool = False,
                 custom_dataset: Optional[List[Dict]] = None):
        self.profile = profile
        self.use_test_data = use_test_data
        self.custom_dataset = custom_dataset
        self.current_time = 0
        self.duration = 300  # 5 minutes
        self.arrival_interval = 5
        
        # Core state
        self.patients: List[Patient] = []
        self.queue: Dict[str, List[Patient]] = {"RED": [], "YELLOW": [], "BLUE": []}
        
        # Logging and social layer
        self.events: List[Event] = []
        self.chat_bubbles: List[ChatBubble] = []
        
        # Infrastructure
        self.rooms = self._initialize_rooms(profile)
        self.patient_id_counter = 0
        
        # Tracking
        self.admitted_patients: List[Patient] = []
        self.deferred_patients: List[Patient] = []
        self.transferred_patients: List[Patient] = []
        self.patient_metrics: Dict[int, PatientMetrics] = {}
        
        # Agent action log
        self.agent_actions: List[Dict] = []
        
        # Load test data if requested
        if use_test_data:
            self.test_dataset = custom_dataset if custom_dataset else self._load_test_dataset()
            self.test_data_index = 0
    
    def _load_test_dataset(self) -> List[Dict]:
        """Load the provided test dataset."""
        return [
            {"id": 1, "arrival_time": 0, "chief_complaint": "severe chest pain radiating to left arm",
             "age": 62, "history": ["hypertension", "hyperlipidemia"]},
            {"id": 2, "arrival_time": 5, "chief_complaint": "routine blood pressure check", "age": 45,
             "history": ["hypertension"]},
            {"id": 3, "arrival_time": 10, "chief_complaint": "tooth pain cannot sleep at night", "age": 34,
             "history": []},
            {"id": 4, "arrival_time": 15, "chief_complaint": "bleeding gums wants cleaning", "age": 29,
             "history": []},
            {"id": 5, "arrival_time": 20, "chief_complaint": "difficulty breathing and chest tightness",
             "age": 58, "history": ["diabetes"]},
            {"id": 6, "arrival_time": 25, "chief_complaint": "follow up visit for diabetes review",
             "age": 51, "history": ["diabetes"]},
            {"id": 7, "arrival_time": 30, "chief_complaint": "fever for 2 days no other symptoms",
             "age": 22, "history": []},
            {"id": 8, "arrival_time": 35, "chief_complaint": "fell down bike accident tooth came out",
             "age": 18, "history": []},
            {"id": 9, "arrival_time": 40, "chief_complaint": "routine dental scaling appointment",
             "age": 41, "history": []},
            {"id": 10, "arrival_time": 45, "chief_complaint": "sudden severe abdominal pain right side",
             "age": 27, "history": []},
            {"id": 11, "arrival_time": 50, "chief_complaint": "headache wants pain medicine",
             "age": 36, "history": []},
            {"id": 12, "arrival_time": 55, "chief_complaint": "shortness of breath worsening", "age": 70,
             "history": ["cardiac disease"]},
            {"id": 13, "arrival_time": 60, "chief_complaint": "gum swelling mild pain", "age": 33,
             "history": []},
            {"id": 14, "arrival_time": 65, "chief_complaint": "annual health checkup", "age": 39,
             "history": []},
            {"id": 15, "arrival_time": 70, "chief_complaint": "vomiting and loose motion", "age": 26,
             "history": []},
            {"id": 16, "arrival_time": 75, "chief_complaint": "follow up for blood test reports", "age": 48,
             "history": ["hypertension"]},
            {"id": 17, "arrival_time": 80, "chief_complaint": "jaw swelling difficulty opening mouth",
             "age": 44, "history": []},
            {"id": 18, "arrival_time": 85, "chief_complaint": "routine pregnancy counseling", "age": 30,
             "history": []},
            {"id": 19, "arrival_time": 90, "chief_complaint": "chest pain since morning sweating",
             "age": 55, "history": ["smoking"]},
            {"id": 20, "arrival_time": 95, "chief_complaint": "dental sensitivity to cold", "age": 21,
             "history": []},
            {"id": 21, "arrival_time": 100, "chief_complaint": "difficulty breathing and neck swelling",
             "age": 46, "history": []},
            {"id": 22, "arrival_time": 105, "chief_complaint": "follow up for cholesterol", "age": 52,
             "history": ["hyperlipidemia"]},
            {"id": 23, "arrival_time": 110, "chief_complaint": "mild cough and cold", "age": 19,
             "history": []},
            {"id": 24, "arrival_time": 115, "chief_complaint": "routine dental check", "age": 37,
             "history": []},
            {"id": 25, "arrival_time": 120, "chief_complaint": "severe chest pain collapse", "age": 63,
             "history": ["hypertension", "diabetes"]},
        ]
    
    def _initialize_rooms(self, profile: str) -> List[Room]:
        """Initialize rooms based on hospital profile."""
        if profile == "Govt":
            return [
                Room("Emergency 1", "Emergency", capacity_per_minute=1),
                Room("Emergency 2", "Emergency", capacity_per_minute=1),
                Room("OPD 1", "General OPD", capacity_per_minute=2),
                Room("OPD 2", "General OPD", capacity_per_minute=2),
            ]
        elif profile == "Private":
            return [
                Room("Emergency 1", "Emergency", capacity_per_minute=2),
                Room("Emergency 2", "Emergency", capacity_per_minute=2),
                Room("OPD 1", "General OPD", capacity_per_minute=3),
                Room("OPD 2", "General OPD", capacity_per_minute=3),
                Room("Preventive Care", "Preventive Care", capacity_per_minute=2),
            ]
        else:  # Balanced
            return [
                Room("Emergency 1", "Emergency", capacity_per_minute=1),
                Room("Emergency 2", "Emergency", capacity_per_minute=2),
                Room("OPD 1", "General OPD", capacity_per_minute=2),
                Room("OPD 2", "General OPD", capacity_per_minute=3),
                Room("Preventive Care", "Preventive Care", capacity_per_minute=1),
            ]
    
    def _generate_patient_from_test_data(self) -> Optional[Patient]:
        """Generate patient from test dataset."""
        if self.test_data_index >= len(self.test_dataset):
            return None
        
        while self.test_data_index < len(self.test_dataset):
            data = self.test_dataset[self.test_data_index]
            if data["arrival_time"] == self.current_time:
                self.test_data_index += 1
                patient = Patient(
                    id=data["id"],
                    arrival_time=data["arrival_time"],
                    chief_complaint=data["chief_complaint"],
                    age=data["age"],
                    history=data["history"]
                )
                self.patient_metrics[patient.id] = PatientMetrics(patient_id=patient.id)
                return patient
            elif data["arrival_time"] > self.current_time:
                return None
            else:
                self.test_data_index += 1
        return None
    
    def _generate_patient_random(self) -> Patient:
        """Generate random patient."""
        self.patient_id_counter += 1
        
        complaints = [
            ("chest pain", 0.05), ("difficulty breathing", 0.05),
            ("severe bleeding", 0.03), ("fracture", 0.10),
            ("high fever", 0.15), ("moderate pain", 0.20),
            ("cough and cold", 0.15), ("headache", 0.12),
            ("skin rash", 0.10), ("routine checkup", 0.05)
        ]
        
        complaint = random.choices(
            [c[0] for c in complaints],
            weights=[c[1] for c in complaints]
        )[0]
        
        age = random.choices(
            [random.randint(0, 10), random.randint(18, 45),
             random.randint(45, 65), random.randint(65, 90)],
            weights=[0.15, 0.40, 0.30, 0.15]
        )[0]
        
        history = []
        if age > 50:
            if random.random() < 0.4:
                history.append("hypertension")
            if random.random() < 0.3:
                history.append("diabetes")
        
        patient = Patient(
            id=self.patient_id_counter,
            arrival_time=self.current_time,
            chief_complaint=complaint,
            age=age,
            history=history
        )
        
        self.patient_metrics[patient.id] = PatientMetrics(patient_id=patient.id)
        return patient
    
    def _log_event(self, event_type: str, entity_id: Optional[int] = None,
                   details: Dict = None):
        """Event logging - if it's not logged, it did not happen."""
        event = Event(
            timestamp=self.current_time,
            type=event_type,
            entity_id=entity_id,
            details=details or {}
        )
        self.events.append(event)
        
        # Generate chat bubble if applicable
        patient = None
        if entity_id:
            patient = next((p for p in self.patients if p.id == entity_id), None)
        
        bubble = generate_chat_bubble(event, patient, self.rooms)
        if bubble:
            self.chat_bubbles.append(bubble)
    
    def _perceive(self):
        """STEP 1: PERCEIVE - Check for new patient arrivals."""
        if self.use_test_data:
            patient = self._generate_patient_from_test_data()
            if patient:
                self.patients.append(patient)
                self._log_event("PATIENT_ARRIVED", patient.id, {
                    "complaint": patient.chief_complaint,
                    "age": patient.age,
                    "history": patient.history
                })
                patient.triage_stage_1 = early_triage(patient)
                self._log_event("TRIAGE_STAGE_1_ASSIGNED", patient.id, {
                    "triage": patient.triage_stage_1,
                    "reason": "Early coarse triage on arrival"
                })
        else:
            if self.current_time % self.arrival_interval == 0 and self.current_time < self.duration:
                patient = self._generate_patient_random()
                self.patients.append(patient)
                self._log_event("PATIENT_ARRIVED", patient.id, {
                    "complaint": patient.chief_complaint,
                    "age": patient.age
                })
                patient.triage_stage_1 = early_triage(patient)
                self._log_event("TRIAGE_STAGE_1_ASSIGNED", patient.id, {
                    "triage": patient.triage_stage_1
                })
    
    def _classify(self):
        """STEP 2: CLASSIFY - Perform refined triage."""
        wait_threshold = 60
        
        for patient in self.patients:
            if patient.status != PatientStatus.WAITING:
                continue
            
            if patient.triage_stage_2 is None:
                at_front = False
                for band, queue in self.queue.items():
                    if queue and queue[0].id == patient.id:
                        at_front = True
                        break
                
                waited_long = (self.current_time - patient.arrival_time) > wait_threshold
                
                if at_front or waited_long:
                    patient.triage_stage_2 = refined_triage(patient)
                    wait_time = self.current_time - patient.arrival_time
                    
                    if patient.id in self.patient_metrics:
                        self.patient_metrics[patient.id].triage_2_start_time = self.current_time
                        self.patient_metrics[patient.id].wait_time_at_triage_2 = wait_time
                    
                    self._log_event("TRIAGE_STAGE_2_ASSIGNED", patient.id, {
                        "triage": patient.triage_stage_2,
                        "wait_time": wait_time,
                        "reason": "At front of queue" if at_front else "Wait threshold exceeded"
                    })
            
            # Mark patients as worsening if waiting too long
            if (self.current_time - patient.arrival_time) > 120:
                patient.condition_worsening = True
    
    def _order(self):
        """STEP 3: ORDER - Organize queue by triage bands."""
        prev_queue_state = {
            band: [p.id for p in patients]
            for band, patients in self.queue.items()
        }
        
        self.queue = {"RED": [], "YELLOW": [], "BLUE": []}
        
        for patient in self.patients:
            if patient.status == PatientStatus.WAITING and patient.triage_stage_2:
                self.queue[patient.triage_stage_2].append(patient)
        
        new_queue_state = {
            band: [p.id for p in patients]
            for band, patients in self.queue.items()
        }
        
        if prev_queue_state != new_queue_state:
            self._log_event("QUEUE_REORDERED", None, {
                "previous_state": prev_queue_state,
                "new_state": new_queue_state
            })
    
    def _check_governance(self) -> List[str]:
        """STEP 4: CHECK - Governance gate returns recommendations."""
        return governance_check(self.queue, self.rooms, self.current_time)
    
    def _surface_recommendations(self, recommendations: List[str]):
        """STEP 5: SURFACE - Log recommendations."""
        if recommendations:
            self._log_event("ESCALATION_SUGGESTED", None, {
                "recommendations": recommendations,
                "reason": "Governance check triggered"
            })
            
            # Log agent action
            for rec in recommendations:
                self.agent_actions.append({
                    "timestamp": self.current_time,
                    "action": rec.replace("SUGGEST_", "").replace("_", " ").title(),
                    "reason": "Governance threshold exceeded"
                })
    
    def _admit_patients(self):
        """Process admissions based on room capacity."""
        priority_order = ["RED", "YELLOW", "BLUE"]
        
        for band in priority_order:
            for patient in list(self.queue[band]):
                admitted = False
                
                if band == "RED":
                    for room in self.rooms:
                        if room.room_type == "Emergency" and room.current_load < room.capacity_per_minute:
                            patient.status = PatientStatus.ADMITTED
                            room.current_load += 1
                            self.admitted_patients.append(patient)
                            self.queue[band].remove(patient)
                            
                            if patient.id in self.patient_metrics:
                                self.patient_metrics[patient.id].admission_time = self.current_time
                            
                            wait_time = self.current_time - patient.arrival_time
                            self._log_event("PATIENT_ADMITTED", patient.id, {
                                "room": room.name,
                                "wait_time": wait_time,
                                "triage": patient.triage_stage_2
                            })
                            
                            # Agent action log
                            self.agent_actions.append({
                                "timestamp": self.current_time,
                                "action": f"Admitted Patient #{patient.id} to {room.name}",
                                "reason": f"RED priority, wait time: {wait_time}s"
                            })
                            
                            admitted = True
                            break
                else:
                    for room in self.rooms:
                        if room.room_type in ["General OPD", "Preventive Care"] and \
                           room.current_load < room.capacity_per_minute:
                            patient.status = PatientStatus.ADMITTED
                            room.current_load += 1
                            self.admitted_patients.append(patient)
                            self.queue[band].remove(patient)
                            
                            if patient.id in self.patient_metrics:
                                self.patient_metrics[patient.id].admission_time = self.current_time
                            
                            wait_time = self.current_time - patient.arrival_time
                            self._log_event("PATIENT_ADMITTED", patient.id, {
                                "room": room.name,
                                "wait_time": wait_time,
                                "triage": patient.triage_stage_2
                            })
                            
                            admitted = True
                            break
        
        # Room timing - release patients periodically
        if self.current_time % 30 == 0:
            for room in self.rooms:
                room.current_load = max(0, room.current_load - 1)
                room.time_to_next_free = 30
        else:
            for room in self.rooms:
                room.time_to_next_free = max(0, room.time_to_next_free - 1)
        
        # Check for room overload
        for room in self.rooms:
            if room.current_load >= room.capacity_per_minute:
                self._log_event("ROOM_OVERLOAD", None, {
                    "room": room.name,
                    "load": room.current_load,
                    "capacity": room.capacity_per_minute
                })
    
    def tick(self):
        """Execute one simulation tick - IMMUTABLE AGENT LOOP."""
        self.current_time += 1
        
        # Agent Loop: PERCEIVE → CLASSIFY → ORDER → CHECK → SURFACE → LOG
        self._perceive()
        self._classify()
        self._order()
        recommendations = self._check_governance()
        self._surface_recommendations(recommendations)
        self._admit_patients()
    
    def get_visual_state(self) -> Dict:
        """
        Generate visual state snapshot for UI rendering.
        This is the ONLY contract between simulation and visualization.
        """
        arrival_gate = [p.id for p in self.patients 
                       if self.current_time - p.arrival_time < 5]
        
        return {
            "time": self.current_time,
            "arrival_gate": arrival_gate,
            "queues": {
                "RED": [p.id for p in self.queue["RED"]],
                "YELLOW": [p.id for p in self.queue["YELLOW"]],
                "BLUE": [p.id for p in self.queue["BLUE"]]
            },
            "rooms": {
                room.name: {
                    "capacity": room.capacity_per_minute,
                    "occupied": room.current_load,
                    "time_to_next_free": room.time_to_next_free,
                    "type": room.room_type
                }
                for room in self.rooms
            },
            "chat_bubbles": self.chat_bubbles[-5:],  # Last 5
            "metrics": self._calculate_live_metrics(),
            "recent_agent_actions": self.agent_actions[-3:]  # Last 3
        }
    
    def _calculate_live_metrics(self) -> Dict:
        """Calculate live metrics for display."""
        avg_wait_by_color = {}
        for color in ["RED", "YELLOW", "BLUE"]:
            waiting = [p for p in self.queue[color]]
            if waiting:
                avg_wait_by_color[color] = sum(
                    self.current_time - p.arrival_time for p in waiting
                ) / len(waiting)
            else:
                avg_wait_by_color[color] = 0
        
        # Patient satisfaction (simplified for live view)
        total_waiting = sum(len(q) for q in self.queue.values())
        patient_satisfaction = max(0, 100 - (total_waiting * 3))
        
        # Staff stress (simplified for live view)
        overloaded_rooms = sum(1 for r in self.rooms 
                              if r.current_load >= r.capacity_per_minute)
        staff_stress = min(100, overloaded_rooms * 25)
        
        # Ethics overrides
        ethics_overrides = sum(1 for e in self.events 
                             if e.type in ["QUEUE_REORDERED", "ESCALATION_SUGGESTED"])
        
        return {
            "avg_wait_by_color": avg_wait_by_color,
            "patient_satisfaction": patient_satisfaction,
            "staff_stress": staff_stress,
            "ethics_overrides": ethics_overrides
        }
    
    def generate_report(self) -> Dict:
        """Generate comprehensive post-run evaluation report."""
        return {
            "ies": self._calculate_ies(),
            "pss": self._calculate_pss(),
            "sss": self._calculate_sss(),
            "summary": self._generate_summary()
        }
    
    def _calculate_ies(self) -> Dict[str, float]:
        """Calculate Institutional Efficacy Score."""
        red_patients = [p for p in self.patients if p.triage_stage_2 == "RED"]
        red_admitted = [p for p in red_patients if p.status == PatientStatus.ADMITTED]
        safety_score = (len(red_admitted) / len(red_patients) * 100) if red_patients else 100
        
        queue_reorders = sum(1 for e in self.events if e.type == "QUEUE_REORDERED")
        dignity_score = max(0, 100 - (queue_reorders * 3))
        
        if self.admitted_patients:
            total_wait = sum(
                self.patient_metrics[p.id].admission_time - p.arrival_time
                for p in self.admitted_patients
                if p.id in self.patient_metrics and self.patient_metrics[p.id].admission_time
            )
            avg_wait = total_wait / len(self.admitted_patients)
            flow_score = max(0, 100 - (avg_wait / 2))
        else:
            flow_score = 0
        
        escalations = sum(1 for e in self.events if e.type == "ESCALATION_SUGGESTED")
        adaptation_score = min(100, escalations * 15)
        adaptation_score = max(0, adaptation_score - (escalations - 5) * 10) if escalations > 5 else adaptation_score
        
        authority_score = 100
        
        overall = (safety_score + dignity_score + flow_score + adaptation_score + authority_score) / 5
        
        return {
            "Safety Preservation": round(safety_score, 2),
            "Dignity & Fairness": round(dignity_score, 2),
            "Flow Stability": round(flow_score, 2),
            "Capacity Adaptation": round(adaptation_score, 2),
            "Human Authority Integrity": round(authority_score, 2),
            "Overall": round(overall, 2)
        }
    
    def _calculate_pss(self) -> float:
        """Calculate Patient Satisfaction Score."""
        total_patients = len(self.patients)
        if total_patients == 0:
            return 100.0
        
        queue_reorders = sum(1 for e in self.events if e.type == "QUEUE_REORDERED")
        patient_complaints = sum(1 for b in self.chat_bubbles if b.actor == "Patient")
        staff_explanations = sum(1 for b in self.chat_bubbles if b.actor == "Staff")
        deferral_count = len(self.deferred_patients)
        still_waiting = sum(len(q) for q in self.queue.values())
        
        if queue_reorders > 0:
            complaints_about_reorder = sum(1 for b in self.chat_bubbles
                                          if b.actor == "Patient" and "ahead" in b.message.lower())
            silent_reorders = max(0, queue_reorders - complaints_about_reorder)
            SAC = silent_reorders / queue_reorders
        else:
            SAC = 1.0
        
        ESC = min(1.0, staff_explanations / patient_complaints) if patient_complaints > 0 else 1.0
        DTC = 1.0 - (deferral_count / max(1, total_patients)) if deferral_count > 0 else 1.0
        CPC = max(0.0, 1.0 - (patient_complaints / total_patients))
        EPC = max(0.0, 1.0 - (still_waiting / total_patients))
        
        SAC = max(0.0, min(1.0, SAC))
        ESC = max(0.0, min(1.0, ESC))
        DTC = max(0.0, min(1.0, DTC))
        CPC = max(0.0, min(1.0, CPC))
        EPC = max(0.0, min(1.0, EPC))
        
        PSS_raw = (0.30 * SAC + 0.25 * ESC + 0.20 * DTC + 0.15 * CPC + 0.10 * EPC)
        return round(PSS_raw * 100, 2)
    
    def _calculate_sss(self) -> float:
        """Calculate Staff Satisfaction Score."""
        staff_messages = sum(1 for b in self.chat_bubbles if b.actor == "Staff")
        explanation_load_score = max(0, 100 - (staff_messages * 4))
        
        alerts = sum(1 for e in self.events if e.type == "ESCALATION_SUGGESTED")
        alert_density_score = max(0, 100 - (alerts * 8))
        
        patient_concerns = sum(1 for b in self.chat_bubbles if b.actor == "Patient")
        deescalation_score = max(0, 100 - (patient_concerns * 3))
        
        triage_assignments = sum(1 for e in self.events if e.type in
                                ["TRIAGE_STAGE_1_ASSIGNED", "TRIAGE_STAGE_2_ASSIGNED"])
        override_score = max(0, 100 - (triage_assignments / max(1, len(self.patients)) * 20))
        
        sss = (explanation_load_score + alert_density_score + deescalation_score + override_score) / 4
        return round(sss, 2)
    
    def _generate_summary(self) -> Dict:
        """Generate summary statistics."""
        avg_wait = 0.0
        if self.admitted_patients:
            total_wait = sum(
                self.patient_metrics[p.id].admission_time - p.arrival_time
                for p in self.admitted_patients
                if p.id in self.patient_metrics and self.patient_metrics[p.id].admission_time
            )
            avg_wait = total_wait / len(self.admitted_patients)
        
        return {
            "total_patients": len(self.patients),
            "admitted": len(self.admitted_patients),
            "waiting": sum(len(q) for q in self.queue.values()),
            "deferred": len(self.deferred_patients),
            "transferred": len(self.transferred_patients),
            "red_patients": sum(1 for p in self.patients if p.triage_stage_2 == "RED"),
            "yellow_patients": sum(1 for p in self.patients if p.triage_stage_2 == "YELLOW"),
            "blue_patients": sum(1 for p in self.patients if p.triage_stage_2 == "BLUE"),
            "total_events": len(self.events),
            "escalations": sum(1 for e in self.events if e.type == "ESCALATION_SUGGESTED"),
            "avg_wait_time": avg_wait
        }

# ============================================================================
# 6. STREAMLIT UI - "LIVING HOSPITAL" VISUALIZATION
# ============================================================================

def render_patient_token(patient: Patient, size: str = "normal") -> str:
    """
    Render a patient token with color, shape, and visual modifiers.
    
    Visual Grammar:
    - Color = urgency level (RED, YELLOW, BLUE)
    - Shape modifier = condition status
    - Glow = recently reordered
    """
    # Determine color
    color_map = {
        "RED": "🔴",
        "YELLOW": "🟡",
        "BLUE": "🔵",
        "NOT_RED": "⚪"
    }
    
    triage = patient.triage_stage_2 or patient.triage_stage_1 or "NOT_RED"
    emoji = color_map.get(triage, "⚪")
    
    # Shape modifier
    if patient.condition_worsening:
        emoji += "⚠️"  # Warning for worsening
    
    return emoji

def render_queue_lane(queue: List[Patient], color: str, sim: SimulationEngine) -> None:
    """Render a queue lane with stacked patient tokens."""
    color_names = {
        "RED": "Critical",
        "YELLOW": "Urgent", 
        "BLUE": "Routine"
    }
    
    color_display = {
        "RED": "#ff4444",
        "YELLOW": "#ffbb33",
        "BLUE": "#33b5e5"
    }
    
    st.markdown(f"**{color_names[color]} ({len(queue)} waiting)**")
    
    if queue:
        # Show tokens in a grid
        cols = st.columns(min(len(queue), 5))
        for idx, patient in enumerate(queue[:5]):
            with cols[idx]:
                token = render_patient_token(patient)
                st.markdown(f"<div style='text-align: center; font-size: 24px;'>{token}</div>", 
                           unsafe_allow_html=True)
                st.caption(f"P#{patient.id}")
                
                wait_time = sim.current_time - patient.arrival_time
                st.caption(f"{wait_time}s")
        
        if len(queue) > 5:
            st.caption(f"... +{len(queue) - 5} more")
    else:
        st.info("No patients waiting")

def render_room(room: Room) -> None:
    """Render a room as a building with capacity slots."""
    room_emojis = {
        "Emergency": "🚑",
        "General OPD": "🩺",
        "Preventive Care": "🌱",
        "IPD": "🛏️"
    }
    
    emoji = room_emojis.get(room.room_type, "🏥")
    
    # Calculate utilization
    utilization = (room.current_load / room.capacity_per_minute * 100) if room.capacity_per_minute > 0 else 0
    
    # Color code based on utilization
    if utilization >= 100:
        color = "#ff4444"
        status = "⚠️ FULL"
    elif utilization >= 80:
        color = "#ffbb33"
        status = "🟡 High"
    else:
        color = "#33b5e5"
        status = "✅ Available"
    
    st.markdown(f"**{emoji} {room.name}**")
    
    # Progress bar for utilization
    st.progress(min(utilization / 100, 1.0))
    
    col1, col2 = st.columns(2)
    with col1:
        st.caption(f"{room.current_load}/{room.capacity_per_minute} occupied")
    with col2:
        st.caption(f"Next free: {room.time_to_next_free}s")
    
    st.markdown(f"<div style='color: {color}; font-weight: bold;'>{status}</div>", 
               unsafe_allow_html=True)

def render_chat_bubble(bubble: ChatBubble) -> None:
    """Render a chat bubble with appropriate styling."""
    actor_config = {
        "Patient": ("👤", "human", "#e3f2fd"),
        "Staff": ("👨‍⚕️", "assistant", "#f1f8e9"),
        "Doctor": ("🩺", "assistant", "#fff3e0"),
        "System": ("🖥️", "ai", "#fce4ec")
    }
    
    emoji, avatar, bg_color = actor_config.get(bubble.actor, ("💬", "human", "#f5f5f5"))
    
    # Severity styling
    border_color = {
        "low": "#90caf9",
        "medium": "#ffb74d",
        "high": "#ef5350"
    }.get(bubble.severity, "#90caf9")
    
    with st.chat_message(avatar):
        st.markdown(f"""
        <div style='border-left: 3px solid {border_color}; padding-left: 10px;'>
            <strong>{emoji} {bubble.actor}</strong> <em>[{bubble.timestamp}s]</em><br/>
            {bubble.message}
        </div>
        """, unsafe_allow_html=True)

def main():
    """Main Streamlit application."""
    
    st.set_page_config(
        page_title="Living Hospital Orchestration Simulator",
        page_icon="🏥",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Custom CSS for hospital-native light mode
    st.markdown("""
    <style>
    .stApp {
        background-color: #fafafa;
    }
    .metric-card {
        background-color: white;
        padding: 15px;
        border-radius: 5px;
        border: 1px solid #e0e0e0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .zone-header {
        background-color: #e3f2fd;
        padding: 10px;
        border-radius: 5px;
        margin: 10px 0;
        font-weight: bold;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Header
    st.title("🏥 Living Hospital Orchestration Simulator")
    st.markdown("**Eka Care–aligned, Governance-Safe**")
    st.caption("*If a decision cannot be explained in one sentence to a tired nurse at 2 a.m., it does not belong in this system.*")
    st.markdown("---")
    
    # ========================================================================
    # SIDEBAR - SIMULATION CONTROLS
    # ========================================================================
    
    with st.sidebar:
        st.header("⚙️ Simulation Controls")
        
        # Profile selection
        profile = st.selectbox(
            "🏥 Hospital Profile",
            ["Govt", "Private", "Balanced"],
            index=2,
            help="Different profiles have different room capacities and resource constraints"
        )
        
        # Data source
        data_source = st.radio(
            "📊 Patient Data Source",
            ["Built-in Test Dataset", "Random Generation", "Upload Custom CSV"],
            help="Choose how to generate patient data"
        )
        
        custom_dataset = None
        use_test_data = False
        
        if data_source == "Built-in Test Dataset":
            use_test_data = True
            st.info("📊 Using 25-patient deterministic test dataset")
        
        elif data_source == "Upload Custom CSV":
            use_test_data = True
            st.markdown("**📁 Upload Patient CSV**")
            
            uploaded_file = st.file_uploader(
                "Choose CSV file",
                type=['csv'],
                help="CSV must have: id, arrival_time, chief_complaint, age, history"
            )
            
            if uploaded_file:
                try:
                    import pandas as pd
                    df = pd.read_csv(uploaded_file)
                    
                    required_columns = ['id', 'arrival_time', 'chief_complaint', 'age', 'history']
                    missing = [col for col in required_columns if col not in df.columns]
                    
                    if missing:
                        st.error(f"❌ Missing columns: {', '.join(missing)}")
                    else:
                        custom_dataset = []
                        for _, row in df.iterrows():
                            history = row['history']
                            if isinstance(history, str):
                                if history.strip() == '' or history.lower() == 'nan':
                                    history = []
                                else:
                                    history = [h.strip() for h in history.split(',') if h.strip()]
                            elif pd.isna(history):
                                history = []
                            
                            custom_dataset.append({
                                'id': int(row['id']),
                                'arrival_time': int(row['arrival_time']),
                                'chief_complaint': str(row['chief_complaint']),
                                'age': int(row['age']),
                                'history': history
                            })
                        
                        st.success(f"✅ Loaded {len(custom_dataset)} patients")
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
        
        else:  # Random
            st.info("🎲 Random patient generation enabled")
        
        st.markdown("---")
        
        # Simulation controls
        if 'sim' not in st.session_state:
            if st.button("🚀 Start Simulation", type="primary", use_container_width=True):
                if data_source == "Upload Custom CSV" and custom_dataset is None:
                    st.error("Please upload a CSV file first!")
                else:
                    st.session_state.sim = SimulationEngine(profile, use_test_data, custom_dataset)
                    st.session_state.running = False
                    st.session_state.completed = False
                    st.rerun()
        else:
            # Time controls
            st.markdown("**⏯️ Time Controls**")
            
            col1, col2 = st.columns(2)
            with col1:
                if st.button("▶️ Run" if not st.session_state.get('running', False) else "⏸️ Pause",
                            use_container_width=True):
                    st.session_state.running = not st.session_state.get('running', False)
                    st.rerun()
            
            with col2:
                if st.button("⏭️ Step (5s)", use_container_width=True):
                    if st.session_state.sim.current_time < st.session_state.sim.duration:
                        st.session_state.sim.tick()
                        st.rerun()
            
            if st.button("⏭️⏭️ Jump (30s)", use_container_width=True):
                for _ in range(6):
                    if st.session_state.sim.current_time < st.session_state.sim.duration:
                        st.session_state.sim.tick()
                st.rerun()
            
            if st.button("🔄 Reset", use_container_width=True):
                for key in list(st.session_state.keys()):
                    del st.session_state[key]
                st.rerun()
        
        st.markdown("---")
        
        # About
        st.markdown("### 📖 About")
        st.markdown("""
        **Purpose:** Make invisible operational stress visible through symbolic spatial
        representation.
        
        **Core Principles:**
        - Safety first (irrevocable RED rule)
        - Human authority preserved  
        - Full explainability
        - No autonomous decisions
        - Ethical governance
        """)
    
    # ========================================================================
    # MAIN CONTENT
    # ========================================================================
    
    if 'sim' not in st.session_state:
        # Welcome screen
        st.info("👈 Configure simulation settings and click 'Start Simulation' to begin")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("### 🎯 Visual Metaphor")
            st.markdown("""
            This simulator uses a **SimCity-like** top-down view where:
            
            - 🔴🟡🔵 **Patient tokens** = colored circles representing urgency
            - 🏥 **Rooms** = buildings with capacity slots
            - 📊 **Queues** = visible lanes showing congestion
            - 💬 **Chat bubbles** = patient/staff concerns
            - ⚡ **Movement** = discrete steps (no smooth animation)
            
            The visualization makes ethical tension **immediately visible** through
            color, shape, and spatial arrangement.
            """)
        
        with col2:
            st.markdown("### 🧠 The Agent Loop")
            st.markdown("""
            Every simulation tick executes the **immutable agent loop**:
            
            1. **PERCEIVE** → Detect new arrivals
            2. **CLASSIFY** → Perform triage
            3. **ORDER** → Organize queues by urgency
            4. **CHECK** → Governance monitoring
            5. **SURFACE** → Show recommendations (never auto-execute)
            6. **LOG** → Record everything
            
            No step may be skipped or reordered. This ensures consistency and auditability.
            """)
    
    else:
        sim = st.session_state.sim
        
        # Auto-advance if running
        if st.session_state.get('running', False):
            if sim.current_time < sim.duration:
                sim.tick()
                time.sleep(0.2)  # Slow down for visibility
                st.rerun()
            else:
                st.session_state.running = False
                st.session_state.completed = True
        
        # Progress bar
        progress = sim.current_time / sim.duration
        st.progress(progress, text=f"Simulation Progress: {sim.current_time}s / {sim.duration}s")
        
        # Top metrics
        col1, col2, col3, col4, col5 = st.columns(5)
        with col1:
            st.metric("⏱️ Time", f"{sim.current_time}s")
        with col2:
            st.metric("👥 Total", len(sim.patients))
        with col3:
            st.metric("✅ Admitted", len(sim.admitted_patients))
        with col4:
            waiting = sum(len(q) for q in sim.queue.values())
            st.metric("⏳ Waiting", waiting)
        with col5:
            escalations = sum(1 for e in sim.events if e.type == "ESCALATION_SUGGESTED")
            st.metric("⚠️ Escalations", escalations)
        
        st.markdown("---")
        
        # ====================================================================
        # LIVING HOSPITAL MAP
        # ====================================================================
        
        st.markdown("<div class='zone-header'>🏥 LIVING HOSPITAL MAP</div>", 
                   unsafe_allow_html=True)
        
        # Layout: Arrival Gate | Waiting Area | Rooms
        map_col1, map_col2 = st.columns([1, 2])
        
        with map_col1:
            # ARRIVAL GATE
            st.markdown("### 🚪 Arrival Gate")
            visual_state = sim.get_visual_state()
            if visual_state["arrival_gate"]:
                st.markdown("**New arrivals:**")
                for pid in visual_state["arrival_gate"]:
                    patient = next(p for p in sim.patients if p.id == pid)
                    token = render_patient_token(patient)
                    st.markdown(f"{token} Patient #{pid}")
            else:
                st.info("No new arrivals")
            
            st.markdown("---")
            
            # WAITING AREA
            st.markdown("### ⏳ Waiting Area")
            st.caption("Patients organized by urgency bands (FIFO within band)")
            
            for color in ["RED", "YELLOW", "BLUE"]:
                with st.expander(f"{color} Queue", expanded=True):
                    render_queue_lane(sim.queue[color], color, sim)
        
        with map_col2:
            # ROOMS
            st.markdown("### 🏥 Hospital Rooms")
            st.caption("Capacity-constrained treatment areas")
            
            room_cols = st.columns(2)
            for idx, room in enumerate(sim.rooms):
                with room_cols[idx % 2]:
                    render_room(room)
        
        st.markdown("---")
        
        # ====================================================================
        # TABS: EVENT LOG, CHAT, METRICS, AGENT LOG
        # ====================================================================
        
        tab1, tab2, tab3, tab4 = st.tabs([
            "💬 Social Layer (Chat)",
            "📋 Event Log",
            "📊 Live Metrics",
            "🧠 Agent Actions"
        ])
        
        with tab1:
            st.markdown("### 💬 Social Layer - Chat Bubbles")
            st.caption("*Effects only, never causes. Reflects system state but does not influence logic.*")
            
            recent_bubbles = sim.chat_bubbles[-8:][::-1]
            if recent_bubbles:
                for bubble in recent_bubbles:
                    render_chat_bubble(bubble)
            else:
                st.info("No chat activity yet")
        
        with tab2:
            st.markdown("### 📋 Event Log")
            st.caption("Complete audit trail - if it's not logged, it didn't happen")
            
            event_filter = st.multiselect(
                "Filter by type",
                ["PATIENT_ARRIVED", "TRIAGE_STAGE_1_ASSIGNED", "TRIAGE_STAGE_2_ASSIGNED",
                 "QUEUE_REORDERED", "PATIENT_ADMITTED", "ESCALATION_SUGGESTED", "ROOM_OVERLOAD"],
                default=[]
            )
            
            recent_events = sim.events[-20:][::-1]
            if event_filter:
                recent_events = [e for e in recent_events if e.type in event_filter]
            
            if recent_events:
                for event in recent_events:
                    event_emoji = {
                        "PATIENT_ARRIVED": "🚶",
                        "TRIAGE_STAGE_1_ASSIGNED": "🏷️",
                        "TRIAGE_STAGE_2_ASSIGNED": "🔬",
                        "QUEUE_REORDERED": "🔄",
                        "ESCALATION_SUGGESTED": "⚠️",
                        "PATIENT_ADMITTED": "✅",
                        "ROOM_OVERLOAD": "🚨"
                    }
                    emoji = event_emoji.get(event.type, "📌")
                    
                    with st.expander(f"{emoji} [{event.timestamp}s] {event.type}", expanded=False):
                        if event.entity_id:
                            st.markdown(f"**Patient ID:** {event.entity_id}")
                        if event.details:
                            st.json(event.details, expanded=False)
            else:
                st.info("No events match filter")
        
        with tab3:
            st.markdown("### 📊 Live Metrics Dashboard")
            st.caption("These metrics update in real-time but never influence the simulation logic")
            
            metrics = visual_state["metrics"]
            
            # Wait times by color
            st.markdown("**⏱️ Average Wait Times by Urgency**")
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("🔴 RED", f"{metrics['avg_wait_by_color'].get('RED', 0):.1f}s")
            with col2:
                st.metric("🟡 YELLOW", f"{metrics['avg_wait_by_color'].get('YELLOW', 0):.1f}s")
            with col3:
                st.metric("🔵 BLUE", f"{metrics['avg_wait_by_color'].get('BLUE', 0):.1f}s")
            
            st.markdown("---")
            
            # Satisfaction and stress
            col1, col2, col3 = st.columns(3)
            with col1:
                psat = metrics['patient_satisfaction']
                st.metric("😊 Patient Satisfaction", f"{psat:.0f}/100")
                st.progress(psat / 100)
            
            with col2:
                stress = metrics['staff_stress']
                st.metric("👨‍⚕️ Staff Stress", f"{stress:.0f}/100")
                st.progress(stress / 100)
            
            with col3:
                st.metric("⚖️ Ethics Overrides", metrics['ethics_overrides'])
        
        with tab4:
            st.markdown("### 🧠 Agent Action Log")
            st.caption("The agent is not an avatar - it manifests only through logged decisions")
            
            if sim.agent_actions:
                recent_actions = sim.agent_actions[-10:][::-1]
                for action in recent_actions:
                    st.markdown(f"""
                    **[{action['timestamp']}s]** {action['action']}
                    
                    *Reason:* {action['reason']}
                    """)
                    st.markdown("---")
            else:
                st.info("No agent actions yet")
        
        # ====================================================================
        # POST-RUN REPORT
        # ====================================================================
        
        if sim.current_time >= sim.duration and not st.session_state.get('completed', False):
            st.session_state.completed = True
            st.session_state.running = False
        
        if st.session_state.get('completed', False):
            st.markdown("---")
            st.success("✅ Simulation Complete!")
            
            if st.button("📊 Generate Post-Run Evaluation Report", type="primary"):
                with st.spinner("Generating comprehensive evaluation..."):
                    report = sim.generate_report()
                    st.session_state.report = report
                    st.rerun()
            
            if 'report' in st.session_state:
                report = st.session_state.report
                
                st.markdown("---")
                st.header("📈 Post-Run Evaluation Report")
                st.caption("*These scores do not represent truth. They represent trade-offs made visible.*")
                
                # Summary
                st.subheader("📊 Summary Statistics")
                summary = report['summary']
                
                col1, col2, col3, col4, col5 = st.columns(5)
                with col1:
                    st.metric("Total Patients", summary['total_patients'])
                with col2:
                    st.metric("✅ Admitted", summary['admitted'])
                with col3:
                    st.metric("⏳ Waiting", summary['waiting'])
                with col4:
                    st.metric("📋 Events", summary['total_events'])
                with col5:
                    st.metric("⚠️ Escalations", summary['escalations'])
                
                col1, col2, col3, col4 = st.columns(4)
                with col1:
                    st.metric("🔴 RED", summary['red_patients'])
                with col2:
                    st.metric("🟡 YELLOW", summary['yellow_patients'])
                with col3:
                    st.metric("🔵 BLUE", summary['blue_patients'])
                with col4:
                    st.metric("⏱️ Avg Wait", f"{summary['avg_wait_time']:.1f}s")
                
                st.markdown("---")
                
                # IES
                st.subheader("🏛️ Institutional Efficacy Score (IES)")
                st.markdown("""
                Measures five pillars of institutional performance across safety, dignity,
                flow, adaptation, and human authority.
                """)
                
                ies = report['ies']
                col1, col2 = st.columns([2, 1])
                
                with col1:
                    for pillar, score in ies.items():
                        if pillar != "Overall":
                            color = "🟢" if score >= 80 else "🟡" if score >= 60 else "🔴"
                            st.progress(score / 100, text=f"{color} **{pillar}**: {score}/100")
                
                with col2:
                    overall = ies['Overall']
                    st.metric("Overall IES", f"{overall}/100")
                    if overall >= 80:
                        st.success("Excellent")
                    elif overall >= 60:
                        st.info("Good")
                    else:
                        st.warning("Needs improvement")
                
                st.markdown("---")
                
                # PSS and SSS
                col1, col2 = st.columns(2)
                
                with col1:
                    st.subheader("😊 Patient Satisfaction (PSS)")
                    pss = report['pss']
                    st.metric("PSS", f"{pss}/100")
                    st.progress(pss / 100)
                    st.caption("Measures fairness & predictability, not happiness or wait time")
                
                with col2:
                    st.subheader("👨‍⚕️ Staff Satisfaction (SSS)")
                    sss = report['sss']
                    st.metric("SSS", f"{sss}/100")
                    st.progress(sss / 100)
                    st.caption("Measures cognitive load and alert burden")
                
                st.markdown("---")
                
                # Download report
                st.subheader("📥 Export Report")
                report_json = json.dumps(report, indent=2)
                st.download_button(
                    label="Download Report (JSON)",
                    data=report_json,
                    file_name="hospital_simulation_report.json",
                    mime="application/json"
                )

if __name__ == "__main__":
    main()
