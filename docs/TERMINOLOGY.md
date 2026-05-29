# TERMINOLOGY.md — Language Guide for Institutional Mirror

## Purpose

This file governs which terms to use in which context across the entire
application — UI copy, LLM prompts, report generation, glossary, and
disclaimers. It exists because the system uses original terminology that
is more expressive than academic equivalents, but some reader audiences
operate within established frameworks that use standard terms.

The rule is simple:
- Use our terms by default everywhere
- Switch to standard terms for Legal Counsel and Quality Lead report lenses
- Always define our terms on first use in any new context

---

## Term Mapping

### Value Drift

**Our term:** Value drift
**Literature equivalents:** Mission drift, mission deviation, value-practice gap
**Status:** KEEP OURS — more precise for real-time operational context

Our use is more specific than the literature. "Mission drift" in academic
work refers to organisations drifting from stated purpose over years due
to funding pressure. "Value drift" is the real-time gap between declared
and observed values under operational pressure — a different and more
useful concept.

**By role:**
- Medical Superintendent: "value drift"
- COO: "value drift"
- Quality Lead: "value-practice gap" (bridges to clinical quality vocabulary)
- Legal Counsel: "deviation from stated institutional values"
- Research: "value drift (cf. mission deviation literature)"

**Glossary definition (two sentences max):**
"Value drift measures the gap between the values an institution declares
and the values its decisions reveal under pressure. It is a structural
signal — it reflects resourcing and protocol, not individuals."

---

### Ethical Debt

**Our term:** Ethical debt
**Literature equivalents:** Moral residue (Jameton), accumulated moral distress
**Status:** KEEP OURS — original, intuitive, borrows usefully from technical debt

"Moral residue" is the closest academic term but is obscure and rooted in
individual psychology. "Ethical debt" is immediately understood, memorable,
and accurately describes something that accumulates across decisions and
compounds if unaddressed — exactly like technical debt.

**By role:**
- Medical Superintendent: "ethical debt"
- COO: "ethical debt" (the technical debt analogy lands well with this audience)
- Quality Lead: "accumulated governance burden"
- Legal Counsel: "documented pattern of value compromise"
- Research: "ethical debt (no direct literature equivalent — original construct)"

**Glossary definition:**
"Ethical debt is the moral weight that accumulates from repeated decisions
made under pressure that compromise declared values. Like technical debt,
it is manageable in small amounts and dangerous when it compounds silently."

---

### Moral Reckoning (layer name)

**Our term:** Moral reckoning
**Literature equivalents:** Ethics review, algorithmic accountability, AI audit,
governance review, patient safety analysis
**Status:** KEEP as system/layer name — but translate for each role in reports

"Ethics review" is bureaucratic. "Algorithmic accountability" is technical.
"AI audit" is backward-looking and compliance-flavoured. "Moral reckoning"
is accurate and evocative. Keep it as the technical name for the layer.

**By role (use in report section headers and narrative):**
- Medical Superintendent: "governance review"
- COO: "institutional performance analysis"
- Quality Lead: "patient safety analysis"
- Legal Counsel: "compliance and accountability review"
- Research: "moral reckoning layer analysis"

**Glossary definition:**
"The moral reckoning layer analyses every simulation decision for ethical
signals — value drift, harm classification, refusal events, and tension
patterns. It runs independently of the performance scoring layer."

---

### Forced Harm

**Our term:** Forced harm
**Literature equivalents:** Unavoidable adverse event, system-level harm,
capacity-constrained harm
**Status:** KEEP for general audiences — SWITCH for Legal and Quality lenses

"Unavoidable adverse event" is the WHO/NABH/ICMR standard term. It appears
in incident reporting frameworks, NABH accreditation standards, and legal
documentation. Legal Counsel and Quality Lead readers will recognise it
immediately and know how it maps to their existing obligations.

**By role:**
- Medical Superintendent: "forced harm"
- COO: "capacity-constrained harm"
- Quality Lead: "unavoidable adverse event" (WHO/NABH standard)
- Legal Counsel: "unavoidable adverse event" (maps to incident reporting SOPs)
- Research: "forced harm (cf. unavoidable adverse event in patient safety literature)"

**Glossary definition:**
"Forced harms are events where no feasible alternative existed given the
institution's actual capacity at the time. They are documented for
institutional awareness, not attribution of fault."

---

### Avoidable Harm

**Our term:** Avoidable harm
**Literature equivalents:** Preventable adverse event (WHO standard),
preventable harm
**Status:** KEEP for general audiences — SWITCH for Legal and Quality lenses

"Preventable adverse event" is the WHO-standard term used in NABH, ICMR,
and every patient safety framework in India and globally. Legal Counsel
and Quality Lead readers operate within this vocabulary daily.

**By role:**
- Medical Superintendent: "avoidable harm"
- COO: "avoidable harm"
- Quality Lead: "preventable adverse event" (WHO/NABH standard)
- Legal Counsel: "preventable adverse event" (maps to liability and
  incident reporting frameworks — using this term signals awareness of
  existing legal and accreditation obligations)
- Research: "avoidable harm (cf. preventable adverse event, WHO 2005)"

**Glossary definition:**
"Avoidable harms are events where the simulation identified a feasible
alternative that was not taken — meaning a protocol change, staffing
decision, or resource allocation could have prevented the outcome.
Only avoidable harms are within governance reach."

---

### Tension Signals

**Our term:** Tension signals
**Literature equivalents:** Pre-incident indicators, leading indicators,
ethical climate signals, early warning signals
**Status:** KEEP — augment with parenthetical in glossary and report

