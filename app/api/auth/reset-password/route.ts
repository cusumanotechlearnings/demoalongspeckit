import { NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcrypt";
import { queryOne, execute } from "@/lib/db";

const SALT_ROUNDS = 10;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token and new password are required." }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const row = await queryOne<{ id: string; user_id: string; expires_at: string }>(
      "SELECT id, user_id, expires_at FROM password_reset_tokens WHERE token_hash = $1",
      [tokenHash]
    );

    if (!row || new Date(row.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invalid or expired reset link. Please request a new one." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await execute("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [passwordHash, row.user_id]);
    await execute("DELETE FROM password_reset_tokens WHERE id = $1", [row.id]);

    return NextResponse.json({ message: "Password updated. You can sign in now." });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
