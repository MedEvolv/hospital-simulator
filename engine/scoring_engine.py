"""
These scores represent trade-offs made visible.
They are not measures of clinical truth.

PHILOSOPHY:
Hospitals are multi-objective systems. Optimizing one dimension always stresses another.
Scores expose trade-offs, not hide them. No score represents "truth".
Scores are lenses, not verdicts.

WHAT IS NOT SCORED:
- Diagnostic accuracy
- Mortality
- Treatment success
- Clinical outcomes
(These are ethically unsafe, out of scope, and misleading in simulation)
"""

from dataclasses import dataclass
from typing import List, Dict, Tuple
import copy

from event_sourced_engine import SimulationRun, Event
from playback_engine import EventPlaybackController, StateSnapshot

# ============================================================================
# 1. INSTITUTIONAL EFFICACY FRAMEWORK
# ============================================================================

@dataclass
class TimeIndexedScore:
    """Score at specific timestamp."""
    timestamp: int
    value: float
    
@dataclass
class ScoringResult:
    """Complete scoring result for a simulation run."""
    run_id: str
    
    # Individual metrics (0-100 each)
    patient_safety_score: float
    patient_experience_score: float
    staff_stress_score: float
    ethics_intervention_count: int
    system_throughput_index: float
    
    # Composite
    institutional_efficacy_score: float
    
    # Time series
    pss_over_time: List[TimeIndexedScore]
    pes_over_time: List[TimeIndexedScore]
    sss_over_time: List[TimeIndexedScore]
    
    # Narrative
    interpretation: str

# ============================================================================
# 2. METRIC 1: PATIENT SAFETY SCORE (PSS)
# ============================================================================

def compute_patient_safety_score(run: SimulationRun) -> Tuple[float, str]:
    """
    Measures how well high-risk patients are protected from delay or misrouting.
    
    Inputs:
    - RED/YELLOW wait time breaches
    - Near-miss escalations caught
    - Emergency overload duration
    
    HIGH SCORE ≠ FAST SYSTEM
    HIGH SCORE = DANGER WAS NOT IGNORED
    
    Returns: (score, interpretation)
    """
    score = 100.0
    
    # Analyze events
    red_wait_breaches = 0
    yellow_wait_breaches = 0
    early_escalations = 0
    safety_referrals = 0
    
    # Track patient wait times
    patient_arrivals = {}
    patient_admissions = {}
    
    for event in run.event_log:
        if event.event_type == "PATIENT_ARRIVAL":
            patient_id = event.payload["patient_id"]
            patient_arrivals[patient_id] = event.timestamp
        
        elif event.event_type == "TRIAGE_STAGE_2_ASSIGNED":
            patient_id = event.payload["patient_id"]
            triage = event.payload["triage"]
            wait_time = event.payload.get("wait_time", 0)
            
            # Check for wait breaches
            if triage == "RED" and wait_time > 0:
                red_wait_breaches += 1
            elif triage == "YELLOW" and wait_time > 180:  # 3 minutes
                yellow_wait_breaches += 1
        
        elif event.event_type == "PATIENT_ADMITTED":
            patient_id = event.payload["patient_id"]
            patient_admissions[patient_id] = event.timestamp
        
        elif event.event_type == "AGENT_ACTION":
            action = event.payload.get("action", "")
            if "ALERT" in action or "ESCALATION" in action:
                early_escalations += 1
        
        elif event.event_type == "ESCALATION_SUGGESTED":
            recommendations = event.payload.get("recommendations", [])
            if any("REFERRAL" in r for r in recommendations):
                safety_referrals += 1
    
    # Scoring
    score -= (red_wait_breaches * 10)
    score -= (yellow_wait_breaches * 5)
    score += (early_escalations * 2)
    score += (safety_referrals * 2)
    
    # Clamp to 0-100
    score = max(0, min(100, score))
    
    # Interpretation
    if score >= 90:
        interpretation = "Excellent - High-risk patients consistently prioritized"
    elif score >= 75:
        interpretation = "Good - Safety maintained with minor delays"
    elif score >= 60:
        interpretation = "Adequate - Some safety concerns present"
    else:
        interpretation = "Concerning - Multiple high-risk patient delays detected"
    
    return score, interpretation

