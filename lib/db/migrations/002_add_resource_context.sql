-- Add context fields to resources: notes, tags, learning_category.
-- Run after 001_add_passwords.sql (or on existing DB with resources table).
-- Required for Resource Library add/edit context and PATCH /api/resources/[id].

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS learning_category TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
