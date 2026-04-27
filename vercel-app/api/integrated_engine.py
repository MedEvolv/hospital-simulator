"""
Integrated Hospital Orchestration System
Combines event-sourced simulation with moral reckoning layer

This is the complete system that produces institutional truth-telling.
"""

from event_sourced_engine import (
    EventSourcedSimulationEngine,
    SimulationRun,
    InstitutionalParameters
)
from moral_reckoning import (
    MoralReckoningEngine,
    DeclaredValues,
    ValueDriftResult,
    UnavoidableHarmSummary
)
from scoring_engine import ScoringEngine
from playback_engine import EventPlaybackController
from typing import Dict, Optional, List


class IntegratedHospitalSystem:
    """
    Complete system combining:
    - Event-sourced simulation (what happened)
    - Moral reckoning layer (what it cost)
    - Performance scoring (how it performed)
    - Value drift detection (were values honored)
    - Ethical debt tracking (cumulative moral weight)
    """
    
    def __init__(
        self,
        institutional_profile: str,
        parameters: InstitutionalParameters,
        declared_values: Optional[DeclaredValues] = None,
        seed: int = 42
    ):
        # Simulation engine (creates run automatically in __init__)
        self.sim_engine = EventSourcedSimulationEngine(
            institutional_profile=institutional_profile,
            parameters=parameters,
            seed=seed
        )
        
        # Get the run that was created
        self.current_run = self.sim_engine.run
        
        # Declare values (or use defaults based on profile)
        if declared_values is None:
            declared_values = self._default_declared_values(institutional_profile)
        
        # Moral reckoning engine
        self.moral_engine = MoralReckoningEngine(
            declared_values=declared_values,
            institutional_profile=institutional_profile
        )
        
        # Playback controller
        self.playback_controller = EventPlaybackController(self.current_run)
        self.tick_counter: int = 0
    
    def _default_declared_values(self, profile: str) -> DeclaredValues:
        """Default declared values based on institutional profile"""
        if profile == "Government Hospital":
            return DeclaredValues(
                patient_dignity=0.85,
                fairness=0.95,  # Strong fairness commitment (public service)
                transparency=0.90,
                safety_primacy=1.0,
                staff_welfare=0.65
            )
        elif profile == "Private Hospital":
            return DeclaredValues(
                patient_dignity=0.90,
                fairness=0.70,  # Lower fairness (can prioritize paying customers)
                transparency=0.85,
                safety_primacy=1.0,
                staff_welfare=0.75  # Better staff conditions
            )
        else:  # Balanced
            return DeclaredValues(
                patient_dignity=0.90,
                fairness=0.80,
                transparency=0.95,
                safety_primacy=1.0,
                staff_welfare=0.70
            )
    
    
    def execute_tick(self, tick: Optional[int] = None) -> Dict:
        """
        Execute one simulation tick with moral reckoning.
        
        Returns combined state including:
        - Simulation state
        - Events from this tick
        - Ethical debt level
        - Active tensions
        """
        if tick is None:
            tick = self.tick_counter
            self.tick_counter += 1
        
        # Run simulation tick
        self.sim_engine.tick()
        
        # Get current state (derived from events)
        state = self.sim_engine.get_current_state()
        
        # Get events from this tick
        events_this_tick = [
            e for e in self.current_run.event_log
            if e.timestamp == tick * 5
        ]
        
        # Process through moral reckoning
        self.moral_engine.process_tick(
            state=state,
            events=events_this_tick,
            current_tick=tick,
            parameters=self.current_run.parameters
        )
        
        # Return combined state
        return {
            'tick': tick,
            'timestamp': tick * 5,
            'simulation_state': state,
            'events_count': len(events_this_tick),
            'ethical_debt': self.moral_engine.ethical_debt.current_debt,
            'ethical_debt_interpretation': self.moral_engine.ethical_debt.get_interpretation(),
            'active_tensions': self.moral_engine.tension_detector.get_active_tensions_summary(),
            'total_patients': len(state.patients),
            'waiting_patients': sum(1 for p in state.patients.values() if p.status.name == 'WAITING')
        }
    
    def run_full_simulation(self, duration_ticks: int, verbose: bool = False) -> Dict:
        """Run complete simulation with moral reckoning"""
        results = []
        
        for tick in range(duration_ticks):
            tick_result = self.execute_tick(tick)
            results.append(tick_result)
            
            if verbose and tick % 10 == 0:
                print(f"Tick {tick}: "
                      f"Patients={tick_result['total_patients']}, "
                      f"Debt={tick_result['ethical_debt']:.1f}, "
                      f"Tensions={tick_result['active_tensions']['active_count']}")
        
        return {
            'duration_ticks': duration_ticks,
            'tick_results': results,
            'final_state': results[-1] if results else None
        }
    
    def compute_value_drift(self) -> ValueDriftResult:
        """Compute value drift at current state"""
        return self.moral_engine.compute_value_drift()
    
    def get_ethical_debt_summary(self) -> Dict:
        """Get current ethical debt summary"""
        return self.moral_engine.ethical_debt.to_dict()
    
    def get_tension_signals(self) -> Dict:
        """Get all detected tension signals"""
        return {
            'active': self.moral_engine.tension_detector.get_active_tensions_summary(),
            'history': [t.to_dict() for t in self.moral_engine.tension_detector.tension_history]
        }
    
    def get_harm_classifications(self) -> Dict:
        """Get all harm classifications"""
        return {
            'summary': self.moral_engine.harm_classifier.get_summary(),
            'details': [h.to_dict() for h in self.moral_engine.harm_classifier.classified_harms]
        }
    
    def get_refusals(self) -> Dict:
        """Get all system refusals"""
        return {
            'summary': self.moral_engine.refusal_evaluator.get_summary(),
            'details': [r.to_dict() for r in self.moral_engine.refusal_evaluator.refusals]
        }
    
    def generate_complete_report(self) -> Dict:
        """
        Generate complete institutional report.
        
        This is the full moral + performance accounting.
        """
        if not self.current_run:
            raise ValueError("No active run - create run first")
        
        # Performance scores (how system performed)
        performance_scores = ScoringEngine.score_run(self.current_run)
        
        # Moral reckoning (what it cost)
        moral_export = self.moral_engine.export_complete_reckoning(
            self.current_run.run_id
        )
        
        # Combined report
        return {
            'run_id': self.current_run.run_id,
            'institutional_profile': self.current_run.institutional_profile,
            'timestamp': self.current_run.start_time,  # Already a string
            'seed': self.current_run.seed,
            
            # Performance dimension (metrics)
            'performance_scores': {
                'patient_safety_score': performance_scores.patient_safety_score,
                'patient_experience_score': performance_scores.patient_experience_score,
                'staff_stress_score': performance_scores.staff_stress_score,
                'ethics_intervention_count': performance_scores.ethics_intervention_count,
                'system_throughput_index': performance_scores.system_throughput_index,
                'institutional_efficacy_score': performance_scores.institutional_efficacy_score,
                'interpretation': performance_scores.interpretation
            },
            
            # Moral reckoning dimension (costs)
            'moral_reckoning': moral_export,
            
            # Synthesis (the critical insights)
            'synthesis': self._synthesize_report(performance_scores, moral_export)
        }
    
    def _synthesize_report(self, performance, moral) -> Dict:
        """
        Synthesize performance and moral dimensions.
        
        This is where we surface the uncomfortable truths.
        """
        
        insights = []
        
        # INSIGHT 1: Value-performance misalignment
        if moral['value_drift']['maximum_drift'] > 0.3:
            insights.append({
                'type': 'VALUE_MISALIGNMENT',
                'severity': 'HIGH',
                'message': f"Significant value drift detected: {moral['value_drift']['interpretation']}",
                'data': {
                    'maximum_drift': moral['value_drift']['maximum_drift'],
                    'primary_misalignment': moral['value_drift']['primary_misalignment']
                }
            })
        
        # INSIGHT 2: Ethical debt strain
        if moral['ethical_debt']['current_debt'] > 60:
            insights.append({
                'type': 'ETHICAL_STRAIN',
                'severity': 'HIGH',
                'message': moral['ethical_debt']['interpretation'],
                'data': {
                    'debt_level': moral['ethical_debt']['current_debt'],
                    'category_breakdown': moral['ethical_debt']['category_breakdown']
                }
            })
        elif moral['ethical_debt']['current_debt'] > 30:
            insights.append({
                'type': 'ETHICAL_STRAIN',
                'severity': 'MEDIUM',
                'message': moral['ethical_debt']['interpretation'],
                'data': {
                    'debt_level': moral['ethical_debt']['current_debt']
                }
            })
        
        # INSIGHT 3: Avoidable harm pattern
        harm_summary = moral['harm_classifications']['summary']
        if harm_summary.get('avoidable_count', 0) > harm_summary.get('forced_count', 0):
            insights.append({
                'type': 'AVOIDABLE_HARM',
                'severity': 'HIGH',
                'message': f"{harm_summary['avoidable_count']} harms were capacity or policy-induced - potentially avoidable",
                'data': {
                    'forced': harm_summary['forced_count'],
                    'avoidable': harm_summary['avoidable_count'],
                    'by_type': harm_summary['by_type']
                }
            })
        
        # INSIGHT 4: Active tensions (pre-collapse signals)
        if moral['tension_signals']['active']['active_count'] > 0:
            severity = 'HIGH' if moral['tension_signals']['active']['active_count'] > 2 else 'MEDIUM'
            insights.append({
                'type': 'ACTIVE_TENSION',
                'severity': severity,
                'message': f"{moral['tension_signals']['active']['active_count']} pre-collapse tensions detected - system absorbing pressure instead of responding",
                'data': {
                    'tension_types': moral['tension_signals']['active']['types']
                }
            })
        
        # INSIGHT 5: Performance-moral trade-off (the critical one)
        if performance.institutional_efficacy_score > 75 and moral['value_drift']['average_drift'] > 0.3:
            insights.append({
                'type': 'PERFORMANCE_MORAL_TRADEOFF',
                'severity': 'CRITICAL',
                'message': "High performance score achieved at cost of significant value drift. System is succeeding on metrics while failing on values. This is institutional self-deception.",
                'data': {
                    'performance_score': performance.institutional_efficacy_score,
                    'value_drift': moral['value_drift']['average_drift'],
                    'gap': performance.institutional_efficacy_score / 100 - (1 - moral['value_drift']['average_drift'])
                }
            })
        
        # INSIGHT 6: Silent strain
        if len(moral['tension_signals']['history']) > 10 and moral['ethical_debt']['current_debt'] > 40:
            insights.append({
                'type': 'CHRONIC_STRAIN',
                'severity': 'HIGH',
                'message': "System experiencing chronic strain: frequent tensions + accumulated debt. This pattern leads to burnout and moral injury.",
                'data': {
                    'tension_count': len(moral['tension_signals']['history']),
                    'debt_level': moral['ethical_debt']['current_debt']
                }
            })
        
        # INSIGHT 7: Refusals (epistemic humility)
        if moral['refusals']['summary']['total_refusals'] > 0:
            insights.append({
                'type': 'EPISTEMIC_HUMILITY',
                'severity': 'INFO',
                'message': f"System refused to act {moral['refusals']['summary']['total_refusals']} times when it could not do so safely. This is proper restraint, not failure.",
                'data': moral['refusals']['summary']
            })
        
        return {
            'insights': insights,
            'recommendation': self._generate_recommendation(insights),
            'cost_accounting': {
                'performance_score': performance.institutional_efficacy_score,
                'ethical_debt': moral['ethical_debt']['current_debt'],
                'forced_harms': harm_summary.get('forced_count', 0),
                'avoidable_harms': harm_summary.get('avoidable_count', 0),
                'value_drift_average': moral['value_drift']['average_drift'],
                'value_drift_maximum': moral['value_drift']['maximum_drift'],
                'active_tensions': moral['tension_signals']['active']['active_count']
            },
            'critical_question': self._generate_critical_question(insights, moral, performance)
        }
    
    def _generate_critical_question(self, insights: List[Dict], moral: Dict, performance) -> str:
        """Generate a run-specific governance question from the most severe finding."""
        critical = [i for i in insights if i['severity'] == 'CRITICAL']
        high = [i for i in insights if i['severity'] == 'HIGH']

        drift = moral['value_drift']
        debt = moral['ethical_debt']['current_debt']
        avoidable = moral['harm_classifications']['summary'].get('avoidable_count', 0)
        forced = moral['harm_classifications']['summary'].get('forced_count', 0)
        ies = performance.institutional_efficacy_score

        if critical:
            top = critical[0]
            if top['type'] == 'PERFORMANCE_MORAL_TRADEOFF':
                return (
                    f"This run scored {ies:.1f}/100 on institutional efficacy while average value drift "
                    f"reached {drift['average_drift']:.2f}. The institution is succeeding on metrics "
                    f"while failing on values. Is this an acceptable trade-off — and who in this institution "
                    f"has the authority to name it as one?"
                )

        if drift.get('primary_misalignment') and drift['maximum_drift'] > 0.3:
            return (
                f"'{drift['primary_misalignment']}' was declared as a core value but showed the highest "
                f"drift ({drift['maximum_drift']:.2f}) in this run. This is a structural pattern — not "
                f"an individual failure. What resource allocation decision would need to change for that "
                f"drift to narrow?"
            )

        if avoidable > 0 and avoidable > forced:
            return (
                f"{avoidable} of {avoidable + forced} harms in this run were avoidable — they happened "
                f"because of policy or capacity decisions, not because no alternative existed. Which of "
                f"those decisions does this institution currently have a named process to revisit?"
            )

        if debt > 60:
            return (
                f"This run accrued {debt:.0f} units of ethical debt. Debt reflects accumulated "
                f"compromises made under pressure. If this run represented a real shift — does your "
                f"institution have a mechanism to detect that accumulation before it becomes normalised?"
            )

        return (
            "What did this run cost — in dignity, in fairness, in staff welfare — that will not appear "
            "in any standard performance report? And who is responsible for making that cost visible?"
        )

    def _generate_recommendation(self, insights: List[Dict]) -> str:
        """Generate human-readable recommendation"""
        if not insights:
            return "Institution operating within declared values with manageable ethical costs. Continue monitoring."
        
        critical = [i for i in insights if i['severity'] == 'CRITICAL']
        high = [i for i in insights if i['severity'] == 'HIGH']
        
        if critical:
            return f"CRITICAL: {len(critical)} critical issues detected. This represents institutional self-deception - performance metrics hiding moral costs. Immediate governance review and policy adjustment required."
        elif len(high) >= 3:
            return f"ATTENTION REQUIRED: {len(high)} high-severity issues detected. System is under ethical strain. Ethics committee review recommended within 48 hours."
        elif high:
            return f"MODERATE CONCERN: {len(high)} high-severity issues detected. Recommend ethics committee review and policy discussion."
        else:
            return f"{len(insights)} moderate concerns detected. Recommend routine ethics committee review."
    
    def export_to_json(self, filepath: str):
        """Export complete report to JSON file"""
        import json
        
        report = self.generate_complete_report()
        
        with open(filepath, 'w') as f:
            json.dump(report, f, indent=2)
        
        return filepath


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def create_system_from_profile(profile: str, seed: int = 42) -> IntegratedHospitalSystem:
    """Create integrated system from profile name"""
    
    if profile == "Government Hospital":
        # Government Hospital: High fairness, safety-focused
        params = InstitutionalParameters(
            max_wait_red=0,
            max_wait_yellow=240,
            max_wait_blue=600,
            safety_weight=0.55,
            experience_weight=0.20,
            staff_weight=0.15,
            throughput_weight=0.10,
            room_intake_modifier=0.8,
            escalation_sensitivity=1.2,
            red_clustering_threshold=2,
            queue_pressure_threshold=15
        )
    elif profile == "Private Hospital":
        # Private Hospital: Experience-focused, higher throughput
        params = InstitutionalParameters(
            max_wait_red=0,
            max_wait_yellow=120,
            max_wait_blue=300,
            safety_weight=0.40,
            experience_weight=0.40,
            staff_weight=0.10,
            throughput_weight=0.10,
            room_intake_modifier=1.2,
            escalation_sensitivity=0.8,
            red_clustering_threshold=3,
            queue_pressure_threshold=20
        )
    else:  # Balanced
        # Balanced: Standard parameters
        params = InstitutionalParameters(
            max_wait_red=0,
            max_wait_yellow=180,
            max_wait_blue=600,
            safety_weight=0.45,
            experience_weight=0.30,
            staff_weight=0.15,
            throughput_weight=0.10,
            room_intake_modifier=1.0,
            escalation_sensitivity=1.0,
            red_clustering_threshold=3,
            queue_pressure_threshold=15
        )
    
    return IntegratedHospitalSystem(
        institutional_profile=profile,
        parameters=params,
        declared_values=None,  # Use defaults
        seed=seed
    )


