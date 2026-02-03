-- Add format and topic to assignments for quiz generation context.
-- format: multiple_choice, mixed_format, etc. — drives MCQ vs mixed (MCQ + short answer).
-- topic: original user input (e.g. "lengthy test on turtles") — helps AI determine question count.

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS format TEXT,
  ADD COLUMN IF NOT EXISTS topic TEXT;
