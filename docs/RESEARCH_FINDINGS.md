# RESEARCH_FINDINGS.md — What the Evidence Says

## Purpose of this file

Three deep research documents inform this project:
1. AI Governance in Indian Healthcare: Failures, Landscape, Experience, and Institutional Good Practice
2. Feasibility Risks for a Cohort-Based AI Governance Program in Indian Hospitals (Delhi NCR, 2026)
3. Conceptual and Strategic Pitfalls in a Hospital-Based AI Governance Program in Indian Healthcare

This file distils the findings that directly affect how the Vercel app should
be framed, designed, and copy-written. Claude Code should read this before
writing any UI text, disclaimer language, or results display logic.

---

## Finding 1: The visibility paradox — the most important design constraint

The research finding with the most direct impact on UI design:

> "Transparency is not a panacea. Disclosure of failures without protective
> structures leads to blame, under-reporting, legal defensiveness, and moral
> injury among staff — not to institutional learning."

In Indian hospitals specifically, surfacing value gaps and trade-offs without
a "just culture" framework generates resistance and risk-management behaviour
rather than reflection.

**What this means for the UI:**

The results screen must never present findings as accusations or verdicts.
Every moral reckoning output — value drift, ethical debt, harm classification —
must be framed as a prompt for institutional reflection, not a performance grade.

Specific copy direction:
- NOT: "Your institution failed on Patient Dignity"
- YES: "A gap was detected between declared commitment to Patient Dignity and observed behaviour under pressure"

- NOT: "4 avoidable harms occurred"
- YES: "4 instances were classified as potentially avoidable — meaning alternatives existed. This is information for governance review, not attribution of fault."

- NOT: "Ethical debt: HIGH"
- YES: "Ethical debt has accumulated — moral weight that lingers from repeated compromises. This is a signal to examine what structural pressures created these decisions."

The framing throughout must be: *the system observed, not the system judged.*

---

## Finding 2: Governance washing is the biggest risk to the tool's credibility

The research documents "governance washing" extensively — institutions adopting
frameworks for NABH accreditation or investor narrative without actually using them.

Indicators of governance washing in practice:
- No defined decision rights or escalation paths
- No resourcing for implementation
- No monitoring or audit mechanisms
- No linkage to incentives or consequences
- Governance document filed and forgotten

**What this means for the UI:**

The tool must actively resist being used as a governance washing instrument.
This means:

1. The disclaimer must explicitly say the tool is for internal institutional
   self-reflection — not for external reporting, accreditation, or ranking.

2. The results screen should not produce a "governance score" that can be
   screenshot and shared with investors or accreditors. Resist any request
   to add a single composite number. This is already in GOAL.md — the research
   confirms why it matters.

3. Consider adding a line on the results screen:
   > "This output is a starting point for internal review — not a compliance
   > document. Its value depends entirely on what your institution does with it."

---

## Finding 3: Alert fatigue — 90-96% of AI alerts are ignored in clinical settings

The research documents that in busy clinical settings, 90–96% of AI/CDSS
alerts are ignored because they are too frequent, too generic, or misaligned
with workflow. This is directly relevant to how the Decision Inspector
presents information.

**What this means for Screen 3 (Decision Inspector):**

Do not show everything. Prioritise signal over volume.
- Lead with flagged events (ethical overrides, refusals, harm classifications)
- Default filter should show HIGH and CRITICAL severity events, not all events
- A clinician or administrator reviewing this in a meeting has 10 minutes,
  not 90 minutes
- "All events" should be an option, not the default

---

## Finding 4: Who actually uses governance frameworks in Indian hospitals

The research is specific: formal governance frameworks are used by leadership,
compliance officers, clinical governance committees, and IT/quality teams —
not by frontline clinicians directly. Frontline staff encounter governance
indirectly through tools, checklists, and workflows shaped by those frameworks.

**What this means for the UI:**

The primary user persona is not a frontline nurse or junior doctor.
It is a CMO, Medical Superintendent, Quality Head, or CIO in a tier 2/3
Indian hospital, likely presenting this to a committee or using it to
prepare for an ethics committee review.

Design implications:
- The results screen should be printable / presentable in a meeting (high contrast,
  clear section headings, nothing that requires hovering or interaction to understand)
- Export functionality matters for this audience — they want to take something away
- Language should be formal enough for a governance committee but not academic

---

## Finding 5: Value drift is systemic, not individual — the framing must reflect this

