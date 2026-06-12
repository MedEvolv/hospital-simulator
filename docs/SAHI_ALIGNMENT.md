# SAHI Alignment Document
## How Institutional Mirror and the AI Collective Healthcare Governance Cohort
## Respond to India's National Strategy for AI in Healthcare (SAHI, 2026)

**Document purpose:** This file maps our work — the Institutional Mirror
governance simulator and the AI Collective Delhi Chapter Healthcare Governance
Cohort Program — against specific recommendations in India's Strategy for
Artificial Intelligence in Healthcare (SAHI), launched by the Ministry of
Health and Family Welfare at the India AI Impact Summit, February 2026.

Use this document when:
- Presenting to hospital leadership, policy actors, or institutional partners
- Pitching the cohort program to Masters Union, Medoc, or government stakeholders
- Framing Institutional Mirror for Parishrut Jassal or GovernAI conversations
- Writing grant applications, research proposals, or partnership briefs
- Updating the tool's about section and disclaimer language

**Core claim this document supports:**

We are not doing something parallel to national policy.
We are implementing what national policy asked for — and providing the
tooling to make it actionable at the institutional level where SAHI is silent.

---

## What SAHI Is

SAHI is India's first national framework for AI governance in healthcare,
developed by a committee constituted by the Ministry of Health and Family
Welfare. It was launched at the India AI Impact Summit on February 17, 2026,
alongside BODH (Benchmarking Open Data Platform for Health AI).

SAHI is structured around five pillars:
- Pillar I: Governance, Regulation, and Trust
- Pillar II: Health Data and Digital Infrastructure
- Pillar III: Workforce, Institutional Capacity, and Change Management
- Pillar IV: Research, Innovation, and Evidence Generation
- Pillar V: Ecosystem Enablement and Global Leadership

SAHI functions as a guiding and enabling framework rather than a prescriptive
mandate. It is explicitly designed to support institutions, not to replace
their judgment. This is precisely the gap our work fills.

---

## Where SAHI Is Strong — And Where It Is Silent

SAHI is authoritative on *what* India's healthcare AI ecosystem needs:
governance frameworks, lifecycle monitoring, institutional capacity,
workforce competency, equity safeguards. The **32 formal recommendations**
are clear and evidence-based.

> **Correction of record (2026-06-12):** earlier drafts of this file (and the
> V2 PRD) referenced "22 recommendations." A direct read of the published SAHI
> (pp. 36–38) confirms **32 recommendations** across the five pillars. All counts
> below use the verified figure. See the complete 32-recommendation coverage in
> the "Complete Coverage" section appended at the end.

SAHI is almost entirely silent on *how* a tier 2 or tier 3 hospital with
no dedicated IT staff, no AI governance committee, and no budget for either
is supposed to implement these recommendations.

This is not a criticism of SAHI — it is a guiding framework, not an
implementation manual. But it creates a concrete gap:

> "SAHI outlines principles but appears to leave the creation of concrete
> structures — AI governance committees, incident reporting systems,
> escalation paths — to states and institutions."
> — Expert commentary, ICT4D and digital health community, 2026

Institutional Mirror and the AI Collective cohort program exist to fill
this gap. Together they provide:
1. A practical governance tool any institution can use without prior AI
   infrastructure (Institutional Mirror)
2. A structured pathway for building AI governance capacity inside a hospital
   (the cohort program)

---

## Recommendation-by-Recommendation Alignment

### RECOMMENDATION 1
*"AI Solutions in healthcare must be classified based on their likelihood
to cause harm and made subject to appropriate regulatory and operational
obligations commensurate to the level of risk they pose."*
— SAHI, Pillar I, §4.1.1

**How we respond:**

Institutional Mirror explicitly positions itself as a governance and
self-reflection tool — not a clinical decision system, not a triage tool,
not a diagnostic aid. The ontological disclaimer on every screen states
this clearly and is a non-negotiable design constraint.

The moral reckoning layer classifies simulation events by harm type and
severity (INFO / MEDIUM / HIGH / CRITICAL). The forced vs avoidable harm
distinction is a direct operationalisation of risk-proportionate thinking:
it distinguishes events where harm was capacity-constrained (structural
risk, requiring system-level response) from events where harm was
allocation-driven (operational risk, within governance reach).

