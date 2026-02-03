import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardNav } from "./DashboardNav";

/**
 * Dashboard layout: sidebar (Dashboard, Resource Library, Assignment History, Peer Directory).
 * Unauthenticated users are redirected to sign-in.
 */
export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <DashboardNav />
      <main className="flex-1 p-6 text-[var(--text-primary)]">{children}</main>
    </div>
  );
}
