import { NextResponse } from "next/server";
import { randomBytes, createHash, randomUUID } from "crypto";
import { queryOne, execute } from "@/lib/db";
import { sendPasswordResetEmail, APP_URL } from "@/lib/email";

const TOKEN_EXPIRY_HOURS = 1;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await queryOne<{ id: string }>("SELECT id FROM users WHERE LOWER(email) = $1", [email]);
    // Always return success to avoid leaking whether the email exists
    if (!user) {
      return NextResponse.json({ message: "If an account exists with that email, you will receive a reset link." });
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await execute(
      "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)",
      [id, user.id, tokenHash, expiresAt.toISOString()]
    );

    const resetLink = `${APP_URL}/auth/reset-password?token=${token}`;
    const { ok, error } = await sendPasswordResetEmail(email, resetLink);

    if (!ok) {
      return NextResponse.json(
        { error: error ?? "Failed to send email. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "If an account exists with that email, you will receive a reset link." });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
