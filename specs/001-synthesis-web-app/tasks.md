# Tasks: Synthesis Web App

**Input**: Design documents from `specs/001-synthesis-web-app/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested in the feature specification; no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **This project**: Next.js App Router at repo root — `app/`, `lib/` (see plan.md)
- API routes: `app/api/*/route.ts`
- UI: `app/(landing)/`, `app/(dashboard)/`, components under `app/` or shared

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, basic structure, and design system per plan

- [X] T001 Create API route directories per plan: app/api/instant-challenge, app/api/resources, app/api/assignments, app/api/submissions, app/api/reports, app/api/auth (or document NextAuth/Clerk routes)
- [X] T002 Add dependencies to package.json: PostgreSQL client (@vercel/postgres or pg), AI SDK or OpenAI-compatible client, auth (next-auth or @clerk/nextjs), blob storage (e.g. @vercel/blob) per research.md
- [X] T003 [P] Configure ESLint and Prettier (or existing lint) in eslint.config.mjs / .prettierrc; ensure constitution commenting and simplicity are lint-friendly
- [X] T004 [P] Apply design system per plan.md Design System: add CSS variables or Tailwind theme in app/globals.css (and/or tailwind.config) for surface #0F172A, primary #10B981, secondary #F59E0B, text #F8FAFC / #94A3B8; Inter and JetBrains Mono fonts so landing and dashboard use "Modern Laboratory" aesthetic

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Setup PostgreSQL schema and migrations: tables for users, resources, assignments, submissions, growth_reports, rubrics per data-model.md (e.g. lib/db/schema.sql or Prisma/Drizzle migrations)
- [X] T006 [P] Implement PostgreSQL client in lib/db.ts (connection pool, query helpers; add comments per constitution)
- [X] T007 [P] Implement AI/LLM client in lib/ai.ts for generating MCQs, extracting topics, grading (OpenAI-compatible; server-side only; add comments per constitution)
- [X] T008 [P] Implement blob/storage client in lib/storage.ts for resource and submission file uploads (Vercel Blob or S3-compatible; add comments per constitution)
- [X] T009 Implement authentication (NextAuth.js or Clerk) in app/api/auth/ or provider layout: session, sign-in/sign-up, associate user id to requests per research.md
- [X] T010 Add .env.example with DATABASE_URL, NEXTAUTH_* or CLERK_*, OPENAI_API_KEY, BLOB_* (or equivalent) per quickstart.md
- [X] T011 Add shared API error and response helpers (e.g. lib/api.ts): consistent JSON error messages, loading/retry guidance per spec edge cases

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Resource Ingest & Instant Challenge (Priority: P1) 🎯 MVP

**Goal**: Landing page: paste text → get 5 MCQs → take quiz; "Save Results & Get Detailed Feedback" triggers auth modal. No account required for Instant Challenge.

**Independent Test**: Paste text on landing, receive 5 MCQs, complete quiz, tap "Save Results" → auth modal appears.

### Implementation for User Story 1

- [X] T012 [US1] Implement landing page with Instant Challenge input in app/page.tsx (or app/(landing)/page.tsx): high-prominence text area, "Generate Challenge" (or equivalent), clear empty/invalid message per spec
- [X] T013 [US1] Implement POST app/api/instant-challenge/generate/route.ts: accept { input } body, call lib/ai.ts to generate 5 MCQs, return { items }; 400 for empty/invalid, 502/503 with clear error for AI unavailable per contracts/instant-challenge.md
- [X] T014 [US1] Implement Quiz UI component: display 5 MCQ items, collect answers, submit to backend; file under app/ or app/(landing)/ (e.g. app/components/Quiz.tsx or inline in page)
- [X] T015 [US1] Implement POST app/api/instant-challenge/submit/route.ts: accept answers, return score (and optional feedback); no auth required per contracts/instant-challenge.md
- [X] T016 [US1] Add "Save Results & Get Detailed Feedback" button that opens auth modal (client state or route); wire to auth provider sign-in flow per FR-002
- [X] T017 [US1] Add validation and user-facing error messages for empty input and AI errors in app/page.tsx and API routes per spec edge cases

**Checkpoint**: User Story 1 is fully functional; anonymous Instant Challenge works; "Save Results" triggers auth

---

## Phase 4: User Story 2 - Authentication & Dashboard (Priority: P1)

**Goal**: Signed-in user sees dashboard with sidebar (Dashboard, Resource Library, Assignment History, Peer Directory), resource feed (thumbnail, date, Extracted Topics), and Action Hub (Learning Architect entry, Quick Dictate).

**Independent Test**: Sign in, see sidebar and resource feed area; upload one resource, see it as card with date and Extracted Topics; see Action Hub with Learning Architect and Quick Dictate entry points.

### Implementation for User Story 2

- [X] T018 [US2] Implement dashboard layout with sidebar in app/(dashboard)/layout.tsx: nav items Dashboard (Home), Resource Library, Assignment History, Peer Directory per FR-004
- [X] T019 [US2] Protect dashboard routes: redirect unauthenticated users to sign-in (middleware or layout check using auth from T009)
- [X] T020 [US2] Implement GET app/api/resources/route.ts: list resources for authenticated user, return items with id, type, title, contentRef, thumbnailRef, extractedTopics, createdAt per contracts/resources.md
- [X] T021 [US2] Implement POST app/api/resources/route.ts: create resource (text or file upload), store in DB and blob via lib/storage.ts, derive or set extractedTopics (e.g. call lib/ai.ts or ["Uncategorized"]), return resource per contracts/resources.md and data-model.md
- [X] T022 [US2] Implement resource feed UI in app/(dashboard)/page.tsx (or Resource Library page): grid of cards showing thumbnail (or placeholder), date, Extracted Topics per FR-005
- [X] T023 [US2] Implement Action Hub component: Learning Architect (Socratic) entry point (button or link) and Quick Dictate input/entry (e.g. "I want a test on X") in dashboard per FR-006

**Checkpoint**: User Story 2 works; dashboard, resource CRUD, feed, and Action Hub are usable

---

## Phase 5: User Story 3 - Learning Architect & Quick Dictate (Priority: P2)

**Goal**: Learning Architect chat overlay helps user choose quiz vs case study; Quick Dictate "I want a test on X" creates or surfaces an assignment (using global knowledge when no/few resources).

**Independent Test**: Open Learning Architect overlay, converse; use Quick Dictate with a topic, receive generated assignment (or clear path). With no uploads, assignment still generated from global knowledge.

### Implementation for User Story 3

- [X] T024 [US3] Implement Learning Architect overlay component: chat UI (messages + input), open/close from Action Hub button, in app/(dashboard)/ or shared component (e.g. app/(dashboard)/LearningArchitectOverlay.tsx)
- [X] T025 [US3] Implement chat API or server action for Learning Architect: accept message(s), call lib/ai.ts for Socratic suggestion (quiz vs case study based on user resources), return response per FR-006 and spec
- [X] T026 [US3] Implement POST app/api/assignments/route.ts: accept { topic } or { topic, resourceIds }; when no/few resources use global knowledge via lib/ai.ts; create Assignment in DB, return assignment per contracts/assignments.md and FR-007
- [X] T027 [US3] Wire Quick Dictate UI to POST /api/assignments: on submit create assignment, then navigate to assignment or Workbench entry per contracts/assignments.md

**Checkpoint**: User Story 3 works; Learning Architect chat and Quick Dictate produce assignments (including from global knowledge)

---

## Phase 6: User Story 4 - Assignments & Workbench (Priority: P2)

**Goal**: Workbench with progress, large text area and/or file upload, "Save for Later" and "Submit for Grading"; draft persisted; submit triggers async grading; user can leave and be notified when report ready.

**Independent Test**: Open an assignment, see Workbench with progress and text/file area; Save for Later, return and see draft; Submit for Grading, leave; later see report ready (in-app or Assignment History).

### Implementation for User Story 4

- [X] T028 [US4] Implement Workbench page/component: progress indicator, large text area and file upload (video allowed for storage in MVP), "Save for Later" and "Submit for Grading" buttons in app/(dashboard)/workbench/[assignmentId]/page.tsx (or equivalent) per FR-008
- [X] T029 [US4] Implement GET/POST for submission draft: GET app/api/assignments/[id]/submissions/draft/route.ts (or list and pick draft), POST app/api/assignments/[id]/submissions/route.ts to create/update draft (bodyText, fileRef) per contracts/submissions.md
- [X] T030 [US4] Implement POST app/api/submissions/[id]/submit/route.ts: set state to submitted, set grading_status to pending, trigger async grading job (queue or background), return 200 per contracts/submissions.md and FR-009
- [X] T031 [US4] Implement Assignment History: list assignments and submissions (past attempts and retakes) in app/(dashboard)/assignment-history/ or dashboard sidebar link; GET app/api/assignments/route.ts and per-assignment submissions per FR-013

**Checkpoint**: User Story 4 works; Workbench, draft save, submit for grading, and Assignment History with retakes are functional

---

## Phase 7: User Story 5 - Growth Report & Follow-up (Priority: P2)

**Goal**: Growth Report shows score, competency level, rubric breakdown; "Generate follow-up based on gaps" creates follow-up assignment. Async grading completes in background; user notified when report ready.

**Independent Test**: After grading completes, open report (from notification or Assignment History); see score, competency level, rubric table; tap "Generate follow-up based on gaps" and get new assignment.

### Implementation for User Story 5

- [X] T032 [US5] Implement async grading job: on submission submitted, run grading (call lib/ai.ts with rubric), write Growth Report to DB (score, competency_level, rubric_breakdown), set grading_status to graded; on failure set grading_status to failed; use background function, queue, or polled job per research.md
- [X] T033 [US5] Implement GET app/api/reports/[submissionId]/route.ts: return Growth Report if grading_status is graded; return 202 with status pending/grading if not yet ready per contracts/reports.md
- [X] T034 [US5] Implement Growth Report page: display score, competency level (e.g. Novice, Competent, Expert), rubric breakdown table/list in app/(dashboard)/reports/[submissionId]/page.tsx (or equivalent) per FR-009
- [X] T035 [US5] Implement POST app/api/reports/[reportId]/follow-up/route.ts: create new assignment targeting weak areas from rubric_breakdown, return assignmentId per contracts/reports.md and FR-010
- [X] T036 [US5] Add "Generate follow-up based on gaps" button on Growth Report page that calls POST follow-up and navigates to new assignment Workbench
- [X] T037 [US5] Implement notification when report ready: in-app indicator (e.g. badge on Assignment History or dashboard) and/or poll GET /api/reports/[submissionId] until 200; show clear status and retry on grading failure per FR-009 and spec edge cases

**Checkpoint**: User Story 5 works; Growth Report, rubric breakdown, follow-up from gaps, and async notification are functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Align with constitution (simplicity, commenting, single-file preference, performance/UX); docs and validation

- [X] T038 [P] Add or improve educational comments in lib/db.ts, lib/ai.ts, lib/storage.ts and key app/ files: explain what and why for newcomers per constitution
- [X] T039 Run quickstart.md validation: verify env, install, dev, and key flows (Instant Challenge, auth, resource upload, assignment, submit, report) per specs/001-synthesis-web-app/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (T006 lib/ai.ts, T009 auth for modal only)
- **User Story 2 (Phase 4)**: Depends on Foundational (T005–T011); needs Resource entity and auth
- **User Story 3 (Phase 5)**: Depends on Foundational and US2 (dashboard, Action Hub); needs Assignment entity
- **User Story 4 (Phase 6)**: Depends on Foundational and US3 (assignments); needs Submission entity
- **User Story 5 (Phase 7)**: Depends on Foundational and US4 (submissions); needs Growth Report, grading job
- **Polish (Phase 8)**: Depends on completion of desired user stories

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependency on US2–US5; can ship as MVP alone
- **US2 (P1)**: After Foundational — provides auth and resource feed; US3 uses dashboard/Action Hub
- **US3 (P2)**: After US2 — uses dashboard layout and Action Hub; creates assignments for US4
- **US4 (P2)**: After US3 — uses assignments; produces submissions for US5
- **US5 (P2)**: After US4 — consumes submissions and grading; shows reports and follow-up

### Within Each User Story

- API routes and UI can be implemented in dependency order (e.g. generate route before quiz UI that calls it)
- Models/entities are in Foundational (T005); story-specific logic lives in routes and components

### Parallel Opportunities

- Phase 1: T003 [P], T004 [P] can run in parallel with T001–T002
- Phase 2: T006, T007, T008 are [P] (lib/db.ts, lib/ai.ts, lib/storage.ts)
- Phases 3–7: Different stories can be worked in parallel by different developers after Foundational is done
- Phase 8: T038 [P] (comments) can run in parallel with T039

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (including design system T004)
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Instant Challenge + auth modal)
4. **STOP and VALIDATE**: Test Instant Challenge and "Save Results" auth trigger independently
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add US1 → test independently → deploy (MVP)
3. Add US2 → dashboard, resources, feed, Action Hub → test → deploy
4. Add US3 → Learning Architect, Quick Dictate → test → deploy
5. Add US4 → Workbench, submissions, grading trigger → test → deploy
6. Add US5 → Growth Report, follow-up, notifications → test → deploy
7. Polish → comments, quickstart validation

### Parallel Team Strategy

- Team completes Phase 1 and Phase 2 together
- After Phase 2: Developer A — US1; Developer B — US2; then US3–US5 can be split or sequenced
- Stories integrate via shared auth, DB, and API contracts

---

## Notes

- [P] tasks = different files, no dependencies on other incomplete tasks
- [USn] label maps task to user story for traceability
- Each user story is independently testable per spec Independent Test criteria
- Design system (T004) applies plan.md Visual Identity so UI uses Modern Laboratory palette and typography
- Commit after each task or logical group
- File paths use app/ and lib/ at repo root (Next.js App Router); no src/ in this project
