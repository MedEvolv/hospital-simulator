# Quick Start Guide - Living Hospital Simulator

## 🚀 Get Running in 60 Seconds

### Step 1: Install Dependencies
```bash
pip install streamlit pandas --break-system-packages
```

### Step 2: Run the Simulator
```bash
streamlit run hospital_orchestration_simulator.py
```

### Step 3: Access in Browser
Open the URL shown in terminal (typically `http://localhost:8501`)

---

## 🎮 First Simulation

### Recommended Settings for First Run:
1. **Hospital Profile:** Balanced
2. **Data Source:** Built-in Test Dataset (25 patients)
3. Click **"🚀 Start Simulation"**

### Understanding the Interface:

**Left Sidebar** = Controls
- Hospital profile selection
- Data source options  
- Time controls (play/pause/step)

**Main View** = Living Hospital Map
- 🚪 **Arrival Gate** - New patients appear here
- ⏳ **Waiting Area** - Three colored queue lanes (RED/YELLOW/BLUE)
- 🏥 **Rooms** - Treatment areas with capacity meters

**Bottom Tabs**:
- 💬 **Social Layer** - Patient/staff chat bubbles
- 📋 **Event Log** - Complete audit trail
- 📊 **Live Metrics** - Real-time performance
- 🧠 **Agent Actions** - System decisions with reasoning

---

## ⏯️ Time Controls

**While simulation is running:**

| Button | Action | Use Case |
|--------|--------|----------|
| ▶️ Run | Continuous play | See overall flow |
| ⏸️ Pause | Freeze state | Inspect current situation |
| ⏭️ Step (5s) | Advance one tick | Examine decisions carefully |
| ⏭️⏭️ Jump (30s) | Fast forward | Skip quiet periods |
| 🔄 Reset | Start over | Try different settings |

**Pro tip:** Use **Pause + Step** to understand exactly how the agent loop works.

---

## 🎯 What to Look For

### Safety Signals
- 🔴 RED patients always go first (irrevocable rule)
- ⚠️ Warnings when emergency rooms are full
- 🚨 System alerts for unsafe clustering

### Fairness Indicators
- 💬 Patient complaints in chat when deprioritized
- 👨‍⚕️ Staff explanations about urgency-based ordering
- 📊 Wait time tracking by urgency level

### Stress Visualization
- Room capacity meters turning red
- Queue lengths growing
- Multiple escalation recommendations

---

## 📊 After Simulation Completes

1. Click **"📊 Generate Post-Run Evaluation Report"**
2. Review three key scores:
   - **IES** (Institutional Efficacy) - Overall performance
   - **PSS** (Patient Satisfaction) - Fairness perception
   - **SSS** (Staff Satisfaction) - Workload burden

3. Export data:
   - Event log (JSON) - Complete audit trail
   - Report (JSON) - Score breakdown

---

## 🧪 Experiment Ideas

### Scenario 1: Stress Test
- Profile: Government Hospital (limited resources)
- Data: Built-in Test (has 3 RED arrivals)
- Watch: How system handles RED clustering

### Scenario 2: Smooth Operations  
- Profile: Private Hospital (more capacity)
- Data: Random Generation
- Watch: Lower stress, fewer escalations

### Scenario 3: Custom Scenario
- Profile: Balanced
- Data: Upload `sample_patient_dataset.csv` (included)
- Modify CSV to create specific situations

---

## 🎓 Learning Exercises

### Exercise 1: Irrevocable RED Rule
1. Run simulation with Built-in Test
2. Watch Patient #1 (arrives at 0s with chest pain)
3. Observe: Immediate RED classification
4. Note: Patient #1 stays RED even if others arrive

### Exercise 2: Queue Reordering
1. Pause simulation when multiple patients waiting
2. Look at queue lanes (RED/YELLOW/BLUE)
3. Step through triage assignments
4. Watch patients move between lanes
5. Check chat for patient reactions

### Exercise 3: Capacity Constraints
1. Run with Government profile
2. Pause when emergency rooms show "FULL"
3. Look for escalation recommendations
4. Note: System suggests, never auto-executes

---

## 💡 Key Insights to Discover

### The Agent Loop Never Cheats
Every tick executes: PERCEIVE → CLASSIFY → ORDER → CHECK → SURFACE → LOG

No shortcuts, no optimization, no ML predictions.

### Human Authority is Sacred
System recommends:
- ✅ External referral
- ✅ Room morphing
- ✅ Capacity increase

But NEVER executes without human approval.

### Metrics Don't Lie
- Low scores = tensions made visible
- High scores = smooth operations
- Middle scores = realistic trade-offs

**Not about being "good" or "bad" - about seeing clearly.**

---

## 🐛 Common Questions

**Q: Why do patients jump the queue?**
A: Urgency-based triage. RED always goes first. Check event log for reasoning.

**Q: Why are some rooms empty while patients wait?**
A: Room types matter. RED → Emergency only. YELLOW/BLUE → OPD/Preventive.

**Q: Why don't I see many chat bubbles?**
A: Bubbles are probabilistic and event-driven. More stress = more chat.

**Q: Can I speed up simulation?**
A: Use "Jump 30s" button or run without pausing for faster execution.

**Q: What does "governance-safe" mean?**
A: No black boxes. Every decision logged. Human authority preserved.

---

## 🎬 Demo Flow (For Presentations)

1. **Start paused** - Show empty hospital
2. **Explain zones** - Arrival, Waiting, Rooms
3. **Run simulation** - Let queues build
4. **Pause at tension** - RED clustering visible
5. **Show escalation** - System recommendations appear
6. **Resume** - Watch resolution
7. **Generate report** - Show score breakdown
8. **Export data** - Demonstrate auditability

---

## 📚 Next Steps

- Read full **README.md** for detailed documentation
- Examine **event log** to understand decision flow
- Try different **hospital profiles** to see constraints
- Create **custom CSV scenarios** for specific situations
- Review **post-run reports** to analyze trade-offs

---

## 🚨 Remember

> "If a decision cannot be explained in one sentence to a tired nurse at 2 a.m., it does not belong in this system."

This isn't a game. It's a **cognitive scaffold** for understanding operational healthcare under constraint.

Enjoy exploring! 🏥
