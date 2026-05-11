"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Radar", icon: "radar" as const },
  { href: "/analyze", label: "Analyze", icon: "search" as const },
  { href: "/saved", label: "Saved", icon: "bookmark" as const },
  { href: "/profile", label: "Profile", icon: "user" as const }
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="bottom-nav">
      {items.map(({ href, label, icon }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link key={href} href={href} className={`nav-item ${active ? "active" : ""}`}>
            <Icon name={icon} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Icon({ name }: { name: "radar" | "search" | "bookmark" | "user" }) {
  switch (name) {
    case "radar":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="2" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
        </svg>
      );
    case "search":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      );
    case "bookmark":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
  }
}
