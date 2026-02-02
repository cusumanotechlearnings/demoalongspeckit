# Data Model: Synthesis Web App

**Branch**: `001-synthesis-web-app` | **Date**: 2025-01-31

Entities, fields, relationships, and validation rules derived from the feature spec. Implementation will use PostgreSQL; this document is technology-agnostic where possible.

---

## Entity Relationship Overview

- **User** 1 — * owns **Resource** (Knowledge Anchors)
- **User** 1 — * owns **Assignment** (generated tasks)
- **Assignment** 1 — * has **Submission** (one per attempt; retakes allowed)
- **Submission** 0..1 — 1 **Growth Report** (after grading)
- **Rubric** is used to grade a submission; rubric criteria and per-criterion performance are stored with the Growth Report

---

## 1. User

**Purpose**: The learner; has identity after authentication; owns resources, assignments, and reports.

| Field       | Type     | Constraints / Notes |
|------------|----------|---------------------|
| id         | PK       | Unique identifier (e.g. UUID or auth provider id) |
| email      | string   | Optional if OAuth; required for credentials |
| name       | string   | Optional display name |
| created_at | datetime | |
| updated_at | datetime | Optional |

**Validation**: Identity sufficient to associate all user data (FR-011). Data retained until account is closed (FR-014).

**Lifecycle**: Created on first sign-in or sign-up; no automatic purge.

---

## 2. Resource (Knowledge Anchor)

**Purpose**: User-uploaded or pasted content (text, PDF, image); has date, optional thumbnail, and Extracted Topics; used as input for assignment generation and the Knowledge Graph.

| Field          | Type     | Constraints / Notes |
|----------------|----------|---------------------|
| id             | PK       | UUID or ULID |
| user_id        | FK → User | Owner |
| type           | enum     | e.g. `text` \| `pdf` \| `image` |
| title          | string   | Optional; can be derived or user-provided |
| content_ref    | string   | Inline text or blob key/URL for file |
| thumbnail_ref  | string   | Optional; blob key or URL |
| extracted_topics| string[] | Array of topic labels; empty or ["Uncategorized"] if none |
| created_at     | datetime | |
| updated_at     | datetime | Optional |

**Validation**: FR-003 — store with metadata (date); derive or display Extracted Topics. File/types and size limits defined in implementation; clear message when exceeded (spec edge case).

**Lifecycle**: Retained until user deletes or account closed (FR-014).

---

## 3. Assignment

**Purpose**: A generated task (e.g. 5 MCQs, case study, long-form prompt); may reference one or more resources; has status; user may retake (each attempt = new submission).

| Field        | Type       | Constraints / Notes |
|-------------|------------|---------------------|
| id          | PK         | UUID or ULID |
| user_id     | FK → User  | Owner |
| type        | enum       | e.g. `instant_mcq` \| `case_study` \| `long_form` |
| title       | string     | Optional |
| prompt      | text       | Assignment text / instructions |
| resource_ids| FK[] → Resource | Optional; empty when generated from global knowledge |
| status      | enum       | `draft` \| `in_progress` \| `submitted` (aggregate from submissions if needed) |
| created_at  | datetime   | |
| updated_at  | datetime   | Optional |

**Validation**: FR-007 — generate from user content or global knowledge. FR-013 — user can retake; each attempt is a new Submission.

**State**: Status can reflect “has at least one submitted submission” or be derived when listing (e.g. show “in progress” if latest submission is draft). No strict state machine required for MVP.

---

## 4. Submission

**Purpose**: User’s response to an assignment for one attempt (text and/or file, including video for storage in MVP); linked to assignment; has state (draft, submitted). Each submission has at most one Growth Report.

| Field         | Type        | Constraints / Notes |
|---------------|-------------|---------------------|
| id            | PK          | UUID or ULID |
| assignment_id | FK → Assignment | |
| user_id       | FK → User   | Redundant but convenient for queries |
| body_text     | text        | Optional; long-form text response |
| file_ref      | string      | Optional; blob key/URL (including video in MVP for storage) |
| state         | enum        | `draft` \| `submitted` |
| grading_status| enum        | `pending` \| `grading` \| `graded` \| `failed` |
| submitted_at  | datetime    | Null until state = submitted |
| created_at    | datetime    | |
| updated_at    | datetime    | Optional |

**Validation**: FR-008 — Save for Later stores draft; Submit for Grading sets state to submitted and triggers async grading. FR-009 — grading applies to text/file in MVP; video stored but not graded. FR-013 — each attempt = new submission.

**Lifecycle**: Retained until user deletes or account closed (FR-014).

---

## 5. Growth Report

**Purpose**: Result of grading a submission; includes score, competency level, rubric breakdown (criteria vs. performance per criterion), and option to generate follow-up.

| Field             | Type     | Constraints / Notes |
|-------------------|----------|---------------------|
| id                | PK       | UUID or ULID |
| submission_id     | FK → Submission | 1:1 with a submitted submission after grading |
| score             | decimal  | e.g. 0–100 or 0–1 |
| competency_level  | enum     | e.g. `novice` \| `competent` \| `expert` |
| rubric_breakdown  | JSON     | Array of { criterion_id or name, score/feedback, performance_note } |
| created_at        | datetime | When grading completed |

**Validation**: FR-009 — show score, competency level, rubric breakdown. FR-010 — “Generate follow-up based on gaps” consumes this report. User notified when report is ready (async; FR-009).

**Lifecycle**: Retained until user deletes or account closed (FR-014).

---

## 6. Rubric

**Purpose**: Set of grading criteria used to evaluate a submission; criteria are visible to the user in the Growth Report.

| Field     | Type     | Constraints / Notes |
|----------|----------|---------------------|
| id       | PK       | UUID or ULID |
| name     | string   | e.g. "Default long-form rubric" |
| criteria | JSON     | Array of { id, name, description, weight? } |

**Usage**: Can be global per assignment type or per-assignment. Growth Report’s `rubric_breakdown` references criterion id/name and stores per-criterion performance. No separate “RubricResult” table required if breakdown is stored as JSON on Growth Report.

---

## State Transitions

- **Submission**: `draft` → `submitted` (on Submit for Grading); `grading_status`: `pending` → `grading` → `graded` or `failed`.
- **Assignment**: No strict transitions; status can be derived from latest submission(s) (e.g. in_progress if any draft submission exists, submitted if at least one submitted).

---

## Indexes (Recommendations)

- **Resource**: `user_id`, `created_at`
- **Assignment**: `user_id`, `created_at`
- **Submission**: `assignment_id`, `user_id`, `created_at`, `grading_status`
- **Growth Report**: `submission_id` (unique)

---

## Out of Scope for MVP

- Peer Directory / social data (spec defers)
- Video grading (storage only in MVP)
- Versioning of resources or assignments (optional future)
