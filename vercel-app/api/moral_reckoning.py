"""
Moral Reckoning Layer
Living Hospital Orchestration Simulator

WHAT THIS IS:
- A stance toward decision-making under irreducible uncertainty
- A refusal of premature closure
- A commitment to visible tension over false resolution
- A mirror for institutional self-awareness

WHAT THIS IS NOT:
❌ NOT a rules engine
❌ NOT an optimizer
❌ NOT a value function
❌ NOT a performance ranking tool
❌ NOT a justification for austerity
❌ NOT a predictive triage system
❌ NOT a sales demo for efficiency

If someone asks for these, the answer is explicitly NO.

This module implements:
- Priority 1: Value Drift Detection
- Priority 2: Ethical Debt Accumulation
- Priority 3: Pre-Collapse Tension Signals
- Priority 4: Forced vs Chosen Harm Distinction
- Priority 5: Refusal to Act States
- Priority 6: Unavoidable Harm Summary
- Priority 7: Epistemic Humility (surfaced in synthesis via EPISTEMIC_HUMILITY insight type)
  The system records every decision it declined to make autonomously, paired with the
  reason. These refusals are governance signals, not failures.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple, Set
from enum import Enum
from datetime import datetime
import json


# ============================================================================
# PRIORITY 1: VALUE DRIFT DETECTION
# ============================================================================

@dataclass
class DeclaredValues:
    """What the institution CLAIMS to stand for"""
    patient_dignity: float = 0.9      # Commitment to treating patients with respect
    fairness: float = 0.8             # Commitment to FCFS and explained exceptions
    transparency: float = 0.95        # Commitment to visible decision-making
    safety_primacy: float = 1.0       # Commitment to safety over all else
    staff_welfare: float = 0.7        # Commitment to sustainable working conditions
    
    def to_dict(self) -> Dict[str, float]:
        return {
            'patient_dignity': self.patient_dignity,
            'fairness': self.fairness,
            'transparency': self.transparency,
            'safety_primacy': self.safety_primacy,
            'staff_welfare': self.staff_welfare
        }


@dataclass
class ObservedBehavior:
    """What the institution ACTUALLY does under pressure"""
    dignity_score: float = 0.0        # Computed from unexplained reorders, silent deferrals
    fairness_score: float = 0.0       # Computed from FCFS violations with explanation
    transparency_score: float = 0.0   # Computed from logged vs hidden decisions
    safety_score: float = 0.0         # Computed from safety threshold violations
    staff_welfare_score: float = 0.0  # Computed from unresolved stress duration
    
    # Supporting counts
    unexplained_reorders: int = 0
    silent_deferrals: int = 0
    hidden_overrides: int = 0
    safety_violations: int = 0
    sustained_staff_stress_ticks: int = 0
    
    def to_dict(self) -> Dict[str, float]:
        return {
            'dignity_score': self.dignity_score,
            'fairness_score': self.fairness_score,
            'transparency_score': self.transparency_score,
            'safety_score': self.safety_score,
            'staff_welfare_score': self.staff_welfare_score
        }


@dataclass
class ValueDriftResult:
    """The gap between declared values and observed behavior"""
    declared: DeclaredValues
    observed: ObservedBehavior
    
    # Drift signals (0.0 = aligned, 1.0 = complete divergence)
    dignity_drift: float = 0.0
    fairness_drift: float = 0.0
    transparency_drift: float = 0.0
    safety_drift: float = 0.0
    staff_welfare_drift: float = 0.0
    
    # Overall drift magnitude
    maximum_drift: float = 0.0
    average_drift: float = 0.0
    
    # Human-readable interpretation
    primary_misalignment: Optional[str] = None
    interpretation: str = ""
    
    def compute_drift(self):
        """Compute drift signals between declared and observed"""
        self.dignity_drift = abs(self.declared.patient_dignity - self.observed.dignity_score)
        self.fairness_drift = abs(self.declared.fairness - self.observed.fairness_score)
        self.transparency_drift = abs(self.declared.transparency - self.observed.transparency_score)
        self.safety_drift = abs(self.declared.safety_primacy - self.observed.safety_score)
        self.staff_welfare_drift = abs(self.declared.staff_welfare - self.observed.staff_welfare_score)
        
        drifts = [
            ('Patient Dignity', self.dignity_drift),
            ('Fairness', self.fairness_drift),
            ('Transparency', self.transparency_drift),
            ('Safety Primacy', self.safety_drift),
            ('Staff Welfare', self.staff_welfare_drift)
        ]
        
        self.maximum_drift = max(d[1] for d in drifts)
        self.average_drift = sum(d[1] for d in drifts) / len(drifts)
        
        # Identify primary misalignment
        primary = max(drifts, key=lambda x: x[1])
        if primary[1] > 0.15:  # Significant drift threshold
            self.primary_misalignment = primary[0]
            self.interpretation = f"Current behavior is diverging from declared value: {primary[0]} (drift: {primary[1]:.2f})"
        else:
            self.primary_misalignment = None
            self.interpretation = "Behavior is generally aligned with declared values"
    
    def to_dict(self) -> Dict:
        return {
            'declared_values': self.declared.to_dict(),
            'observed_behavior': self.observed.to_dict(),
            'drift_signals': {
                'dignity_drift': self.dignity_drift,
                'fairness_drift': self.fairness_drift,
                'transparency_drift': self.transparency_drift,
                'safety_drift': self.safety_drift,
                'staff_welfare_drift': self.staff_welfare_drift
            },
            'maximum_drift': self.maximum_drift,
            'average_drift': self.average_drift,
            'primary_misalignment': self.primary_misalignment,
            'interpretation': self.interpretation
        }


# ============================================================================
# PRIORITY 2: ETHICAL DEBT ACCUMULATION
# ============================================================================

@dataclass
class EthicalDebtEntry:
    """Single instance of ethical debt accrual"""
    timestamp: int
    amount: float
    reason: str
    category: str  # 'safety_override', 'unresolved_stress', 'repeated_deferral', etc.
    patient_id: Optional[int] = None


class EthicalDebt:
    """
    Cumulative moral weight carried by the institution.
    
    Key principles:
    - Does not reset per event
    - Decays slowly (moral weight lingers)
    - Is not "good" or "bad" - it is descriptive
    - Answers: "How much moral weight is this institution carrying right now?"
    """
    
    def __init__(self, decay_rate: float = 0.005):
        self.current_debt: float = 0.0
        self.decay_rate: float = decay_rate
        self.debt_history: List[Tuple[int, float]] = []  # (timestamp, debt_level)
        self.accrual_log: List[EthicalDebtEntry] = []
        self.last_decay_tick: int = 0
        
    def accrue(self, amount: float, reason: str, category: str, timestamp: int, patient_id: Optional[int] = None):
        """Add ethical debt"""
        self.current_debt += amount
        
        entry = EthicalDebtEntry(
            timestamp=timestamp,
            amount=amount,
            reason=reason,
            category=category,
            patient_id=patient_id
        )
        self.accrual_log.append(entry)
        self.debt_history.append((timestamp, self.current_debt))
    
    def decay(self, current_tick: int):
        """Slowly decay ethical debt over time"""
        if current_tick > self.last_decay_tick:
            ticks_elapsed = current_tick - self.last_decay_tick
            # Exponential decay
            self.current_debt *= (1 - self.decay_rate) ** ticks_elapsed
            self.last_decay_tick = current_tick
            
            # Record decay
            if self.debt_history and self.debt_history[-1][0] != current_tick:
                self.debt_history.append((current_tick, self.current_debt))
    
    def get_interpretation(self) -> str:
        """Human-readable interpretation of current debt level"""
        if self.current_debt < 10:
            return "Minimal moral weight - institution operating within values"
        elif self.current_debt < 30:
            return "Moderate moral weight - some accumulated compromises"
        elif self.current_debt < 60:
            return "Significant moral weight - repeated compromises have accumulated"
        elif self.current_debt < 100:
            return "Heavy moral weight - institution carrying substantial ethical cost"
        else:
            return "Critical moral weight - institution under severe ethical strain"
    
    def get_breakdown_by_category(self) -> Dict[str, float]:
        """Breakdown of debt by category"""
        breakdown = {}
        for entry in self.accrual_log:
            breakdown[entry.category] = breakdown.get(entry.category, 0.0) + entry.amount
        return breakdown
    
    def to_dict(self) -> Dict:
        return {
            'current_debt': self.current_debt,
            'interpretation': self.get_interpretation(),
            'debt_history': self.debt_history,
            'category_breakdown': self.get_breakdown_by_category(),
            'accrual_events': len(self.accrual_log)
        }


# ============================================================================
# PRIORITY 3: PRE-COLLAPSE TENSION SIGNALS
# ============================================================================

class TensionType(Enum):
    """Types of pre-collapse tension"""
    ABSORBING_PRESSURE = "ABSORBING_PRESSURE"        # Near-threshold without escalation
    SILENT_STRAIN = "SILENT_STRAIN"                  # Rising stress without policy response
    NORMALIZED_HARM = "NORMALIZED_HARM"              # Repeated complaints without action
    THRESHOLD_HOVERING = "THRESHOLD_HOVERING"        # Repeatedly approaching but not crossing thresholds
    ESCALATION_AVOIDANCE = "ESCALATION_AVOIDANCE"    # System avoiding necessary escalations


@dataclass
class TensionSignal:
    """Pre-collapse tension detection"""
    timestamp: int
    tension_type: TensionType
    severity: float  # 0.0 to 1.0
    description: str
    contributing_factors: List[str]
    duration_ticks: int  # How long this tension has persisted
    
    def to_dict(self) -> Dict:
        return {
            'timestamp': self.timestamp,
            'tension_type': self.tension_type.value,
            'severity': self.severity,
            'description': self.description,
            'contributing_factors': self.contributing_factors,
            'duration_ticks': self.duration_ticks
        }


class TensionDetector:
    """
    Detects when the system is coping instead of responding.
    
    Key principle: Silence is more dangerous than error.
    """
    
    def __init__(self):
        self.active_tensions: Dict[TensionType, int] = {}  # Type -> started_tick
        self.tension_history: List[TensionSignal] = []
        
        # Thresholds
        self.near_threshold_ratio = 0.85  # 85% of threshold
        self.sustained_duration = 6       # 30 seconds (6 ticks)
        
    def detect(self, state, events: List, current_tick: int, parameters) -> List[TensionSignal]:
        """Detect pre-collapse tensions in current state"""
        new_tensions = []
        
        # Check for absorbing pressure
        tension = self._detect_absorbing_pressure(state, current_tick, parameters)
        if tension:
            new_tensions.append(tension)
        
        # Check for silent strain
        tension = self._detect_silent_strain(state, events, current_tick)
        if tension:
            new_tensions.append(tension)
        
        # Check for normalized harm
        tension = self._detect_normalized_harm(state, events, current_tick)
        if tension:
            new_tensions.append(tension)
        
        # Check for threshold hovering
        tension = self._detect_threshold_hovering(state, current_tick, parameters)
        if tension:
            new_tensions.append(tension)
        
        # Check for escalation avoidance
        tension = self._detect_escalation_avoidance(state, events, current_tick)
        if tension:
            new_tensions.append(tension)
        
        # Record tensions
        for tension in new_tensions:
            self.tension_history.append(tension)
        
        return new_tensions
    
    def _detect_absorbing_pressure(self, state, current_tick: int, parameters) -> Optional[TensionSignal]:
        """Detect near-threshold waits without escalation"""
        # Check if any RED patients are near max wait but no escalation triggered
        max_wait_red = parameters.max_wait_red
        
        near_threshold_patients = []
        for patient in state.patients.values():
            if patient.triage_stage_2 == 'RED' and patient.status.name == 'WAITING':
                wait_time = current_tick * 5 - patient.arrival_time
                if wait_time > max_wait_red * self.near_threshold_ratio:
                    near_threshold_patients.append((patient.id, wait_time))
        
        if near_threshold_patients:
            # Check if this has been sustained
            if TensionType.ABSORBING_PRESSURE not in self.active_tensions:
                self.active_tensions[TensionType.ABSORBING_PRESSURE] = current_tick
            
            duration = current_tick - self.active_tensions[TensionType.ABSORBING_PRESSURE]
            
            if duration >= self.sustained_duration:
                severity = min(len(near_threshold_patients) / 3.0, 1.0)
                
                return TensionSignal(
                    timestamp=current_tick * 5,
                    tension_type=TensionType.ABSORBING_PRESSURE,
                    severity=severity,
                    description=f"System absorbing pressure: {len(near_threshold_patients)} RED patients near threshold without escalation",
                    contributing_factors=[f"Patient {pid} at {wt}s wait" for pid, wt in near_threshold_patients[:3]],
                    duration_ticks=duration
                )
        else:
            # Clear active tension if resolved
            if TensionType.ABSORBING_PRESSURE in self.active_tensions:
                del self.active_tensions[TensionType.ABSORBING_PRESSURE]
        
        return None
    
    def _detect_silent_strain(self, state, events: List, current_tick: int) -> Optional[TensionSignal]:
        """Detect rising staff stress without policy response"""
        # Check recent events for staff stress indicators
        recent_events = [e for e in events if e.timestamp > (current_tick - 10) * 5]
        
        overload_events = [e for e in recent_events if 'overload' in e.event_type.lower()]
        stress_events = [e for e in recent_events if 'stress' in str(e.payload).lower()]
        
        # Check for policy responses
        policy_responses = [e for e in recent_events if 'ESCALATION' in e.event_type or 'REFERRAL' in e.event_type]
        
        if (len(overload_events) + len(stress_events)) > 3 and len(policy_responses) == 0:
            if TensionType.SILENT_STRAIN not in self.active_tensions:
                self.active_tensions[TensionType.SILENT_STRAIN] = current_tick
            
            duration = current_tick - self.active_tensions[TensionType.SILENT_STRAIN]
            
            if duration >= self.sustained_duration:
                severity = min((len(overload_events) + len(stress_events)) / 5.0, 1.0)
                
                return TensionSignal(
                    timestamp=current_tick * 5,
                    tension_type=TensionType.SILENT_STRAIN,
                    severity=severity,
                    description="Staff stress rising without policy response - system absorbing strain silently",
                    contributing_factors=[f"{len(overload_events)} overload events", f"{len(stress_events)} stress signals", "No escalation response"],
                    duration_ticks=duration
                )
        else:
            if TensionType.SILENT_STRAIN in self.active_tensions:
                del self.active_tensions[TensionType.SILENT_STRAIN]
        
        return None
    
    def _detect_normalized_harm(self, state, events: List, current_tick: int) -> Optional[TensionSignal]:
        """Detect repeated complaints without action"""
        # Look for repeated queue reorders or deferrals
        recent_reorders = [e for e in events if e.event_type == 'QUEUE_REORDER' and e.timestamp > (current_tick - 20) * 5]
        
        if len(recent_reorders) > 5:
            if TensionType.NORMALIZED_HARM not in self.active_tensions:
                self.active_tensions[TensionType.NORMALIZED_HARM] = current_tick
            
            duration = current_tick - self.active_tensions[TensionType.NORMALIZED_HARM]
            
            if duration >= self.sustained_duration:
                severity = min(len(recent_reorders) / 10.0, 1.0)
                
                return TensionSignal(
                    timestamp=current_tick * 5,
                    tension_type=TensionType.NORMALIZED_HARM,
                    severity=severity,
                    description="Repeated queue disruptions becoming normalized - fairness violations routine",
                    contributing_factors=[f"{len(recent_reorders)} reorders in recent history"],
                    duration_ticks=duration
                )
        else:
            if TensionType.NORMALIZED_HARM in self.active_tensions:
                del self.active_tensions[TensionType.NORMALIZED_HARM]
        
        return None
    
    def _detect_threshold_hovering(self, state, current_tick: int, parameters) -> Optional[TensionSignal]:
        """Detect repeatedly approaching but not crossing thresholds"""
        # Similar to absorbing pressure but looking at pattern over time
        hovering_patients = []
        
        for patient in state.patients.values():
            if patient.status.name == 'WAITING':
                wait_time = current_tick * 5 - patient.arrival_time
                
                threshold = parameters.max_wait_red if patient.triage_stage_2 == 'RED' else \
                           parameters.max_wait_yellow if patient.triage_stage_2 == 'YELLOW' else \
                           parameters.max_wait_blue
                
                if threshold > 0 and wait_time > threshold * 0.8 and wait_time < threshold * 0.95:
                    hovering_patients.append(patient.id)
        
        if len(hovering_patients) >= 3:
            severity = min(len(hovering_patients) / 5.0, 1.0)
            
            return TensionSignal(
                timestamp=current_tick * 5,
                tension_type=TensionType.THRESHOLD_HOVERING,
                severity=severity,
                description=f"{len(hovering_patients)} patients hovering near thresholds - system at capacity limit",
                contributing_factors=[f"Patient {pid} near threshold" for pid in hovering_patients[:3]],
                duration_ticks=0
            )
        
        return None
    
    def _detect_escalation_avoidance(self, state, events: List, current_tick: int) -> Optional[TensionSignal]:
        """Detect system avoiding necessary escalations"""
        # Check if conditions warrant escalation but none occurred
        recent_escalations = [e for e in events if 'ESCALATION' in e.event_type and e.timestamp > (current_tick - 10) * 5]
        
        # Count patients who should trigger escalation
        should_escalate_count = sum(1 for p in state.patients.values() 
                                    if p.status.name == 'WAITING' and p.triage_stage_2 == 'RED')
        
        if should_escalate_count >= 3 and len(recent_escalations) == 0:
            severity = min(should_escalate_count / 5.0, 1.0)
            
            return TensionSignal(
                timestamp=current_tick * 5,
                tension_type=TensionType.ESCALATION_AVOIDANCE,
                severity=severity,
                description="Conditions warrant escalation but system not responding - avoidance pattern detected",
                contributing_factors=[f"{should_escalate_count} RED patients waiting", "No recent escalations"],
                duration_ticks=0
            )
        
        return None
    
    def get_active_tensions_summary(self) -> Dict:
        """Summary of currently active tensions"""
        return {
            'active_count': len(self.active_tensions),
            'types': [t.value for t in self.active_tensions.keys()],
            'total_detected': len(self.tension_history)
        }


# ============================================================================
# PRIORITY 4: FORCED VS CHOSEN HARM DISTINCTION
# ============================================================================

class HarmType(Enum):
    """Classification of harm types"""
    PHYSICALLY_FORCED = "PHYSICALLY_FORCED"          # No alternative existed
    CAPACITY_INDUCED = "CAPACITY_INDUCED"            # Avoidable with more resources
    POLICY_CONSTRAINED = "POLICY_CONSTRAINED"        # Avoidable with different policy
    INFORMATION_LIMITED = "INFORMATION_LIMITED"      # Uncertain due to data gaps


@dataclass
class HarmClassification:
    """Detailed classification of a harmful decision"""
    event_id: str
    timestamp: int
    action: str
    harm_type: HarmType
    justification: str
    patient_id: Optional[int]
    
    # What could have prevented this
    avoidable_with: Optional[str] = None
    alternative_actions: List[str] = field(default_factory=list)
    
    # Context
    capacity_state: Dict[str, any] = field(default_factory=dict)
    policy_constraints: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            'event_id': self.event_id,
            'timestamp': self.timestamp,
            'action': self.action,
            'harm_type': self.harm_type.value,
            'justification': self.justification,
            'patient_id': self.patient_id,
            'avoidable_with': self.avoidable_with,
            'alternative_actions': self.alternative_actions,
            'capacity_state': self.capacity_state,
            'policy_constraints': self.policy_constraints
        }


class HarmClassifier:
    """
    Distinguishes forced harm from chosen compromise.
    
    Ethics committees care deeply about this distinction.
    """
    
    def __init__(self):
        self.classified_harms: List[HarmClassification] = []
    
    def classify_harm(self, event, state, parameters) -> Optional[HarmClassification]:
        """Classify a potentially harmful decision"""
        
        # Only classify events that involve ethical overrides
        if event.event_type not in ['QUEUE_REORDER', 'AGENT_ACTION', 'ESCALATION_SUGGESTED']:
            return None
        
        harm_type = self._determine_harm_type(event, state, parameters)
        
        if harm_type:
            classification = HarmClassification(
                event_id=event.event_id,
                timestamp=event.timestamp,
                action=event.event_type,
                harm_type=harm_type,
                justification=self._extract_justification(event),
                patient_id=event.payload.get('patient_id'),
                avoidable_with=self._determine_prevention(harm_type, state),
                alternative_actions=self._identify_alternatives(event, state),
                capacity_state=self._capture_capacity_state(state),
                policy_constraints=self._extract_policy_constraints(event, parameters)
            )
            
            self.classified_harms.append(classification)
            return classification
        
        return None
    
    def _determine_harm_type(self, event, state, parameters) -> Optional[HarmType]:
        """Determine the type of harm"""
        
        # Check if all rooms are full (physically forced)
        if hasattr(state, 'rooms'):
            all_full = all(room.current_load >= room.max_occupancy for room in state.rooms)
            if all_full:
                return HarmType.PHYSICALLY_FORCED
        
        # Check if capacity-constrained but not full
        if hasattr(state, 'rooms'):
            high_utilization = sum(1 for room in state.rooms 
                                  if room.current_load / room.max_occupancy > 0.8) > len(state.rooms) / 2
            if high_utilization:
                return HarmType.CAPACITY_INDUCED
        
        # Check if policy-constrained
        if 'policy_context' in event.payload:
            return HarmType.POLICY_CONSTRAINED
        
        # Check if information-limited
        if 'insufficient_data' in event.payload or 'uncertain' in str(event.payload).lower():
            return HarmType.INFORMATION_LIMITED
        
        return None
    
    def _extract_justification(self, event) -> str:
        """Extract justification from event"""
        if 'justification' in event.payload:
            return event.payload['justification']
        if 'reason' in event.payload:
            return event.payload['reason']
        if 'rules_triggered' in event.payload:
            return f"Rules: {', '.join(event.payload['rules_triggered'])}"
        return "No explicit justification provided"
    
    def _determine_prevention(self, harm_type: HarmType, state) -> Optional[str]:
        """Determine what could have prevented this harm"""
        if harm_type == HarmType.PHYSICALLY_FORCED:
            return None  # Nothing could have prevented it
        elif harm_type == HarmType.CAPACITY_INDUCED:
            return "Additional room capacity or staff"
        elif harm_type == HarmType.POLICY_CONSTRAINED:
            return "Different institutional policy"
        elif harm_type == HarmType.INFORMATION_LIMITED:
            return "Better data quality or ABDM integration"
        return None
    
    def _identify_alternatives(self, event, state) -> List[str]:
        """Identify alternative actions that were possible"""
        alternatives = []
        
        if event.event_type == 'QUEUE_REORDER':
            alternatives.append("Maintain FCFS order")
            alternatives.append("Escalate to external referral")
        
        if event.event_type == 'AGENT_ACTION':
            if 'DEFER' in event.payload.get('action', ''):
                alternatives.append("Keep patient in queue")
            if 'ADMIT' in event.payload.get('action', ''):
                alternatives.append("Continue waiting")
        
        return alternatives
    
    def _capture_capacity_state(self, state) -> Dict:
        """Capture current capacity state"""
        if not hasattr(state, 'rooms'):
            return {}
        
        return {
            'total_rooms': len(state.rooms),
            'rooms_full': sum(1 for r in state.rooms if r.current_load >= r.max_occupancy),
            'average_utilization': sum(r.current_load / r.max_occupancy for r in state.rooms if r.max_occupancy > 0) / len(state.rooms) if state.rooms else 0
        }
    
    def _extract_policy_constraints(self, event, parameters) -> List[str]:
        """Extract relevant policy constraints"""
        constraints = []
        
        if 'policy_context' in event.payload:
            constraints.extend(event.payload['policy_context'].keys())
        
        # Add parameter-based constraints
        constraints.append(f"max_wait_red: {parameters.max_wait_red}s")
        constraints.append(f"safety_weight: {parameters.safety_weight}")
        
        return constraints
    
    def get_summary(self) -> Dict:
        """Summary of harm classifications"""
        by_type = {}
        for harm in self.classified_harms:
            key = harm.harm_type.value
            by_type[key] = by_type.get(key, 0) + 1
        
        return {
            'total_harms_classified': len(self.classified_harms),
            'by_type': by_type,
            'forced_count': by_type.get(HarmType.PHYSICALLY_FORCED.value, 0),
            'avoidable_count': sum(by_type.get(t.value, 0) for t in [HarmType.CAPACITY_INDUCED, HarmType.POLICY_CONSTRAINED])
        }


# ============================================================================
# PRIORITY 5: REFUSAL TO ACT STATE
# ============================================================================

class RefusalReason(Enum):
    """Reasons for refusing to act"""
    CONFLICTING_SIGNALS = "CONFLICTING_SIGNALS"          # Signals contradict each other
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"              # Not enough information
    POLICY_AMBIGUITY = "POLICY_AMBIGUITY"               # Policy intent unclear
    HARM_THRESHOLD_EXCEEDED = "HARM_THRESHOLD_EXCEEDED" # Action would cause unacceptable harm
    EPISTEMIC_UNCERTAINTY = "EPISTEMIC_UNCERTAINTY"      # Fundamental uncertainty


@dataclass
class RefusalToAct:
    """
    System explicitly refuses to act when it cannot do so safely.
    
    This encodes epistemic humility.
    It prevents overreach.
    It mirrors real clinical ethics.
    """
    timestamp: int
    reason: RefusalReason
    description: str
    signals: Dict[str, any]
    requires_human: bool = True
    alternative_suggestions: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            'timestamp': self.timestamp,
            'reason': self.reason.value,
            'description': self.description,
            'signals': self.signals,
            'requires_human': self.requires_human,
            'alternative_suggestions': self.alternative_suggestions
        }


class RefusalEvaluator:
    """Determines when the system should refuse to act"""
    
    def __init__(self):
        self.refusals: List[RefusalToAct] = []
        
        # Thresholds for refusal
        self.signal_conflict_threshold = 0.7  # How contradictory signals must be
        self.data_sufficiency_threshold = 0.5  # Minimum data quality
        self.harm_threshold = 0.9  # Maximum acceptable harm level
    
    def should_refuse(self, signals: Dict, state, parameters, current_tick: int) -> Optional[RefusalToAct]:
        """Evaluate whether system should refuse to act"""
        
        # Check for conflicting signals
        refusal = self._check_signal_conflicts(signals, current_tick)
        if refusal:
            return refusal
        
        # Check for insufficient data
        refusal = self._check_data_sufficiency(signals, state, current_tick)
        if refusal:
            return refusal
        
        # Check for policy ambiguity
        refusal = self._check_policy_ambiguity(signals, parameters, current_tick)
        if refusal:
            return refusal
        
        # Check for harm threshold
        refusal = self._check_harm_threshold(signals, state, current_tick)
        if refusal:
            return refusal
        
        return None
    
    def _check_signal_conflicts(self, signals: Dict, current_tick: int) -> Optional[RefusalToAct]:
        """Check if signals are contradictory"""
        # Example: Patient shows RED symptoms but history suggests false alarm
        
        if 'triage' in signals and 'history' in signals:
            triage_urgency = signals.get('triage', {}).get('urgency', 0)
            history_risk = signals.get('history', {}).get('risk_level', 0)
            
            # If triage says urgent but history says low risk - conflict
            if triage_urgency > 0.8 and history_risk < 0.3:
                refusal = RefusalToAct(
                    timestamp=current_tick * 5,
                    reason=RefusalReason.CONFLICTING_SIGNALS,
                    description="Triage assessment conflicts with patient history - cannot determine safe action",
                    signals={'triage_urgency': triage_urgency, 'history_risk': history_risk},
                    requires_human=True,
                    alternative_suggestions=["Request senior clinician review", "Obtain additional vital signs"]
                )
                self.refusals.append(refusal)
                return refusal
        
        return None
    
    def _check_data_sufficiency(self, signals: Dict, state, current_tick: int) -> Optional[RefusalToAct]:
        """Check if there's sufficient data to act"""
        # Example: Missing critical information
        
        required_fields = ['chief_complaint', 'age', 'triage']
        missing = [f for f in required_fields if f not in signals or signals[f] is None]
        
        if len(missing) > len(required_fields) / 2:
            refusal = RefusalToAct(
                timestamp=current_tick * 5,
                reason=RefusalReason.INSUFFICIENT_DATA,
                description=f"Critical information missing: {', '.join(missing)}",
                signals={'missing_fields': missing},
                requires_human=True,
                alternative_suggestions=["Complete patient intake", "Request additional information"]
            )
            self.refusals.append(refusal)
            return refusal
        
        return None
    
    def _check_policy_ambiguity(self, signals: Dict, parameters, current_tick: int) -> Optional[RefusalToAct]:
        """Check if policy intent is clear"""
        # Example: Edge case not covered by policy
        
        if 'policy_context' in signals:
            policy = signals['policy_context']
            
            # Check if multiple policies apply equally
            if isinstance(policy, dict) and len(policy) > 1:
                priorities = [p.get('priority', 0) for p in policy.values() if isinstance(p, dict)]
                if len(set(priorities)) == 1:  # All same priority - ambiguous
                    refusal = RefusalToAct(
                        timestamp=current_tick * 5,
                        reason=RefusalReason.POLICY_AMBIGUITY,
                        description="Multiple policies apply with equal priority - cannot determine precedence",
                        signals={'policies': list(policy.keys())},
                        requires_human=True,
                        alternative_suggestions=["Escalate to supervisor", "Apply most conservative policy"]
                    )
                    self.refusals.append(refusal)
                    return refusal
        
        return None
    
    def _check_harm_threshold(self, signals: Dict, state, current_tick: int) -> Optional[RefusalToAct]:
        """Check if proposed action would cause unacceptable harm"""
        # Example: Only available action violates core values
        
        if 'proposed_action' in signals and 'harm_estimate' in signals:
            harm_level = signals['harm_estimate']
            
            if harm_level > self.harm_threshold:
                refusal = RefusalToAct(
                    timestamp=current_tick * 5,
                    reason=RefusalReason.HARM_THRESHOLD_EXCEEDED,
                    description=f"Proposed action would cause unacceptable harm (level: {harm_level:.2f})",
                    signals={'proposed_action': signals['proposed_action'], 'harm_level': harm_level},
                    requires_human=True,
                    alternative_suggestions=["Seek alternative approach", "Escalate decision authority"]
                )
                self.refusals.append(refusal)
                return refusal
        
        return None
    
    def get_summary(self) -> Dict:
        """Summary of refusals"""
        by_reason = {}
        for refusal in self.refusals:
            key = refusal.reason.value
            by_reason[key] = by_reason.get(key, 0) + 1
        
        return {
            'total_refusals': len(self.refusals),
            'by_reason': by_reason
        }


