# Deep Research Prompt: Clinical Protocols & Technical Foundations

**Purpose:** Ground our institutional truth-telling system in real-world clinical protocols and identify technical tools to enhance capabilities  
**Timeline:** 4-6 weeks of focused research  
**Outcome:** Protocol integration roadmap + technical enhancement plan

---

## Part 1: Research Philosophy

### What We're Looking For

**Clinical Protocols:**
- ✅ Protocols that define **decision rules** (what triggers action)
- ✅ Protocols with **ethical tensions** built in (trade-offs)
- ✅ Protocols with **capacity constraints** (resource allocation)
- ✅ Protocols that **surface institutional values** (fairness, safety, efficiency)

**Technical Tools:**
- ✅ Libraries that enhance **simulation realism**
- ✅ Algorithms for **pattern detection** (value drift, tensions)
- ✅ Tools for **data analysis** (event logs, moral reckoning)
- ✅ Frameworks for **visualization** (making complexity legible)

### What We're NOT Looking For

**Clinical Protocols:**
- ❌ Protocols for **diagnosis** (we don't diagnose)
- ❌ Protocols for **treatment** (we don't prescribe)
- ❌ Protocols requiring **real-time medical data** (we use synthetic)
- ❌ Protocols that would make us a **medical device**

**Technical Tools:**
- ❌ Machine learning for **prediction** (we're deterministic where it matters)
- ❌ Optimization algorithms that **hide trade-offs** (we expose them)
- ❌ Real-time monitoring tools (we're retrospective)
- ❌ Patient-facing applications (we're governance-facing)

---

## Part 2: Clinical Protocols - Priority Matrix

### TIER 1: CRITICAL - Must Understand Deeply

These protocols are **core to emergency department flow** and contain the ethical tensions we need to model.

#### Protocol 1: ESI (Emergency Severity Index) v4/5

**What it is:**
- 5-level triage acuity scale (ESI 1-5)
- Level 1: Immediate life-saving intervention
- Level 2: High risk or severe pain/distress
- Level 3: Multiple resources needed
- Level 4: One resource
- Level 5: No resources

**Why critical:**
- Most widely used ED triage protocol in US
- Explicitly balances **urgency vs resource needs**
- Has built-in ethical tensions (Level 2 vs Level 3 boundary)
- We already conceptually reference it

**Research questions:**
1. What are the **exact decision rules** at each level?
2. Where do **clinical disagreements** occur? (inter-rater reliability)
3. What **resource assumptions** are baked in?
4. How do **capacity constraints** affect application in practice?
5. What **value tensions** exist in edge cases?

**Integration plan:**
- Map ESI levels to our RED/YELLOW/BLUE more precisely
- Model the "resource vs urgency" trade-off explicitly
- Simulate ESI drift under capacity pressure

**Key references to obtain:**
- ESI Implementation Handbook (AHRQ)
- ESI Triage Algorithm
- Validation studies (sensitivity/specificity)
- Crowding impact on ESI accuracy papers

**Expected finding:**
ESI works well under normal capacity but degrades under pressure - exactly what we need to model.

---

#### Protocol 2: NEWS2 (National Early Warning Score)

**What it is:**
- Aggregate physiological score (0-20+)
- Monitors: respiratory rate, oxygen, temperature, BP, pulse, consciousness
- Triggers escalation at thresholds (5, 7)
- Used primarily in UK/Europe

**Why critical:**
- Quantitative risk stratification
- Clear escalation thresholds
- Shows how **objective scores still require judgment**
- Demonstrates **threshold effects** (safe at 6, emergency at 7)

**Research questions:**
1. What are the **exact scoring criteria**?
2. How are **borderline cases** handled? (score=6.5)
3. What **context modifies** interpretation? (chronic conditions)
4. How does **capacity pressure** affect threshold adherence?
5. Any **gaming or manipulation** documented?

**Integration plan:**
- Model NEWS2-inspired triage refinement
- Show how thresholds create "cliff effects"
- Demonstrate value drift when thresholds relaxed under pressure

**Key references:**
- Royal College of Physicians NEWS2 guidelines
- Implementation case studies
- Crowding impact papers
- Criticism/limitation papers

**Expected finding:**
Thresholds are both necessary (clear action triggers) and problematic (create artificial boundaries).

---

#### Protocol 3: SOFA Score (Sequential Organ Failure Assessment)

**What it is:**
- ICU mortality risk score
- 6 organ systems (respiratory, cardiovascular, hepatic, coagulation, renal, neurological)
- Score 0-24, higher = worse
- Used for **ICU triage** and resource allocation

**Why critical:**
- High-stakes resource allocation protocol
- COVID-19 exposed ethical tensions (who gets ventilator?)
- Shows intersection of **clinical judgment + ethics + scarcity**
- Proxy for "medical utility" in crisis standards

**Research questions:**
1. What are **exact calculation criteria**?
2. How does SOFA perform under **crisis conditions**?
3. What **ethical frameworks** modify its use? (utilitarian vs egalitarian)
4. Where do **clinical disagreements** occur?
5. What are **documented problems** with SOFA in allocation?

**Integration plan:**
- Build ICU allocation module using SOFA-like scoring
- Model ethical tensions (maximizing lives vs fairness)
- Simulate crisis standards of care decisions

**Key references:**
- SOFA score calculation tables
- Crisis Standards of Care documents (state/federal)
- COVID-19 triage protocols
- Ethics papers critiquing SOFA use

**Expected finding:**
No score eliminates moral weight - even "objective" criteria require value judgments.

---

#### Protocol 4: EMTALA (Emergency Medical Treatment and Labor Act)

**What it is:**
- US federal law requiring ED screening/stabilization
- Applies to all patients regardless of ability to pay
- Creates **legal obligation** for emergency care
- Defines what "emergency" means legally

**Why critical:**
- Legal framework underlying ED operations
- Creates **non-negotiable safety baseline**
- Shows tension between **legal mandate + capacity reality**
- Relevant to "forced vs chosen harm" classification

**Research questions:**
1. What are **exact legal requirements**?
2. What counts as **"stabilization"** legally?
3. How do hospitals **comply under capacity constraints**?
4. What are **documented violations** and why they occur?
5. How does EMTALA interact with **capacity management**?

**Integration plan:**
- Model EMTALA compliance as non-negotiable constraint
- Simulate boarding patients (stabilized but no bed)
- Show how legal requirements interact with capacity reality

**Key references:**
- EMTALA statute and regulations
- CMS guidance documents
- Case law on violations
- Hospital compliance practices

**Expected finding:**
Legal mandates don't eliminate resource constraints - they shift where pressure appears.

---

### TIER 2: IMPORTANT - Should Understand Well

#### Protocol 5: Crisis Standards of Care (CSC)

**What it is:**
- Framework for altered care during disasters/pandemics
- Three levels: conventional, contingency, crisis
- Shifts from individual optimization to population benefit
- State-specific protocols exist

**Why important:**
- Explicitly acknowledges **scarce resource allocation**
- Shows how **values shift** under extreme pressure
- Demonstrates **institutional value drift** in crisis
- Highly relevant to ICU/ventilator allocation

**Research questions:**
1. What **triggers** shift between levels?
2. How are **allocation decisions** documented?
3. What **ethical frameworks** guide allocation?
4. What **governance structures** oversee CSC activation?
5. How do institutions **debrief** after CSC use?

**Integration plan:**
- Model crisis mode activation
- Simulate value drift during crisis
- Show ethical debt accumulation in crisis standards

---

#### Protocol 6: Pediatric Emergency Assessment (PedsTrac, Pediatric ESI)

**What it is:**
- Age-adapted triage for children
- Accounts for developmental differences
- Parent/guardian involvement
- Higher sensitivity to deterioration

**Why important:**
- Demonstrates **context-specific protocols**
- Shows adaptation of general framework
- Relevant if we expand to pediatric ED module
- Contains unique ethical dimensions (assent vs consent)

**Research questions:**
1. How does pediatric triage **differ from adult**?
2. What are **developmentally appropriate** assessments?
3. How is **parent/guardian input** incorporated?
4. What are **unique ethical considerations**?

---

#### Protocol 7: Psychiatric Emergency Screening (ESAS, MHSAS)

**What it is:**
- Mental health triage protocols
- Suicide risk assessment
- Involuntary hold criteria
- Behavioral emergency management

**Why important:**
- Different urgency calculation (risk to self/others)
- Legal implications (involuntary hold)
- Resource challenges (psychiatric bed scarcity)
- Stigma and bias concerns

**Research questions:**
1. What are **risk stratification criteria**?
2. How are **involuntary holds** determined?
3. What **resources** are assumed available?
4. What are **documented disparities** in application?

---

### TIER 3: USEFUL - Good to Know

#### Protocol 8: Trauma Team Activation Criteria

**What it is:**
- Criteria for full trauma team activation
- Based on mechanism, vitals, anatomy
- Resource-intensive (10+ staff)
- Time-sensitive

**Why useful:**
- Shows **resource mobilization** decisions
- Demonstrates **over-triage vs under-triage** trade-off
- Relevant to capacity modeling

---

#### Protocol 9: Stroke Alert / STEMI Alert Protocols

**What it is:**
- Time-sensitive activation for stroke/cardiac
- "Time is brain/muscle" protocols
- Bypass normal ED flow
- Direct to intervention

**Why useful:**
- Shows **priority override** mechanisms
- Time-sensitive decision-making
- Resource allocation to time-sensitive conditions

---

#### Protocol 10: Sepsis Screening & Response (qSOFA, SIRS)

**What it is:**
- Early sepsis identification
- Trigger for aggressive treatment
- Bundle protocols (antibiotics, fluids)

**Why useful:**
- Demonstrates **early warning systems**
- Shows protocol adherence challenges
- Relevant to deterioration detection

---

## Part 3: Algorithms - What We Need to Model

### Category A: Queue Theory & Flow Dynamics

**What we need:**
- Model patient flow through multi-stage system
- Optimize (or reveal trade-offs in) queue management
- Understand capacity effects on wait times
- Simulate bottlenecks and pressure points

#### Algorithm 1: Discrete Event Simulation (DES)

**Current status:** ✅ Already implemented (our core)

**Enhancement opportunities:**
- More sophisticated arrival distributions (Poisson? Time-varying?)
- Service time distributions by urgency
- Queue discipline variations (FIFO, priority, dynamic)

**Python libraries:**
- **SimPy** - Discrete event simulation framework
  - Why: Industry standard, well-documented
  - Use: Validate our implementation, learn advanced patterns
  - Integration: Could rewrite engine using SimPy for robustness

- **Salabim** - DES with animation
  - Why: Built-in visualization, easier than p5.js integration
  - Use: Explore as alternative visualization layer

**Research questions:**
1. What arrival patterns best match real ED data?
2. What service time distributions are realistic?
3. How do we model "boarding" (admitted but no bed)?
4. What's best way to model staff as resources?

---

#### Algorithm 2: Queue Optimization vs Trade-off Analysis

**Current status:** ✅ We expose trade-offs, don't optimize

**What we could add:**
- Show "optimal" solution (if we only cared about metric X)
- Compare to "fair" solution (FIFO)
- Compute **Pareto frontier** (can't improve X without hurting Y)

**Python libraries:**
- **OR-Tools** (Google) - Operations research toolkit
  - Why: Industry-grade optimization
  - Use: Generate "optimal" solutions to contrast with fair solutions
  - Integration: Background comparison, not primary logic

- **PuLP** - Linear programming
  - Why: Simpler, more pedagogical
  - Use: Teaching tool for showing trade-offs

**Research questions:**
1. What does "optimal" queue management look like?
2. How far from optimal is "fair"?
3. What's the **cost of fairness** quantitatively?

**Critical boundary:**
We show what "optimal" would be to expose what we sacrifice for fairness.
We NEVER recommend implementing "optimal" without human review.

---

#### Algorithm 3: Time-Varying Arrival Rates

**Current status:** ⚠️ Partially - could be more sophisticated

**What we could add:**
- Model daily patterns (rush at 8am, lull at 3am)
- Weekly patterns (Monday spike)
- Seasonal patterns (flu season surge)
- Special events (accident on highway)

**Python libraries:**
- **NumPy** - Statistical distributions
  - Why: Already use, could use better
  - Use: Non-homogeneous Poisson process

- **SciPy** - Statistical functions
  - Why: Advanced distributions
  - Use: Model realistic arrival patterns

**Research questions:**
1. What are typical ED arrival patterns by time of day?
2. How much variability exists?
3. What's impact of "surge" vs "normal" on moral reckoning?

---

### Category B: Pattern Detection & Anomaly Recognition

**What we need:**
- Detect value drift patterns over time
- Identify tension signals before collapse
- Recognize normalization of deviance
- Cluster similar ethical challenges

#### Algorithm 4: Time Series Analysis (Value Drift Detection)

**Current status:** ⚠️ Basic - could be much better

**What we could add:**
- Trend detection (is drift accelerating?)
- Changepoint detection (when did drift start?)
- Forecasting (will drift exceed threshold?)
- Seasonal decomposition (is drift periodic?)

**Python libraries:**
- **statsmodels** - Time series analysis
  - Why: Comprehensive statistical models
  - Use: Trend analysis, changepoint detection
  - Integration: Enhance Priority 1 (Value Drift)

- **prophet** (Facebook) - Time series forecasting
  - Why: Easy to use, handles seasonality well
  - Use: Predict value drift trajectory
  - Integration: Early warning system

- **ruptures** - Changepoint detection
  - Why: Specialized for detecting regime changes
  - Use: Detect when institutional behavior shifted
  - Integration: Identify inflection points in value drift

**Research questions:**
1. What time series models best fit value drift?
2. How early can we detect concerning trends?
3. What's false positive rate for alerts?

---

#### Algorithm 5: Clustering & Pattern Recognition

**Current status:** ❌ Not implemented

**What we could add:**
- Cluster similar decisions (do certain patterns recur?)
- Identify "ethical archetypes" (common dilemmas)
- Detect unusual outliers (decisions that don't fit patterns)
- Find hidden structure in ethical debt accumulation

**Python libraries:**
- **scikit-learn** - Machine learning toolkit
  - Why: Industry standard, well-maintained
  - Use: Clustering (K-means, DBSCAN, hierarchical)
  - Integration: Pattern detection in decision logs

- **hdbscan** - Hierarchical clustering
  - Why: Better than K-means for irregular clusters
  - Use: Find natural groupings in decisions
  - Integration: Identify "families" of ethical dilemmas

**Research questions:**
1. Do ethical dilemmas cluster into types?
2. Can we identify "signature patterns" per institution type?
3. What's the right distance metric for comparing decisions?

**Critical boundary:**
This is for **understanding patterns**, not for **predicting decisions**.
We cluster historical data, never use ML to make triage decisions.

---

#### Algorithm 6: Anomaly Detection (Tension Signals)

**Current status:** ⚠️ Rule-based - could add statistical methods

**What we could add:**
- Statistical anomaly detection (unusual patterns)
- Outlier identification (decisions far from norm)
- Drift detection (behavior changing over time)

**Python libraries:**
- **pyod** - Outlier detection
  - Why: Comprehensive anomaly detection methods
  - Use: Detect unusual ethical debt patterns
  - Integration: Flag concerning decisions automatically

- **scikit-learn** (IsolationForest, LocalOutlierFactor)
  - Why: Standard anomaly detection algorithms
  - Use: Find decisions that don't fit expected patterns

**Research questions:**
1. What counts as "anomalous" ethically?
2. How do we avoid false positives?
3. Can we learn what "normal tension" looks like?

---

### Category C: Causal Analysis & Counterfactuals

**What we need:**
- Answer "what if we had done X instead?"
- Distinguish correlation from causation
- Model causal chains (A caused B caused C)
- Identify intervention points (where to change policy)

#### Algorithm 7: Causal Inference

**Current status:** ❌ Not implemented

**What we could add:**
- Causal DAGs (Directed Acyclic Graphs)
- Counterfactual simulation ("what if...")
- Mediation analysis (does X cause Y through Z?)
- Instrumental variables (isolate causal effects)

**Python libraries:**
- **DoWhy** (Microsoft) - Causal inference
  - Why: Comprehensive causal analysis framework
  - Use: Model causal relationships in hospital system
  - Integration: Answer "why" questions, not just "what"

- **CausalML** (Uber) - Causal ML
  - Why: ML for causal questions
  - Use: Estimate treatment effects (policy changes)
  - Integration: Policy impact assessment

- **pgmpy** - Probabilistic graphical models
  - Why: Bayesian networks, causal DAGs
  - Use: Model belief propagation through system

**Research questions:**
1. Can we model causal structure of hospital system?
2. How do we identify confounders?
3. What's the causal effect of policy changes?

**Critical boundary:**
This is for **understanding causality in simulation**, not in real patients.
We model causal relationships in synthetic scenarios only.

---

#### Algorithm 8: Counterfactual Analysis

**Current status:** ⚠️ Partial - we show alternatives, could formalize

**What we could add:**
- Formal counterfactual framework
- "Nearest possible world" analysis (minimal change to get different outcome)
- Responsibility attribution (which decision caused harm?)

**Python libraries:**
- **CausalNex** (QuantumBlack) - Causal reasoning
  - Why: Built for business applications
  - Use: Counterfactual scenario analysis
  - Integration: "What if" policy simulator

**Research questions:**
1. What's the **smallest change** to avoid a harm?
2. Which decisions were **pivotal** vs incidental?
3. How do we assign **responsibility** in multi-step processes?

---

### Category D: Data Analysis & Visualization

**What we need:**
- Analyze event logs efficiently
- Visualize complex relationships
- Make moral reckoning legible
- Interactive exploration of scenarios

#### Algorithm 9: Event Log Analysis

**Current status:** ✅ Working but could be faster/richer

**What we could add:**
- Efficient log querying (SQL-like)
- Log mining (discover patterns)
- Process mining (reconstruct workflows)

**Python libraries:**
- **Pandas** - Data manipulation
  - Status: Already use
  - Enhancement: Better indexing, optimization

- **Polars** - Fast DataFrame library
  - Why: Much faster than Pandas
  - Use: Handle larger simulation runs
  - Integration: Consider migration for performance

- **DuckDB** - Embedded SQL database
  - Why: SQL queries on Python data
  - Use: Complex event log queries
  - Integration: Enable SQL-like analysis

- **pm4py** - Process mining
  - Why: Specialized for event logs
  - Use: Discover process models from logs
  - Integration: Visualize decision flows

**Research questions:**
1. What queries do ethics committees need?
2. How do we make log exploration intuitive?
3. Can we auto-generate insights from logs?

---

#### Algorithm 10: Graph Visualization & Analysis

**Current status:** ⚠️ Basic - could show relationships better

**What we could add:**
- Decision graph (which events caused which)
- Value network (how values interact)
- Tension network (which tensions co-occur)
- Causal graph (what causes what)

**Python libraries:**
- **NetworkX** - Graph analysis
  - Why: Comprehensive graph algorithms
  - Use: Model relationships in system
  - Integration: Causal chains, decision trees

- **Plotly** - Interactive visualization
  - Status: Could use more
  - Use: Interactive plots in Streamlit
  - Integration: Better moral reckoning visualizations

- **Altair** - Declarative visualization
  - Why: Clean, composable charts
  - Use: Complex multi-dimensional plots
  - Integration: Value drift visualization

- **Graphviz** - Graph rendering
  - Why: Standard for DAGs
  - Use: Decision trees, causal diagrams

**Research questions:**
1. What relationships should we visualize?
2. How do we avoid overwhelming users?
3. What interactivity is useful?

---

#### Algorithm 11: Dimensionality Reduction

**Current status:** ❌ Not implemented

**What we could add:**
- Reduce 5 metrics to 2D visualization
- Find "principal components" of moral reckoning
- Cluster institutions in reduced space

**Python libraries:**
- **scikit-learn** (PCA, t-SNE, UMAP)
  - Why: Standard dimensionality reduction
  - Use: Visualize high-dimensional moral space
  - Integration: Ethics dashboard

- **umap-learn** - UMAP algorithm
  - Why: Better than t-SNE for some data
  - Use: 2D embedding of ethical profiles

**Research questions:**
1. Can we visualize 5 metrics + moral reckoning in 2D?
2. Do institutions cluster in moral space?
3. What dimensions matter most?

---

### Category E: Reporting & Export

**What we need:**
- Generate governance-grade reports
- Export in multiple formats
- Create publication-ready figures
- Support academic writing

#### Algorithm 12: Report Generation

**Current status:** ✅ Basic - JSON/CSV/PDF via Markdown

**What we could add:**
- Template-based report generation
- Parameterized reports
- Multi-format export (Word, LaTeX)

**Python libraries:**
- **Jinja2** - Template engine
  - Status: Could use more
  - Use: Parameterized report templates
  - Integration: Ethics committee reports

- **python-docx** - Word documents
  - Why: Generate .docx directly
  - Use: Ethics committee preferred format

- **reportlab** - PDF generation
  - Status: Consider instead of Markdown → PDF
  - Use: Production-quality PDFs

- **WeasyPrint** - HTML to PDF
  - Why: Better PDF from HTML
  - Use: Rich formatting in reports

**Research questions:**
1. What format do ethics committees prefer?
2. What sections are essential?
3. How much detail is right?

---

#### Algorithm 13: Statistical Testing

**Current status:** ❌ Not implemented

**What we could add:**
- Test if value drift is significant
- Compare runs statistically
- Confidence intervals for metrics
- Power analysis for detecting changes

**Python libraries:**
- **scipy.stats** - Statistical tests
  - Why: Comprehensive test suite
  - Use: Validate significance of findings
  - Integration: Academic rigor

- **statsmodels** - Statistical models
  - Status: Mentioned earlier
  - Use: Regression, ANOVA, time series

**Research questions:**
1. When is value drift "significant" statistically?
2. How many simulation runs needed for confidence?
3. What's statistical power to detect policy impact?

---

## Part 4: Integration Priority Matrix

### IMMEDIATE (Next 3 Months)

**Clinical Protocols:**
1. **ESI** - Deep dive, precise integration
2. **NEWS2** - Understand thresholds, model in triage
3. **EMTALA** - Legal constraints as non-negotiable

**Algorithms & Libraries:**
1. **statsmodels** - Time series analysis for value drift
2. **ruptures** - Changepoint detection
3. **Plotly** - Better interactive visualizations

**Why these first:**
- ESI/NEWS2 ground triage in reality
- EMTALA defines legal baseline
- Time series + changepoint = better early warning
- Plotly = immediate UX improvement

---

### NEAR-TERM (3-6 Months)

**Clinical Protocols:**
4. **SOFA** - ICU allocation module
5. **Crisis Standards of Care** - Extreme pressure scenarios

**Algorithms & Libraries:**
4. **scikit-learn** - Clustering, anomaly detection
5. **DoWhy** - Causal inference framework
6. **NetworkX** - Decision graph visualization

**Why next:**
- SOFA enables ICU expansion
- CSC models crisis value drift
- Clustering finds patterns
- Causal inference answers "why"
- Graph viz shows relationships

---

### MEDIUM-TERM (6-12 Months)

**Clinical Protocols:**
6. **Pediatric triage** - If expanding to peds ED
7. **Psychiatric screening** - If mental health focus

**Algorithms & Libraries:**
7. **SimPy** - Consider engine rewrite for robustness
8. **CausalNex** - Counterfactual simulator
9. **pyod** - Advanced anomaly detection

**Why later:**
- Pediatric/psych are specializations
- SimPy rewrite is major undertaking
- Counterfactuals add sophistication
- Advanced anomaly detection after basic works

---

### OPTIONAL/RESEARCH (12+ Months)

**Clinical Protocols:**
8. **Trauma activation** - If specializing in trauma
9. **Stroke/STEMI alerts** - Time-sensitive protocols
10. **Sepsis screening** - Early warning systems

**Algorithms & Libraries:**
10. **Polars/DuckDB** - Performance at scale
11. **pm4py** - Process mining
12. **UMAP** - Advanced visualization

**Why optional:**
- Specialized protocols for specific expansions
- Performance optimization after proven useful
- Process mining is research-grade
- UMAP nice-to-have for visualization

---

## Part 5: Research Methodology

### Phase 1: Protocol Deep Dive (Weeks 1-2)

**For each Tier 1 protocol (ESI, NEWS2, SOFA, EMTALA):**

1. **Obtain primary sources**
   - Official guidelines/handbooks
   - Training materials
   - Decision algorithms/flowcharts

2. **Study implementation**
   - How is it used in practice?
   - Where do clinicians disagree?
   - What happens under capacity pressure?

3. **Review academic literature**
   - Validation studies
   - Criticisms and limitations
   - Crowding/capacity impact
   - Bias and disparity studies

4. **Extract decision rules**
   - Formalize as pseudocode
   - Identify threshold values
   - Map to our system constructs

5. **Identify ethical tensions**
   - Where do values conflict?
   - What's traded off for what?
   - Where does capacity constrain protocol?

**Deliverable:** Protocol integration spec for each (10-15 pages each)

---

### Phase 2: Algorithm Exploration (Weeks 2-3)

**For each Priority algorithm/library:**

1. **Install and experiment**
   - Quick tutorials
   - Example applications
   - Performance testing

2. **Evaluate fit**
   - Does it solve our problem?
   - Is it well-maintained?
   - Good documentation?
   - Python 3.10+ compatible?

3. **Prototype integration**
   - Minimal working example
   - Integration with our event log
   - Performance on real runs

4. **Document findings**
   - What works well?
   - What are limitations?
   - What's integration effort?
   - What's maintenance burden?

**Deliverable:** Technical evaluation report for each (5 pages each)

---

### Phase 3: Integration Planning (Week 4)

**Activities:**
1. Prioritize protocols (which first?)
2. Prioritize algorithms (which first?)
3. Estimate effort (weeks per integration)
4. Identify dependencies (what needs what?)
5. Create implementation roadmap

**Deliverable:** 
- Protocol integration roadmap (1 year plan)
- Technical enhancement roadmap (1 year plan)
- Resource requirements
- Risk assessment

---

### Phase 4: Pilot Implementation (Weeks 5-6)

**Pick ONE protocol + ONE algorithm to pilot:**

Recommended: **ESI + statsmodels**

**Why:**
- ESI is most critical protocol
- statsmodels enhances core capability (value drift)
- Both are well-documented
- Manageable scope for proof-of-concept

**Activities:**
1. Implement ESI integration
2. Add time series analysis to value drift
3. Validate with test scenarios
4. Document lessons learned
5. Refine roadmap based on experience

**Deliverable:**
- Working ESI-integrated triage
- Enhanced value drift detection
- Lessons learned document
- Updated roadmap

---

## Part 6: Research Questions by Domain

### For Clinical Protocols

**Universal questions for each protocol:**

1. **Decision Structure**
   - What are the **input signals** (vitals, complaints, history)?
   - What are the **decision rules** (if X then Y)?
   - What are the **output actions** (triage level, intervention)?
   - What are the **thresholds** (numeric cutoffs)?

2. **Ethical Dimensions**
   - What **values** does the protocol prioritize?
   - Where do **values conflict** (safety vs efficiency)?
   - What **trade-offs** are built in?
   - Who **wins and loses** when applied?

3. **Capacity Interaction**
   - How does **crowding** affect protocol adherence?
   - What happens when **resources unavailable**?
   - Are there **workarounds** under pressure?
   - Is there **documented drift** from protocol?

4. **Implementation Reality**
   - What's **inter-rater reliability** (do clinicians agree)?
   - Where do **clinical disagreements** occur?
   - What **context** modifies application?
   - What are **known limitations**?

5. **Bias & Disparity**
   - Are there **documented racial disparities** in application?
   - Any **gender** or **age** biases?
   - **Socioeconomic** factors?
   - How does protocol address (or fail to address) bias?

---

### For Algorithms & Libraries

**Universal questions for each tool:**

1. **Technical Fit**
   - Does it solve our problem?
   - What's the learning curve?
   - Is it actively maintained?
   - What's the community like?

2. **Integration Effort**
   - How hard to integrate with our codebase?
   - Dependencies? (new libraries, system requirements)
   - Performance impact?
   - Breaking changes risk?

3. **Maintenance Burden**
   - How often does it update?
   - Stable API?
   - Good test coverage?
   - Migration path if it's deprecated?

4. **Governance Fit**
   - Does it maintain our boundaries?
   - Explainable outputs?
   - Auditable behavior?
   - No black boxes?

5. **Ethical Considerations**
   - Could it be misused?
   - Does it expose trade-offs or hide them?
   - Deterministic or probabilistic?
   - Human authority preserved?

---

## Part 7: Specific Research Tasks

### Task Group A: ESI Deep Dive (Week 1)

**Obtain:**
1. ESI Implementation Handbook v4 or v5 (AHRQ)
2. ESI Triage Algorithm flowchart
3. 5 validation studies (PubMed search)
4. 3 crowding impact papers
5. Training videos/materials if available

**Extract:**
1. Exact decision rules for each ESI level
2. Resource needs by level
3. Expected time to physician/treatment by level
4. Modifications for pediatric/geriatric
5. Known edge cases and clinical disagreements

**Analyze:**
1. Map ESI 1-5 to our RED/YELLOW/BLUE
2. Identify where capacity affects ESI determination
3. Find ethical tensions in ESI boundaries
4. Note documented disparities in ESI application

**Deliverable:** ESI Integration Specification (15 pages)
- Decision rules as pseudocode
- Ethical tension analysis
- Integration plan with our system
- Validation approach

---

### Task Group B: Time Series Analysis (Week 2)

**Install & Learn:**
1. statsmodels (focus on time series module)
2. prophet (Facebook forecasting)
3. ruptures (changepoint detection)

**Experiment:**
1. Generate synthetic value drift data (increasing trend)
2. Apply ARIMA model to detect trend
3. Use prophet to forecast trajectory
4. Use ruptures to detect changepoint (when drift started)

**Prototype:**
1. Integrate with our value drift computation
2. Add trend detection ("drift accelerating")
3. Add early warning ("will exceed threshold in N runs")
4. Add changepoint detection ("drift started at run X")

**Deliverable:** Time Series Enhancement Specification (10 pages)
- Library comparison
- Integration code examples
- Performance results
- UI mockup for enhanced drift visualization

---

### Task Group C: SOFA Score Research (Week 3)

**Obtain:**
1. SOFA score calculation tables
2. 3 state Crisis Standards of Care documents
3. COVID-19 allocation protocols (5 states)
4. Ethics papers critiquing SOFA in allocation (5 papers)
5. Validation studies for SOFA mortality prediction

**Analyze:**
1. How is SOFA calculated? (exact formula)
2. How was SOFA used in COVID-19 allocation?
3. What ethical frameworks modified SOFA use?
4. What are documented problems with SOFA?
5. What alternatives were proposed?

**Design:**
1. ICU allocation simulation module
2. SOFA-based scoring (or alternative)
3. Ethical framework selection (utilitarian vs egalitarian)
4. Value drift detection in allocation decisions

**Deliverable:** ICU Allocation Module Specification (20 pages)
- SOFA integration plan
- Ethical framework modeling
- Moral reckoning adaptations
- Use cases for ethics committees

---

### Task Group D: Visualization Enhancement (Week 4)

**Experiment with:**
1. Plotly interactive charts (Streamlit integration)
2. NetworkX + Graphviz (decision graphs)
3. Altair (declarative charts)

**Create prototypes:**
1. Interactive value drift timeline (Plotly)
2. Decision graph showing causal chains (NetworkX)
3. Multi-dimensional ethical profile (Altair)
4. Tension network (which tensions co-occur)

**User test:**
1. Show to 3 people (technical + non-technical)
2. Assess: Which is most clear?
3. Assess: What's confusing?
4. Iterate based on feedback

**Deliverable:** Visualization Enhancement Plan (10 pages)
- Library recommendations
- 5 specific visualizations to add
- Implementation effort estimates
- Before/after mockups

---

## Part 8: Documentation Requirements

### For Each Protocol Researched

**Create document with:**

1. **Protocol Overview** (1-2 pages)
   - What it is, who uses it, why it exists

2. **Decision Rules** (2-3 pages)
   - Formalized as pseudocode
   - Thresholds and cutoffs
   - Input signals, output actions

3. **Ethical Analysis** (2-3 pages)
   - What values prioritized
   - Where tensions exist
   - Built-in trade-offs

4. **Capacity Interaction** (2-3 pages)
   - How crowding affects adherence
   - Documented workarounds
   - Drift patterns

5. **Integration Specification** (3-5 pages)
   - How to integrate with our system
   - Code structure
   - Data requirements
   - Validation approach

6. **References** (1-2 pages)
   - Primary sources
   - Academic papers
   - Implementation guides

**Total per protocol:** 10-15 pages

---

### For Each Algorithm/Library Researched

**Create document with:**

1. **Technical Overview** (1 page)
   - What it does
   - Key features
   - Maturity/maintenance status

2. **Evaluation** (2-3 pages)
   - Pros and cons
   - Fit with our needs
   - Integration effort
   - Performance

3. **Example Code** (1-2 pages)
   - Minimal working example
   - Integration with our event log
   - Output interpretation

4. **Integration Plan** (2-3 pages)
   - Where it fits in architecture
   - Code changes needed
   - Testing approach
   - Migration risk

5. **Governance Check** (1 page)
   - Maintains boundaries?
   - Explainable?
   - Auditable?
   - Any ethical concerns?

**Total per algorithm:** 5-8 pages

---

## Part 9: Success Criteria

### Research Phase Success

**We've succeeded if:**

✅ **Deep understanding** of 4 Tier 1 protocols (ESI, NEWS2, SOFA, EMTALA)  
✅ **Working knowledge** of 3 Tier 2 protocols (CSC, Pediatric, Psych)  
✅ **Evaluated** 10+ Python libraries for fit  
✅ **Prototyped** 2-3 enhancements (ESI + time series minimum)  
✅ **Created** integration roadmap (1 year plan)  
✅ **Validated** approach with one working example  

### Integration Success (Post-Research)

**We've succeeded if:**

✅ **ESI-integrated triage** is more realistic and clinically grounded  
✅ **Value drift detection** has early warning capabilities  
✅ **Visualizations** make moral reckoning more legible  
✅ **Ethics committees** find enhancements useful  
✅ **Academic reviewers** consider system credible  
✅ **Boundaries preserved** - still governance tool, not clinical  

---

## Part 10: The Complete Deep Research Prompt

### Comprehensive Research Question

**"What clinical protocols and technical tools would ground our institutional truth-telling system in real-world practice while enhancing our capability to detect value drift, ethical debt, and institutional self-deception—without ever becoming a clinical decision support tool or violating our governance boundaries?"**

### Sub-Questions to Answer

**Clinical Protocols:**
1. What are the exact decision rules in ESI, NEWS2, SOFA, and EMTALA?
2. Where do these protocols contain ethical tensions or trade-offs?
3. How do capacity constraints affect protocol adherence in practice?
4. What documented biases or disparities exist in protocol application?
5. How can we model these protocols in simulation to expose institutional value drift?

**Technical Tools:**
6. Which Python libraries best enhance our time series analysis (value drift)?
7. Which algorithms enable better pattern detection (tensions, ethical debt)?
8. Which visualization tools make moral reckoning more legible?
9. Which causal inference methods help us answer "why" questions?
10. How do we integrate new tools while maintaining deterministic safety guarantees?

**Integration Strategy:**
11. What's the critical path for protocol integration (which first)?
12. What's the effort-to-value ratio for each enhancement?
13. How do we validate enhanced system against clinical reality?
14. How do we ensure boundaries preserved as we add sophistication?
15. What's the 12-month roadmap for deepening the system?

---

## Part 11: Resources & References

### Where to Find Clinical Protocols

**ESI:**
- AHRQ website (Agency for Healthcare Research and Quality)
- Emergency Nurses Association (ENA) training materials
- Academic hospital ED training programs

**NEWS2:**
- Royal College of Physicians (UK) website
- NHS implementation guides
- Validation studies in Emergency Medicine journals

**SOFA:**
- Critical Care Medicine journal articles
- ICU scoring system databases
- State Crisis Standards of Care documents

**EMTALA:**
- CMS (Centers for Medicare & Medicaid Services) website
- Healthcare compliance resources
- Legal case databases

### Where to Find Python Libraries

**Main repositories:**
- PyPI (pip install)
- Conda-forge (conda install)
- GitHub (source code)

**Documentation:**
- Official library docs
- Stack Overflow (implementation questions)
- Medium/blogs (tutorials)

**Evaluation:**
- Papers With Code (ML benchmarks)
- Awesome lists (curated library lists)
- PyData conference talks

---

## Part 12: Timeline & Milestones

### Week 1: ESI + NEWS2 Deep Dive
**Deliverable:** 2 protocol integration specs (30 pages total)

### Week 2: Time Series Analysis Implementation
**Deliverable:** Enhanced value drift detection (working code + docs)

### Week 3: SOFA + EMTALA Research
**Deliverable:** 2 protocol integration specs + ICU module design

### Week 4: Visualization Enhancement
**Deliverable:** 3 new visualizations (prototypes + plan)

### Week 5-6: Pilot Integration
**Deliverable:** ESI-integrated system + lessons learned

**Total:** 6 weeks, 4 protocol specs, 3 algorithm enhancements, 1 working pilot

---

## Conclusion: Research as Foundation for Evolution

This deep research will:

1. **Ground system in clinical reality** (protocols)
2. **Enhance core capabilities** (algorithms)
3. **Maintain boundaries** (governance focus)
4. **Enable academic validation** (credibility)
5. **Support real-world pilots** (practical utility)

**The goal:** Deepen sophistication while preserving purpose.

**The outcome:** A system that prevents institutional self-deception, now grounded in the actual protocols that create ethical tensions.

---

**Research Phase Status:** Roadmap Complete  
**Next Action:** Begin Week 1 (ESI Deep Dive)  
**Critical Success Factor:** Preserve boundaries while adding depth  
**Ultimate Question:** "What did this cost us, and why?" (now with more precision)
