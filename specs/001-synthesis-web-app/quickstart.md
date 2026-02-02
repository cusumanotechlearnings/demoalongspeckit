# Quickstart: Synthesis Web App

**Branch**: `001-synthesis-web-app` | **Date**: 2025-01-31

Minimal steps to run the project locally and validate key flows. Assumes implementation follows the plan and contracts.

---

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm, yarn, or pnpm
- PostgreSQL instance (local, Vercel Postgres, Neon, or Supabase)
- (Optional) OpenAI or compatible API key for AI features

---

## Environment

Create `.env.local` at repo root (or use `.env.example` as template):

```bash
# Database (PostgreSQL connection string)
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Auth (e.g. NextAuth)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# AI (e.g. OpenAI-compatible)
OPENAI_API_KEY="sk-..."

# Blob storage (e.g. Vercel Blob)
BLOB_READ_WRITE_TOKEN="..."
```

Exact variable names depend on implementation (NextAuth, Vercel Blob, etc.). See implementation for required keys.

---

## Install and run

```bash
# From repo root
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Landing page should show Instant Challenge input.

---

## Database setup

1. Create PostgreSQL database and set `DATABASE_URL`.
2. Run migrations (implementation will provide: e.g. `npx prisma migrate dev` or SQL scripts under `scripts/` or `lib/db/schema`).
3. Ensure tables exist for: users, resources, assignments, submissions, growth_reports, rubrics (or equivalent; see data-model.md).

---

## Key flows to validate

1. **Instant Challenge (unauthenticated)**  
   Paste text on landing → request challenge → receive 5 MCQs → answer → see result. Optional: tap "Save Results" → auth modal.

2. **Auth + Dashboard**  
   Sign in → see sidebar (Dashboard, Resource Library, Assignment History, Peer Directory) and resource feed. Action Hub: Learning Architect entry, Quick Dictate.

3. **Resource**  
   Upload or add a Knowledge Anchor → see it in Resource Library with date and Extracted Topics (or "Uncategorized").

4. **Assignment + Workbench**  
   Create assignment (e.g. Quick Dictate "test on X") → open Workbench → enter text or upload file → Save for Later → return → Submit for Grading.

5. **Growth Report**  
   After submit, leave; when notified or on return, open Assignment History / report → see score, competency level, rubric breakdown → "Generate follow-up based on gaps" → new assignment.

6. **Retakes**  
   From same assignment, start another attempt → new submission → new Growth Report; Assignment History shows past attempts and retakes.

---

## Build and deploy (Vercel)

```bash
npm run build
```

Deploy to Vercel (connect repo or `vercel` CLI). Set env vars in Vercel project settings. Ensure PostgreSQL and blob storage are reachable from serverless (connection pooling recommended).

---

## References

- **Spec**: [spec.md](../spec.md)
- **Plan**: [plan.md](../plan.md)
- **Data model**: [data-model.md](../data-model.md)
- **API contracts**: [contracts/](../contracts/)
