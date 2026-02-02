# Feature Specification: Synthesis Web App

**Feature Branch**: `001-synthesis-web-app`  
**Created**: 2025-01-31  
**Status**: Draft  
**Input**: User description: Wireframe and feature set for Synthesis — AI-powered personal development platform that turns consumption signals into a Knowledge Graph, with resource ingest, Learning Architect chat, assignment generation, and Growth Reports.

## Clarifications

### Session 2025-01-31

- Q: When a user has no uploads (or very few) and requests "a test on X" (e.g. via Quick Dictate or Learning Architect), what should the system do? → A: Use global/system knowledge to generate the test anyway (user gets a test without uploading).
- Q: For graded assignments, is video submission in scope for MVP? → A: Accept video upload for storage only in MVP; grading of video content comes in a later phase.
- Q: After a user taps "Submit for Grading," how should they receive the Growth Report? → A: Asynchronous — user can leave; they are notified when ready (e.g. in-app badge, email, or check back later).
- Q: Can a user retake the same assignment and get a new grade? → A: Yes — user can retake; each attempt produces a new submission and a new Growth Report.
- Q: How long should the system keep user data (resources, submissions, Growth Reports)? → A: Indefinite until user deletes content or account is closed (no automatic purge).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Resource Ingest & Instant Challenge (Priority: P1)

As a learner, I want to paste text or upload a snippet (e.g., screenshot, PDF, or note) and immediately get a short set of multiple-choice questions generated from that content so that I can test my understanding without creating an account. If I want to save my results or get detailed feedback, I am prompted to sign in.

**Why this priority**: Core value proposition — “turn consumption into mastery” starts with ingest and on-demand quiz. Delivers value to anonymous users and motivates sign-up.

**Independent Test**: Can be fully tested by pasting text on the landing page, receiving 5 MCQs, completing the quiz, and (optionally) triggering the auth modal via “Save Results & Get Detailed Feedback.” No other feature required.

**Acceptance Scenarios**:

1. **Given** I am on the landing page, **When** I enter or paste text into the “Instant Challenge” input and request a challenge, **Then** I receive exactly 5 MCQ items derived from that content and can answer them in a simple quiz UI.
2. **Given** I have completed the quiz, **When** I tap “Save Results & Get Detailed Feedback,” **Then** an authentication modal appears and I can sign in or create an account.
3. **Given** I am on the landing page, **When** I submit an empty or invalid input, **Then** the system shows a clear message and does not generate questions.

---

### User Story 2 - Authentication & Dashboard (Priority: P1)

As a signed-in user, I want a dashboard with a clear sidebar (Dashboard, Resource Library, Assignment History, Peer Directory), a resource feed showing my uploads (thumbnail, date, extracted topics), and an Action Hub so that I can navigate my knowledge base and start learning flows.

**Why this priority**: Required for all “save and persist” behavior; Resource Library is the foundation for the Knowledge Graph and later assignment generation.

**Independent Test**: Can be fully tested by signing in and verifying sidebar navigation, resource feed with at least one uploaded item (thumbnail, date, extracted topics), and presence of Action Hub (e.g., Learning Architect entry point, Quick Dictate).

**Acceptance Scenarios**:

1. **Given** I am authenticated, **When** I open the app, **Then** I see the dashboard with sidebar (Dashboard, Resource Library, Assignment History, Peer Directory) and a resource feed area.
2. **Given** I have uploaded at least one resource, **When** I view the Resource Library (or feed), **Then** each item appears as a card with thumbnail (or placeholder), date, and “Extracted Topics.”
3. **Given** I am on the dashboard, **When** I look at the Action Hub, **Then** I can access a Learning Architect entry point and a Quick Dictate (e.g., “I want a test on X”) command.

---

### User Story 3 - Learning Architect & Quick Dictate (Priority: P2)

As a user feeling information overload, I want to open a Socratic chat overlay (Learning Architect) so that the system can help me decide whether to do a quick quiz or a deeper case study based on my recent saves. I also want a short command (e.g., “I want a test on X”) to quickly request an assignment.

**Why this priority**: Reduces friction and guides users from passive save to active practice; supports Phase 2 roadmap.

**Independent Test**: Can be fully tested by opening the Learning Architect overlay, having a short conversation about “quiz vs case study,” and by using Quick Dictate to request a test on a topic and receiving a generated assignment (or clear next step).

**Acceptance Scenarios**:

1. **Given** I am on the dashboard, **When** I open the Learning Architect (e.g., Drafting/Socratic button), **Then** a chat overlay appears and I can converse to decide between quiz or case study based on my resources.
2. **Given** I am on the dashboard, **When** I use Quick Dictate with a phrase like “I want a test on X,” **Then** the system creates or surfaces an assignment (or clear path) for that topic.
3. **Given** I have no or few resources, **When** I use Learning Architect or Quick Dictate to request a test on a topic, **Then** the system generates the assignment using global/system knowledge for that topic rather than failing silently or requiring uploads first.