The tool itself is risk-classified by design: it makes no clinical
recommendations, produces no patient-level outputs, and explicitly refuses
to claim predictive or triage authority.

---

### RECOMMENDATION 2
*"Measures should be put in place to ascertain the accountability of
different actors in the AI healthcare ecosystem so that liability for
harms caused can be appropriately allocated."*
— SAHI, Pillar I, §4.1.1

**How we respond:**

The Legal Counsel lens of the role-aware Report page is built specifically
for this purpose. It reframes every simulation output — harm classifications,
refusal events, escalations — in accountability language: who made which
decision, what the system escalated to human oversight, what was documented.

The refusal mechanism in the moral reckoning layer is directly relevant here:
every refusal event is a documented instance of the system declining to
make a decision autonomously and escalating to human review. This is the
accountability architecture SAHI recommends, operationalised in simulation.

The Separation of Powers architectural constraint — the simulation engine
does not score itself, the scoring layer does not modify the simulation,
the UI has no business logic — models the kind of clear actor separation
SAHI calls for in accountability allocation.

---

### RECOMMENDATION 3
*"Safety should be embedded across all stages of the AI lifecycle, with
clear metrics developed and adopted to assess safety, bias, interoperability,
and real world use."*
— SAHI, Pillar I, §4.1.1

**How we respond:**

The five-metric framework (PSS, PES, SSS, EIC, STI) was designed
specifically to prevent single-metric optimisation — the most common
failure mode of safety metrics in healthcare AI. Metrics are always
displayed separately, never collapsed into a composite score.

The Patient Safety Score (PSS) directly measures safe care delivery.
The Ethics Intervention Count (EIC) measures governance layer activity —
a proxy for system-level safety oversight. The Staff Stress Score (SSS)
measures the human cost of safety decisions, connecting clinical safety
to workforce wellbeing.

The value drift detection layer measures the gap between declared safety
commitments and observed operational behaviour — which SAHI calls for
under "real world use" monitoring but provides no mechanism to achieve.

---

### RECOMMENDATION 5
*"High-impact AI applications should assess and address potential inequity
impact as part of design, evaluation, and deployment decisions."*
— SAHI, Pillar I, §4.1.2

**How we respond:**

The Equity dimension is embedded in the declared values framework of
every institutional profile. Value drift on equity — the gap between
an institution's declared commitment to equitable care and its observed
operational behaviour — is tracked separately from other value dimensions.

The harm classification layer detects equity breaches explicitly (e.g.,
admission declined on insurance-status grounds when clinical urgency was
equivalent). These appear as avoidable harms with specific mitigation paths.

The Government Hospital profile is designed to model equity-first
resource allocation under constraint — demonstrating what genuine
equity commitment costs operationally, and where it produces value drift
in other dimensions.

---

### RECOMMENDATION 6
*"AI applications should be transparent and explicitly communicate use,
limitations, and risk in a form that intended users can understand."*
— SAHI, Pillar I, §4.1.3

**How we respond:**

The ontological disclaimer — visible on every screen — explicitly states
what the tool is and is not. This is non-negotiable by design:

"This tool does not evaluate your hospital. It helps your hospital
evaluate itself. It uses synthetic data and parameterised profiles.
It does not make clinical decisions, diagnose conditions, or evaluate
real patients."

The role-aware Report page translates technical simulation outputs into
language appropriate for each reader — Medical Superintendent, Legal
Counsel, Quality Lead, COO — ensuring transparency in a form the
intended user can actually understand. This directly implements SAHI's
"accessible and usable forms" requirement.

The plain-English summary at the top of every results screen ensures
that the most important findings are communicated without requiring
technical literacy to access.

---

### RECOMMENDATION 7
*"AI applications should be monitored post deployment for performance
changes, model drift, bias, and other unintended consequences."*
— SAHI, Pillar I, §4.1.3

**How we respond:**

The value drift detection layer is a direct implementation of SAHI's
post-deployment monitoring requirement — applied to institutional
behaviour rather than model performance. This is an important distinction:

SAHI's monitoring recommendation is typically interpreted as technical
(monitoring model accuracy over time). The deeper governance problem is
institutional — whether the humans and institutions deploying AI systems
continue to behave consistently with their declared values as systems scale.

Value drift detection monitors this dimension. It is the governance
monitoring layer that SAHI calls for but does not specify how to build.

---