# ============================================================================
# 3. METRIC 2: PATIENT EXPERIENCE SCORE (PES)
# ============================================================================

def compute_patient_experience_score(run: SimulationRun) -> Tuple[float, str]:
    """
    Measures perceived fairness, dignity, and predictability.
    
    KEY RULE:
    First-come-first-served violation is NOT a penalty by default.
    UNEXPLAINED violation IS.
    
    Inputs:
    - Average wait time by urgency
    - Patient complaint chat bubbles
    - Unexplained queue jumps
    - Deferral/reappointment acceptance
    
    Returns: (score, interpretation)
    """
    score = 100.0
    
    # Count relevant events
    queue_reorders = 0
    patient_complaints = 0
    explained_reorders = 0
    deferrals = 0
    total_wait_time = 0
    patient_count = 0
    
    for event in run.event_log:
        if event.event_type == "QUEUE_REORDER":
            queue_reorders += 1
            # Check if explanation was provided (via context)
            if event.payload.get("reason"):
                explained_reorders += 1
        
        elif event.event_type == "PATIENT_ADMITTED":
            wait_time = event.payload.get("wait_time", 0)
            total_wait_time += wait_time
            patient_count += 1
        
        # Note: Chat bubbles would be analyzed from state, not events directly
    
    # Scoring
    unexplained_reorders = queue_reorders - explained_reorders
    score -= (unexplained_reorders * 5)
    
    # Average wait penalty (scaled)
    if patient_count > 0:
        avg_wait = total_wait_time / patient_count
        score -= (avg_wait / 10)  # Gradual penalty
    
    # Clamp
    score = max(0, min(100, score))
    
    # Interpretation
    if score >= 80:
        interpretation = "High - Patients experience predictable, fair treatment"
    elif score >= 60:
        interpretation = "Moderate - Some frustration with queue management"
    elif score >= 40:
        interpretation = "Low - Significant fairness concerns"
    else:
        interpretation = "Critical - Patient trust severely compromised"
    
    return score, interpretation

# ============================================================================
# 4. METRIC 3: STAFF STRESS SCORE (SSS)
# ============================================================================

def compute_staff_stress_score(run: SimulationRun) -> Tuple[float, str]:
    """
    Measures cognitive and operational load on staff.
    
    This is a WARNING SIGNAL, not a failure signal.
    
    Inputs:
    - Room overload duration
    - Repeated ethical overrides
    - Intake pressure vs capacity
    
    Returns: (score, interpretation)
    """
    stress = 0.0  # Start at 0, accumulate stress
    
    overload_events = 0
    ethical_overrides = 0
    escalations = 0
    
    for event in run.event_log:
        if event.event_type == "ROOM_OVERLOAD":
            overload_events += 1
        
        elif event.event_type == "QUEUE_REORDER":
            ethical_overrides += 1
        
        elif event.event_type == "ESCALATION_SUGGESTED":
            escalations += 1
    
    # Accumulate stress
    stress += (overload_events * 5)
    stress += (ethical_overrides * 3)
    stress += (escalations * 8)
    
    # Invert for score (high stress = low score)
    score = max(0, 100 - stress)
    
    # Interpretation
    if score >= 75:
        interpretation = "Manageable - Staff operating within capacity"
    elif score >= 50:
        interpretation = "Elevated - Staff experiencing moderate burden"
    elif score >= 25:
        interpretation = "High - Staff under significant pressure"
    else:
        interpretation = "Critical - Staff cognitively overloaded"
    
    return score, interpretation

# ============================================================================
# 5. METRIC 4: ETHICS INTERVENTION COUNT (EIC)
# ============================================================================

