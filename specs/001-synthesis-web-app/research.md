# Research: Synthesis Web App

**Branch**: `001-synthesis-web-app` | **Date**: 2025-01-31

Consolidated decisions and rationale for technical choices. All NEEDS CLARIFICATION from the plan are resolved using the user-stated stack (Next.js/Tailwind/React, Next/Vercel serverless, PostgreSQL, external AI/APIs, Vercel hosting) and common patterns.

---

## 1. Framework & Runtime

**Decision**: Next.js 16 (App Router), React 19, TypeScript; deploy to Vercel.

**Rationale**: User-specified stack; Next.js App Router provides server components, Route Handlers for API, and single codebase for UI + serverless. Vercel is the natural host for Next.js.

**Alternatives considered**: Separate React SPA + Node backend (rejected: more complexity, two deploys); Remix (rejected: stack specified Next.js).

---

## 2. Database

**Decision**: PostgreSQL via Vercel Postgres, Neon, or Supabase; use a single Postgres instance for users, resources, assignments, submissions, growth_reports, rubrics.

**Rationale**: User specified PostgreSQL; Vercel Postgres/Neon/Supabase all offer serverless-friendly Postgres with connection pooling. Single DB keeps ops simple and aligns with constitution.

**Alternatives considered**: SQLite (rejected: not ideal for serverless multi-instance); MongoDB (rejected: stack specified PostgreSQL).

---

## 3. Authentication

**Decision**: Use a standard auth provider (e.g. NextAuth.js with credentials or OAuth, or Clerk). Sufficient to identify the user and associate resources, assignments, and reports to that user (FR-011).

**Rationale**: Spec leaves auth method to implementation; NextAuth or Clerk integrate with Next.js and support session-based association of data to user. No custom auth needed for MVP.

**Alternatives considered**: Custom JWT/session (rejected: more work, higher risk); Auth0 (acceptable alternative if preferred).

---

## 4. File / Blob Storage

**Decision**: Use Vercel Blob (or S3-compatible store) for uploaded resources (PDF, images) and submission files (text + file/video storage in MVP). Store object key/URL in PostgreSQL; serve via signed URL or proxy if needed.

**Rationale**: Spec requires upload of Knowledge Anchors (text, PDF, images) and submission files (including video for storage). Serverless-friendly blob storage avoids storing large binaries in Postgres; Vercel Blob fits Vercel deploy.

**Alternatives considered**: Postgres BYTEA (rejected: bloats DB, poor for large files); external-only S3 (acceptable if team prefers).

---

## 5. AI / LLM Integration

**Decision**: Use an OpenAI-compatible API (OpenAI, or Vercel AI SDK with provider) for: (1) generating 5 MCQs from input text (Instant Challenge), (2) extracting topics from resources, (3) Learning Architect chat, (4) assignment generation (including from global knowledge when user has no uploads), (5) rubric-based grading and Growth Report, (6) follow-up assignment from gaps. Call from server-side only (Route Handlers or server actions).

**Rationale**: Spec requires AI-generated MCQs, Extracted Topics, Socratic chat, assignment generation from user or global knowledge, grading, and follow-up. Single provider keeps integration simple; server-side only protects keys and aligns with Next.js patterns.

**Alternatives considered**: Multiple specialized APIs (rejected: more complexity); client-side AI (rejected: key exposure, consistency).

---

## 6. Async Grading & Notifications

**Decision**: Grading runs asynchronously after "Submit for Grading." Options: (A) Vercel background function / queue (e.g. Vercel KV + consumer or Inngest), or (B) polled job table in Postgres (submission status: pending_grading → graded). Notify user when ready via: in-app indicator (e.g. badge on Assignment History or dashboard), optional email (e.g. Resend), and/or "check back" in Assignment History.

**Rationale**: Spec requires user to be able to leave after submit and be notified when Growth Report is ready. Async grading avoids timeouts; notification channels are implementation detail (in-app + optional email sufficient for MVP).

**Alternatives considered**: Synchronous grading with long timeout (rejected: poor UX, risk of timeout); push-only (rejected: in-app + history required for "check back").

---

## 7. API Shape

**Decision**: REST-style API via Next.js Route Handlers under `app/api/`. JSON request/response; auth via session/cookie. Key areas: instant-challenge (generate MCQs, submit quiz), resources (CRUD), assignments (create, list, get), submissions (save draft, submit), grading (trigger/status), reports (get). OpenAPI or markdown contracts in `contracts/`.

**Rationale**: Fits Next.js and serverless; REST is sufficient for CRUD and actions. No GraphQL for MVP to keep complexity low.

---

## 8. Testing

**Decision**: Unit/component tests with Jest or Vitest + React Testing Library; API tests via supertest or fetch against Route Handlers. E2E optional (Playwright) for critical flows. No NEEDS CLARIFICATION; exact runner is implementation choice.

**Rationale**: Spec and constitution emphasize testability; lightweight testing stack aligns with single-app structure.

---

## 9. Design System (Visual Identity)

**Decision**: Apply wireframe design system — "The Modern Laboratory": Deep Slate `#0F172A` surface, Emerald `#10B981` primary action, Amber `#F59E0B` secondary; Inter (or Montserrat) for UI, JetBrains Mono for technical accents; modular cards, Workbench focus mode (dim nav), subtle lattice/grid; Lucide or Heroicons; direct, performance-oriented tone.

**Rationale**: Wireframe specifies brand essence, palette, typography, layout patterns, and tone so implementation is consistent and on-brand.

**Alternatives considered**: Generic light theme (rejected: wireframe defines dark, focused aesthetic); defer design (rejected: design system reduces rework).

---

## Summary Table

| Area           | Decision                          | Rationale / Notes                    |
|----------------|-----------------------------------|--------------------------------------|
| Framework      | Next.js 16, React 19, TypeScript | User stack; App Router + Route Handlers |
| Database       | PostgreSQL (Vercel/Neon/Supabase)| User stack; single DB                |
| Auth           | NextAuth or Clerk                | Associate user to data; no custom auth |
| Blob storage   | Vercel Blob or S3-compatible     | Resources + submission files         |
| AI             | OpenAI-compatible, server-side   | MCQs, topics, chat, grading, follow-up |
| Async grading  | Background job + notify          | In-app + optional email + Assignment History |
| API            | REST, Next.js Route Handlers    | Under `app/api/`                     |
| Testing        | Jest/Vitest + RTL                | Unit/component + API tests           |
| Design system  | Wireframe tokens (plan.md)      | Modern Laboratory; Tailwind theme    |

All NEEDS CLARIFICATION from Technical Context are resolved; no blocking unknowns for Phase 1.
