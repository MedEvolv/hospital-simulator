# CONTEXT.md — Strategic & Audience Context for the Build

## Read this alongside GOAL.md. This file explains the *why* behind the what.

This document captures context from extended brainstorming sessions that shaped
how this simulator should be positioned, who it is for, and what it needs to
communicate beyond pure functionality. It affects UI copy, framing, and
prioritisation decisions.

---

## This Vercel deployment has two audiences, not one

**Audience 1: Hackathon judges (Zero to Agent, May 3 deadline)**
Judged on usefulness, technical execution, and originality. Covered in GOAL.md.

**Audience 2: Real stakeholders who will see this URL within days of it going live**

- **Parishrut Jassal** — Founder, GovernAI. TEDx Speaker. Working Group Member
  on AI Governance for the Government of Himachal Pradesh. He is confirmed as
  an expert practitioner for Session 1 of the AI Collective Healthcare Governance
  Cohort program. He will be sent this URL. He needs to see a tool that is
  serious about governance — not a demo, not a toy.

- **Utkarsh Luthra** — CEO, Medoc Health. A close personal contact. Medoc
  builds AI-powered tools for doctors and integrated management for hospitals,
  focused on tier 2/3 Indian hospitals. There is an active conversation about
  a Medoc × AI Collective governance collaboration. This URL is part of
  establishing credibility for that conversation.

- **Masters Union (Gurugram)** — A potential institutional partner for the
  cohort program. Practical, industry-connected, non-traditional. A Vercel URL
  is evidence that the work is real, not a proposal.

- **Hospital leadership at a Delhi NCR hospital** — the target institution for
  the cohort's embedded program. When the program brief is presented, this URL
  demonstrates what "governance tooling" actually means in practice.

The deployment must hold up in a room, not just in a browser tab. Clinicians,
policy people, and hospital administrators will open this. The language, framing,
and visual tone need to reflect that.

---

## The target institution profile (critical for UI copy and framing)

This tool is built for **tier 2 and tier 3 Indian hospitals** — not enterprise
health systems, not AIIMS-scale institutions.

What this means practically:
- These hospitals are resource-constrained. They are not over-governed —
  they often have no formal AI governance at all.
- They respond to the words "manual process," "audit trail," and "ethical
  accountability" — not to "optimization" or "efficiency."
- Hospital leadership in this context is often a Medical Superintendent or
  CMO who is skeptical of external frameworks that feel imported or academic.
- The fear is not "our AI is wrong" — it is "we don't know what our system
  is actually doing, and we'll be held responsible if something goes wrong."

**The UI should speak to this fear directly.** The value proposition is not
performance improvement. It is: *you can see what happened, why it happened,
and what it cost you* — before someone else points it out.

---

## Language that has been established and stress-tested

These phrases have been used consistently across all design and communication
work on this project. Use them verbatim in UI copy wherever appropriate.
Do not paraphrase or "improve" them.

**Core thesis:**
> "What did this cost us, and why?"

**What the system is:**
> "An institutional mirror, not an optimiser."

**What it reveals:**
> "The gap between declared values and operational behaviour."

**What it prevents:**
> "Institutional self-deception."

**Why it matters:**
> "Hospitals rarely fail because they choose wrong. They fail because they lose
> sight of the gap between who they believe they are and how they're behaving
> under pressure."

**What makes it different from dashboards:**
> "High scores can hide ethical costs. This system shows what the metrics don't."

These phrases should appear in:
- The landing page (Screen 1) — establish the thesis before the user runs anything
- The results dashboard (Screen 2) — reinforce after they see their data
- The about/disclaimer section — anchor the ontological position

---

## The cohort program context (why this matters beyond the hackathon)

The AI Collective Delhi Chapter is running India's first embedded healthcare
AI governance cohort program. Structure:

- **Session 1 (Phase 1, May 2026):** 30-person public launch event in Delhi NCR.
  Two expert practitioners as provocateurs — Parishrut Jassal (AI governance)
  and a digital health practitioner. Three real-world case breakouts.
  This simulator may be used as a live demo or discussion anchor.

- **Sessions 2–6 (Phase 2, Sep 2026 onwards):** The embedded cohort design
  has been adjusted based on feasibility research. Rather than 5 weekends
  fully embedded inside one hospital (original plan), the revised minimum
  viable version is 3 intensive weekends with 1–2 hospital clinicians in an
  advisory role rather than full host partners. The first cohort is explicitly
  a pilot — the goal is to generate credible material and relationships for a
  more formal embedded partnership in a subsequent, better-resourced cohort.
  This is not a retreat from ambition — it is what the evidence says actually
  works in Indian hospital settings.

**What this means for the build:**
The simulator is not just a hackathon entry. It is the conceptual foundation
of a real governance program. The Vercel URL is the proof-of-concept that
makes hospital outreach credible. It needs to be something you can open in
a presentation and say: "This is the kind of visibility we're proposing to
bring to your institution."

Design implication: **The tool must be presentable on a projector in a room.**
Contrast, font size, and layout must hold up at presentation scale. Test it
at 1280×720 as well as at standard desktop.

---

## What the simulator is NOT (enforce this in UI copy)

This has been explicitly stress-tested against the following risks:

- **Governance washing risk:** Hospitals might want the output for NABH
  accreditation or investor narrative without actually using it. The tool
  should not facilitate this. Framing should emphasise what the tool reveals,
  not what it produces on paper.

- **Austerity justification risk:** The forced vs avoidable harm distinction
  exists precisely to prevent the tool from being used to say "nothing could
  have been done." Avoidable harms must be clearly labelled as avoidable,
  with what could have prevented them.

- **Academic/parachute perception risk:** External tools brought into Indian
  hospitals are often perceived as extractive — a team comes in, takes data,
  produces a report, leaves. The framing must emphasise that the tool is for
  the institution's own self-awareness, not for external evaluation.

**A line worth considering for the about section:**
> "This tool does not evaluate your hospital. It helps your hospital evaluate itself."

---

## Positioning of this work in a professional context

This project is the primary portfolio evidence for a healthcare AI product
strategist transitioning out of clinical practice. It is described professionally
as:

> "A governance-grade discrete event simulation system modelling patient flow,
> triage decisions, and ethical trade-offs in hospital operations. Features value
> drift detection, ethical debt accumulation tracking, and a moral reckoning layer
> that surfaces the gap between declared institutional values and operational
> behaviour. 13 governance keystones documented. Production-ready."

The Vercel URL will be the Featured link on a LinkedIn profile and shared in
outreach to PM/product roles at healthcare AI companies including Innovaccer
and HealthPlix.

**This means the tool must make a strong first impression to someone who has
never heard of it and has 30 seconds of attention.** Screen 1 cannot just be
a form. It needs to communicate what the tool is and why it matters in the
first viewport — before the user has run anything.

Consider adding a 3–4 line intro section at the top of Screen 1 that explains
the thesis. Something like:

> "Most hospital performance tools tell you how well you're doing.
> This one tells you what it cost you to get there — and whether the costs
> were unavoidable. Run a simulation, pick an institutional profile, and see
> what your decisions actually produced."

---

## One more thing: the name

The project is sometimes referred to as the "Living Hospital Orchestration
Simulator" (from the engineering docs) and sometimes as the "Hospital Simulator"
(colloquially). For the Vercel deployment, consider a cleaner title:

**Suggested:** "Institutional Mirror — Hospital Governance Simulator"

Or simply use the thesis as the title: **"What did this cost us?"**

This is a decision to raise with the builder — do not pick one unilaterally.
Ask: "What do you want the browser tab and the page title to say?"

---

*This document synthesised from design sessions, brainstorming, and
communication strategy work conducted January–April 2026.*
*Last updated: April 25, 2026.*