---

### User Story 4 - Assignments & Workbench (Priority: P2)

As a professional, I want to work on an assignment in a focused Workbench: I see progress, can enter long-form text or upload a file, and choose “Save for Later” or “Submit for Grading.” Assignments may connect multiple resources (Synthesis) so I can practice cross-topic application.

**Why this priority**: Enables the full loop from ingest → assign → submit → feedback; Workbench supports flow state (dimmed/hidden nav when active).

**Independent Test**: Can be fully tested by starting an assignment, seeing progress and a large text/file area, saving for later, then submitting for grading and confirming submission is recorded.

**Acceptance Scenarios**:

1. **Given** I have an active assignment, **When** I open the Workbench, **Then** I see a progress indicator, a large text area and/or file upload for my response, and “Save for Later” and “Submit for Grading” actions.
2. **Given** I am in the Workbench, **When** I choose “Save for Later,” **Then** my draft is stored and I can return to it without losing work.
3. **Given** I am in the Workbench, **When** I choose “Submit for Grading,” **Then** my response is submitted and I can leave; I am notified when the Growth Report is ready (e.g. in-app, email, or I can check back later).
4. **Given** an assignment is built from multiple resources (Synthesis), **When** I view the assignment, **Then** I understand it connects those topics (e.g., DevOps + GTM Planning) for cross-functional practice.

---

### User Story 5 - Growth Report & Follow-up (Priority: P2)

As a learner, I want to submit my written response or upload a file (including video for storage) and receive a Growth Report that shows my score, a competency level (e.g., Novice, Competent, Expert), a rubric breakdown of how I did on each criterion, and an option to “Generate follow-up based on gaps.”

**Why this priority**: Closes the feedback loop and differentiates the product with transparent, rubric-based grading and actionable next steps.

**Independent Test**: Can be fully tested by submitting a graded assignment and verifying the report shows score, competency level, rubric table, and a follow-up generation action.

**Acceptance Scenarios**:

1. **Given** I have submitted an assignment for grading, **When** I am notified or return and the Growth Report is ready, **Then** I see a Growth Report with a prominent score and a competency level (e.g., Novice, Competent, Expert).
2. **Given** I am viewing my Growth Report, **When** I scroll or view the full report, **Then** I see a rubric breakdown (table or list) showing each grading criterion and how I performed on it.
3. **Given** I am viewing my Growth Report, **When** I tap “Generate follow-up based on gaps,” **Then** the system creates or suggests a follow-up assignment targeting my weak areas.
4. **Given** grading fails or times out, **When** I view the assignment or report, **Then** I see a clear status message and a way to retry or get help.

---

### Edge Cases

- What happens when the user submits a very long text or a very large file for an assignment? System MUST enforce reasonable limits and show a clear message when exceeded; drafts SHOULD be saveable up to that limit.
- What happens when the user has no uploads and requests “a test on X”? System MUST use global/system knowledge to generate the test for that topic (user gets value without uploading) and MUST NOT fail silently.
- What happens when AI-generated content (MCQs, rubric, feedback) is slow or unavailable? System MUST show a loading or retry state and a clear error message; MUST NOT leave the user on an infinite spinner without recourse.
- What happens after "Submit for Grading"? Grading is asynchronous; user can leave. System MUST notify the user when the Growth Report is ready (e.g. in-app, email, or visible in Assignment History when they return).
- What happens when the user is mid-quiz or mid-workbench and session expires? System SHOULD preserve draft where possible and prompt re-authentication; on re-auth, SHOULD restore or offer to restore the draft.
- What happens when extracted topics cannot be determined for a resource? System SHOULD show the resource with a neutral or “Uncategorized” state and still allow it to be used in assignments.

## Requirements *(mandatory)*

Where applicable, requirements MUST align with the project constitution: simplicity, performance/UX, minimal complexity, and educational commenting for newcomers.

### Functional Requirements

