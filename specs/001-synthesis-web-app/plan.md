# Implementation Plan: Synthesis Web App

**Branch**: `001-synthesis-web-app` | **Date**: 2025-01-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-synthesis-web-app/spec.md` + wireframe (landing, dashboard, Growth Report, design system).

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

Synthesis is an AI-powered personal development web app that turns user "consumption signals" (text, PDFs, images) into a Knowledge Graph and generates assignments (e.g. 5 MCQs, case studies). Users can take an Instant Challenge on the landing (unauthenticated), sign in to save resources and results, use a Learning Architect chat and Quick Dictate to get assignments, work in a Workbench (draft/submit), and receive asynchronous Growth Reports with rubric breakdown and follow-up. Technical approach: single Next.js app (App Router) on Vercel with serverless API routes, PostgreSQL for persistence, and external AI/LLM for content generation and grading; async grading with notify-when-ready. Stack: Next.js/Tailwind/React (client), Next/Vercel serverless, PostgreSQL, external AI/APIs, Vercel hosting.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 16.x, React 19.x  
**Primary Dependencies**: Next.js (App Router), React, Tailwind CSS 4, serverless API routes (Next.js Route Handlers), PostgreSQL client (e.g. `@vercel/postgres` or `pg`), external AI API (e.g. OpenAI-compatible)  
**Storage**: PostgreSQL (Vercel Postgres, Neon, or Supabase); file/blob storage for uploads (Vercel Blob or S3-compatible)  
**Testing**: Jest or Vitest, React Testing Library; optional Playwright for E2E  
**Target Platform**: Web (browser); deploy to Vercel  
**Project Type**: Web (single Next.js full-stack app at repo root)  
**Performance Goals**: Instant Challenge completable in &lt;3 min; resource upload visible in &lt;2 min; Learning Architect / Quick Dictate response within ~1 min; Growth Report delivered asynchronously with clear loading/retry  
**Constraints**: Reasonable file size limits for resources and submissions; clear error/loading states; no infinite spinners  
**Scale/Scope**: Standard SaaS; data retained until user deletes or account closed

## Design System (Visual Identity)

Per wireframe: **"The Modern Laboratory"** — professional, high-focus, precise; clean, performance-driven aesthetic.

| Area | Tokens / Guidance |
|------|-------------------|
| **Surface/Background** | `#0F172A` (Deep Slate) — calm, focused environment |
| **Primary Action (Growth)** | `#10B981` (Emerald) — "Start Learning," correct answers, progress bars |
| **Secondary Action (Mental Energy)** | `#F59E0B` (Amber) — "Generate Challenge," Synthesis Mode, highlights |
| **Text** | `#F8FAFC` (Off-white) primary; `#94A3B8` (Muted Blue-Grey) secondary labels |
| **Display/Headers** | Sans-serif, geometric (Inter or Montserrat); Bold (700) for section titles |
| **Body/UI** | Inter |
| **Technical Accents** | JetBrains Mono — tags, rubric criteria, data points ("Knowledge Graph" feel) |
| **Layout** | Modular card system (dashboard); Workbench = focus mode (dim/hide nav); subtle lattice/grid patterns for Knowledge Graph feel |
| **Icons** | Minimalist thin-line (Lucide or Heroicons); data visualizations over stock photography |
| **Tone** | Direct, objective, empowering; avoid flowery or cutesy copy |

Implementation: apply via Tailwind (e.g. `globals.css` CSS variables or Tailwind theme) and reuse in components; keep tokens in one place for consistency.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Simplicity & Readability**: Plan MUST favor clean, simple structure and regular commenting.
- **Performance & UX**: Plan MUST support optimized load speeds and good user experience.
- **Single-File Preference**: New files/folders MUST be justified; prefer single-file or minimal structure.
- **Educational Commenting**: Plan MUST include commenting that explains what and why for newcomers.

## Project Structure

### Documentation (this feature)

```text
specs/001-synthesis-web-app/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks - not created by plan)
```

### Source Code (repository root)

```text
app/
├── (landing)/           # Landing: Instant Challenge input, quiz UI, auth modal trigger
├── (dashboard)/         # Auth layout: sidebar, resource feed, Action Hub
├── api/                 # Serverless API routes (Route Handlers)
│   ├── auth/
│   ├── instant-challenge/
│   ├── resources/
│   ├── assignments/
│   ├── submissions/
│   └── reports/
├── globals.css
├── layout.tsx
└── page.tsx

lib/
├── db.ts
├── ai.ts
└── storage.ts

public/
```

**Structure Decision**: Single Next.js App Router app. All UI and API under `app/` and `lib/` at repo root. No separate backend; serverless = Next.js Route Handlers. Aligns with constitution single-file preference.

## Complexity Tracking

> No constitution violations. Single app, minimal extra abstraction.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| —         | —          | —                                   |