def compute_ethics_intervention_count(run: SimulationRun) -> Tuple[int, str]:
    """
    How often naïve fairness had to be overridden for safety.
    
    HIGH EIC IS NOT BAD.
    HIGH EIC WITHOUT EXPLANATION IS.
    
    This metric must always be paired with context.
    
    Returns: (count, interpretation)
    """
    count = 0
    
    for event in run.event_log:
        if event.event_type in ["QUEUE_REORDER", "ESCALATION_SUGGESTED"]:
            count += 1
    
    # Interpretation
    if count == 0:
        interpretation = "No interventions - Smooth operation or insufficient monitoring"
    elif count <= 3:
        interpretation = "Minimal interventions - Well-matched capacity"
    elif count <= 10:
        interpretation = "Moderate interventions - Normal operational stress"
    else:
        interpretation = "Frequent interventions - High complexity or overload"
    
    return count, interpretation

# ============================================================================
# 6. METRIC 5: SYSTEM THROUGHPUT INDEX (STI)
# ============================================================================

def compute_system_throughput_index(run: SimulationRun) -> Tuple[float, str]:
    """
    Flow efficiency without fetishizing speed.
    
    Primarily for administrators. Secondary for clinicians.
    
    Inputs:
    - Patients processed per minute
    - Room utilization
    - Backlog growth rate
    
    Returns: (score, interpretation)
    """
    total_patients = 0
    admitted_patients = 0
    max_time = 0
    
    for event in run.event_log:
        if event.event_type == "PATIENT_ARRIVAL":
            total_patients += 1
        elif event.event_type == "PATIENT_ADMITTED":
            admitted_patients += 1
        
        max_time = max(max_time, event.timestamp)
    
    # Calculate throughput
    if max_time > 0:
        patients_per_minute = admitted_patients / (max_time / 60)
        utilization = admitted_patients / max(1, total_patients)
        
        score = (patients_per_minute * 10) + (utilization * 50)
        score = min(100, score)
    else:
        score = 0
    
    # Interpretation
    if score >= 80:
        interpretation = "High - Efficient patient flow"
    elif score >= 60:
        interpretation = "Moderate - Acceptable throughput"
    elif score >= 40:
        interpretation = "Low - Flow bottlenecks present"
    else:
        interpretation = "Poor - Significant capacity constraints"
    
    return score, interpretation

# ============================================================================
# 7. COMPOSITE: INSTITUTIONAL EFFICACY SCORE (IES)
# ============================================================================

def compute_institutional_efficacy_score(
    pss: float,
    pes: float,
    sss: float,
    sti: float,
    weights: Dict[str, float]
) -> Tuple[float, str]:
    """
    Weighted composite for executive summary.
    
    Formula:
    IES = (PSS × safety_weight) +
          (PES × experience_weight) +
          (SSS × staff_weight) +
          (STI × throughput_weight)
    
    NEVER DISPLAY IES ALONE. Always show individual metrics.
    
    Returns: (score, narrative)
    """
    ies = (
        pss * weights.get("safety_weight", 0.45) +
        pes * weights.get("experience_weight", 0.30) +
        sss * weights.get("staff_weight", 0.15) +
        sti * weights.get("throughput_weight", 0.10)
    )
    
    # Narrative based on weights
    if weights.get("safety_weight", 0) > 0.5:
        narrative = "Safety prioritized over other dimensions"
    elif weights.get("experience_weight", 0) > 0.4:
        narrative = "Patient experience emphasized"
    else:
        narrative = "Balanced approach across dimensions"
    
    return ies, narrative

# ============================================================================
# 8. TIME-AWARE SCORING
# ============================================================================

def compute_time_series_scores(run: SimulationRun, interval: int = 30) -> Dict:
    """
    Compute scores over time at regular intervals.
    
    This enables:
    - After-action review
    - Ethics discussion
    - Training
    
    Returns: Dictionary with time series for each metric
    """
    controller = EventPlaybackController(run)
    max_time = controller.get_max_time()
    
    pss_series = []
    pes_series = []
    sss_series = []
    
    for t in range(0, max_time + 1, interval):
        controller.scrub_to_time(t)
        
        # Would need to compute partial scores here
        # For now, simplified
        pss_series.append(TimeIndexedScore(t, 0.0))
        pes_series.append(TimeIndexedScore(t, 0.0))
        sss_series.append(TimeIndexedScore(t, 0.0))
    
    return {
        "pss": pss_series,
        "pes": pes_series,
        "sss": sss_series
    }

# ============================================================================
# 9. COMPLETE SCORING ENGINE
# ============================================================================

