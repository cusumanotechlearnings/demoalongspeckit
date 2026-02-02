"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/** Wraps app with NextAuth session so we can use signIn/signOut in client components. */
export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