# ============================================================================
# PRIORITY 6: UNAVOIDABLE HARM SUMMARY
# ============================================================================

@dataclass
class UnavoidableHarmSummary:
    """
    Post-run summary of unavoidable harm.
    
    Reframes evaluation from "Did we succeed?" to "What did this cost us, and why?"
    
    This is governance-grade honesty.
    """
    run_id: str
    institutional_profile: str
    
    # Harms that occurred
    harms_that_occurred: List[str] = field(default_factory=list)
    
    # Values that could not be honored
    values_not_honored: List[str] = field(default_factory=list)
    
    # Trade-offs that remain unresolved
    trade_offs_unresolved: List[str] = field(default_factory=list)
    
    # Quantitative summary
    total_safety_violations: int = 0
    total_dignity_violations: int = 0
    total_fairness_violations: int = 0
    forced_harms: int = 0
    avoidable_harms: int = 0
    
    # Interpretation
    summary: str = ""
    
    def to_dict(self) -> Dict:
        return {
            'run_id': self.run_id,
            'institutional_profile': self.institutional_profile,
            'harms_that_occurred': self.harms_that_occurred,
            'values_not_honored': self.values_not_honored,
            'trade_offs_unresolved': self.trade_offs_unresolved,
            'quantitative_summary': {
                'total_safety_violations': self.total_safety_violations,
                'total_dignity_violations': self.total_dignity_violations,
                'total_fairness_violations': self.total_fairness_violations,
                'forced_harms': self.forced_harms,
                'avoidable_harms': self.avoidable_harms
            },
            'summary': self.summary
        }
    
    def generate_narrative(self):
        """Generate human-readable narrative"""
        parts = []
        
        parts.append(f"Run: {self.run_id[:8]}")
        parts.append(f"Profile: {self.institutional_profile}")
        parts.append("")
        
        if self.harms_that_occurred:
            parts.append("HARMS THAT OCCURRED:")
            for harm in self.harms_that_occurred:
                parts.append(f"  • {harm}")
            parts.append("")
        
        if self.values_not_honored:
            parts.append("VALUES NOT HONORED:")
            for value in self.values_not_honored:
                parts.append(f"  • {value}")
            parts.append("")
        
        if self.trade_offs_unresolved:
            parts.append("TRADE-OFFS UNRESOLVED:")
            for trade_off in self.trade_offs_unresolved:
                parts.append(f"  • {trade_off}")
            parts.append("")
        
        parts.append("QUANTITATIVE SUMMARY:")
        parts.append(f"  Safety violations: {self.total_safety_violations}")
        parts.append(f"  Dignity violations: {self.total_dignity_violations}")
        parts.append(f"  Fairness violations: {self.total_fairness_violations}")
        parts.append(f"  Forced (unavoidable): {self.forced_harms}")
        parts.append(f"  Avoidable (capacity/policy): {self.avoidable_harms}")
        parts.append("")
        
        if self.forced_harms > 0:
            parts.append(f"Note: {self.forced_harms} harms were physically forced - no alternative existed.")
        if self.avoidable_harms > 0:
            parts.append(f"Note: {self.avoidable_harms} harms were capacity or policy-induced - potentially avoidable.")
        
        self.summary = "\n".join(parts)
        return self.summary