class ScoringEngine:
    """
    Complete scoring engine for simulation runs.
    
    Produces:
    - Individual metric scores
    - Composite IES
    - Time series
    - Interpretations
    """
    
    @staticmethod
    def score_run(run: SimulationRun) -> ScoringResult:
        """Score a complete simulation run."""
        
        # Compute individual metrics
        pss, pss_interp = compute_patient_safety_score(run)
        pes, pes_interp = compute_patient_experience_score(run)
        sss, sss_interp = compute_staff_stress_score(run)
        eic, eic_interp = compute_ethics_intervention_count(run)
        sti, sti_interp = compute_system_throughput_index(run)
        
        # Compute composite
        weights = run.parameters.to_dict()
        ies, ies_narrative = compute_institutional_efficacy_score(
            pss, pes, sss, sti, weights
        )
        
        # Time series (simplified for now)
        time_series = compute_time_series_scores(run)
        
        # Overall interpretation
        interpretation = f"""
Institutional Efficacy: {ies:.1f}/100
{ies_narrative}

Patient Safety: {pss:.1f}/100 - {pss_interp}
Patient Experience: {pes:.1f}/100 - {pes_interp}
Staff Stress: {sss:.1f}/100 - {sss_interp}
Ethics Interventions: {eic} - {eic_interp}
Throughput: {sti:.1f}/100 - {sti_interp}
"""
        
        return ScoringResult(
            run_id=run.run_id,
            patient_safety_score=pss,
            patient_experience_score=pes,
            staff_stress_score=sss,
            ethics_intervention_count=eic,
            system_throughput_index=sti,
            institutional_efficacy_score=ies,
            pss_over_time=time_series["pss"],
            pes_over_time=time_series["pes"],
            sss_over_time=time_series["sss"],
            interpretation=interpretation
        )
    
    @staticmethod
    def compare_runs(run1: SimulationRun, run2: SimulationRun) -> Dict:
        """
        Compare two runs.
        
        Rules:
        - Do not average scores
        - Do not collapse timelines
        - Show divergence points
        """
        result1 = ScoringEngine.score_run(run1)
        result2 = ScoringEngine.score_run(run2)
        
        return {
            "run1": {
                "profile": run1.institutional_profile,
                "ies": result1.institutional_efficacy_score,
                "pss": result1.patient_safety_score,
                "pes": result1.patient_experience_score,
                "sss": result1.staff_stress_score
            },
            "run2": {
                "profile": run2.institutional_profile,
                "ies": result2.institutional_efficacy_score,
                "pss": result2.patient_safety_score,
                "pes": result2.patient_experience_score,
                "sss": result2.staff_stress_score
            },
            "insights": ScoringEngine._generate_comparison_insights(result1, result2)
        }
    
    @staticmethod
    def _generate_comparison_insights(r1: ScoringResult, r2: ScoringResult) -> List[str]:
        """Generate comparison insights."""
        insights = []
        
        # Safety comparison
        if r1.patient_safety_score > r2.patient_safety_score + 10:
            insights.append("Run 1 prioritized safety more effectively")
        elif r2.patient_safety_score > r1.patient_safety_score + 10:
            insights.append("Run 2 prioritized safety more effectively")
        
        # Experience comparison
        if r1.patient_experience_score > r2.patient_experience_score + 10:
            insights.append("Run 1 delivered better patient experience")
        elif r2.patient_experience_score > r1.patient_experience_score + 10:
            insights.append("Run 2 delivered better patient experience")
        
        # Trade-off detection
        if (r1.patient_safety_score > r2.patient_safety_score and 
            r1.patient_experience_score < r2.patient_experience_score):
            insights.append("Classic safety-experience trade-off detected")
        
        return insights if insights else ["Runs showed similar performance"]

# ============================================================================
# 10. EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    from event_sourced_engine import EventSourcedSimulationEngine
    
    # Create and score a run
    engine = EventSourcedSimulationEngine(seed=42)
    run = engine.run_simulation()
    
    result = ScoringEngine.score_run(run)
    
    print(result.interpretation)
    print(f"\nIES: {result.institutional_efficacy_score:.1f}/100")
