"""
Living Hospital Orchestration Simulator - Complete Integrated UI
Event-Sourced Architecture with Governance Review Mode

ARCHITECTURE:
┌─────────────────────────────────────┐
│  This UI Layer (Streamlit)          │
│  - Visualization only                │
│  - Reads from playback controller   │
│  - Never mutates simulation          │
└──────────────┬──────────────────────┘
               │ reads snapshots
               ▼
┌─────────────────────────────────────┐
│  Playback Layer                      │
│  - EventPlaybackController           │
│  - Pure reducers                     │
└──────────────┬──────────────────────┘
               │ consumes events
               ▼
┌─────────────────────────────────────┐
│  Simulation Layer                    │
│  - Event log (source of truth)      │
└─────────────────────────────────────┘

CRITICAL DISCLAIMER (Persistent):
This system simulates institutional decision-making under operational stress.
It does not diagnose, prescribe, or replace clinical judgment.
"""

import streamlit as st
import json
from datetime import datetime
from typing import Optional, Dict, List
import pandas as pd

# Import our engines
from event_sourced_engine import (
    EventSourcedSimulationEngine, SimulationRun, InstitutionalParameters,
    PatientStatus, ReplayEngine
)
from playback_engine import (
    EventPlaybackController, StateSnapshot, PlaybackSpeed,
    MultiRunComparison
)
from scoring_engine import ScoringEngine, ScoringResult

# Import visual simulation
from visual_hospital import render_visual_simulation

# Import TrueMemory client
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'engine')))
try:
    from truememory_client import fetch_vault_facts
except ImportError:
    def fetch_vault_facts(): return []

# ============================================================================
# GLOBAL CONFIGURATION
# ============================================================================

# Institutional Profiles (Part 4)
PROFILES = {
    "Govt": {
        "name": "Overburdened Government Hospital",
        "description": "High safety priority, limited resources, longer waits",
        "params": InstitutionalParameters(
            safety_weight=0.55,
            experience_weight=0.20,
            staff_weight=0.15,
            throughput_weight=0.10,
            room_intake_modifier=0.8,
            red_clustering_threshold=2,
            max_wait_yellow=240
        )
    },
    "Private": {
        "name": "Elite Private Hospital",
        "description": "High experience priority, more resources, smooth flow",
        "params": InstitutionalParameters(
            safety_weight=0.40,
            experience_weight=0.40,
            staff_weight=0.10,
            throughput_weight=0.10,
            room_intake_modifier=1.3,
            red_clustering_threshold=4,
            max_wait_yellow=120
        )
    },
    "Balanced": {
        "name": "Balanced / Eka-Ideal Hospital",
        "description": "Safety first, transparent, balanced trade-offs",
        "params": InstitutionalParameters(
            safety_weight=0.45,
            experience_weight=0.30,
            staff_weight=0.15,
            throughput_weight=0.10,
            room_intake_modifier=1.0,
            red_clustering_threshold=3,
            max_wait_yellow=180
        )
    }
}

# ============================================================================
# UI HELPER FUNCTIONS
# ============================================================================

def render_patient_token(patient, current_time: int) -> str:
    """Render patient token with urgency color."""
    color_map = {
        "RED": "🔴",
        "YELLOW": "🟡",
        "BLUE": "🔵",
        "NOT_RED": "⚪"
    }
    
    triage = patient.triage_stage_2 or patient.triage_stage_1 or "NOT_RED"
    emoji = color_map.get(triage, "⚪")
    
    # Show wait time
    wait_time = current_time - patient.arrival_time
    
    return f"{emoji} P#{patient.id} ({wait_time}s)"

def render_room_status(room) -> str:
    """Render room with capacity visualization."""
    utilization = (room.current_load / room.capacity_per_minute * 100) if room.capacity_per_minute > 0 else 0
    
    if utilization >= 100:
        color = "🔴"
        status = "FULL"
    elif utilization >= 80:
        color = "🟡"
        status = "High"
    else:
        color = "🟢"
        status = "Available"
    
    return f"{color} {room.name}: {room.current_load}/{room.capacity_per_minute} ({status})"