### RECOMMENDATION 13
*"Appropriate cybersecurity standards, incident response protocols, and
continuity planning for health data should be defined."*
— SAHI, Pillar II, §4.2.3

**How we respond (partial — future roadmap):**

SAHI explicitly names cybersecurity as a data governance requirement.
The current version of Institutional Mirror does not model cybersecurity
human risk — but the architecture supports it as a natural extension.

The same moral reckoning layer that detects value drift in clinical
governance can detect drift in security governance: the gap between
declared security policy and actual staff behaviour under cognitive load.
The staff stress score (SSS) is a known predictor of security vulnerability.

This alignment is noted here as a policy anchor for the cybersecurity
human risk module planned for a future version. SAHI Recommendation 13
provides the national policy justification for building it.

---

### RECOMMENDATION 16
*"A role-based AI competency framework for the health sector should be
promoted, defining expected levels of AI understanding and responsibility
across clinical, administrative, frontline, and leadership roles."*
— SAHI, Pillar III, §4.3.1

**How we respond:**

SAHI's FRAC (Framework of Roles, Activities and Competencies) approach
is operationalised in the role-aware Report page of Institutional Mirror.
Five distinct reader roles receive differentiated report narratives:

- Medical Superintendent / CMO → clinical governance framing
- Quality and Patient Safety Lead → patient safety analysis framing
- Legal Counsel / Compliance Officer → accountability and documentation framing
- COO / Hospital Administrator → operational and resource framing
- Research and Governance → methodology and evidence framing

This is FRAC applied to governance tool design: different competency
levels receive information pitched at their level of authority and
responsibility, as SAHI recommends.

The cohort program's participant mix — clinicians, engineers, UX
researchers, administrators — directly implements SAHI's cross-role
competency development requirement. The program does not train one
cadre in isolation; it builds competency across the role spectrum
that SAHI identifies as necessary.

---

### RECOMMENDATION 19 — THE MOST IMPORTANT ALIGNMENT
*"Designated AI units or nodal cells should be created within health
departments and health institutions to lead AI strategy, use-case
prioritisation, tool assessment, deployment oversight, and lifecycle
management."*
— SAHI, Pillar III, §4.3.2

**How we respond:**

SAHI calls for designated AI governance capacity inside every health
institution. For a 120-bed district hospital in Meerut with three
emergency rooms and no IT department, this is currently an unfunded,
unstaffed mandate.

The AI Collective Healthcare Governance Cohort Program is a civil society
mechanism for bootstrapping this capacity in institutions that cannot yet
sustain a formal AI unit. The cohort:

- Embeds a cross-disciplinary team (clinicians, engineers, administrators)
  inside or alongside a Delhi NCR hospital for a structured program
- Produces a governance artefact — a charter, risk register, or SOP — that
  can serve as the founding document for an institution's AI governance function
- Builds the internal competency and relationships that make a future
  designated AI unit viable

Institutional Mirror is the tooling that makes this unit's work legible
and actionable. A hospital that completes the cohort program and adopts
Institutional Mirror has, in practical terms, established the nodal cell
SAHI Recommendation 19 calls for.

---

### RECOMMENDATION 20
*"Structured collaboration and knowledge-exchange mechanisms should be
established to enable continuous learning, research, and cross-jurisdictional
sharing in support of ethical, context-appropriate AI adoption in healthcare."*
— SAHI, Pillar III, §4.3.2

**How we respond:**

The AI Collective Delhi Chapter is precisely the peer learning community
SAHI calls for. The cohort program's design — bringing together clinicians,
engineers, and policy practitioners across institutions — creates the
cross-disciplinary knowledge exchange SAHI recommends.

The cohort's output artefacts are designed to be reusable and shareable:
governance frameworks adapted to Indian resource constraints, not imported
wholesale from Western models. This is SAHI's context-appropriate requirement
taken seriously.

Institutional Mirror's public deployment — no institutional relationship
or permission required to run a simulation — directly enables
cross-jurisdictional learning. Any hospital in India can access the tool,
run their profile, and compare governance signals against what similar
institutions observe.

---

### RECOMMENDATIONS 21 AND 22
*"AI tools should be embedded within existing clinical and public health
workflows to support decision-making without increasing burden or
fragmentation."*
*"Roles and responsibilities for human and AI in workflows should be clearly
defined, including oversight and escalation mechanisms."*
— SAHI, Pillar III, §4.3.3

