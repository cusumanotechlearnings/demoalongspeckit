import Link from "next/link";

const nav = [
  { href: "/dashboard", label: "Dashboard (Home)" },
  { href: "/dashboard/resources", label: "Resource Library" },
  { href: "/dashboard/assignment-history", label: "Assignment History" },
  { href: "/dashboard/peer-directory", label: "Peer Directory" },
];

export function DashboardNav() {
  return (
    <aside className="w-56 border-r border-[var(--text-muted)]/20 bg-[var(--surface)] shadow-sm">
      <nav className="flex flex-col gap-1 p-4">
        <Link
          href="/"
          className="mb-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          ← The Forge
        </Link>
        {nav.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--primary)]/20 hover:text-[var(--text-primary)]"
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
