/**
 * Send password reset email via Resend.
 * Requires RESEND_API_KEY and NEXT_PUBLIC_APP_URL (or APP_URL) in env.
 */

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.EMAIL_FROM ?? "The Forge <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set; skipping password reset email.");
    return { ok: false, error: "Email not configured" };
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: "Reset your password — The Forge",
    html: `
      <p>You requested a password reset for The Forge.</p>
      <p><a href="${resetLink}">Reset your password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export { APP_URL };
