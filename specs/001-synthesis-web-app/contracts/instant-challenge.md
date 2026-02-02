# Instant Challenge API

**Base path**: `POST /api/instant-challenge/*` (or equivalent Route Handler paths)

Unauthenticated users can generate and take the Instant Challenge. Saving results or getting detailed feedback requires authentication (FR-001, FR-002).

---

## Generate MCQs

**POST** `/api/instant-challenge/generate`

**Request**

- **Body** (JSON): `{ "input": string }` — Raw text or pasted content (min length enforced in implementation).
- **Headers**: None required (public).

**Response**

- **200**: `{ "items": MCQItem[] }`  
  - `MCQItem`: `{ "id": string, "question": string, "options": string[], "correctIndex": number }`  
  - Exactly 5 items (spec).
- **400**: Empty or invalid input — `{ "error": string }` with clear message.
- **502** / **503**: AI unavailable — clear error and retry guidance (spec edge case).

**Notes**: Input length limits and validation messages per spec (empty/invalid → clear message, no generation).

---

## Submit Quiz (Instant Challenge)

**POST** `/api/instant-challenge/submit`

**Request**

- **Body** (JSON): `{ "answers": { itemId: selectedIndex }[] }` (or array of { itemId, selectedIndex }).
- **Headers**: Optional `Cookie` for session; if absent, response may still return score but "Save Results" flow will require auth.

**Response**

- **200**: `{ "score": number, "feedback": optional string }` — Immediate feedback for anonymous user.
- **200** with session: If client later sends "Save Results", server can associate this attempt to user after auth (implementation may use temporary token or re-submit after login).

**Notes**: "Save Results & Get Detailed Feedback" triggers auth modal (FR-002); after auth, client may POST to a separate endpoint to persist this attempt and link to user.
