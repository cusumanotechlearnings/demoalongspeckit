-- Add evaluation_details for quiz-specific feedback (MCQ wrong/right, short answer evals).
-- Add rubric_id to assignments for long-form rubric reference.

ALTER TABLE growth_reports
  ADD COLUMN IF NOT EXISTS evaluation_details JSONB;

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS rubric_id TEXT REFERENCES rubrics(id);
