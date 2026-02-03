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
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
