# hospital-simulator

A governance simulator for hospital emergency departments — built for NABH-accredited and pursuing institutions in India.

## What it does

Runs a synthetic patient-flow simulation and surfaces the ethical debt, value drift, and governance tensions that standard throughput metrics hide. Designed as a rehearsal tool before AI deployment in clinical settings.

## Stack

- **Frontend / API routes**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Simulation engine**: Python (Vercel serverless), event-sourced architecture
- **AI enrichment**: DeepSeek (`deepseek-v4-flash`) for patient profiles and governance reports
- **Deployment**: Vercel

## Structure

```
vercel-app/
  api/                  # Python simulation engine (Vercel serverless)
  app/                  # Next.js App Router pages + API routes
    page.tsx            # Home / configure simulation
    survey/             # NABH context survey
    results/            # Patient flow replay + metrics
    report/             # Role-specific AI-generated report
    inspector/          # Decision-level event inspector
  components/           # Shared React components
  lib/types.ts          # Shared TypeScript types
```