def run_complete_simulation(
    profile: str,
    duration_ticks: int = 60,
    seed: int = 42,
    output_file: Optional[str] = None
) -> Dict:
    """
    Run complete simulation with moral reckoning.
    
    Returns full report.
    """
    
    # Create system
    system = create_system_from_profile(profile, seed)
    
    # Run simulation
    system.run_full_simulation(duration_ticks, verbose=True)
    
    # Generate report
    report = system.generate_complete_report()
    
    # Export if requested
    if output_file:
        system.export_to_json(output_file)
        print(f"\nReport exported to: {output_file}")
    
    return report


# ============================================================================
# CLI INTERFACE
# ============================================================================

if __name__ == "__main__":
    import sys
    
    print("="*80)
    print("INTEGRATED HOSPITAL ORCHESTRATION SYSTEM")
    print("Event-Sourced Simulation + Moral Reckoning Layer")
    print("="*80)
    print()
    
    # Get profile from command line or use default
    profile = sys.argv[1] if len(sys.argv) > 1 else "Balanced"
    
    print(f"Profile: {profile}")
    print(f"Duration: 60 ticks (5 minutes)")
    print()
    
    # Run complete simulation
    report = run_complete_simulation(
        profile=profile,
        duration_ticks=60,
        seed=42,
        output_file="integrated_report.json"
    )
    
    # Display summary
    print("\n" + "="*80)
    print("SIMULATION COMPLETE")
    print("="*80)
    
    print("\nPERFORMANCE SCORES:")
    perf = report['performance_scores']
    print(f"  Institutional Efficacy: {perf['institutional_efficacy_score']:.1f}")
    print(f"  Patient Safety: {perf['patient_safety_score']:.1f}")
    print(f"  Patient Experience: {perf['patient_experience_score']:.1f}")
    print(f"  Staff Stress: {perf['staff_stress_score']:.1f}")
    
    print("\nMORAL RECKONING:")
    moral = report['moral_reckoning']
    print(f"  Ethical Debt: {moral['ethical_debt']['current_debt']:.1f} units")
    print(f"  Interpretation: {moral['ethical_debt']['interpretation']}")
    print(f"  Value Drift (max): {moral['value_drift']['maximum_drift']:.3f}")
    print(f"  {moral['value_drift']['interpretation']}")
    print(f"  Harms Classified: {moral['harm_classifications']['summary']['total_harms_classified']}")
    print(f"    - Forced (unavoidable): {moral['harm_classifications']['summary'].get('forced_count', 0)}")
    print(f"    - Avoidable: {moral['harm_classifications']['summary'].get('avoidable_count', 0)}")
    
    print("\nSYNTHESIS INSIGHTS:")
    synthesis = report['synthesis']
    for insight in synthesis['insights']:
        print(f"  [{insight['severity']}] {insight['type']}")
        print(f"      {insight['message']}")
    
    print(f"\nRECOMMENDATION:")
    print(f"  {synthesis['recommendation']}")
    
    print("\n" + "="*80)
    print("WHAT DID THIS COST US, AND WHY?")
    print("="*80)
    
    accounting = synthesis['cost_accounting']
    print(f"\nPerformance achieved: {accounting['performance_score']:.1f}/100")
    print(f"Ethical debt carried: {accounting['ethical_debt']:.1f} units")
    print(f"Forced harms (unavoidable): {accounting['forced_harms']}")
    print(f"Avoidable harms: {accounting['avoidable_harms']}")
    print(f"Value drift: {accounting['value_drift_average']:.3f} average, {accounting['value_drift_maximum']:.3f} maximum")
    print(f"Active tensions: {accounting['active_tensions']}")
    
    print("\nThis system does not ask: 'Did we succeed?'")
    print("It asks: 'What did this cost us, and why?'")
    
    print("\n" + "="*80)
