# Institutional Mirror Phase 1 PRD
## System Stabilization Before Expansion

## 1. Purpose

Phase 1 turns Institutional Mirror from a powerful simulation demo into a coherent operational substrate.

The goal is not feature expansion. The goal is state coherence.

The current system already has strong philosophical framing, event sourcing, moral reckoning, scoring, replay, and a usable Vercel interface. The next risk is conceptual growth outpacing architectural clarity. Phase 1 therefore introduces a stable internal model for operational state, human state, governance state, trust, and hidden strain.

This phase should make future features easier to build because the simulator will have a clearer model of what the institution is, what it remembers, and how pressure propagates through it.

## 2. Non-Goals

Phase 1 must not become a redesign sprint.

Out of scope:

- replacing the existing simulation engine
- rewriting the Vercel UI
- adding a new scenario sandbox
- adding real clinical prediction
- integrating real patient data
- making the system an optimiser
- adding more dashboards before the state model is coherent
- adding free-camera 3D or heavy rendering libraries

The current v1 UI can remain mostly intact while the substrate improves underneath it.

## 3. Design Principle

The system should model the hospital as a living institution under pressure.

That means the engine needs explicit representations of:

- operational flow
- human degradation
- governance response
- operational trust
- hidden strain
- institutional memory

The simulator should not only record events. It should accumulate state.

## 4. Phase 1 Architecture

Phase 1 introduces five additive engine modules. These modules consume the existing event log and emit derived state snapshots. They should not initially replace `event_sourced_engine.py`, `scoring_engine.py`, `playback_engine.py`, `moral_reckoning.py`, or `integrated_engine.py`.

Recommended files:

```text
engine/
├── state_models.py
├── operational_trust.py
├── human_state.py
├── hidden_strain.py
└── governance_state.py
```

The same files can later be copied into `vercel-app/api/` for deployment once stable.

## 5. Normalized State Models

### 5.1 OperationalState

Represents mechanical hospital state.

Fields:

- current_tick
- patient_locations
- queue_lengths
- room_occupancy
- waiting_times
- active_bottlenecks
- throughput_rate
- escalation_queue_depth
- overload_level

Purpose:

Provide one canonical derived state snapshot that later systems can read instead of each system re-parsing raw events differently.

### 5.2 HumanState

Represents patient and staff degradation.

Patient-level fields:

- frustration
- trust
- anxiety
- abandonment_risk
- escalation_likelihood

Staff-level fields:

- fatigue
- burnout
- cognitive_load
- procedural_compliance
- override_tendency
- escalation_willingness

Purpose:

Make human state operationally consequential rather than purely narrative.

### 5.3 GovernanceState

Represents institutional coordination capacity.

Fields:

- active_policies
- policy_adherence
- override_count
- escalation_success_rate
- escalation_failure_rate
- fairness_interventions
- governance_stability
- governance_drift
- accountability_trace_completeness

Purpose:

Track whether institutional safeguards are functioning under stress.

### 5.4 TrustState

Represents operational trust across actors.

Fields:

- patient_trust
- staff_trust
- institutional_trust
- trust_fragmentation
- trust_recovery_rate
- trust_degradation_rate
- bypass_probability
- compliance_probability
- escalation_willingness
- institutional_fragility

Purpose:

Make Operational Trust the stabilizing systems layer.

### 5.5 HiddenStrainState

Represents invisible accumulation.

Fields:

- latent_stress
- silent_overload
- normalized_dysfunction
- fatigue_memory
- delayed_failure_risk
- invisible_suffering
- unresolved_pressure
- strain_hotspots

Purpose:

Model the way real institutions fail through accumulation before visible collapse.

## 6. Event Propagation Model

Phase 1 should introduce an explicit propagation pipeline:

```text
Raw Event Log
  ↓
Operational State Reducer
  ↓
Human State Engine
  ↓
Governance State Engine
  ↓
Operational Trust Engine
  ↓
Hidden Strain Engine
  ↓
Reflective Snapshot
```

This pipeline keeps separation of concerns clear:

- operational state says what happened mechanically
- human state says how actors are degrading or recovering
- governance state says how institutional safeguards are responding
- trust state says whether the institution remains reliable under pressure
- hidden strain says what is accumulating invisibly

