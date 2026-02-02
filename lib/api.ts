/**
 * Shared API helpers for Synthesis: consistent JSON errors and retry guidance.
 * Use in Route Handlers so clients always get clear messages (per spec edge cases).
 *
 * Why this file: Single place for response shape so loading/retry/error UX
 * stays consistent across instant-challenge, resources, assignments, etc.
 */

import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "empty_input"
  | "invalid_input"
  | "service_unavailable"
  | "file_too_large"
  | "unauthorized"
  | "not_found"
  | "rate_limit";

/** User-facing error message and optional retry hint */
export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number = 400
): NextResponse {
  const body: Record<string, unknown> = {
    error: message,
    code,
  };
  if (code === "service_unavailable") {
    body.retry = "Please try again in a moment.";
  }
  if (code === "file_too_large") {
    body.retry = "Use a smaller file or check the size limit.";
  }
  return NextResponse.json(body, { status });
}

/** 400 Bad Request — empty or invalid input */
export function badRequest(message: string = "Invalid or missing input."): NextResponse {
  return apiError("invalid_input", message, 400);
}

/** 401 Unauthorized */
export function unauthorized(message: string = "Sign in required."): NextResponse {
  return apiError("unauthorized", message, 401);
}

/** 404 Not Found */
export function notFound(message: string = "Not found."): NextResponse {
  return apiError("not_found", message, 404);
}

/** 502/503 — AI or external service down; show loading/retry per spec */
export function serviceUnavailable(
  message: string = "Service temporarily unavailable. Please try again."
): NextResponse {
  return apiError("service_unavailable", message, 503);
}

/** 413 — file too large; clear message per spec */
export function fileTooLarge(
  message: string = "File exceeds the maximum allowed size."
): NextResponse {
  return apiError("file_too_large", message, 413);
}

/** 202 Accepted — e.g. grading pending; client can poll or wait for notification */
export function accepted(data: Record<string, unknown>): NextResponse {
  return NextResponse.json({ status: "pending", ...data }, { status: 202 });
}