- **FR-001**: System MUST allow unauthenticated users to use the Instant Challenge (paste/input text, receive 5 MCQs, complete quiz) on the landing page.
- **FR-002**: System MUST prompt for authentication when an unauthenticated user chooses “Save Results & Get Detailed Feedback” (or equivalent).
- **FR-003**: System MUST allow authenticated users to upload or add “Knowledge Anchors” (text, PDF, images) and store them with metadata (e.g., date); system MUST derive or display “Extracted Topics” for each resource where possible.
- **FR-004**: System MUST provide a dashboard with sidebar navigation: Dashboard (Home), Resource Library, Assignment History, Peer Directory.
- **FR-005**: System MUST display a resource feed (e.g., grid of cards) showing thumbnail (or placeholder), date, and Extracted Topics for the user’s uploads.
- **FR-006**: System MUST provide an Action Hub with access to a Learning Architect (Socratic chat) overlay and a Quick Dictate command (e.g., “I want a test on X”).
- **FR-007**: System MUST support generating assignments from user content (on-demand MCQs from input; optionally assignments that connect multiple resources/topics). When the user has no or few uploads and requests a test on a topic (e.g. via Quick Dictate or Learning Architect), the system MUST generate the assignment using global/system knowledge rather than requiring uploads first.
- **FR-008**: System MUST provide a Workbench for assignments with: progress indicator, large text area and/or file upload (including video for storage in MVP) for submission, “Save for Later,” and “Submit for Grading.”
- **FR-009**: System MUST grade submissions using a defined rubric and produce a Growth Report showing: score, competency level, and rubric breakdown (criteria vs. performance). In MVP, grading applies to text and file submissions; video uploads are stored but grading of video content is deferred to a later phase. After "Submit for Grading," the user MAY leave; the system MUST notify the user when the report is ready (e.g. in-app indicator, email, or user can check Assignment History / report area later).
- **FR-010**: System MUST offer a “Generate follow-up based on gaps” (or equivalent) action from the Growth Report that creates or suggests a follow-up assignment targeting weak areas.
- **FR-011**: System MUST support authentication sufficient to identify the user and associate resources, assignments, and reports to that user.
- **FR-012**: System MUST handle errors (e.g., empty input, service unavailable, file too large) with clear, user-facing messages and recoverable flows where possible.
- **FR-013**: Users MUST be able to retake the same assignment; each attempt produces a new submission and a new Growth Report. Assignment History MUST show past attempts and retakes.
- **FR-014**: User data (resources, submissions, Growth Reports) MUST be retained until the user deletes it or the account is closed; no automatic purge by time.

### Key Entities

- **User**: The learner; has identity after authentication; owns resources, assignments, and reports.
- **Resource (Knowledge Anchor)**: User-uploaded or pasted content (text, PDF, image); has date, optional thumbnail, and Extracted Topics; used as input for assignment generation and the “Knowledge Graph.”
- **Assignment**: A generated task (e.g., 5 MCQs, case study, long-form prompt); may reference one or more resources; has status (draft, in progress, submitted); may have a due or created date. A user MAY retake the same assignment; each attempt is a new submission with its own Growth Report.
- **Submission**: User’s response to an assignment for one attempt (text and/or file, including video upload in MVP for storage); linked to assignment; has state (draft, submitted). In MVP, grading applies to text and file content; video content grading is deferred. Each submission has at most one Growth Report.
- **Growth Report**: Result of grading a submission; includes score, competency level, rubric breakdown (criteria and performance per criterion), and option to generate follow-up.
- **Rubric**: Set of grading criteria used to evaluate a submission; criteria are visible to the user in the Growth Report.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can complete an Instant Challenge (paste text, get 5 MCQs, answer them) in under 3 minutes without creating an account.
- **SC-002**: An authenticated user can upload at least one resource and see it in the Resource Library with date and Extracted Topics within 2 minutes.
- **SC-003**: Users can open the Learning Architect chat and receive a relevant suggestion (quiz vs. case study) based on recent saves, or complete a Quick Dictate request, within 1 minute of opening the overlay.
- **SC-004**: Users can submit an assignment from the Workbench and view a Growth Report (score, competency level, rubric breakdown) without errors in normal conditions; errors show clear messages and retry options.
- **SC-005**: At least 80% of users who complete a Growth Report can successfully trigger “Generate follow-up based on gaps” and receive a follow-up suggestion or assignment.
- **SC-006**: Dashboard and Workbench layouts support scannable cards and focused flow (e.g., reduced distraction in Workbench) so that primary tasks (browse resources, complete assignment) are completable without unnecessary steps.

## Assumptions

- The product is a cloud-hosted web application; users access it via a browser.
- Authentication is sufficient to associate all user data (resources, assignments, reports) to a single user account; specific auth method (e.g., email/password, OAuth) is an implementation choice.
- “Extracted Topics” and AI-generated content (MCQs, rubric, feedback, follow-up) are produced by system logic (e.g., AI/LLM); exact provider is out of scope for this spec.
- Peer Directory is in scope as a navigation item and future social/topic feature; detailed behavior is deferred to a later phase.
- Resource and submission file types and size limits will be defined in implementation; this spec requires that limits exist and that users see clear messages when they are exceeded.
- Visual identity (e.g., “Modern Laboratory,” color palette, typography) will be applied in implementation; this spec does not mandate specific design tokens.
- Video submission: MVP accepts video file upload for storage; grading of video content (e.g., transcription, rubric on video) is out of scope for MVP and deferred to a later phase.
- Data retention: User data (resources, submissions, Growth Reports) is kept indefinitely until the user deletes it or the account is closed; no automatic purge by time.
