/**
 * PostgreSQL client for Synthesis.
 * Uses @vercel/postgres in serverless; connection pool is managed by Vercel.
 * All queries run server-side only (Route Handlers / Server Components).
 *
 * Why this file: Single place for DB access so we can swap driver or add
 * connection pooling later without touching route code.
 *
 * Connection: Accepts either DATABASE_URL or POSTGRES_URL (Vercel Postgres
 * reads POSTGRES_URL by default; we mirror DATABASE_URL so setup guides work).
 */
if (typeof process !== "undefined" && !process.env.POSTGRES_URL && process.env.DATABASE_URL) {
  process.env.POSTGRES_URL = process.env.DATABASE_URL;
}

import { sql } from "@vercel/postgres";

export type { QueryResultRow } from "@vercel/postgres";

/** Run a parameterized query. Use for SELECT/INSERT/UPDATE/DELETE. */
export async function query<T extends Record<string, unknown>>(
  text: string,
  values?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const result = await sql.query(text, values);
  return {
    rows: (result.rows ?? []) as T[],
    rowCount: result.rowCount ?? 0,
  };
}

/** Get a single row or null. */
export async function queryOne<T extends Record<string, unknown>>(
  text: string,
  values?: unknown[]
): Promise<T | null> {
  const { rows } = await query<T>(text, values);
  return rows[0] ?? null;
}

/** Execute a statement (INSERT/UPDATE/DELETE) and return row count. */
export async function execute(text: string, values?: unknown[]): Promise<number> {
  const result = await sql.query(text, values);
  return result.rowCount ?? 0;
}