## 7. Operational Trust Engine

### 7.1 Definition

Operational Trust is the sustained ability of patients, clinicians, operators, and the institution to rely on the system under uncertainty, overload, drift, and imperfect information.

It is not sentiment. It is not satisfaction. It is a stability variable.

### 7.2 Inputs That Reduce Trust

Trust should degrade from:

- delay inequity
- unexplained overrides
- overload
- escalation failures
- fairness drift
- opacity
- workload imbalance
- repeated reversals
- unavailable human oversight
- unresolved harm events

### 7.3 Inputs That Restore Trust

Trust should recover from:

- transparent escalation
- timely intervention
- equitable prioritization
- explained override decisions
- successful recovery after overload
- visible governance response
- reduced queue volatility
- completed accountability traces

### 7.4 Outputs

Operational Trust should influence:

- patient compliance
- escalation willingness
- patient abandonment risk
- institutional fragility
- workflow bypass probability
- complaint amplification
- staff procedural compliance
- likelihood of informal workarounds

### 7.5 Suggested Initial Formula

Phase 1 can begin with deterministic heuristic scoring.

Example:

```text
trust_delta =
  + transparent_escalations * 0.03
  + successful_interventions * 0.04
  - delay_inequity * 0.05
  - unexplained_overrides * 0.04
  - overload_level * 0.03
  - escalation_failures * 0.06
  - fairness_drift * 0.05
  - opacity * 0.04
```

Clamp all trust values to 0.0–1.0.

The exact coefficients are less important than making trust explicit, inspectable, and deterministic.

## 8. Hidden Strain Engine

### 8.1 Definition

Hidden Strain is unresolved operational pressure that has not yet appeared as a visible failure but is already changing institutional behaviour.

### 8.2 Tracked Variables

- latent stress
- hidden risk accumulation
- normalized dysfunction
- silent overload
- delayed failure emergence
- institutional fatigue memory
- moral injury pressure
- unresolved escalation pressure

### 8.3 Accumulation Rules

Hidden strain should increase when:

- queues remain near threshold without escalation
- staff stress stays elevated
- ethical debt rises without governance response
- patients wait without status updates
- room occupancy stays saturated
- escalation events are suggested but not resolved
- the same tension appears repeatedly

Hidden strain should decrease when:

- escalation resolves a bottleneck
- staffing relief occurs
- queue pressure meaningfully drops
- patients receive transparent communication
- governance intervention addresses the source condition

### 8.4 Delayed Failure Emergence

When hidden strain crosses thresholds, it should emit derived warnings such as:

- `NORMALIZED_OVERLOAD_DETECTED`
- `ESCALATION_FATIGUE_RISK`
- `TRUST_FRAGMENTATION_RISK`
- `WORKFLOW_BYPASS_RISK`
- `DELAYED_FAILURE_LIKELY`

These are not accusations. They are reflective signals.

## 9. Governance State Engine

### 9.1 Purpose

The governance state engine tracks whether safeguards remain functional under pressure.

It should answer:

- Are policies being followed?
- Are exceptions explained?
- Are escalation chains working?
- Are overrides becoming routine?
- Is accountability trace completeness degrading?
- Is governance responding to strain or merely recording it?

### 9.2 Initial Derived Variables

- policy_adherence
- override_frequency
- explained_override_ratio
- escalation_success_rate
- escalation_congestion
- fairness_intervention_rate
- governance_stability
- governance_drift

### 9.3 Drift Detection

Governance drift increases when:

- overrides become frequent
- exceptions lack explanation
- escalation suggestions do not lead to action
- fairness interventions decrease under overload
- transparency declines while throughput remains stable

Governance drift decreases when:

- interventions are documented
- fairness safeguards activate
- escalation paths resolve bottlenecks
- accountability traces remain complete

## 10. Human-State Engine

### 10.1 Purpose

Human-state dynamics should connect operational pressure to behavioural change.

This does not require full psychological realism. It requires enough state to model institutional consequences.

### 10.2 Patient State

Initial variables:

- frustration
- trust
- anxiety
- abandonment_risk
- complaint_probability