**How we respond:**

The refusal mechanism in Institutional Mirror's moral reckoning layer is
a direct implementation of SAHI's escalation requirement: the system
identifies decisions it cannot make within declared values and escalates
them to human review. Every refusal event is documented with the reason
for escalation.

The Decision Inspector's default view — showing only HIGH and CRITICAL
events — is designed to integrate into existing governance workflows
without creating alert fatigue. A Quality Incharge reviewing the inspector
after a committee meeting is not shown everything; they are shown the
decisions that require their specific attention.

---

## The Gap SAHI Creates — And What We Uniquely Fill

SAHI's 32 recommendations collectively describe a future state: Indian
hospitals with designated AI units, lifecycle monitoring infrastructure,
role-based competency frameworks, and cross-institutional knowledge exchange.

The path from the current state — most tier 2/3 hospitals have none of
this — to that future state is not described in SAHI. This is the
implementation gap.

We fill it in three specific ways that no other current initiative addresses:

**1. Governance before AI is deployed.**
Institutional Mirror works for hospitals that have not yet deployed AI.
It builds governance literacy and surfaces structural trade-offs before
institutions face the consequences of ungoverned AI. SAHI calls for this
but provides no tool for it.

**2. Accessible without infrastructure.**
The tool requires a browser. No installation, no IT department, no API
key, no institutional registration. SAHI's recommendations assume
institutional capacity that most tier 2/3 hospitals do not yet have.
We design for the institution as it is, not as policy assumes it to be.

**3. Civil society as implementation mechanism.**
The cohort program demonstrates that SAHI's Recommendation 19 — designated
AI governance capacity — can be bootstrapped through structured civil
society programming rather than waiting for government mandate or
institutional budget. This is documented, replicable, and fundable.

---

## Language for External Communication

**For hospital leadership:**
"Institutional Mirror is designed to help your institution implement what
India's national SAHI strategy recommends for AI governance — without
requiring a dedicated AI team, external consultants, or new infrastructure."

**For policy actors and government partners:**
"The AI Collective Healthcare Governance Cohort operationalises SAHI's
Recommendation 19 — designated AI governance capacity within health
institutions — as a civil society mechanism for tier 2/3 hospitals that
cannot yet sustain a formal AI unit."

**For academic and research partners:**
"Our work addresses the implementation gap in SAHI: a national framework
strong on principles and silent on how resource-constrained institutions
are supposed to build the capacity those principles require."

**For funders:**
"SAHI has established the national policy mandate. The AI Collective
provides the civil society implementation mechanism and the open-access
tooling. Together, this is a complete response to one of SAHI's most
critical gaps."

---

## Citation Format

When citing SAHI in reports, papers, or presentations:

Ministry of Health and Family Welfare, Government of India. Strategy
for Artificial Intelligence in Healthcare for India (SAHI). Launched
at the India AI Impact Summit, February 17, 2026.

For specific recommendations:
SAHI (2026), Recommendation [N], Pillar [I-V], Section [number].

---

## Complete Coverage — all 32 recommendations *(appended 2026-06-12)*

The prose above covers the recommendations most central to the pitch. This matrix
completes the picture across **all 32**, so no recommendation is silently omitted.
Status: 🟢 directly addressed · 🟡 partial · ⚪ out of IM's institutional scope
(ecosystem/data-infrastructure/policy level — IM is an institutional tool, so these are
legitimately out of scope; saying so is discipline, not a gap). Detailed cross-map in
`STANDARDS_ALIGNMENT_MATRIX.md §2`.

