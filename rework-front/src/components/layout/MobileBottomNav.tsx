import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Compass, Map, User } from "lucide-react";
import { cn } from "../../lib/utils";

export function MobileBottomNav() {
  const navItems = [
    { to: "/", icon: Home, label: "Accueil" },
    { to: "/planifier", icon: Compass, label: "Planifier" },
    { to: "/voyages", icon: Map, label: "Voyages" },
    { to: "/profil", icon: User, label: "Profil" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-light-border px-4 py-2 pb-safe z-50 flex justify-around items-center h-[64px]">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-brand" : "text-light-muted"
            )
          }
        >
          <Icon size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