def render_event_details(event):
    """Render event details in expandable format."""
    event_emojis = {
        "PATIENT_ARRIVAL": "🚶",
        "TRIAGE_STAGE_1_ASSIGNED": "🏷️",
        "TRIAGE_STAGE_2_ASSIGNED": "🔬",
        "QUEUE_REORDER": "🔄",
        "ESCALATION_SUGGESTED": "⚠️",
        "PATIENT_ADMITTED": "✅",
        "AGENT_ACTION": "🤖",
        "METRIC_UPDATE": "📊"
    }
    
    emoji = event_emojis.get(event.event_type, "📌")
    title = f"{emoji} [{event.timestamp}s] {event.event_type}"
    
    with st.expander(title, expanded=False):
        payload = event.payload
        
        # Format key fields nicely
        if "patient_id" in payload:
            st.markdown(f"**Patient ID:** `{payload['patient_id']}`")
        
        if "triage" in payload:
            triage_emoji = {"RED": "🔴", "YELLOW": "🟡", "BLUE": "🔵", "NOT_RED": "⚪"}
            st.markdown(f"**Triage:** {triage_emoji.get(payload['triage'], '❓')} {payload['triage']}")
        
        if "wait_time" in payload:
            st.markdown(f"**Wait Time:** {payload['wait_time']}s")
        
        if "room" in payload:
            st.markdown(f"**Room:** {payload['room']}")
        
        if "action" in payload:
            st.markdown(f"**Action:** `{payload['action']}`")
        
        if "rules_triggered" in payload:
            st.markdown("**Rules Triggered:**")
            for rule in payload["rules_triggered"]:
                st.markdown(f"  • `{rule}`")
        
        if "recommendations" in payload:
            st.markdown("**Recommendations:**")
            for rec in payload["recommendations"]:
                st.markdown(f"  • {rec}")
        
        # Show raw JSON for remaining fields
        remaining = {k: v for k, v in payload.items() 
                    if k not in ["patient_id", "triage", "wait_time", "room", "action", "rules_triggered", "recommendations"]}
        
        if remaining:
            with st.expander("📋 Additional Details", expanded=False):
                st.json(remaining)

def render_decision_inspector(event, run: SimulationRun):
    """Render decision inspector panel for AGENT_ACTION events."""
    if event.event_type != "AGENT_ACTION":
        return
    
    st.markdown("### 🔍 Decision Inspector")
    st.caption("*Structured explainability - deterministic, machine-readable*")
    
    payload = event.payload
    
    # Action
    st.markdown(f"**Action:** `{payload.get('action', 'N/A')}`")
    st.markdown(f"**Timestamp:** {event.timestamp}s")
    
    st.markdown("---")
    
    # Rules Triggered
    st.markdown("**⚖️ Rules Triggered**")
    for rule in payload.get("rules_triggered", []):
        st.text(f"  ✓ {rule}")
    
    st.markdown("---")
    
    # Policy Context
    st.markdown("**🏛️ Policy Context**")
    policy = payload.get("policy_context", {})
    for key, value in policy.items():
        st.text(f"  • {key}: {value}")
    
    st.markdown("---")
    
    # Human Override
    if payload.get("human_override_allowed", True):
        st.success("✅ **Human Override:** Allowed - Recommendation requires approval")
    else:
        st.info("ℹ️ **Human Override:** N/A - Automated safety response")

# ============================================================================
# MAIN APPLICATION
# ============================================================================