# ============================================================================
# INTEGRATED MORAL RECKONING ENGINE
# ============================================================================

class MoralReckoningEngine:
    """
    Master engine that coordinates all moral reckoning components.
    
    This is the institutional truth-telling machinery.
    """
    
    def __init__(self, declared_values: DeclaredValues, institutional_profile: str):
        self.declared_values = declared_values
        self.institutional_profile = institutional_profile
        
        # Initialize components
        self.ethical_debt = EthicalDebt()
        self.tension_detector = TensionDetector()
        self.harm_classifier = HarmClassifier()
        self.refusal_evaluator = RefusalEvaluator()
        
        # Observed behavior tracking
        self.observed_behavior = ObservedBehavior()
        
    def process_tick(self, state, events: List, current_tick: int, parameters):
        """Process one simulation tick through moral reckoning"""
        
        # Decay ethical debt
        self.ethical_debt.decay(current_tick)
        
        # Process each event
        for event in events:
            if event.timestamp == current_tick * 5:  # Events from this tick
                self._process_event_for_moral_reckoning(event, state, current_tick, parameters)
        
        # Detect tensions
        tensions = self.tension_detector.detect(state, events, current_tick, parameters)
        
        # Accrue debt for active tensions
        for tension in tensions:
            if tension.severity > 0.5:
                self.ethical_debt.accrue(
                    amount=tension.severity * 5,
                    reason=f"Sustained tension: {tension.description}",
                    category='sustained_tension',
                    timestamp=current_tick * 5
                )
        
        # Update observed behavior
        self._update_observed_behavior(state, events, current_tick)
    
    def _process_event_for_moral_reckoning(self, event, state, current_tick: int, parameters):
        """Process single event for moral implications"""
        
        # Classify potential harms
        harm_classification = self.harm_classifier.classify_harm(event, state, parameters)
        
        # Accrue ethical debt for specific event types
        if event.event_type == 'QUEUE_REORDER':
            explained = 'reason' in event.payload or 'justification' in event.payload
            if not explained:
                self.ethical_debt.accrue(
                    amount=5,
                    reason="Unexplained queue reorder",
                    category='unexplained_reorder',
                    timestamp=current_tick * 5,
                    patient_id=event.payload.get('patient_id')
                )
                self.observed_behavior.unexplained_reorders += 1
        
        if event.event_type == 'AGENT_ACTION':
            if not event.payload.get('human_override_allowed', True):
                # Automated safety response - acceptable
                pass
            else:
                # Human override recommended - log as potential debt
                if 'rules_triggered' not in event.payload or not event.payload['rules_triggered']:
                    self.ethical_debt.accrue(
                        amount=3,
                        reason="Action without clear rule justification",
                        category='unjustified_action',
                        timestamp=current_tick * 5
                    )
    
    def _update_observed_behavior(self, state, events: List, current_tick: int):
        """Update observed behavior scores based on actual behavior"""
        # Dignity score: inversely related to unexplained reorders
        total_reorders = sum(1 for e in events if e.event_type == 'QUEUE_REORDER')
        if total_reorders > 0:
            explained_ratio = 1.0 - (self.observed_behavior.unexplained_reorders / total_reorders)
            self.observed_behavior.dignity_score = explained_ratio
        else:
            self.observed_behavior.dignity_score = 1.0
        
        # Fairness score: based on FCFS violations with explanation
        total_violations = len([e for e in events if e.event_type == 'QUEUE_REORDER'])
        explained_violations = len([e for e in events if e.event_type == 'QUEUE_REORDER' and ('reason' in e.payload or 'justification' in e.payload)])
        if total_violations > 0:
            self.observed_behavior.fairness_score = explained_violations / total_violations
        else:
            self.observed_behavior.fairness_score = 1.0
        
        # Transparency score: based on logged vs hidden decisions
        total_actions = len([e for e in events if e.event_type == 'AGENT_ACTION'])
        logged_actions = len([e for e in events if e.event_type == 'AGENT_ACTION' and 'rules_triggered' in e.payload])
        if total_actions > 0:
            self.observed_behavior.transparency_score = logged_actions / total_actions
        else:
            self.observed_behavior.transparency_score = 1.0
        
        # Safety score: inverse of safety violations
        safety_violations = sum(1 for e in events if 'safety_violation' in str(e.payload).lower())
        self.observed_behavior.safety_score = max(0, 1.0 - (safety_violations / 100))
        
        # Staff welfare score: inverse of sustained stress
        # (Would need staff stress tracking in state)
        self.observed_behavior.staff_welfare_score = 0.7  # Placeholder
    
    def compute_value_drift(self) -> ValueDriftResult:
        """Compute value drift between declared and observed"""
        result = ValueDriftResult(
            declared=self.declared_values,
            observed=self.observed_behavior
        )
        result.compute_drift()
        return result
    
    def generate_unavoidable_harm_summary(self, run_id: str) -> UnavoidableHarmSummary:
        """Generate end-of-run unavoidable harm summary"""
        summary = UnavoidableHarmSummary(
            run_id=run_id,
            institutional_profile=self.institutional_profile
        )
        
        # Populate from harm classifications
        for harm in self.harm_classifier.classified_harms:
            if harm.harm_type == HarmType.PHYSICALLY_FORCED:
                summary.forced_harms += 1
                summary.harms_that_occurred.append(f"{harm.action} at {harm.timestamp}s - physically forced ({harm.justification})")
            else:
                summary.avoidable_harms += 1
                summary.harms_that_occurred.append(f"{harm.action} at {harm.timestamp}s - {harm.harm_type.value} (could have been prevented by: {harm.avoidable_with})")
        
        # Populate from value drift
        value_drift = self.compute_value_drift()
        if value_drift.dignity_drift > 0.2:
            summary.values_not_honored.append(f"Patient Dignity - {self.observed_behavior.unexplained_reorders} unexplained deprioritizations")
        if value_drift.fairness_drift > 0.2:
            summary.values_not_honored.append(f"Fairness - FCFS violated without sufficient explanation")
        if value_drift.transparency_drift > 0.2:
            summary.values_not_honored.append(f"Transparency - decisions made without clear logging")
        
        # Populate from ethical debt
        debt_breakdown = self.ethical_debt.get_breakdown_by_category()
        if 'sustained_tension' in debt_breakdown and debt_breakdown['sustained_tension'] > 20:
            summary.trade_offs_unresolved.append("Safety vs Experience tension sustained - no policy adjustment made")
        
        # Count violations
        summary.total_dignity_violations = self.observed_behavior.unexplained_reorders
        summary.total_fairness_violations = len([h for h in self.harm_classifier.classified_harms if 'REORDER' in h.action])
        
        # Generate narrative
        summary.generate_narrative()
        
        return summary
    
    def export_complete_reckoning(self, run_id: str) -> Dict:
        """Export complete moral reckoning data"""
        return {
            'run_id': run_id,
            'institutional_profile': self.institutional_profile,
            'declared_values': self.declared_values.to_dict(),
            'value_drift': self.compute_value_drift().to_dict(),
            'ethical_debt': self.ethical_debt.to_dict(),
            'tension_signals': {
                'active': self.tension_detector.get_active_tensions_summary(),
                'history': [t.to_dict() for t in self.tension_detector.tension_history]
            },
            'harm_classifications': {
                'summary': self.harm_classifier.get_summary(),
                'details': [h.to_dict() for h in self.harm_classifier.classified_harms]
            },
            'refusals': {
                'summary': self.refusal_evaluator.get_summary(),
                'details': [r.to_dict() for r in self.refusal_evaluator.refusals]
            },
            'unavoidable_harm_summary': self.generate_unavoidable_harm_summary(run_id).to_dict()
        }


# ============================================================================
# EXPORT
# ============================================================================

__all__ = [
    'DeclaredValues',
    'ObservedBehavior',
    'ValueDriftResult',
    'EthicalDebt',
    'EthicalDebtEntry',
    'TensionType',
    'TensionSignal',
    'TensionDetector',
    'HarmType',
    'HarmClassification',
    'HarmClassifier',
    'RefusalReason',
    'RefusalToAct',
    'RefusalEvaluator',
    'UnavoidableHarmSummary',
    'MoralReckoningEngine'
]
