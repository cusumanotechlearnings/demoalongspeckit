"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="mt-auto rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--text-muted)]/10 hover:text-[var(--text-primary)]"
    >
      Sign out
    </button>
  );
}
