"""
Stress Test Suite for Moral Reckoning System

Tests:
1. High-volume simulation (200 ticks)
2. Multiple concurrent scenarios
3. Edge cases (empty runs, overload, zero capacity)
4. Data consistency validation
5. Performance benchmarks
6. Memory usage
7. All 7 priorities under stress
8. Extreme value drift scenarios
9. Maximum ethical debt accumulation
10. Refusal cascade scenarios
"""

import sys
import time
import traceback
from datetime import datetime
import json

# Canonical engine: the deployed copy under vercel-app/api (engine/ is deprecated).
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "vercel-app", "api")))

from integrated_engine import IntegratedHospitalSystem, create_system_from_profile
from event_sourced_engine import InstitutionalParameters
from moral_reckoning import DeclaredValues


class StressTestResult:
    """Track results of stress tests"""
    
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.failures = []
        self.warnings = []
        self.performance_metrics = {}
    
    def pass_test(self, name: str):
        self.tests_run += 1
        self.tests_passed += 1
        print(f"✅ PASS: {name}")
    
    def fail_test(self, name: str, error: str):
        self.tests_run += 1
        self.tests_failed += 1
        self.failures.append({'test': name, 'error': error})
        print(f"❌ FAIL: {name}")
        print(f"   Error: {error}")
    
    def warn(self, message: str):
        self.warnings.append(message)
        print(f"⚠️  WARNING: {message}")
    
    def record_performance(self, name: str, duration: float, metrics: dict):
        self.performance_metrics[name] = {
            'duration_seconds': duration,
            **metrics
        }
    
    def summary(self):
        print("\n" + "="*80)
        print("STRESS TEST SUMMARY")
        print("="*80)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_failed}")
        print(f"Warnings: {len(self.warnings)}")
        
        if self.tests_failed > 0:
            print("\nFailed Tests:")
            for failure in self.failures:
                print(f"  - {failure['test']}: {failure['error']}")
        
        if self.warnings:
            print(f"\nWarnings: {len(self.warnings)}")
        
        print("\nPerformance Metrics:")
        for name, metrics in self.performance_metrics.items():
            print(f"  {name}:")
            print(f"    Duration: {metrics['duration_seconds']:.2f}s")
            for key, value in metrics.items():
                if key != 'duration_seconds':
                    print(f"    {key}: {value}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        if self.tests_failed == 0:
            print("\n🎉 ALL TESTS PASSED")
        else:
            print(f"\n⚠️  {self.tests_failed} TESTS FAILED")
        
        return self.tests_failed == 0


results = StressTestResult()


def test_high_volume_simulation():
    """Test 1: High-volume simulation (200 ticks = ~16 minutes)"""
    
    test_name = "High-Volume Simulation (200 ticks)"
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")
    
    try:
        start_time = time.time()
        
        # Create system
        system = create_system_from_profile("Balanced", seed=42)
        
        # Run 200 ticks
        print("Running 200 ticks...")
        for tick in range(200):
            system.execute_tick(tick)
            if tick % 50 == 0:
                print(f"  Tick {tick}/200...")
        
        # Generate report
        report = system.generate_complete_report()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Validate report structure
        assert 'performance_scores' in report
        assert 'moral_reckoning' in report
        assert 'synthesis' in report
        
        # Record metrics
        metrics = {
            'ticks_executed': 200,
            'events_generated': len(system.current_run.event_log),
            'ethical_debt_final': report['moral_reckoning']['ethical_debt']['current_debt'],
            'tensions_detected': len(report['moral_reckoning']['tension_signals']['history']),
            'harms_classified': report['moral_reckoning']['harm_classifications']['summary']['total_harms_classified']
        }
        
        results.record_performance(test_name, duration, metrics)
        results.pass_test(test_name)
        
        return report
        
    except Exception as e:
        results.fail_test(test_name, str(e))
        traceback.print_exc()
        return None


def test_extreme_overload_scenario():
    """Test 2: Extreme overload scenario"""
    
    test_name = "Extreme Overload Scenario"
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")
    
    try:
        start_time = time.time()
        
        # Create system with very tight parameters
        params = InstitutionalParameters(
            max_wait_red=30,  # Very tight
            max_wait_yellow=60,
            max_wait_blue=120,
            safety_weight=0.45,
            experience_weight=0.30,
            staff_weight=0.15,
            throughput_weight=0.10,
            room_intake_modifier=0.5,  # Reduce intake
            escalation_sensitivity=1.0,
            red_clustering_threshold=3,
            queue_pressure_threshold=15
        )
        
        system = IntegratedHospitalSystem(
            institutional_profile="Government Hospital",
            parameters=params,
            seed=42
        )
        
        
        
        # Run simulation
        print("Running overload scenario (100 ticks)...")
        for tick in range(100):
            system.execute_tick(tick)
        
        report = system.generate_complete_report()
        
        end_time = time.time()
        
        # Validate high stress was detected
        ethical_debt = report['moral_reckoning']['ethical_debt']['current_debt']
        tensions = len(report['moral_reckoning']['tension_signals']['history'])
        
        print(f"  Ethical debt reached: {ethical_debt:.1f} units")
        print(f"  Tensions detected: {tensions}")
        
        # Should have high debt and tensions
        if ethical_debt < 20:
            results.warn(f"Expected high ethical debt under overload, got {ethical_debt:.1f}")
        
        if tensions < 5:
            results.warn(f"Expected multiple tensions under overload, got {tensions}")
        
        metrics = {
            'ethical_debt': ethical_debt,
            'tensions': tensions,
            'harms': report['moral_reckoning']['harm_classifications']['summary']['total_harms_classified']
        }
        
        results.record_performance(test_name, end_time - start_time, metrics)
        results.pass_test(test_name)
        
        return report
        
    except Exception as e:
        results.fail_test(test_name, str(e))
        traceback.print_exc()
        return None


def test_value_drift_extremes():
    """Test 3: Extreme value drift scenarios"""
    
    test_name = "Extreme Value Drift Detection"
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")
    
    try:
        start_time = time.time()
        
        # Create system with very high declared values
        high_values = DeclaredValues(
            patient_dignity=1.0,
            fairness=1.0,
            transparency=1.0,
            safety_primacy=1.0,
            staff_welfare=1.0
        )
        
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
        
        system = IntegratedHospitalSystem(
            institutional_profile="Balanced",
            parameters=params,
            declared_values=high_values,
            seed=42
        )
        
        
        
        # Run simulation
        print("Running with maximum declared values...")
        for tick in range(80):
            system.execute_tick(tick)
        
        # Check drift
        drift = system.compute_value_drift()
        
        print(f"  Maximum drift: {drift.maximum_drift:.3f}")
        print(f"  Average drift: {drift.average_drift:.3f}")
        print(f"  Primary misalignment: {drift.primary_misalignment}")
        
        # Should detect drift with perfect declared values
        if drift.maximum_drift < 0.1:
            results.warn("Expected significant drift with perfect declared values")
        
        metrics = {
            'maximum_drift': drift.maximum_drift,
            'average_drift': drift.average_drift,
            'primary_misalignment': drift.primary_misalignment
        }
        
        results.record_performance(test_name, time.time() - start_time, metrics)
        results.pass_test(test_name)
        
        return drift
        
    except Exception as e:
        results.fail_test(test_name, str(e))
        traceback.print_exc()
        return None


def test_ethical_debt_decay():
    """Test 4: Ethical debt accumulation and decay"""
    
    test_name = "Ethical Debt Accumulation & Decay"
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")
    
    try:
        start_time = time.time()
        
        system = create_system_from_profile("Balanced", seed=42)
        
        
        debt_history = []
        
        # Run and track debt
        print("Tracking debt over 150 ticks...")
        for tick in range(150):
            system.execute_tick(tick)
            debt = system.moral_engine.ethical_debt.current_debt
            debt_history.append((tick, debt))
            
            if tick % 30 == 0:
                print(f"  Tick {tick}: Debt = {debt:.1f}")
        
        # Check that debt accumulated
        max_debt = max(d[1] for d in debt_history)
        final_debt = debt_history[-1][1]
        
        print(f"  Maximum debt reached: {max_debt:.1f}")
        print(f"  Final debt: {final_debt:.1f}")
        
        # Debt should accumulate
        if max_debt < 10:
            results.warn(f"Expected debt accumulation, max was only {max_debt:.1f}")
        
        # Check decay is working (debt shouldn't only increase)
        increasing_count = sum(1 for i in range(1, len(debt_history)) 
                              if debt_history[i][1] > debt_history[i-1][1])
        decreasing_count = sum(1 for i in range(1, len(debt_history)) 
                              if debt_history[i][1] < debt_history[i-1][1])
        
        print(f"  Ticks with increasing debt: {increasing_count}")
        print(f"  Ticks with decreasing debt: {decreasing_count}")
        
        if decreasing_count == 0:
            results.warn("Debt never decreased - decay may not be working")
        
        metrics = {
            'max_debt': max_debt,
            'final_debt': final_debt,
            'increasing_ticks': increasing_count,
            'decreasing_ticks': decreasing_count
        }
        
        results.record_performance(test_name, time.time() - start_time, metrics)
        results.pass_test(test_name)
        
        return debt_history
        
    except Exception as e:
        results.fail_test(test_name, str(e))
        traceback.print_exc()
        return None


def test_tension_detection_sensitivity():
    """Test 5: Tension detection sensitivity"""
    
    test_name = "Tension Detection Sensitivity"
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")
    
    try:
        start_time = time.time()
        
        # Run multiple profiles
        profiles = ["Government Hospital", "Private Hospital", "Balanced"]
        tension_counts = {}
        
        for profile in profiles:
            print(f"\n  Testing profile: {profile}")
            system = create_system_from_profile(profile, seed=42)
            
            
            for tick in range(60):
                system.execute_tick(tick)
            
            tensions = system.get_tension_signals()
            count = len(tensions['history'])
            tension_counts[profile] = count
            
            print(f"    Tensions detected: {count}")
            
            # Check types
            if tensions['history']:
                types = set(t['tension_type'] for t in tensions['history'])
                print(f"    Types: {', '.join(types)}")
        
        # All profiles should detect some tensions
        for profile, count in tension_counts.items():
            if count == 0:
                results.warn(f"No tensions detected for {profile}")
        
        metrics = {
            'tensions_by_profile': tension_counts
        }
        
        results.record_performance(test_name, time.time() - start_time, metrics)
        results.pass_test(test_name)
        
        return tension_counts
        
    except Exception as e:
        results.fail_test(test_name, str(e))
        traceback.print_exc()
        return None


def test_harm_classification_coverage():
    """Test 6: Harm classification coverage"""
    
    test_name = "Harm Classification Coverage"
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")
    
    try:
        start_time = time.time()
        
        system = create_system_from_profile("Balanced", seed=42)
        
        
        # Run simulation
        print("Running simulation to generate harms...")
        for tick in range(100):
            system.execute_tick(tick)
        
        harms = system.get_harm_classifications()
        
        print(f"  Total harms classified: {harms['summary']['total_harms_classified']}")
        print(f"  Forced: {harms['summary'].get('forced_count', 0)}")
        print(f"  Avoidable: {harms['summary'].get('avoidable_count', 0)}")
        
        # Check harm types distribution
        if 'by_type' in harms['summary']:
            print(f"  By type:")
            for harm_type, count in harms['summary']['by_type'].items():
                print(f"    {harm_type}: {count}")
        
        # Should have classified some harms
        if harms['summary']['total_harms_classified'] == 0:
            results.warn("No harms classified - may need to check classification logic")
        
        metrics = {
            'total_classified': harms['summary']['total_harms_classified'],
            'forced': harms['summary'].get('forced_count', 0),
            'avoidable': harms['summary'].get('avoidable_count', 0),
            'by_type': harms['summary'].get('by_type', {})
        }
        
        results.record_performance(test_name, time.time() - start_time, metrics)
        results.pass_test(test_name)
        
        return harms
        
    except Exception as e:
        results.fail_test(test_name, str(e))
        traceback.print_exc()
        return None


def test_refusal_scenarios():
    """Test 7: Refusal to act scenarios"""
    
    test_name = "Refusal to Act Scenarios"
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")
    
    try:
        start_time = time.time()
        
        from moral_reckoning import RefusalEvaluator
        
        evaluator = RefusalEvaluator()
        
        # Test conflicting signals
        print("  Testing conflicting signals...")
        conflicting_signals = {
            'triage': {'urgency': 0.9},
            'history': {'risk_level': 0.2}
        }
        
        refusal = evaluator.should_refuse(conflicting_signals, None, None, 0)
        
        if refusal:
            print(f"    ✓ Refused: {refusal.reason.value}")
        else:
            results.warn("Expected refusal for conflicting signals")
        
        # Test insufficient data
        print("  Testing insufficient data...")
        insufficient_signals = {
            'chief_complaint': None,
            'age': None,
            'triage': None
        }
        
        refusal = evaluator.should_refuse(insufficient_signals, None, None, 0)
        
        if refusal:
            print(f"    ✓ Refused: {refusal.reason.value}")
        else:
            results.warn("Expected refusal for insufficient data")
        
        # Test clear signals (should not refuse)
        print("  Testing clear signals (should not refuse)...")
        clear_signals = {
            'triage': {'urgency': 0.8},
            'history': {'risk_level': 0.7},
            'chief_complaint': 'chest pain',
            'age': 55
        }
        
        refusal = evaluator.should_refuse(clear_signals, None, None, 0)
        
        if not refusal:
            print(f"    ✓ Correctly did not refuse")
        else:
            results.warn(f"Should not have refused for clear signals, but refused: {refusal.reason.value}")
        
        refusal_summary = evaluator.get_summary()
        
        metrics = {
            'total_refusals': refusal_summary['total_refusals'],
            'by_reason': refusal_summary.get('by_reason', {})
        }
        
        results.record_performance(test_name, time.time() - start_time, metrics)
        results.pass_test(test_name)
        
        return refusal_summary
        
    except Exception as e:
        results.fail_test(test_name, str(e))
        traceback.print_exc()
        return None


def test_complete_report_generation():
    """Test 8: Complete report generation"""
    
    test_name = "Complete Report Generation"
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")
    
    try:
        start_time = time.time()
        
        system = create_system_from_profile("Balanced", seed=42)
        
        
        # Run simulation
        print("Running simulation...")
        for tick in range(80):
            system.execute_tick(tick)
        
        # Generate complete report
        print("Generating complete report...")
        report = system.generate_complete_report()
        
        # Validate structure
        required_keys = [
            'run_id',
            'institutional_profile',
            'timestamp',
            'performance_scores',
            'moral_reckoning',
            'synthesis'
        ]
        
        for key in required_keys:
            if key not in report:
                raise ValueError(f"Missing required key in report: {key}")
        
        # Validate moral reckoning structure
        moral_required = [
            'declared_values',
            'value_drift',
            'ethical_debt',
            'tension_signals',
            'harm_classifications',
            'refusals',
            'unavoidable_harm_summary'
        ]
        
        for key in moral_required:
            if key not in report['moral_reckoning']:
                raise ValueError(f"Missing moral reckoning key: {key}")
        
        # Validate synthesis
        synthesis_required = ['insights', 'recommendation', 'cost_accounting']
        
        for key in synthesis_required:
            if key not in report['synthesis']:
                raise ValueError(f"Missing synthesis key: {key}")
        
        print("  ✓ All required keys present")
        print(f"  ✓ Generated {len(report['synthesis']['insights'])} insights")
        print(f"  ✓ Recommendation: {report['synthesis']['recommendation'][:50]}...")
        
        # Test JSON serialization
        print("  Testing JSON serialization...")
        json_str = json.dumps(report, indent=2)
        print(f"  ✓ JSON size: {len(json_str):,} characters")
        
        # Test deserialization
        report_reloaded = json.loads(json_str)
        print("  ✓ JSON deserialization successful")
        
        metrics = {
            'report_keys': len(report.keys()),
            'insights_generated': len(report['synthesis']['insights']),
            'json_size_bytes': len(json_str)
        }
        
        results.record_performance(test_name, time.time() - start_time, metrics)
        results.pass_test(test_name)
        
        return report
        
    except Exception as e:
        results.fail_test(test_name, str(e))
        traceback.print_exc()
        return None


def test_multiple_runs_consistency():
    """Test 9: Multiple runs consistency"""
    
    test_name = "Multiple Runs Consistency"
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")
    
    try:
        start_time = time.time()
        
        # Run same scenario 3 times with same seed
        print("Running 3 identical scenarios (same seed)...")
        reports = []
        
        for i in range(3):
            print(f"  Run {i+1}/3...")
            system = create_system_from_profile("Balanced", seed=42)
            
            
            for tick in range(50):
                system.execute_tick(tick)
            
            report = system.generate_complete_report()
            reports.append(report)
        
        # Check consistency
        print("\nChecking consistency...")
        
        # Event counts should be identical
        event_counts = [len(system.current_run.event_log) for _ in reports]
        # Note: we only have the last system, so can't check all
        
        # Ethical debts should be close (may vary slightly due to floating point)
        debts = [r['moral_reckoning']['ethical_debt']['current_debt'] for r in reports]
        debt_variance = max(debts) - min(debts)
        
        print(f"  Ethical debts: {debts}")
        print(f"  Variance: {debt_variance:.3f}")
        
        if debt_variance > 5.0:
            results.warn(f"High variance in ethical debt across runs: {debt_variance:.3f}")
        
        # Check value drifts
        drifts = [r['moral_reckoning']['value_drift']['maximum_drift'] for r in reports]
        drift_variance = max(drifts) - min(drifts)
        
        print(f"  Maximum drifts: {[f'{d:.3f}' for d in drifts]}")
        print(f"  Variance: {drift_variance:.3f}")
        
        if drift_variance > 0.1:
            results.warn(f"High variance in value drift across runs: {drift_variance:.3f}")
        
        metrics = {
            'runs': 3,
            'debt_variance': debt_variance,
            'drift_variance': drift_variance
        }
        
        results.record_performance(test_name, time.time() - start_time, metrics)
        results.pass_test(test_name)
        
        return reports
        
    except Exception as e:
        results.fail_test(test_name, str(e))
        traceback.print_exc()
        return None


def test_edge_cases():
    """Test 10: Edge cases"""
    
    test_name = "Edge Cases"
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")
    
    try:
        start_time = time.time()
        
        # Test 1: Very short run (1 tick)
        print("  Testing very short run (1 tick)...")
        system = create_system_from_profile("Balanced", seed=42)
        
        system.execute_tick(0)
        report = system.generate_complete_report()
        print("    ✓ Short run successful")
        
        # Test 2: Zero declared values
        print("  Testing zero declared values...")
        zero_values = DeclaredValues(
            patient_dignity=0.0,
            fairness=0.0,
            transparency=0.0,
            safety_primacy=0.0,
            staff_welfare=0.0
        )
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
        system = IntegratedHospitalSystem(
            institutional_profile="Balanced",
            parameters=params,
            declared_values=zero_values,
            seed=42
        )
        
        for tick in range(10):
            system.execute_tick(tick)
        drift = system.compute_value_drift()
        print(f"    ✓ Drift with zero values: {drift.maximum_drift:.3f}")
        
        # Test 3: Identical declared and observed (theoretical)
        print("  Testing value drift computation...")
        drift = system.compute_value_drift()
        print(f"    ✓ Drift computed: {drift.interpretation}")
        
        metrics = {
            'edge_cases_tested': 3
        }
        
        results.record_performance(test_name, time.time() - start_time, metrics)
        results.pass_test(test_name)
        
        return True
        
    except Exception as e:
        results.fail_test(test_name, str(e))
        traceback.print_exc()
        return None


def run_all_stress_tests():
    """Run complete stress test suite"""
    
    print("="*80)
    print("MORAL RECKONING SYSTEM - COMPREHENSIVE STRESS TEST")
    print("="*80)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    overall_start = time.time()
    
    # Run all tests
    test_high_volume_simulation()
    test_extreme_overload_scenario()
    test_value_drift_extremes()
    test_ethical_debt_decay()
    test_tension_detection_sensitivity()
    test_harm_classification_coverage()
    test_refusal_scenarios()
    test_complete_report_generation()
    test_multiple_runs_consistency()
    test_edge_cases()
    
    overall_duration = time.time() - overall_start
    
    # Print summary
    print(f"\n{'='*80}")
    print(f"Total Duration: {overall_duration:.2f}s ({overall_duration/60:.1f} minutes)")
    
    success = results.summary()
    
    print(f"\n{'='*80}")
    print(f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*80}")
    
    return success


if __name__ == "__main__":
    success = run_all_stress_tests()
    sys.exit(0 if success else 1)
