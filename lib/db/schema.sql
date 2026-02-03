-- Synthesis Web App: PostgreSQL schema per data-model.md
-- Run this against your Postgres DB (e.g. Vercel Postgres, Neon, Supabase).
-- Tables: users, resources, assignments, submissions, growth_reports, rubrics

-- Users: identity from auth; we sync on first sign-in. password_hash required for login.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Password reset tokens (token_hash = SHA-256 of token; verify with hashed comparison)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Resources (Knowledge Anchors): user uploads / pasted content + context
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'pdf', 'image')),
  title TEXT,
  content_ref TEXT NOT NULL,
  thumbnail_ref TEXT,
  extracted_topics TEXT[] DEFAULT '{}',
  notes TEXT,
  learning_category TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_resources_user_id ON resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at);

-- Assignments: generated tasks; may reference resources or global knowledge
CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('instant_mcq', 'case_study', 'long_form')),
  title TEXT,
  prompt TEXT,
  resource_ids TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'submitted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at);

-- Submissions: one per attempt; retakes allowed
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body_text TEXT,
  file_ref TEXT,
  state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'submitted')),
  grading_status TEXT NOT NULL DEFAULT 'pending' CHECK (grading_status IN ('pending', 'grading', 'graded', 'failed')),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_grading_status ON submissions(grading_status);

-- Growth Reports: one per submission after grading
CREATE TABLE IF NOT EXISTS growth_reports (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL UNIQUE REFERENCES submissions(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  competency_level TEXT NOT NULL CHECK (competency_level IN ('novice', 'competent', 'expert')),
  rubric_breakdown JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_growth_reports_submission_id ON growth_reports(submission_id);

-- Rubrics: grading criteria (global or per assignment type)
CREATE TABLE IF NOT EXISTS rubrics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
