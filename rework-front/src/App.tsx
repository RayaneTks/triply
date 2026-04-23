import React, { useState } from "react";
import { Routes, Route, Outlet, useLocation, Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { TriplyLogo } from "./components/layout/TriplyLogo";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";
import { cn } from "./lib/utils";
import { ActiveTrip, AppContextType } from "./types/app";

// Features Imports
import { LandingView } from "./features/landing/LandingView";
import { PricingView } from "./features/pricing/PricingView";
import { ModeSelectionView } from "./features/modes/ModeSelectionView";
import { OnboardingView } from "./features/onboarding/OnboardingView";

// Real Component Imports
import { ItineraryView } from "./components/app/ItineraryView";
import { TripsListView } from "./components/app/TripsListView";
import { Wizard } from "./components/planner/Wizard";
import { Login } from "./components/Login/Login";

const ProfileView = () => <div className="max-w-4xl mx-auto p-12 text-center"><h1 className="text-3xl font-display font-bold">Mon Profil</h1><p className="text-light-muted mt-4">TODO: Intégrer les paramètres de compte.</p></div>;
const ManualCanvasView = () => <div className="max-w-4xl mx-auto p-12 text-center border-2 border-dashed border-light-border m-12 rounded-[40px]"><h1 className="text-3xl font-display font-bold">Mode Manuel</h1><p className="text-light-muted mt-4 font-bold uppercase text-[10px] tracking-widest">Saisie libre type brief en cours d'implémentation.</p></div>;

function AppShell() {
  const location = useLocation();
  const isLogin = location.pathname === "/connexion";
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);

  const appContext: AppContextType = {
    activeTrip,
    hasDraft: false,
    isConnected: false,
    openLogin: () => console.log("TODO: open login"),
    persistCurrentTrip: (trip) => setActiveTrip(prev => prev ? { ...prev, ...trip } : null),
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col",
      location.pathname.startsWith("/connexion") ? "bg-dark-bg" : "bg-light-bg"
    )}>
      {/* TopNav Desktop */}
      {!isLogin && (
        <header className="hidden lg:flex fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-light-border z-50 px-8 items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/">
              <TriplyLogo />
            </Link>
            <nav className="flex items-center gap-8">
              <NavLink to="/planifier" className={({isActive}) => cn("text-sm font-bold transition-colors", isActive ? "text-brand" : "text-light-muted hover:text-light-foreground")}>Planifier</NavLink>
              <NavLink to="/tarifs" className={({isActive}) => cn("text-sm font-bold transition-colors", isActive ? "text-brand" : "text-light-muted hover:text-light-foreground")}>Tarifs</NavLink>
              <NavLink to="/voyages" className={({isActive}) => cn("text-sm font-bold transition-colors", isActive ? "text-brand" : "text-light-muted hover:text-light-foreground")}>Mes voyages</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <NavLink to="/profil" className="text-sm font-bold text-light-muted hover:text-light-foreground">Profil</NavLink>
            <Link to="/planifier" className="btn-primary py-2 px-4 text-sm">Commencer</Link>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 flex flex-col",
        !isLogin && "pt-20 lg:pt-20",
        !isLogin && "pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0"
      )}>
        <Outlet context={appContext} />
      </main>

      {/* MobileBottomNav */}
      {!isLogin && <MobileBottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<LandingView />} />
        <Route path="tarifs" element={<PricingView />} />
        <Route path="planifier" element={<ModeSelectionView />} />
        <Route path="planifier/onboarding" element={<OnboardingView />} />
        <Route path="planifier/manuel" element={<ManualCanvasView />} />
        <Route path="planifier/wizard" element={<Wizard />} />
        <Route path="itineraire" element={<ItineraryView />} />
        <Route path="voyages" element={<TripsListView />} />
        <Route path="profil" element={<ProfileView />} />
      </Route>
      <Route path="/connexion" element={<Login />} />
    </Routes>
  );
}