The research warns explicitly:

> "Value drift is often a property of misaligned systems and institutional logics,
> not of individual virtue. Over-emphasising drift can unintentionally personalise
> structural contradictions — under-resourcing, conflicting performance metrics —
> and lead to unfair blame on staff who have little control over constraints."

**What this means for UI copy:**

Every instance of "value drift" displayed must be contextualised as a system
property, not a people failing.

- NOT: "Staff behaviour diverged from declared values"
- YES: "The system's operational behaviour diverged from the institution's
  declared values — a pattern associated with structural pressure, not individual failure"

The synthesis insights section should include a standard note like:
> "Value drift reflects institutional conditions, not individual fault.
> These findings are most useful when examined alongside resourcing,
> workload, and policy constraints."

---

## Finding 6: The SAHI alignment — cite this, it matters

India's 2026 Strategy for Artificial Intelligence in Healthcare (SAHI)
explicitly calls for:
- Governance and accountability frameworks at the institutional level
- Validation, monitoring, and human oversight mechanisms
- Equity auditing and transparency requirements

The research confirms this is the national policy context the simulator
operates within. This is directly citable in the tool's about section.

**Suggested about/disclaimer copy:**

> "This simulator is designed for institutional governance and self-reflection,
> in alignment with India's 2026 SAHI strategy, which identifies institutional
> AI governance — not just national policy — as a critical gap in healthcare AI
> deployment."

---

## Finding 7: The "parachute" framing risk — one line that solves it

The research documents extensively that external tools brought into Indian
hospitals are experienced as extractive when they evaluate rather than support.

There is one line from the CONTEXT.md that directly addresses this, and it
should appear on the tool — verbatim:

> "This tool does not evaluate your hospital. It helps your hospital evaluate itself."

Place this prominently — on Screen 1 (before the user runs anything) and
again on Screen 2 (results). It is the single clearest statement of the
tool's posture.

---

## Finding 8: Moral injury is real and the Staff Stress Score validates it

The research documents that moral injury among healthcare workers —
psychological distress from being unable to act according to core values —
is increasingly documented and linked to AI and digital systems that force
clinicians to participate in care they perceive as wrong.

This directly validates one of the five metrics: the Staff Stress Score (SSS).

**What this means for the UI:**

The SSS card on Screen 2 deserves more explanatory context than the other
metrics. Consider a tooltip or expandable note:

> "Staff Stress Score tracks sustained workload pressure and the moral burden
> of repeated difficult decisions. Research links high staff stress in AI-assisted
> environments to moral injury — a form of psychological harm from being unable
> to act according to one's values. This metric exists because staff wellbeing
> is a governance concern, not just an HR one."

---

## Finding 9: Three most likely failure modes (relevant to how the tool positions itself)

The feasibility research identifies the three most likely failure modes for
any AI governance intervention in Indian hospitals:

1. Hospital partnership fails to materialise (access is blocked or stalls)
2. Clinician participation is insufficient (workload, no incentive)
3. The governance artefact is misaligned with the hospital's actual AI maturity

**What this means for the tool's framing:**

Failure mode 3 is the one the tool must explicitly address. Many Indian
tier 2/3 hospitals have limited AI deployment — they may be governing
hypothetical or nascent systems, not mature ones.

The tool should acknowledge this on Screen 1:

> "This simulation uses synthetic data and parameterised institutional profiles.
> It is designed to build governance literacy and surface structural trade-offs —
> regardless of whether your institution has deployed AI yet."

This is not a weakness — it is an explicit design choice. The tool helps
institutions develop governance capacity *before* they need it, which is
exactly when governance is most effective.

---

## Summary: what changes in the build based on this research

| Research finding | Build implication |
|---|---|
| Visibility paradox | All moral reckoning outputs framed as observations, never verdicts |
| Governance washing risk | No composite score, no "governance certificate" language |
| Alert fatigue | Decision Inspector defaults to HIGH/CRITICAL, not all events |
| Who uses governance | Design for CMO/committee presentation, not individual use |
| Value drift is systemic | All drift language attributes to system conditions, not people |
| SAHI alignment | About section cites SAHI explicitly |
| Parachute risk | "This tool does not evaluate your hospital" on both Screen 1 and 2 |
| Moral injury is real | SSS card gets expanded explanatory context |
| AI maturity gap | Screen 1 explains tool works regardless of current AI deployment |

