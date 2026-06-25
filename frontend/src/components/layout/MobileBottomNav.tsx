'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Map, User } from "lucide-react";
import { cn } from "../../lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const navItems = [
    { to: "/", icon: Home, label: "Accueil" },
    { to: "/planifier", icon: Compass, label: "Planifier" },
    { to: "/voyages", icon: Map, label: "Voyages" },
    { to: "/profil", icon: User, label: "Profil" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-light-border px-4 py-2 pb-[env(safe-area-inset-bottom)] z-50 flex justify-around items-center h-[calc(64px+env(safe-area-inset-bottom))]">
      {navItems.map(({ to, icon: Icon, label }) => (
        <Link
          key={to}
          href={to}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            pathname === to ? "text-brand" : "text-light-muted"
          )}
        >
          <Icon size={20} />
          <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
