# Institutional Mirror v2 Upgrade PRD

## 1. Product Intent

Institutional Mirror v2 upgrades the current hospital emergency department simulator from a results dashboard into a reflective operational governance environment.

The product remains explicitly not a hospital management system, EHR, ERP, clinical decision support tool, or optimisation engine. It is a governance simulator that helps institutions perceive operational strain, trust degradation, ethical debt, workflow drift, and hidden institutional failure modes before those patterns become invisible routine.

Core thesis:

> Most healthcare AI failures do not emerge only at the model layer. They emerge at the operational layer, where overload, trust erosion, governance breakdown, human adaptation, and workflow drift compound over time.

## 2. Upgrade Objective

The v2 objective is to make the institution feel alive under pressure.

The system should show not only what happened, but what is emerging:

- where strain is accumulating
- where overload is becoming normal
- where trust is fragmenting
- where governance safeguards are eroding
- where ethical debt is building
- where staff and patients are adapting to failure instead of recovering from it

## 3. Target Users

### Primary: Healthcare AI Operations and Governance Teams

They need to stress-test AI-mediated workflows, escalation policies, queue behaviour, and operational consequences before deployment.

Primary jobs:

- evaluate deployment behaviour under overload
- identify governance risks
- understand human and workflow consequences
- test escalation and intervention logic
- detect operational trust failure

### Secondary: Hospital Operations Leadership

They need a serious, readable picture of strain accumulation and governance risk without being given a blame-oriented scorecard.

Primary jobs:

- understand queue dynamics
- identify hidden operational failures
- review escalation pathways
- see where structural pressure is producing avoidable harm

### Tertiary: Policy and Governance Researchers

They need a reflective simulation environment for testing governance frameworks, institutional adaptation, and ethical tradeoffs.

## 4. Product Principles

### 4.1 Reflective, Not Accusatory

Outputs must remain observations for governance review, not verdicts. The system observes institutional behaviour under pressure; it does not blame individual staff or evaluate a real hospital.

### 4.2 Operational Trust Is First-Class

Operational Trust becomes a tracked system variable. It represents the sustained ability of clinicians, patients, operators, and the institution to rely on the system under uncertainty, overload, drift, and imperfect information.

### 4.3 Human State Is Operationally Consequential

Fatigue, frustration, anxiety, burnout, cognitive load, trust, and escalation hesitancy must influence the simulation rather than appear only as narrative after the fact.

### 4.4 Institutions Adapt

Repeated overload should change future behaviour. Workarounds may normalize, escalation chains may weaken, trust baselines may shift, and governance interventions may alter institutional memory.

### 4.5 Three-Layer UX Model

Every major screen should answer:

- Operational: What is happening?
- Interpretive: Why is it happening?
- Reflective: What institutional pattern is emerging?

## 5. v2 Scope

### In Scope

- live institutional operations map
- animated patient and workflow flow
- operational trust metric and trend
- human-state variables for patients and staff
- governance stability indicators
- reflective awareness feed
- event replay and causal trace improvements
- ethical debt and drift visualization
- scenario sandbox foundation

### Out of Scope

- real clinical prediction
- real patient data ingestion
- EHR integration
- hospital ERP features
- chatbot-based decision support
- claims of clinical accuracy
- ranking hospitals
- accreditation or compliance certification

## 6. Current v1 Baseline

The existing Vercel app provides:

- Screen 1: Configure and Run
- Screen 2: Results Dashboard
- Screen 3: Decision Inspector
- Python engine wrapper with mock route for local testing
- five separate performance metrics
- moral reckoning outputs
- event log replay data
- PyGuLP panel support

v2 should preserve all v1 non-negotiables:

- never collapse five metrics into one score
- preserve all moral reckoning priorities
- preserve refusal visibility
- preserve deterministic replay
- preserve ontological boundaries
- keep UI as an interpreter, not a business-logic layer

## 7. New Core System Layers

### 7.1 Operational State Layer

Tracks mechanical institutional state:

- patient inflow
- triage state
- queue length
- wait time
- room occupancy
- staffing pressure
- throughput
- escalation events
- delay propagation

Outputs:

- congestion
- overload indicators
- bottleneck formation
- service degradation

### 7.2 Human State Layer

Tracks emotional and cognitive operational degradation.

Patient variables:

- frustration
- trust
- anxiety
- abandonment risk
- escalation likelihood

Staff variables:

- fatigue
- burnout
- cognitive load
- procedural compliance
- override tendency

Expected behaviours:

- bypass workflows
- delayed response
- reduced care quality
- conflict emergence
- complaint generation

### 7.3 Governance Layer

Tracks institutional coordination and ethical governance.

Variables:

- policy adherence
- escalation logic
- overrides
- governance interventions
- ethical debt
- fairness drift
- triage transparency
- accountability traces

Governance event types:

- administrator override
- AI recommendation conflict
- emergency policy activation
- staffing redistribution
- fairness intervention
- overload response

### 7.4 Reflective Layer

Surfaces hidden institutional dynamics:

- hidden strain reports
- ethical drift maps
- operational trust trends
- escalation congestion
- normalized dysfunction alerts
- governance instability indicators

## 8. Screen Requirements

### 8.1 Screen 1: Live Institutional Operations Map

Purpose:

Provide real-time situational awareness of flow, overload, strain, and operational coordination.

Required layout:

- left panel: institutional zones
- center canvas: live flow simulation
- right panel: reflective awareness feed
- bottom layer: timeline controls

Institutional zones:

- ER
- OPD
- ICU
- Triage
- Imaging
- Billing
- Pharmacy
- Waiting Areas
- Staff Stations

Each zone should display:

- occupancy
- strain intensity
- wait escalation
- trust instability
- overload propagation

Center simulation should show:

- patient movement
- queue propagation
- staff movement
- escalation events
- overload diffusion
- bottleneck formation

Visual behaviours:

- congestion thickens pathways
- overload creates heat gradients
- ethical debt stains affected areas over time
- trust instability creates subtle flicker or volatility overlays

### 8.2 Screen 2: Governance Console

Purpose:

Provide governance visibility, intervention capability, and ethical systems oversight.

Header indicators:

- Operational Trust
- Ethical Debt
- Governance Stability
- Fairness Drift
- Escalation Congestion
- Institutional Strain Index

Policy layer panel:

- active triage protocols
- overload procedures
- AI escalation thresholds
- fairness safeguards
- staffing policies
- emergency mode logic

Governance intervention layer:

- activate emergency staffing
- redistribute queues
- override AI decisions
- activate fairness correction
- slow throughput optimization
- trigger escalation review

Each intervention must produce:

- operational consequence
- trust impact
- ethical debt change
- downstream adaptation

### 8.3 Screen 3: Reflective Insights Panel

Purpose:

Surface hidden institutional patterns that are invisible in standard analytics.

Insight clusters:

- overload dynamics
- hidden inequities
- trust fragmentation
- governance instability
- burnout propagation
- ethical debt accumulation

Institutional narrative engine:

The system should synthesize operational events, governance changes, human-state degradation, and historical drift into reflective institutional interpretation.

Example output:

> Throughput improved during overload, but repeated queue displacement increased fairness drift and trust fragmentation in delayed-care cohorts.

### 8.4 Screen 4: Event Replay and Causal Trace

Purpose:

Explainability and auditability.

Displays:

- timeline reconstruction
- decision chains
- policy interactions
- escalation history
- cascading consequences
- governance explanations

### 8.5 Screen 5: Scenario Sandbox

Purpose:

Governance stress testing.

Allows users to modify:

- staffing levels
- policy thresholds
- triage logic
- AI deployment assumptions
- overload events
- emergency scenarios

Outputs:

- operational consequences
- trust impact
- ethical debt changes
- drift comparison
- resilience indicators

## 9. First Upgrade Slice

The first v2 implementation should be small enough to ship safely on top of the current Vercel app.

Recommended first slice:

1. Add `HospitalFloor.tsx`
   - animated SVG floor plan
   - triage, waiting, treatment zones
   - patient tokens by urgency
   - room occupancy indicators
   - ethical event rings
   - tick counter
   - pause/play and speed controls