| Pillar | # | Recommendation (abbrev.) | IM | Note |
|---|---|---|---|---|
| I | 1 | Risk-classify AI; proportional obligations | 🟢 | Low-risk by design (prose above) |
| I | 2 | Accountability so liability is allocable | 🟢 | Audit trail + Runtime-Authority bridge |
| I | 3 | Safety across lifecycle; safety/bias/interop/real-world metrics | 🟡 | Five signals; real-world metrics 🔴 (synthetic) |
| I | 4 | Representative training/validation data | ⚪ | IM trains no model |
| I | 5 | Assess & address inequity impact | 🟡 | Equity drift signal |
| I | 6 | Transparent; communicate use/limits/risk | 🟢 | Disclaimer + role translation |
| I | 7 | Post-deployment drift/bias monitoring | 🟢 | **Value-drift engine = institutional drift monitoring** |
| I | 8 | Cross-sector / centre–state coordination | ⚪ | Ecosystem-level |
| II | 9 | Data participation / min datasets | ⚪ | Data-ecosystem policy |
| II | 10 | Population-scale representativeness | ⚪ | Data-ecosystem policy |
| II | 11 | Health Data Quality Framework | ⚪ | Data-ecosystem policy |
| II | 12 | Privacy-preserving access; de-identification proportional to risk | 🟢 | Above the floor — **no personal data at all** |
| II | 13 | Cybersecurity standards, incident response, continuity | 🟡→🟢(V2) | V2 cybersecurity human-risk module; SAHI-13 is its anchor |
| II | 14 | ABDM-aligned interoperability | ⚪ | Conceptual alignment only |
| II | 15 | Data-sharing categories under legal basis | ⚪ | Data-policy level |
| III | 16 | Role-based AI competency framework | 🟡 | Role-aware reports = FRAC applied (prose above) |
| III | 17 | AI competencies in formal education | ⚪ | Curriculum-level |
| III | 18 | Capacity among regulators/auditors | 🟡 | Usable as governance-training artifact |
| III | 19 | **Designated AI units / nodal cells** | 🟢 | The tool such a unit runs (prose above) |
| III | 20 | Collaboration & knowledge-exchange | 🟡 | Cohort + Mirror-family grammar |
| III | 21 | Embed AI in workflows without increasing burden | 🟢 | IM *measures* the correction burden (SSS) |
| III | 22 | **Define human/AI roles; oversight & escalation** | 🟢 | Refusal + human authority (prose above) |
| IV | 23 | **Institutional Ethics Committees made AI-ready** | 🟢 | **IM's primary user; outputs are committee deliberation inputs** |
| IV | 24 | Research aligned to health priorities | ⚪ | Funding/policy-level |
| IV | 25 | Open/collaborative innovation | ⚪ | Ecosystem-level |
| IV | 26 | **Risk-proportionate evaluation: safety/fairness/usability/relevance/accuracy** | 🟢 | **IM *is* an evaluation-deliberation environment across these dimensions — strongest single alignment** |
| IV | 27 | Staged research→pilot funding | ⚪ | Funding-level |
| IV | 28 | **Trial designs w/ post-market monitoring, drift detection, feedback loops** | 🟢 | Drift + approval-gated self-learning loop |
| V | 29 | Public procurement prioritising safety/interop | ⚪ | Procurement-policy |
| V | 30 | Pilot-to-scale; testbeds/sandboxes/validation | 🟡 | IM is a governance-stress-testing sandbox |
| V | 31 | Cluster ecosystems anchored in public institutions | ⚪ | Ecosystem-level |
| V | 32 | Institutionalised ecosystem-learning platforms | ⚪ | Ecosystem-level |

**The five strongest alignments** (centrally answered, not merely touched): **Rec 7**
(drift monitoring), **Rec 22** (human/AI roles & escalation), **Rec 23** (AI-ready Ethics
Committees), **Rec 26** (risk-proportionate evaluation), **Rec 28** (post-market monitoring
+ drift + feedback). These are the defensible core of the "we implement what SAHI asked
for" claim — true precisely where IM operates (the institutional layer), not asserted
broadly.

**Honest bound (RULE-G2, VALIDATION §1):** IM does not *certify* SAHI compliance, rank any
institution, or substitute for institutional governance. The ~14 ⚪ recommendations are
ecosystem/data-infrastructure/policy concerns outside an institutional deliberation tool.
And no SAHI/NABH authority has reviewed these mappings — one assessor conversation remains
the right next step (SAHI's own open question on accepting simulation-generated governance
evidence).

**Part of the research-grade documentation set** (2026-06-12): grounded in a direct read of
SAHI (all 32 recommendations) and cross-referenced to `STANDARDS_ALIGNMENT_MATRIX.md`,
`RULE_SETS.md`, `VALIDATION_AND_LIMITATIONS.md`, and `CITATION_REGISTER.md` (NIST AI RMF:
Govern/Manage).

---

*Created April 2026; extended to all 32 recommendations and integrated with the research-
grade documentation set 2026-06-12 (Ouroboros Uno / Claude). Update when new SAHI guidance,
implementation rules, or BODH standards are published. A living alignment record.*
