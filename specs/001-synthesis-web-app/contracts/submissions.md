# Submissions API

**Base path**: `/api/submissions/*`

All endpoints require authentication. Supports Save for Later (draft) and Submit for Grading; grading is asynchronous (FR-008, FR-009, FR-013).

---

## Create or get draft submission

**POST** `/api/assignments/[assignmentId]/submissions`  
Or **GET** `/api/assignments/[assignmentId]/submissions/draft`

**Request**

- **POST** body (JSON): `{ "bodyText": optional string, "fileRef": optional string }` — Create or update draft.
- **Headers**: `Cookie` (session).

**Response**

- **200** / **201**: `{ "id", "assignmentId", "state": "draft", "gradingStatus", "bodyText", "fileRef", "createdAt", "updatedAt" }`
- **400**: Assignment not found or invalid (e.g. file too large) — clear message (spec).
- **401**: Unauthenticated.

**Notes**: "Save for Later" stores draft; user can return and continue (spec). File size limits enforced with clear message.

---

## Submit for grading

**POST** `/api/submissions/[id]/submit`

**Request**

- **Body**: Optional final `bodyText` / `fileRef` if not already set.
- **Headers**: `Cookie` (session).

**Response**

- **200**: `{ "id", "state": "submitted", "gradingStatus": "pending", "submittedAt" }`  
  - Client can leave; user is notified when report is ready (FR-009).
- **400**: Already submitted or invalid.
- **401**: Unauthenticated.

**Notes**: After submit, grading runs asynchronously. Notification when ready: in-app indicator, optional email, or user checks Assignment History (contracts/reports.md).

---

## List submissions for assignment (Assignment History / Retakes)

**GET** `/api/assignments/[assignmentId]/submissions`

**Response**

- **200**: `{ "items": Submission[] }`  
  - Each: `{ "id", "state", "gradingStatus", "submittedAt", "createdAt", "hasReport": boolean }`  
  - Used for past attempts and retakes (FR-013).
- **401**: Unauthenticated.

---

## Get submission (including draft)

**GET** `/api/submissions/[id]`

**Response**

- **200**: Full `Submission`; if `gradingStatus === "graded"`, client can fetch Growth Report (reports.md).
- **404** / **401**: Not found or not owned.