Drivers:

- wait time
- unexplained delay
- triage downgrade
- corridor waiting
- lack of communication
- perceived inequity

### 10.3 Staff State

Initial variables:

- fatigue
- cognitive_load
- burnout
- escalation_willingness
- procedural_compliance
- override_tendency

Drivers:

- room saturation
- queue pressure
- repeated escalations
- unresolved harm events
- sustained high-acuity load
- low governance responsiveness

### 10.4 Behavioural Effects

Human state should eventually influence:

- delayed response
- workflow bypass
- escalation hesitation
- override frequency
- reduced care quality
- complaint emergence

For Phase 1, these can first be reported as derived probabilities rather than fed back into simulation decisions.

## 11. Reflective Snapshot

Phase 1 should produce a new derived object:

```python
ReflectiveSnapshot:
    tick: int
    operational_state: OperationalState
    human_state: HumanState
    governance_state: GovernanceState
    trust_state: TrustState
    hidden_strain_state: HiddenStrainState
    observations: List[ReflectiveObservation]
```

Each `ReflectiveObservation` should contain:

- type
- severity
- message
- evidence
- governance_implication
- tick

Example:

```text
Trust appears to be degrading in emergency intake because escalation suggestions are rising while resolved interventions remain flat.
```

## 12. Integration Strategy

### Step 1: Add Models Only

Create dataclasses and serialization methods. No behaviour changes.

### Step 2: Add Reducers

Build deterministic reducers that consume `SimulationRun.event_log`.

### Step 3: Add Derived Snapshot API

Expose:

```python
generate_reflective_snapshots(run: SimulationRun) -> List[ReflectiveSnapshot]
```

### Step 4: Add Summary to Integrated Report

Add a new top-level report key:

```json
"reflective_state": {
  "operational_trust": ...,
  "hidden_strain": ...,
  "governance_stability": ...,
  "human_state": ...,
  "observations": [...]
}
```

### Step 5: UI Reads the New Object

Only after engine output is stable should the UI visualize:

- trust staining
- strain diffusion
- governance instability
- hidden overload

## 13. Acceptance Criteria

Phase 1 is complete when:

- all new state models serialize to JSON
- every derived value is deterministic for same seed and event log
- no existing engine file behaviour is broken
- existing Vercel screens still work
- report output includes `reflective_state`
- trust and hidden strain are inspectable as separate concepts
- at least five reflective observations can be generated from a 200-tick run
- terminology is defined in a formal ontology doc

## 14. Testing Requirements

Minimum tests:

- same seed produces identical reflective snapshots
- empty event log produces safe zero/default state
- sparse event log does not crash
- high overload event sequence increases hidden strain
- repeated unexplained overrides reduce operational trust
- transparent escalation partially restores trust
- governance drift increases when escalation suggestions are not resolved

## 15. Pre-Deploy vs Post-Deploy

### Safe Pre-Deploy

These can be done without destabilizing the live demo:

- write ontology doc
- add dataclasses
- add pure reducer modules
- generate reflective summary from existing event log
- add report key without changing existing keys

### Post-Deploy

These should wait until the live URL is stable:

- feed human-state probabilities back into simulation decisions
- alter triage or admission logic based on trust
- replace playback architecture
- rewrite timestamp semantics
- refactor core event sourcing

## 16. Formal Ontology Required

Create:

```text
docs/SYSTEMS_ONTOLOGY.md
```

Required definitions:

- Operational Trust
- Ethical Debt
- Governance Drift
- Hidden Strain
- Institutional Cognition
- Escalation Congestion
- Reflective Awareness
- Normalized Dysfunction
- Institutional Fatigue Memory

Each definition should include:

- plain-English definition
- what increases it
- what decreases it
- what it affects
- what it is not

## 17. Recommended Next Build Task

Do not start with the isometric visual.

Start with:

1. `docs/SYSTEMS_ONTOLOGY.md`
2. `engine/state_models.py`
3. `engine/operational_trust.py`
4. `engine/hidden_strain.py`

Then integrate a read-only `reflective_state` summary into the API response.

Only after that should the visual hospital be upgraded to show trust, hidden strain, and governance instability as living institutional dynamics.
