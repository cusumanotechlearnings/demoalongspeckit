# Resources (Knowledge Anchors) API

**Base path**: `/api/resources/*`

All endpoints require authentication. Associate resources to the authenticated user (FR-003, FR-011).

---

## List resources

**GET** `/api/resources`

**Query**: Optional `?limit=`, `?offset=` or cursor for feed.

**Response**

- **200**: `{ "items": Resource[] }`  
  - `Resource`: `{ "id", "type", "title", "contentRef", "thumbnailRef", "extractedTopics": string[], "createdAt" }`
- **401**: Unauthenticated.

---

## Create resource

**POST** `/api/resources`

**Request**

- **Body**: Multipart form or JSON.  
  - Text: `{ "type": "text", "title": optional, "content": string }`  
  - File: `type`, `file` (binary); server stores blob and returns `contentRef` / `thumbnailRef` as appropriate.
- **Headers**: `Cookie` (session).

**Response**

- **201**: `{ "id", "type", "title", "contentRef", "thumbnailRef", "extractedTopics", "createdAt" }`  
  - `extractedTopics` may be empty or `["Uncategorized"]` until processing completes (async extraction allowed).
- **400**: Validation error (e.g. file type/size) — clear message (spec edge case).
- **401**: Unauthenticated.

---

## Get resource

**GET** `/api/resources/[id]`

**Response**

- **200**: Single `Resource` object.
- **404**: Not found or not owned by user.
- **401**: Unauthenticated.

---

## Update resource

**PATCH** `/api/resources/[id]`

**Request**: Partial fields (e.g. `title`). Optional.

**Response**

- **200**: Updated `Resource`.
- **404** / **401**: As above.

---

## Delete resource

**DELETE** `/api/resources/[id]`

**Response**

- **204**: Deleted.
- **404** / **401**: As above.

**Notes**: Data retention — deleted by user; no automatic purge (FR-014).