"Leading indicators" is the safety science term. "Ethical climate signals"
is the organisational psychology term. "Tension signals" is more expressive
and correctly frames these as unresolved structural conflicts, not just
metrics approaching thresholds.

**By role:**
- Medical Superintendent: "tension signals"
- COO: "leading indicators of governance stress"
- Quality Lead: "pre-incident indicators" (safety science vocabulary)
- Legal Counsel: "documented pre-incident signals"
- Research: "tension signals (cf. leading indicators in safety science)"

**Glossary definition:**
"Tension signals are unresolved structural conflicts detected during the
simulation — trade-offs between values that have not been consciously
resolved by governance. They are leading indicators of governance stress,
not errors."

---

### Institutional Mirror (product name)

**Our term:** Institutional Mirror
**Literature equivalents:** None — this is original
**Status:** PROTECT — do not replace, translate, or abbreviate

No equivalent exists in the literature. The closest concept is
"organisational learning" but that is far weaker. Institutional Mirror
describes something distinct: a tool that reflects institutional behaviour
back to the institution without external evaluation or ranking.

This name is the product's strongest asset. Use it consistently across
all roles, all contexts, all documentation.

The tagline that accompanies it — verbatim, always:
"This tool does not evaluate your hospital. It helps your hospital
evaluate itself."

---

### Refusal (system behaviour)

**Our term:** Refusal / system refusal
**Literature equivalents:** Human-in-the-loop escalation, deferred decision,
override event, safety stop
**Status:** KEEP — but frame differently by role

**By role:**
- Medical Superintendent: "escalation to human oversight"
- COO: "deferred decision requiring human review"
- Quality Lead: "safety escalation event"
- Legal Counsel: "documented escalation — decision withheld pending human review"
  (this framing is important for legal audiences — it demonstrates the system
  did not make a decision autonomously in ambiguous cases)
- Research: "refusal event (system declined to act autonomously)"

**Glossary definition:**
"A refusal is a decision the system declined to make autonomously and
escalated to human oversight. Refusals are governance signals, not
failures — they demonstrate that the system recognises the boundaries
of its own competence."

---

### Patient Safety Score (PSS)

**Standard term — no translation needed.**
Patient safety is universal vocabulary. Use "PSS" with the full name on
first reference, abbreviation thereafter.

**Glossary definition:**
"Patient Safety Score measures how consistently safe care was delivered
across all patients in this simulation run. It accounts for triage
breaches, escalation failures, and admission delays for critical patients."

---

### Patient Experience Score (PES)

**Standard term — no translation needed.**

**Glossary definition:**
"Patient Experience Score reflects waiting times, communication quality,
and dignity preserved throughout care. It is distinct from clinical
outcomes — a patient can be clinically safe and experientially harmed."

---

### Staff Stress Score (SSS)

**Our framing, standard adjacent.**
"Staff wellbeing" and "moral distress" are the literature terms.
"Staff Stress Score" is operational and measurable. Keep it.

**By role:**
- Medical Superintendent / Quality Lead: note the link to moral injury research
- Legal Counsel: "staff welfare indicator — relevant to duty of care obligations"

**Glossary definition:**
"Staff Stress Score tracks cumulative cognitive and moral load on clinical
staff across the simulation. Research links sustained high staff stress in
AI-assisted environments to moral injury — psychological harm from being
unable to act according to one's values. This metric exists because staff
wellbeing is a governance concern, not just an HR one."

---

### Ethics Intervention Count (EIC)

**Our term — no direct standard equivalent.**

**Critical framing note:** EIC is not a penalty metric. A high EIC means
the governance layer was active. A zero EIC in a high-acuity run is the
warning sign, not a high EIC.

**Glossary definition:**
"Ethics Intervention Count records how many times the simulation triggered
a governance override or deferred to human judgement. A higher count means
the moral reckoning layer was actively engaged. Zero EIC in a high-pressure
run may indicate that harms were absorbed silently rather than flagged."

---

### System Throughput Index (STI)

**Standard adjacent — throughput is universal operational vocabulary.**

**Glossary definition:**
"System Throughput Index measures how efficiently the emergency department
processed patient volume in this run. High throughput at the cost of high
ethical debt or value drift is the pattern this tool is designed to surface."

---

## LLM Prompt Instructions

When generating role-specific report narratives, the LLM must use the
correct term for the role. Pass this mapping in the system prompt:

```
TERMINOLOGY RULES FOR THIS ROLE:
- [role]: use the following substitutions:
  - "avoidable harm" → [role-specific term]
  - "forced harm" → [role-specific term]
  - "moral reckoning" → [role-specific term]
  - "tension signals" → [role-specific term]
  [etc. from table above]

Do not use terms outside this list. Do not invent synonyms.
```

For the Legal Counsel role specifically, add:
```
This reader operates within NABH accreditation standards and Indian
healthcare law. Use "preventable adverse event" (not "avoidable harm"),
"documented escalation" (not "refusal"), and "deviation from stated
institutional values" (not "value drift"). These are the terms that map
to their existing incident reporting and legal documentation frameworks.
```

---

## What Never Changes Regardless of Role

These phrases appear verbatim in every role, every context, every report:

1. "This tool does not evaluate your hospital. It helps your hospital
   evaluate itself."

2. "What did this cost us, and why?"

3. "Value drift reflects institutional conditions, not individual fault."

4. "Forced gaps reflect hard capacity constraints. Avoidable gaps reflect
   allocation decisions. Only avoidable gaps are within governance reach."

5. The ontological disclaimer — full text, every page.

---

*Created April 2026. Governs all language decisions in Institutional Mirror.*
*Update this file before updating UI copy, LLM prompts, or the glossary.*
