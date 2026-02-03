#!/usr/bin/env node
/**
 * Run pending DB migrations. Loads .env.local so POSTGRES_URL/DATABASE_URL is set.
 * Usage: node scripts/run-migrations.js
 */

const path = require("path");
const fs = require("fs");

// Load .env.local into process.env
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  });
}

if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
  process.env.POSTGRES_URL = process.env.DATABASE_URL;
}

if (!process.env.POSTGRES_URL) {
  console.error("Missing POSTGRES_URL or DATABASE_URL in .env.local");
  process.exit(1);
}

const { sql } = require("@vercel/postgres");

async function run() {
  console.log("Running migration 002_add_resource_context...");
  await sql.query("ALTER TABLE resources ADD COLUMN IF NOT EXISTS notes TEXT");
  await sql.query(
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS learning_category TEXT"
  );
  await sql.query(
    "ALTER TABLE resources ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'"
  );
  console.log("Migration 002 complete. Resource context columns added.");

  console.log("Running migration 003_add_assignment_format_topic...");
  await sql.query(
    "ALTER TABLE assignments ADD COLUMN IF NOT EXISTS format TEXT"
  );
  await sql.query(
    "ALTER TABLE assignments ADD COLUMN IF NOT EXISTS topic TEXT"
  );
  console.log("Migration 003 complete. Assignment format and topic columns added.");

  console.log("Running migration 004_add_evaluation_details_rubric_ref...");
  await sql.query(
    "ALTER TABLE growth_reports ADD COLUMN IF NOT EXISTS evaluation_details JSONB"
  );
  await sql.query(
    "ALTER TABLE assignments ADD COLUMN IF NOT EXISTS rubric_id TEXT"
  );
  // Ensure rubrics table exists and seed default rubrics
  try {
    await sql.query(`
      CREATE TABLE IF NOT EXISTS rubrics (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        criteria JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await sql.query(`
      INSERT INTO rubrics (id, name, criteria) VALUES
      ('rubric-long-form', 'Long-form rubric (essay, project, presentation)', 
       '[{"id":"c1","name":"Clarity","description":"Clear and coherent writing"},{"id":"c2","name":"Depth","description":"Thorough analysis with supporting details"},{"id":"c3","name":"Relevance","description":"Content addresses the assignment prompt"},{"id":"c4","name":"Structure","description":"Logical organization"}]'::jsonb),
      ('rubric-case-study', 'Case study rubric', 
       '[{"id":"c1","name":"Problem identification","description":"Identifies key issues"},{"id":"c2","name":"Analysis","description":"Insightful analysis"},{"id":"c3","name":"Recommendations","description":"Practical recommendations"},{"id":"c4","name":"Evidence","description":"Uses case evidence"}]'::jsonb)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, criteria = EXCLUDED.criteria
    `);
  } catch (e) {
    console.warn("Rubric seed skipped:", e.message);
  }
  console.log("Migration 004 complete.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
