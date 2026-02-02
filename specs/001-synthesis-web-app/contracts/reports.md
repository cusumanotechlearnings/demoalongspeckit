# Growth Reports API

**Base path**: `/api/reports/*`

All endpoints require authentication. Growth Report is available after asynchronous grading completes; user is notified when ready (FR-009, FR-010).

---

## Get Growth Report

**GET** `/api/reports/[submissionId]`  
Or **GET** `/api/submissions/[submissionId]/report`

**Response**

- **200**:  
  `{ "id", "submissionId", "score", "competencyLevel": "novice" | "competent" | "expert", "rubricBreakdown": Array<{ criterionId, name, scoreOrFeedback, performanceNote }>, "createdAt" }`
- **202**: Grading still pending — `{ "status": "pending" | "grading" }`; client should poll or rely on notification.
- **404**: No report yet or submission not found.
- **401**: Unauthenticated.

**Notes**: Async grading; return 202 until report is created. In-app indicator / email / Assignment History when ready (FR-009).

---

## Generate follow-up from gaps

**POST** `/api/reports/[reportId]/follow-up`  
Or **POST** `/api/reports/[reportId]/generate-follow-up`

**Request**

- **Body**: Optional `{ "targetGaps": string[] }` (criterion ids or names to target); if omitted, system uses rubric breakdown to pick weak areas.

**Response**

- **201**: `{ "assignmentId": string }` — New assignment targeting gaps (FR-010).
- **400**: Report not found or invalid.
- **401**: Unauthenticated.

**Notes**: Creates a new assignment; user can open Workbench for it and retake (FR-013).
