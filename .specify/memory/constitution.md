<!--
  Sync Impact Report
  Version change: (none) → 1.0.0
  Modified principles: N/A (initial adoption)
  Added sections: Core Principles (4), Structure & Complexity, Development Workflow, Governance
  Removed sections: N/A
  Templates: plan-template.md ✅ updated; spec-template.md ✅ updated; tasks-template.md ✅ updated
  Follow-up TODOs: None
-->
# Speckit Demo Project Constitution

## Core Principles

### I. Simplicity & Readability

Code MUST be clean and easy to read. Prioritize simplicity in structure, naming, and logic. Comment regularly so that intent is clear at a glance.

**Rationale**: Reduces cognitive load for newcomers and maintainers; essential for a project where contributors are learning fullstack development through experience.

### II. Performance & User Experience

Code MUST be written to support optimized load speeds and a good user experience. Avoid unnecessary work, large bundles, or patterns that harm responsiveness.

**Rationale**: Non-negotiable for cloud-based and web applications; aligns with the goal of a smooth experience for learners and end users.

### III. Single-File Preference & Minimal Complexity

Prefer single files where possible. Avoid creating excessive files or unnecessary abstraction. New structure (new files, folders, or layers) MUST be justified by clear benefit.

**Rationale**: Newcomers and low-coders navigate less structure more easily; reduces “where do I change this?” friction and supports learning by keeping the codebase approachable.

### IV. Educational Commenting

Comments MUST walk readers through what the code is doing and why, so newcomers can understand and troubleshoot without prior context. Explain the “what” and “why,” not only the “how.”

**Rationale**: This project is a learning vehicle for people touching traditional code for the first time; comments are a primary way they learn and fix issues.

## Structure & Complexity

- Default to one or few files per feature or route unless complexity clearly demands more.
- Every new file or folder MUST have a documented reason (e.g., shared logic, testability, or framework convention).
- Prefer in-file organization (sections, clear naming) over splitting into many small files when both are viable.

## Development Workflow

- Before adding a new file or abstraction, confirm it is needed per the Single-File Preference principle.
- Code reviews MUST verify: readability, regular comments, no unnecessary complexity, and alignment with performance/UX goals.
- When in doubt, choose the simpler structure and add structure later if the codebase grows.

## Governance

- This constitution supersedes ad-hoc practices for this project.
- Amendments require documentation (what changed and why), version bump, and updated Last Amended date.
- All PRs and reviews MUST check compliance with the four principles and the structure/workflow sections above.
- Use this file and the spec/plan/task templates for consistent guidance; avoid introducing complexity that conflicts with these principles.

**Version**: 1.0.0 | **Ratified**: 2025-01-31 | **Last Amended**: 2025-01-31