2. Embed `HospitalFloor` on Screen 2
   - full-width panel above metric cards
   - collapsible for governance reviewers who want data-only mode
   - driven only from `event_log` in `sessionStorage`

3. Add visual trust and strain primitives
   - no new API calls
   - infer from existing events where possible
   - degrade gracefully when event payloads are sparse

This slice gives the product a visible v2 direction without destabilizing the core engine before deploy.

## 10. Data Requirements

### Existing Event Data

The v2 visual layer should initially consume only:

- event type
- timestamp
- payload.patient_id
- payload.triage
- payload.room_type or payload.room_name
- payload.wait_time
- payload.severity
- payload.ethical_flag
- payload.harm_type
- payload.refusal_reason

All fields must be optional at the UI boundary.

### Future Engine Additions

Future simulation events should include:

- patient trust
- patient frustration
- staff fatigue
- staff cognitive load
- zone strain
- governance stability
- escalation congestion
- policy drift
- intervention impact

## 11. Interaction Requirements

### Live Map Controls

Required:

- pause/play
- speed selector: 1x, 2x, 4x
- tick counter
- replay from start
- graceful empty state

Optional later:

- scrubber
- zone hover details
- patient causal trace
- drift overlay toggle
- trust overlay toggle

### Reflective Feed

Insights should be calm, specific, and non-accusatory.

Preferred language:

- "A gap was detected..."
- "Trust appears to be degrading..."
- "Escalation reliability is weakening..."
- "This signal is useful for governance review..."

Avoid:

- "failure"
- "violation" as a headline
- "the hospital caused..."
- "staff failed..."
- single composite grades

## 12. Visual Design Requirements

The interface should feel:

- calm under pressure
- operationally intelligent
- institutionally trustworthy
- serious but breathable
- systems-native

Avoid:

- cyberpunk visuals
- neon AI motifs
- military command center aesthetics
- generic hospital dashboards
- cluttered enterprise analytics

Palette direction:

- warm white or soft gray surfaces
- deep slate operational panels
- muted blue governance layer
- amber overload indicators
- soft red ethical instability
- muted green recovery states

## 13. Success Criteria

The v2 upgrade succeeds if a reviewer can say:

- I can see the institution straining in real time.
- I understand how operational pressure changes governance outcomes.
- I can distinguish operational events from reflective interpretation.
- I can see trust, strain, and ethical debt as system dynamics, not static scores.
- The system feels serious enough for governance conversations, not like a toy simulator.

## 14. Risks

### Risk: Visual Simulation Feels Like a Game

Mitigation:

- restrained motion
- institutional labels
- calm colors
- no decorative spectacle
- clear governance framing

### Risk: Reflection Becomes Accusation

Mitigation:

- use observation language
- avoid blame assignment
- include structural pressure framing

### Risk: UI Recreates Business Logic

Mitigation:

- visual layer may infer display state only
- scoring and moral reckoning remain server-side
- future human-state variables should come from the engine

### Risk: v2 Scope Bloats Before Deploy

Mitigation:

- ship first upgrade slice only
- defer human-state engine changes
- defer scenario sandbox
- defer institutional adaptation model

## 15. Roadmap

### Pre-Deploy Upgrade

- Add animated `HospitalFloor` visual layer
- Embed on results screen as collapsible panel
- Use existing event log only
- Keep Python engine untouched

### Post-Deploy v2 Foundation

- Add operational trust as a computed engine output
- Add human-state variables to patient and staff models
- Add real zone strain and overload events
- Improve causal trace model
- Add reflective feed generation

### Future Roadmap

- adaptive institutional learning engine
- AI-agent governance layer
- multi-hospital coordination simulation
- scenario sandbox
- governance intervention simulation
- trust topology visualizations
- institutional narrative engine

## 16. Open Questions

- Should Operational Trust be computed as one metric or a vector across patient, staff, and institutional trust?
- Should human-state dynamics influence queue behaviour immediately, or first appear only as derived reporting?
- How should interventions be represented: purely simulated, or user-triggered during replay?
- Should v2 shift the visual design from current dark slate to the warmer "serious but breathable" palette?
- What is the minimum credible scenario sandbox for a live stakeholder demo?
