"""
Moral Reckoning Layer - Demonstration Script

This demonstrates the deep institutional truth-telling machinery.

Run this to see:
- Value drift detection
- Ethical debt accumulation
- Pre-collapse tension signals
- Forced vs chosen harm distinction
- Refusal to act states
- Unavoidable harm summaries
"""

from moral_reckoning import (
    MoralReckoningEngine,
    DeclaredValues,
    HarmType,
    RefusalReason,
    TensionType
)
from dataclasses import dataclass
from typing import List
from enum import Enum


# Mock structures for demonstration
class PatientStatus(Enum):
    WAITING = "WAITING"
    ADMITTED = "ADMITTED"


@dataclass
class MockPatient:
    id: int
    arrival_time: int
    triage_stage_2: str
    status: PatientStatus
    history: List


@dataclass
class MockRoom:
    name: str
    max_occupancy: int
    current_load: int


@dataclass
class MockState:
    patients: dict
    rooms: List[MockRoom]


@dataclass
class MockEvent:
    event_id: str
    timestamp: int
    event_type: str
    payload: dict


@dataclass
class MockParameters:
    max_wait_red: int = 0
    max_wait_yellow: int = 180
    max_wait_blue: int = 600
    safety_weight: float = 0.45


def demonstrate_moral_reckoning():
    """Demonstrate the moral reckoning layer"""
    
    print("="*80)
    print("MORAL RECKONING LAYER DEMONSTRATION")
    print("Living Hospital Orchestration Simulator")
    print("="*80)
    print()
    
    # Initialize with declared values
    declared_values = DeclaredValues(
        patient_dignity=0.9,
        fairness=0.8,
        transparency=0.95,
        safety_primacy=1.0,
        staff_welfare=0.7
    )
    
    engine = MoralReckoningEngine(
        declared_values=declared_values,
        institutional_profile="Balanced"
    )
    
    print("PRIORITY 1: DECLARED VALUES")
    print("-" * 80)
    print(f"Patient Dignity:    {declared_values.patient_dignity}")
    print(f"Fairness:           {declared_values.fairness}")
    print(f"Transparency:       {declared_values.transparency}")
    print(f"Safety Primacy:     {declared_values.safety_primacy}")
    print(f"Staff Welfare:      {declared_values.staff_welfare}")
    print()
    
    # Simulate some problematic events
    print("SIMULATING INSTITUTIONAL BEHAVIOR UNDER PRESSURE...")
    print("-" * 80)
    print()
    
    # Create mock state
    state = MockState(
        patients={
            1: MockPatient(id=1, arrival_time=0, triage_stage_2='RED', status=PatientStatus.WAITING, history=['HTN']),
            2: MockPatient(id=2, arrival_time=5, triage_stage_2='RED', status=PatientStatus.WAITING, history=[]),
            3: MockPatient(id=3, arrival_time=10, triage_stage_2='YELLOW', status=PatientStatus.WAITING, history=[]),
        },
        rooms=[
            MockRoom(name="Emergency 1", max_occupancy=2, current_load=2),
            MockRoom(name="Emergency 2", max_occupancy=2, current_load=2),
        ]
    )
    
    parameters = MockParameters()
    events = []
    
    # Event 1: Unexplained queue reorder (dignity violation)
    print("Event 1: Queue reordered without explanation...")
    event1 = MockEvent(
        event_id="evt_001",
        timestamp=30,
        event_type="QUEUE_REORDER",
        payload={"patient_id": 3}  # No 'reason' or 'justification'
    )
    events.append(event1)
    engine.process_tick(state, events, 6, parameters)
    print(f"  → Ethical Debt Accrued: +5 (unexplained reorder)")
    print(f"  → Observed Dignity Score: {engine.observed_behavior.dignity_score:.2f}")
    print()
    
    # Event 2: Another unexplained reorder
    print("Event 2: Another queue reorder without explanation...")
    event2 = MockEvent(
        event_id="evt_002",
        timestamp=60,
        event_type="QUEUE_REORDER",
        payload={"patient_id": 2}
    )
    events.append(event2)
    engine.process_tick(state, events, 12, parameters)
    print(f"  → Ethical Debt Accrued: +5")
    print(f"  → Total Ethical Debt: {engine.ethical_debt.current_debt:.1f}")
    print()
    
    # Event 3: Agent action without clear justification
    print("Event 3: System action without rule justification...")
    event3 = MockEvent(
        event_id="evt_003",
        timestamp=90,
        event_type="AGENT_ACTION",
        payload={
            "action": "ADMIT_TO_EMERGENCY",
            "patient_id": 1,
            "human_override_allowed": True
            # Missing: 'rules_triggered'
        }
    )
    events.append(event3)
    engine.process_tick(state, events, 18, parameters)
    print(f"  → Ethical Debt Accrued: +3 (unjustified action)")
    print(f"  → Total Ethical Debt: {engine.ethical_debt.current_debt:.1f}")
    print()
    
    # Process several ticks to show tension buildup
    print("Event 4-10: System under sustained pressure (30 seconds)...")
    for tick in range(20, 26):
        engine.process_tick(state, events, tick, parameters)
    print(f"  → Ethical Debt after decay and accumulation: {engine.ethical_debt.current_debt:.1f}")
    print(f"  → {engine.ethical_debt.get_interpretation()}")
    print()
    
    # PRIORITY 1: Value Drift
    print("\n" + "="*80)
    print("PRIORITY 1: VALUE DRIFT DETECTION")
    print("="*80)
    value_drift = engine.compute_value_drift()
    print(f"\nDignity Drift:      {value_drift.dignity_drift:.3f} (declared: {declared_values.patient_dignity:.2f}, observed: {engine.observed_behavior.dignity_score:.2f})")
    print(f"Fairness Drift:     {value_drift.fairness_drift:.3f}")
    print(f"Transparency Drift: {value_drift.transparency_drift:.3f}")
    print(f"Maximum Drift:      {value_drift.maximum_drift:.3f}")
    print(f"\n⚠️  {value_drift.interpretation}")
    print()
    
    # PRIORITY 2: Ethical Debt
    print("="*80)
    print("PRIORITY 2: ETHICAL DEBT ACCUMULATION")
    print("="*80)
    print(f"\nCurrent Debt: {engine.ethical_debt.current_debt:.1f} units")
    print(f"Interpretation: {engine.ethical_debt.get_interpretation()}")
    print(f"\nDebt Breakdown by Category:")
    for category, amount in engine.ethical_debt.get_breakdown_by_category().items():
        print(f"  - {category}: {amount:.1f}")
    print()
    
    # PRIORITY 3: Tension Detection
    print("="*80)
    print("PRIORITY 3: PRE-COLLAPSE TENSION SIGNALS")
    print("="*80)
    tensions = engine.tension_detector.detect(state, events, 25, parameters)
    if tensions:
        for tension in tensions:
            print(f"\n⚠️  TENSION DETECTED: {tension.tension_type.value}")
            print(f"   Severity: {tension.severity:.2f}")
            print(f"   {tension.description}")
            print(f"   Contributing factors:")
            for factor in tension.contributing_factors:
                print(f"     • {factor}")
    else:
        print("\nNo active tensions detected at this moment.")
    print()
    
    # PRIORITY 4: Harm Classification
    print("="*80)
    print("PRIORITY 4: FORCED VS CHOSEN HARM DISTINCTION")
    print("="*80)
    
    # Classify an event as forced harm
    print("\nClassifying queue reorder event...")
    harm = engine.harm_classifier.classify_harm(event1, state, parameters)
    if harm:
        print(f"Harm Type: {harm.harm_type.value}")
        print(f"Justification: {harm.justification}")
        print(f"Avoidable with: {harm.avoidable_with}")
        print(f"Alternative actions: {harm.alternative_actions}")
    
    summary = engine.harm_classifier.get_summary()
    print(f"\nHarm Classification Summary:")
    print(f"  Total harms classified: {summary['total_harms_classified']}")
    print(f"  Forced (unavoidable): {summary['forced_count']}")
    print(f"  Avoidable: {summary['avoidable_count']}")
    print()
    
    # PRIORITY 5: Refusal to Act
    print("="*80)
    print("PRIORITY 5: REFUSAL TO ACT DEMONSTRATION")
    print("="*80)
    
    # Simulate conflicting signals
    print("\nScenario: Patient shows RED symptoms but history suggests false alarm...")
    conflicting_signals = {
        'triage': {'urgency': 0.9},
        'history': {'risk_level': 0.2}
    }
    
    refusal = engine.refusal_evaluator.should_refuse(conflicting_signals, state, parameters, 30)
    if refusal:
        print(f"\n🛑 SYSTEM REFUSED TO ACT")
        print(f"   Reason: {refusal.reason.value}")
        print(f"   {refusal.description}")
        print(f"   Requires human intervention: {refusal.requires_human}")
        print(f"   Alternative suggestions:")
        for suggestion in refusal.alternative_suggestions:
            print(f"     • {suggestion}")
    print()
    
    # PRIORITY 6: Unavoidable Harm Summary
    print("="*80)
    print("PRIORITY 6: UNAVOIDABLE HARM SUMMARY")
    print("="*80)
    
    harm_summary = engine.generate_unavoidable_harm_summary("run_demo_001")
    print("\n" + harm_summary.summary)
    print()
    
    # Export complete reckoning
    print("="*80)
    print("COMPLETE MORAL RECKONING EXPORT")
    print("="*80)
    
    complete_export = engine.export_complete_reckoning("run_demo_001")
    
    print("\nExported data structure includes:")
    print(f"  - Declared values: {len(complete_export['declared_values'])} dimensions")
    print(f"  - Value drift analysis: {len(complete_export['value_drift'])} metrics")
    print(f"  - Ethical debt: {complete_export['ethical_debt']['current_debt']:.1f} units")
    print(f"  - Tension signals: {len(complete_export['tension_signals']['history'])} detected")
    print(f"  - Harm classifications: {complete_export['harm_classifications']['summary']['total_harms_classified']} events")
    print(f"  - Refusals: {complete_export['refusals']['summary']['total_refusals']} instances")
    print(f"  - Unavoidable harm summary: Generated")
    print()
    
    print("="*80)
    print("KEY INSIGHTS FROM THIS DEMONSTRATION")
    print("="*80)
    print("""
This system does not ask: "Did we succeed?"
It asks: "What did this cost us, and why?"

What we've shown:
1. VALUE DRIFT - Gap between what we claim to value and what we actually do
2. ETHICAL DEBT - Cumulative moral weight that lingers and must be acknowledged
3. TENSION SIGNALS - Early warnings when system is coping instead of responding
4. HARM DISTINCTION - Forced harm vs chosen compromise (ethics committees care)
5. REFUSAL TO ACT - System admits when it cannot act safely (epistemic humility)
6. UNAVOIDABLE HARM - Honest accounting of what could not be prevented

This is not optimization.
This is institutional self-awareness.
This is how institutions prevent self-deception.
    """)
    
    print("="*80)
    print("WHAT THIS SYSTEM MUST NEVER BECOME")
    print("="*80)
    print("""
❌ NOT a performance ranking tool
❌ NOT a justification engine for austerity
❌ NOT a predictive triage system
❌ NOT a sales demo for "efficiency gains"

If someone asks for these, the answer is explicitly NO.

What this IS:
✅ A stance toward decision-making under irreducible uncertainty
✅ A refusal of premature closure
✅ A commitment to visible tension over false resolution
✅ A mirror for institutional self-awareness

This system prevents institutions from lying to themselves.
    """)
    
    print("="*80)
    print("END OF DEMONSTRATION")
    print("="*80)


if __name__ == "__main__":
    demonstrate_moral_reckoning()