---

---

## Finding 10: Patchy AI deployment — the tool must work for hospitals with minimal AI

From the fourth research document (operational feasibility assessment):

> "You may land in a hospital with minimal AI and be forced into hypothetical
> scenarios. Many hospitals have minimal or fragmented AI use and poor data
> infrastructure. Leaders often conflate 'AI governance' with general health IT
> governance or data protection, without a nuanced model lifecycle view."

This is the most common real-world scenario the tool will encounter.

**What this means for Screen 1:**

The tool must explicitly tell users it is valuable *before* AI is deployed,
not just after. Add to the intro copy:

> "This simulator works whether your institution has deployed AI systems or is
> still planning to. Governance literacy built before deployment is more
> effective than governance retrofitted after problems emerge."

This reframes a potential weakness (hypothetical scenarios) as a deliberate
design strength.

---

## Finding 11: The "form over substance" failure mode for governance artefacts

The feasibility research documents extensively how governance frameworks get
adopted "on paper" to satisfy accreditation or external expectations while
leaving practice unchanged. This is the specific failure mode the tool must
resist facilitating.

> "Your cohort could unintentionally produce a governance artefact that mainly
> serves symbolic purposes. The hospital can file your charter for accreditation
> reviews, but nothing changes in how AI tools are procured, validated, or monitored."

The research identifies what distinguishes genuine governance from performative:
- Defined decision rights and escalation paths (not just principles)
- Resourcing committed for implementation
- Monitoring and audit mechanisms built in
- Linkage to actual incentives or consequences

**What this means for the results screen:**

After the simulation results, the synthesis section should close with a
governance action prompt — not a score or grade, but a set of questions
the institution should take to its next governance review:

Suggested closing block on Screen 2:
> **"Questions for your next governance review"**
> - Which of the harms classified as avoidable are within your institution's
>   current capacity to prevent?
> - Where value drift was detected — what policy or resource constraint is
>   driving it?
> - Which tension signals, if unaddressed, are most likely to worsen?
>
> *These questions are more useful than the simulation scores. The scores show
> what happened in a model. The questions help you examine what's happening in
> your institution.*

This transforms the output from a document to be filed into a conversation
to be had — which is exactly what the research says governance must become
to be effective.

---

## Finding 12: The single-organizer risk — and what it means for the tool's credibility

The feasibility research identifies the single-organizer problem as the biggest
systemic vulnerability of the cohort program:

> "You are simultaneously the hospital relationship-holder, facilitator,
> content lead, and logistics owner. Any disruption amplifies the likelihood
> of all three failure modes."

**Why this is relevant to the Vercel build:**

The tool being publicly deployed on Vercel *directly mitigates* this risk.
A live URL that anyone can access means:
- The work exists independently of any one person
- Hospital contacts, cohort members, and future organizers can access it
  without the organizer being present
- It is evidence that cannot be "stalled in an MoU process"

This is worth stating explicitly in the tool's about section — not as
self-promotion, but as a design principle:

> "This tool is publicly available and openly accessible. No institutional
> relationship, MoU, or permission is required to run a simulation. Governance
> literacy should not depend on access."

---

## Updated summary table

| Research finding | Build implication |
|---|---|
| Visibility paradox | All moral reckoning outputs framed as observations, never verdicts |
| Governance washing risk | No composite score, no "governance certificate" language |
| Alert fatigue | Decision Inspector defaults to HIGH/CRITICAL, not all events |
| Who uses governance | Design for CMO/committee presentation, not individual use |
| Value drift is systemic | All drift language attributes to system conditions, not people |
| SAHI alignment | About section cites SAHI explicitly |
| Parachute risk | "This tool does not evaluate your hospital" on both Screen 1 and 2 |
| Moral injury is real | SSS card gets expanded explanatory context |
| AI maturity gap | Screen 1 explains tool works regardless of current AI deployment |
| Patchy AI deployment | Explicitly frame hypothetical use as a feature, not a limitation |
| Form over substance | Screen 2 closes with governance action questions, not just scores |
| Single-organizer risk | About section: tool is publicly accessible, no permission required |

---

*Distilled from four deep research documents, April 2026.*
*Source documents: AI Governance in Indian Healthcare (failures + landscape),*
*Feasibility Risks (Delhi NCR 2026), Conceptual and Strategic Pitfalls,*
*Operational Feasibility Assessment (direct feasibility read, April 2026).*
