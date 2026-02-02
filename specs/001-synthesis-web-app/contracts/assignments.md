# Assignments API

**Base path**: `/api/assignments/*`

All endpoints require authentication. Assignments can be generated from user resources or from global knowledge when user has no/few uploads (FR-007, clarification).

---

## Create assignment (including Quick Dictate / Learning Architect)

**POST** `/api/assignments`

**Request**

- **Body** (JSON):  
  - `{ "topic": string }` — e.g. "I want a test on X"; system uses global knowledge if no/few resources.  
  - Or `{ "topic", "resourceIds": string[] }` — tie to specific resources.  
  - Or `{ "type": "instant_mcq" | "case_study" | "long_form", "resourceIds": optional, "prompt": optional }`
- **Headers**: `Cookie` (session).

**Response**

- **201**: `{ "id", "type", "title", "prompt", "resourceIds", "status", "createdAt" }`
- **400**: Invalid request (e.g. topic empty).
- **401**: Unauthenticated.

**Notes**: Learning Architect chat may call this after conversation; Quick Dictate sends topic (and optionally resourceIds). When user has no uploads, backend uses global knowledge (FR-007).

---

## List assignments

**GET** `/api/assignments`

**Query**: Optional `?status=`, `?limit=`, `?offset=` (or cursor).

**Response**

- **200**: `{ "items": Assignment[] }`  
  - `Assignment`: `{ "id", "type", "title", "prompt", "resourceIds", "status", "createdAt" }`  
  - Used for Assignment History; show past and retakes (FR-013).
- **401**: Unauthenticated.

---

## Get assignment

**GET** `/api/assignments/[id]`

**Response**

- **200**: Single `Assignment` with optional `submissions` summary (e.g. last submission state, report ready flag).
- **404** / **401**: Not found or not owned.