def main():
    st.set_page_config(
        page_title="Living Hospital Orchestration Simulator",
        page_icon="🏥",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Custom CSS
    st.markdown("""
    <style>
    .stApp {background-color: #fafafa;}
    .metric-card {
        background-color: white;
        padding: 15px;
        border-radius: 5px;
        border: 1px solid #e0e0e0;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Header with persistent disclaimer
    st.title("🏥 Living Hospital Orchestration Simulator")
    st.markdown("**Event-Sourced Architecture with Governance Review Mode**")
    
    st.error("""
    ⚠️ **CRITICAL DISCLAIMER (Persistent):**  
    This system simulates institutional decision-making under operational stress.  
    It does **NOT** diagnose, prescribe, or replace clinical judgment.
    """)
    
    st.markdown("---")
    
    # Initialize session state
    if 'mode' not in st.session_state:
        st.session_state.mode = "simulation"  # "simulation" | "governance_review"
    
    if 'runs' not in st.session_state:
        st.session_state.runs = {}  # run_id -> SimulationRun
    
    if 'active_run_id' not in st.session_state:
        st.session_state.active_run_id = None
    
    if 'playback_controller' not in st.session_state:
        st.session_state.playback_controller = None
    
    if 'playing' not in st.session_state:
        st.session_state.playing = False
    
    if 'playback_speed' not in st.session_state:
        st.session_state.playback_speed = PlaybackSpeed.NORMAL
    
    # ========================================================================
    # SIDEBAR
    # ========================================================================
    
    with st.sidebar:
        st.header("⚙️ Control Panel")
        
        # Mode selector
        mode = st.radio(
            "🎯 Mode",
            ["Simulation Mode", "Governance Review Mode"],
            index=0 if st.session_state.mode == "simulation" else 1,
            help="Simulation: Create and run simulations\nGovernance: Review and analyze completed runs"
        )
        st.session_state.mode = "simulation" if mode == "Simulation Mode" else "governance_review"
        
        st.markdown("---")
        
        # ====================================================================
        # SIMULATION MODE CONTROLS
        # ====================================================================
        
        if st.session_state.mode == "simulation":
            st.subheader("🚀 Create New Run")
            
            # Profile selection
            profile_key = st.selectbox(
                "Hospital Profile",
                list(PROFILES.keys()),
                format_func=lambda x: PROFILES[x]["name"],
                help="Pre-configured parameter sets for different hospital types"
            )
            
            profile_info = PROFILES[profile_key]
            st.info(profile_info["description"])
            
            # Show profile parameters
            with st.expander("📊 Profile Parameters", expanded=False):
                params = profile_info["params"]
                
                st.markdown("**⏱️ Wait Time Thresholds**")
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.metric("🔴 RED Max Wait", f"{params.max_wait_red}s")
                with col2:
                    st.metric("🟡 YELLOW Max Wait", f"{params.max_wait_yellow}s")
                with col3:
                    st.metric("🔵 BLUE Max Wait", f"{params.max_wait_blue}s")
                
                st.markdown("---")
                st.markdown("**⚖️ Scoring Weights**")
                col1, col2, col3, col4 = st.columns(4)
                with col1:
                    st.metric("Safety", f"{params.safety_weight:.2f}")
                with col2:
                    st.metric("Experience", f"{params.experience_weight:.2f}")
                with col3:
                    st.metric("Staff", f"{params.staff_weight:.2f}")
                with col4:
                    st.metric("Throughput", f"{params.throughput_weight:.2f}")
                
                weight_sum = params.safety_weight + params.experience_weight + params.staff_weight + params.throughput_weight
                if abs(weight_sum - 1.0) < 0.01:
                    st.success(f"✅ Weights sum to {weight_sum:.2f}")
                else:
                    st.error(f"⚠️ Weights sum to {weight_sum:.2f} (should be 1.0)")
                
                st.markdown("---")
                st.markdown("**🏥 Capacity & Flow**")
                col1, col2 = st.columns(2)
                with col1:
                    st.metric("Room Intake Modifier", f"{params.room_intake_modifier:.1f}×")
                    st.metric("Escalation Sensitivity", f"{params.escalation_sensitivity:.1f}×")
                with col2:
                    st.metric("RED Clustering Threshold", params.red_clustering_threshold)
                    st.metric("Queue Pressure Threshold", params.queue_pressure_threshold)
            
            # Advanced tuning
            with st.expander("🔧 Advanced Parameter Tuning", expanded=False):
                st.warning("⚠️ Changing parameters creates a NEW simulation run")
                
                custom_params = InstitutionalParameters()
                
                st.markdown("**Scoring Weights** (must sum to 1.0)")
                col1, col2 = st.columns(2)
                with col1:
                    safety_w = st.slider("Safety", 0.0, 1.0, profile_info["params"].safety_weight, 0.05)
                    experience_w = st.slider("Experience", 0.0, 1.0, profile_info["params"].experience_weight, 0.05)
                with col2:
                    staff_w = st.slider("Staff", 0.0, 1.0, profile_info["params"].staff_weight, 0.05)
                    throughput_w = st.slider("Throughput", 0.0, 1.0, profile_info["params"].throughput_weight, 0.05)
                
                weight_sum = safety_w + experience_w + staff_w + throughput_w
                if abs(weight_sum - 1.0) > 0.01:
                    st.error(f"⚠️ Weights must sum to 1.0 (current: {weight_sum:.2f})")
                else:
                    custom_params.safety_weight = safety_w
                    custom_params.experience_weight = experience_w
                    custom_params.staff_weight = staff_w
                    custom_params.throughput_weight = throughput_w
                
                st.markdown("**Thresholds**")
                custom_params.red_clustering_threshold = st.number_input(
                    "RED Clustering Threshold", 1, 10, 
                    profile_info["params"].red_clustering_threshold
                )
                custom_params.queue_pressure_threshold = st.number_input(
                    "Queue Pressure Threshold", 5, 50,
                    profile_info["params"].queue_pressure_threshold
                )
                
                use_custom = st.checkbox("Use Custom Parameters")
                if use_custom and abs(weight_sum - 1.0) < 0.01:
                    profile_info["params"] = custom_params
            
            # Seed for determinism
            seed = st.number_input("Random Seed", 1, 1000, 42, 
                                  help="Same seed produces identical results")
            
            # Start simulation button
            if st.button("🚀 Start New Simulation Run", type="primary", use_container_width=True):
                with st.spinner("Creating simulation run..."):
                    # Create engine
                    engine = EventSourcedSimulationEngine(
                        institutional_profile=profile_key,
                        parameters=profile_info["params"],
                        seed=seed
                    )
                    
                    # Run simulation
                    run = engine.run_simulation()
                    
                    # Store run
                    st.session_state.runs[run.run_id] = run
                    st.session_state.active_run_id = run.run_id
                    
                    # Create playback controller
                    st.session_state.playback_controller = EventPlaybackController(run)
                    st.session_state.playing = False
                    
                    st.success(f"✅ Run created: {run.run_id[:8]}...")
                    st.rerun()
            
            # Playback controls (if run active)
            if st.session_state.active_run_id and st.session_state.playback_controller:
                st.markdown("---")
                st.subheader("🎬 Playback Controls")
                
                controller = st.session_state.playback_controller
                
                # Play/Pause
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("▶️ Play" if not st.session_state.playing else "⏸️ Pause", 
                                use_container_width=True):
                        st.session_state.playing = not st.session_state.playing
                        st.rerun()
                
                with col2:
                    if st.button("🔄 Reset", use_container_width=True):
                        controller.scrub_to_time(0)
                        st.session_state.playing = False
                        st.rerun()
                
                # Step controls
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("⏭️ Step +5s", use_container_width=True):
                        controller.step_forward(1)
                        st.rerun()
                
                with col2:
                    if st.button("⏭️⏭️ Jump +30s", use_container_width=True):
                        controller.step_forward(6)
                        st.rerun()
                
                # Speed control
                speed = st.select_slider(
                    "⏩ Speed",
                    options=["0.5×", "1×", "2×", "4×"],
                    value="1×"
                )
                st.session_state.playback_speed = {
                    "0.5×": PlaybackSpeed.SLOW,
                    "1×": PlaybackSpeed.NORMAL,
                    "2×": PlaybackSpeed.FAST,
                    "4×": PlaybackSpeed.FASTER
                }[speed]
                
                # Timeline scrubber
                max_time = controller.get_max_time()
                current_time = controller.current_time
                
                # Only show scrubber if simulation has run (max_time > 0)
                if max_time > 0:
                    scrub_time = st.slider(
                        "⏱️ Timeline Scrubber",
                        0, max_time, current_time,
                        help="Scrub to any point in time (replays events, does not re-simulate)"
                    )
                    
                    if scrub_time != current_time:
                        controller.scrub_to_time(scrub_time)
                        st.rerun()
                else:
                    st.info("⏱️ Timeline scrubber will appear once simulation runs")
        
        # ====================================================================
        # GOVERNANCE REVIEW MODE CONTROLS
        # ====================================================================
        
        else:  # governance_review mode
            st.subheader("🔍 Governance Review")
            st.info("Read-only mode for ethics review, audit, and comparison")
            
            # Run selector
            if st.session_state.runs:
                run_ids = list(st.session_state.runs.keys())
                selected_run = st.selectbox(
                    "Select Run to Review",
                    run_ids,
                    format_func=lambda x: f"{x[:8]}... ({st.session_state.runs[x].institutional_profile})"
                )
                
                st.session_state.active_run_id = selected_run
                
                if st.session_state.playback_controller is None or \
                   st.session_state.playback_controller.run.run_id != selected_run:
                    st.session_state.playback_controller = EventPlaybackController(
                        st.session_state.runs[selected_run]
                    )
                
                # Timeline scrubber (read-only)
                controller = st.session_state.playback_controller
                max_time = controller.get_max_time()
                
                # Only show scrubber if events exist
                if max_time > 0:
                    review_time = st.slider(
                        "⏱️ Review Timeline",
                        0, max_time, 0,
                        help="Navigate to any point for review"
                    )
                    
                    controller.scrub_to_time(review_time)
                else:
                    st.info("⏱️ No events to review in this run")
                
                # Comparison mode
                st.markdown("---")
                st.subheader("📊 Compare Runs")
                
                if len(st.session_state.runs) >= 2:
                    compare_enabled = st.checkbox("Enable Comparison Mode")
                    
                    if compare_enabled:
                        other_runs = [rid for rid in run_ids if rid != selected_run]
                        compare_run = st.selectbox(
                            "Compare With",
                            other_runs,
                            format_func=lambda x: f"{x[:8]}... ({st.session_state.runs[x].institutional_profile})"
                        )
                        
                        st.session_state.compare_run_id = compare_run
                else:
                    st.info("Create multiple runs to enable comparison")
            else:
                st.warning("No runs available. Switch to Simulation Mode to create runs.")
        
        st.markdown("---")
        
        # Export
        if st.session_state.active_run_id:
            st.subheader("📥 Export")
            
            run = st.session_state.runs[st.session_state.active_run_id]
            
            # Event log
            event_log_json = json.dumps(run.to_dict(), indent=2)
            st.download_button(
                "📄 Download Event Log",
                event_log_json,
                f"run_{run.run_id[:8]}_events.json",
                "application/json",
                use_container_width=True
            )
            
            # Scoring report
            col1, col2 = st.columns(2)
            
            with col1:
                if st.button("📊 Compute Scores", use_container_width=True):
                    with st.spinner("Computing scores..."):
                        result = ScoringEngine.score_run(run)
                        st.session_state.scoring_result = result
                    st.success("✅ Scores computed!")
            
            with col2:
                if 'scoring_result' in st.session_state:
                    result = st.session_state.scoring_result
                    
                    # Create downloadable scoring report
                    scoring_report = {
                        "run_id": run.run_id,
                        "run_metadata": {
                            "institutional_profile": run.institutional_profile,
                            "start_time": run.start_time.isoformat(),
                            "seed": run.seed
                        },
                        "scores": {
                            "institutional_efficacy_score": result.institutional_efficacy_score,
                            "patient_safety_score": result.patient_safety_score,
                            "patient_experience_score": result.patient_experience_score,
                            "staff_stress_score": result.staff_stress_score,
                            "ethics_intervention_count": result.ethics_intervention_count,
                            "system_throughput_index": result.system_throughput_index
                        },
                        "interpretation": result.interpretation,
                        "parameters": run.parameters.to_dict()
                    }
                    
                    scoring_json = json.dumps(scoring_report, indent=2)
                    st.download_button(
                        "💾 Download Report JSON",
                        scoring_json,
                        f"run_{run.run_id[:8]}_scores.json",
                        "application/json",
                        use_container_width=True,
                        key="download_scoring_report"
                    )
                else:
                    st.info("Compute scores first")
            
            # Text report
            if 'scoring_result' in st.session_state:
                result = st.session_state.scoring_result
                
                # Create human-readable text report
                text_report = f"""INSTITUTIONAL EFFICACY SCORING REPORT
{'='*50}

Run ID: {run.run_id}
Profile: {run.institutional_profile}
Date: {run.start_time.isoformat()}
Seed: {run.seed}

{'='*50}
COMPOSITE SCORE
{'='*50}
Institutional Efficacy Score (IES): {result.institutional_efficacy_score:.1f}/100

{'='*50}
INDIVIDUAL METRICS
{'='*50}
Patient Safety Score (PSS):       {result.patient_safety_score:.1f}/100
Patient Experience Score (PES):   {result.patient_experience_score:.1f}/100
Staff Stress Score (SSS):         {result.staff_stress_score:.1f}/100
Ethics Intervention Count (EIC):  {result.ethics_intervention_count}
System Throughput Index (STI):    {result.system_throughput_index:.1f}/100

{'='*50}
INTERPRETATION
{'='*50}
{result.interpretation}

{'='*50}
PARAMETERS
{'='*50}
Safety Weight:           {run.parameters.safety_weight:.2f}
Experience Weight:       {run.parameters.experience_weight:.2f}
Staff Weight:            {run.parameters.staff_weight:.2f}
Throughput Weight:       {run.parameters.throughput_weight:.2f}

Max Wait RED:            {run.parameters.max_wait_red}s
Max Wait YELLOW:         {run.parameters.max_wait_yellow}s
Max Wait BLUE:           {run.parameters.max_wait_blue}s

Room Intake Modifier:    {run.parameters.room_intake_modifier:.1f}×
Escalation Sensitivity:  {run.parameters.escalation_sensitivity:.1f}×
RED Clustering Threshold: {run.parameters.red_clustering_threshold}
Queue Pressure Threshold: {run.parameters.queue_pressure_threshold}

{'='*50}
END OF REPORT
"""
                
                st.download_button(
                    "📄 Download Text Report",
                    text_report,
                    f"run_{run.run_id[:8]}_scores.txt",
                    "text/plain",
                    use_container_width=True
                )
    
    # ========================================================================
    # MAIN CONTENT AREA
    # ========================================================================
    
    if not st.session_state.active_run_id:
        # Welcome screen
        st.info("👈 Create a new simulation run or select a run to review")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("### 🎯 Simulation Mode")
            st.markdown("""
            Create and run simulations with different institutional profiles:
            - **Government Hospital** - High safety priority, limited resources
            - **Private Hospital** - High experience priority, more resources  
            - **Balanced/Eka-Ideal** - Optimal trade-offs, transparent
            
            Features:
            - ▶️ Play/Pause controls
            - ⏭️ Step through time
            - ⏱️ Scrub to any moment
            - 🔄 Reset and replay
            """)
        
        with col2:
            st.markdown("### 🔍 Governance Review Mode")
            st.markdown("""
            Review completed simulations for:
            - **Ethics Committee** - Decision audit trails
            - **Regulatory Compliance** - Full explainability
            - **Clinical Training** - Step-by-step analysis
            - **Administrative Planning** - Compare scenarios
            
            Features:
            - 📋 Event timeline inspection
            - 🔍 Decision inspector
            - 📊 Side-by-side comparison
            - 📥 Export for offline review
            """)
    
    else:
        # Active run visualization
        run = st.session_state.runs[st.session_state.active_run_id]
        controller = st.session_state.playback_controller
        snapshot = controller.get_current_snapshot()
        
        # Progress bar
        max_time = controller.get_max_time()
        progress = min(controller.current_time / max_time, 1.0) if max_time > 0 else 0
        st.progress(progress, text=f"Time: {controller.current_time}s / {max_time}s")
        
        # Top metrics
        col1, col2, col3, col4, col5 = st.columns(5)
        with col1:
            st.metric("⏱️ Time", f"{controller.current_time}s")
        with col2:
            st.metric("👥 Total", snapshot.total_patients)
        with col3:
            st.metric("✅ Admitted", snapshot.admitted_count)
        with col4:
            st.metric("⏳ Waiting", snapshot.waiting_count)
        with col5:
            st.metric("📋 Events", len(controller.event_log))
        
        st.markdown("---")
        
        # Main tabs
        if st.session_state.mode == "simulation":
            tabs = st.tabs(["🎮 Visual Sim", "🏥 Live View", "📋 Events", "💬 Chat", "🏠 Rooms", "📊 Metrics", "🧠 TrueMemory"])
        else:
            tabs = st.tabs(["🔍 Inspector", "📋 Event Log", "⚖️ Decisions", "📊 Scoring", "🔀 Compare", "🧠 TrueMemory"])
        
        # ====================================================================
        # SIMULATION MODE TABS
        # ====================================================================
        
        if st.session_state.mode == "simulation":
            # Visual Simulation (NEW)
            with tabs[0]:
                st.subheader("🎮 Animated Hospital Workflow")
                st.caption("Watch patients flow through: Arrival → History → ABDM Check → Triage → Queue → Room")
                
                render_visual_simulation(controller)
                
                st.markdown("---")
                st.info("**How to interpret:**\n"
                       "- 🚪 Patients enter at ENTRANCE\n"
                       "- 📋 History is taken at HISTORY desk\n"
                       "- 🔗 ABDM records checked and reconciled\n"
                       "- 🔬 TRIAGE classifies urgency\n"
                       "- Patients queue by color (🔴 RED / 🟡 YELLOW / 🔵 BLUE)\n"
                       "- 🏥 Admitted to treatment rooms\n"
                       "- Hover over tokens for details")
            
            # Live View
            with tabs[1]:
                st.subheader("Hospital Status")
                
                col1, col2 = st.columns([1, 2])
                
                with col1:
                    st.markdown("**🚪 Queue Status**")
                    
                    for color in ["RED", "YELLOW", "BLUE"]:
                        with st.expander(f"{color} Queue ({len(snapshot.queues[color])})", expanded=True):
                            if snapshot.queues[color]:
                                for pid in snapshot.queues[color][:5]:
                                    if pid in snapshot.patients:
                                        patient = snapshot.patients[pid]
                                        st.text(render_patient_token(patient, controller.current_time))
                                
                                if len(snapshot.queues[color]) > 5:
                                    st.caption(f"... +{len(snapshot.queues[color]) - 5} more")
                            else:
                                st.info("Empty")
                
                with col2:
                    st.markdown("**🏥 Room Status**")
                    
                    for room in snapshot.rooms:
                        st.text(render_room_status(room))
                        st.progress(
                            min(room.current_load / room.capacity_per_minute, 1.0) if room.capacity_per_minute > 0 else 0
                        )
            
            # Events
            with tabs[2]:
                st.subheader("Recent Events")
                
                recent_events = controller.get_events_at_time(controller.current_time)
                
                if recent_events:
                    for event in recent_events:
                        render_event_details(event)
                else:
                    st.info("No events at this timestamp")
            
            # Chat
            with tabs[3]:
                st.subheader("Social Layer - Chat Bubbles")
                st.caption("Effects only, never causes. Reflects system state.")
                
                if snapshot.chat_bubbles:
                    for bubble in snapshot.chat_bubbles[-10:]:
                        with st.chat_message("human" if bubble.actor == "Patient" else "assistant"):
                            st.markdown(f"**{bubble.actor}** [{bubble.timestamp}s]")
                            st.markdown(bubble.message)
                            st.caption(bubble.context)
                else:
                    st.info("No chat activity")
            
            # Rooms
            with tabs[4]:
                st.subheader("Room Utilization")
                
                for room in snapshot.rooms:
                    col1, col2 = st.columns([3, 1])
                    
                    with col1:
                        util = (room.current_load / room.capacity_per_minute * 100) if room.capacity_per_minute > 0 else 0
                        # Clamp progress to [0.0, 1.0] - rooms can exceed 100% capacity
                        progress_value = min(util / 100, 1.0)
                        st.progress(progress_value, text=f"{room.name} ({room.room_type}): {room.current_load}/{room.capacity_per_minute}")
                    
                    with col2:
                        st.metric("", f"{util:.0f}%")
            
            # Metrics
            with tabs[5]:
                st.subheader("Live Metrics")
                
                if snapshot.metrics:
                    st.json(snapshot.metrics)
                else:
                    st.info("No metrics available")
            
            # TrueMemory Vault
            with tabs[6]:
                st.subheader("🧠 TrueMemory Vault (Pluribus Read-Path)")
                st.caption("Facts retrieved persistently from the ArchLife Vault across all agents.")
                facts = fetch_vault_facts()
                if facts:
                    for f in facts:
                        origin = f.get('origin', 'Unknown')
                        content = f.get('content', '')
                        st.info(f"**[{origin}]** {content}")
                else:
                    st.warning("No facts found in TrueMemory Vault.")
        
        # ====================================================================
        # GOVERNANCE REVIEW MODE TABS
        # ====================================================================
        
        else:
            # Inspector
            with tabs[0]:
                st.subheader("🔍 Decision Inspector")
                st.markdown("Review any decision made by the system")
                
                # Filter events
                agent_actions = controller.get_events_by_type("AGENT_ACTION")
                
                if agent_actions:
                    selected_action = st.selectbox(
                        "Select Decision to Inspect",
                        range(len(agent_actions)),
                        format_func=lambda i: f"[{agent_actions[i].timestamp}s] {agent_actions[i].payload.get('action', 'N/A')}"
                    )
                    
                    render_decision_inspector(agent_actions[selected_action], run)
                else:
                    st.info("No agent actions recorded")
            
            # Event Log
            with tabs[1]:
                st.subheader("📋 Complete Event Log")
                st.markdown("Full audit trail - filter and search")
                
                # Filters
                col1, col2 = st.columns(2)
                with col1:
                    event_type_filter = st.multiselect(
                        "Filter by Event Type",
                        options=list(set(e.event_type for e in controller.event_log)),
                        default=[]
                    )
                
                with col2:
                    patient_id_filter = st.number_input(
                        "Filter by Patient ID (0 = all)",
                        0, 1000, 0
                    )
                
                # Display filtered events
                filtered_events = controller.event_log
                
                if event_type_filter:
                    filtered_events = [e for e in filtered_events if e.event_type in event_type_filter]
                
                if patient_id_filter > 0:
                    filtered_events = [e for e in filtered_events if e.payload.get("patient_id") == patient_id_filter]
                
                st.caption(f"Showing {len(filtered_events)} of {len(controller.event_log)} events")
                
                for event in filtered_events[-20:]:  # Show last 20
                    render_event_details(event)
            
            # Decisions
            with tabs[2]:
                st.subheader("⚖️ Ethical Decision Analysis")
                
                # Queue reorders
                reorders = controller.get_events_by_type("QUEUE_REORDER")
                st.metric("Queue Reorders", len(reorders))
                
                if reorders:
                    st.markdown("**Queue Reordering Events**")
                    for event in reorders:
                        with st.expander(f"[{event.timestamp}s] Queue Reordered", expanded=False):
                            st.json(event.payload)
                
                # Escalations
                escalations = controller.get_events_by_type("ESCALATION_SUGGESTED")
                st.metric("Governance Escalations", len(escalations))
                
                if escalations:
                    st.markdown("**Escalation Events**")
                    for event in escalations:
                        with st.expander(f"[{event.timestamp}s] Escalation", expanded=False):
                            st.json(event.payload)
            
            # Scoring
            with tabs[3]:
                st.subheader("📊 Institutional Efficacy Scoring")
                
                if st.button("🔄 Compute Scores", type="primary"):
                    with st.spinner("Computing institutional efficacy metrics..."):
                        result = ScoringEngine.score_run(run)
                        st.session_state.scoring_result = result
                
                if 'scoring_result' in st.session_state:
                    result = st.session_state.scoring_result
                    
                    # IES
                    st.metric("Institutional Efficacy Score (IES)", f"{result.institutional_efficacy_score:.1f}/100")
                    
                    # Individual metrics
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.metric("Patient Safety (PSS)", f"{result.patient_safety_score:.1f}/100")
                    with col2:
                        st.metric("Patient Experience (PES)", f"{result.patient_experience_score:.1f}/100")
                    with col3:
                        st.metric("Staff Stress (SSS)", f"{result.staff_stress_score:.1f}/100")
                    
                    col1, col2 = st.columns(2)
                    with col1:
                        st.metric("Ethics Interventions", result.ethics_intervention_count)
                    with col2:
                        st.metric("Throughput Index (STI)", f"{result.system_throughput_index:.1f}/100")
                    
                    # Interpretation
                    st.markdown("---")
                    st.markdown("**Interpretation**")
                    st.text(result.interpretation)
                else:
                    st.info("Click 'Compute Scores' to generate evaluation")
            
            # Compare
            with tabs[4]:
                st.subheader("🔀 Side-by-Side Run Comparison")
                
                if 'compare_run_id' in st.session_state and st.session_state.compare_run_id:
                    run2 = st.session_state.runs[st.session_state.compare_run_id]
                    
                    # Create comparison
                    comparison_engine = MultiRunComparison(run, run2)
                    
                    # Timeline comparison
                    max_time_1 = controller.get_max_time()
                    max_time_2 = EventPlaybackController(run2).get_max_time()
                    max_compare_time = min(max_time_1, max_time_2)
                    
                    if max_compare_time > 0:
                        compare_time = st.slider(
                            "Compare at Time",
                            0, max_compare_time,
                            0
                        )
                    else:
                        compare_time = 0
                        st.info("⏱️ No events to compare yet")
                    
                    result = comparison_engine.get_comparison_at_time(compare_time)
                    
                    # Display comparison
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        st.markdown(f"**Run 1: {result['run1']['profile']}**")
                        st.metric("Patients", result['run1']['patients'])
                        st.metric("Admitted", result['run1']['admitted'])
                        st.metric("Waiting", result['run1']['waiting'])
                    
                    with col2:
                        st.markdown(f"**Run 2: {result['run2']['profile']}**")
                        st.metric("Patients", result['run2']['patients'])
                        st.metric("Admitted", result['run2']['admitted'])
                        st.metric("Waiting", result['run2']['waiting'])
                    
                    # Scoring comparison
                    if st.button("📊 Compare Scores"):
                        with st.spinner("Computing..."):
                            scoring_comp = ScoringEngine.compare_runs(run, run2)
                            st.session_state.scoring_comparison = scoring_comp
                    
                    if 'scoring_comparison' in st.session_state:
                        comp = st.session_state.scoring_comparison
                        
                        st.markdown("---")
                        st.markdown("**Score Comparison**")
                        
                        col1, col2 = st.columns(2)
                        with col1:
                            st.markdown("**Run 1**")
                            st.metric("IES", f"{comp['run1']['ies']:.1f}/100")
                            st.metric("PSS", f"{comp['run1']['pss']:.1f}/100")
                            st.metric("PES", f"{comp['run1']['pes']:.1f}/100")
                        
                        with col2:
                            st.markdown("**Run 2**")
                            st.metric("IES", f"{comp['run2']['ies']:.1f}/100")
                            st.metric("PSS", f"{comp['run2']['pss']:.1f}/100")
                            st.metric("PES", f"{comp['run2']['pes']:.1f}/100")
                        
                        st.markdown("**Insights**")
                        for insight in comp['insights']:
                            st.info(f"💡 {insight}")
                else:
                    st.info("Enable comparison mode in sidebar to compare runs")
            
            # TrueMemory Vault
            with tabs[5]:
                st.subheader("🧠 TrueMemory Vault (Pluribus Read-Path)")
                st.caption("Facts retrieved persistently from the ArchLife Vault across all agents.")
                facts = fetch_vault_facts()
                if facts:
                    for f in facts:
                        origin = f.get('origin', 'Unknown')
                        content = f.get('content', '')
                        st.info(f"**[{origin}]** {content}")
                else:
                    st.warning("No facts found in TrueMemory Vault.")
        
        # Auto-advance if playing
        if st.session_state.mode == "simulation" and st.session_state.playing:
            if not controller.is_at_end():
                controller.step_forward(1)
                import time
                time.sleep(0.2 / st.session_state.playback_speed.value)
                st.rerun()
            else:
                st.session_state.playing = False
                st.success("✅ Simulation playback complete!")

if __name__ == "__main__":
    main()
