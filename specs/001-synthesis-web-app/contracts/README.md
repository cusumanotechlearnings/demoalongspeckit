# API Contracts: Synthesis Web App

**Branch**: `001-synthesis-web-app` | **Date**: 2025-01-31

REST-style API implemented via Next.js Route Handlers under `app/api/`. Auth: session/cookie; unauthenticated access only for Instant Challenge (generate + take quiz); "Save Results" triggers auth.

- **instant-challenge.md** — Landing: generate MCQs from text; submit quiz (optional save requires auth).
- **resources.md** — CRUD for Knowledge Anchors (auth required).
- **assignments.md** — Create, list, get assignments (auth required).
- **submissions.md** — Save draft, submit for grading (auth required).
- **reports.md** — Get Growth Report; follow-up from gaps (auth required).

Grading is asynchronous; see submissions.md and reports.md for status and notification behavior.
