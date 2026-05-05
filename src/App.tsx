import React, { useState } from "react";
import { Routes, Route, Outlet, useLocation, Link, NavLink, useNavigate } from "react-router-dom";
import { TriplyLogo } from "./components/layout/TriplyLogo";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";
import { cn } from "./lib/utils";
import { ActiveTrip, AppContextType } from "./types/app";
import { useAuthSession } from "./hooks/useAuthSession";

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
import { ProfileView } from "./features/profile/ProfileView";
import { ManualCanvasView } from "./features/modes/ManualCanvasView";
import { TripDetailView } from "./features/trips/TripDetailView";
import { RegisterView } from "./features/auth/RegisterView";
import { ForgotPasswordView } from "./features/auth/ForgotPasswordView";
import { ResetPasswordView } from "./features/auth/ResetPasswordView";
import { TermsView, PrivacyView, MentionsLegalesView } from "./features/legal/LegalViews";
import { AboutView } from "./features/about/AboutView";
import { NotFoundView } from "./features/errors/NotFoundView";

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === "/connexion";
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const { isConnected, currentUser, logout } = useAuthSession();

  const appContext: AppContextType = {
    activeTrip,
    hasDraft: false,
    isConnected,
    currentUser,
    openLogin: () => navigate("/connexion"),
    logout,
    persistCurrentTrip: (trip) => setActiveTrip((prev) => (prev ? { ...prev, ...trip } : null)),
  };

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col",
        location.pathname.startsWith("/connexion") ? "bg-dark-bg" : "bg-light-bg",
      )}
    >
      {!isLogin && (
        <header className="hidden lg:flex fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-light-border z-50 px-8 items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/">
              <TriplyLogo />
            </Link>
            <nav className="flex items-center gap-8">
              <NavLink
                to="/planifier"
                className={({ isActive }) =>
                  cn(
                    "text-sm font-bold transition-colors",
                    isActive ? "text-brand" : "text-light-muted hover:text-light-foreground",
                  )
                }
              >
                Planifier
              </NavLink>
              <NavLink
                to="/tarifs"
                className={({ isActive }) =>
                  cn(
                    "text-sm font-bold transition-colors",
                    isActive ? "text-brand" : "text-light-muted hover:text-light-foreground",
                  )
                }
              >
                Tarifs
              </NavLink>
              <NavLink
                to="/voyages"
                className={({ isActive }) =>
                  cn(
                    "text-sm font-bold transition-colors",
                    isActive ? "text-brand" : "text-light-muted hover:text-light-foreground",
                  )
                }
              >
                Mes voyages
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {isConnected && currentUser ? (
              <span className="text-xs font-bold text-light-muted max-w-[180px] truncate" title={currentUser.email}>
                {currentUser.name}
              </span>
            ) : null}
            <NavLink to="/profil" className="text-sm font-bold text-light-muted hover:text-light-foreground">
              Profil
            </NavLink>
            {isConnected ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="text-sm font-bold text-light-muted hover:text-brand"
              >
                Déconnexion
              </button>
            ) : (
              <Link to="/connexion" className="text-sm font-bold text-light-muted hover:text-brand">
                Connexion
              </Link>
            )}
            <Link to="/planifier" className="btn-primary py-2 px-4 text-sm">
              Commencer
            </Link>
          </div>
        </header>
      )}

      <main
        className={cn(
          "flex-1 flex flex-col",
          !isLogin && "pt-20 lg:pt-20",
          !isLogin && "pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0",
        )}
      >
        <Outlet context={appContext} />
      </main>

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
        <Route path="a-propos" element={<AboutView />} />

        <Route path="planifier" element={<ModeSelectionView />} />
        <Route path="planifier/onboarding" element={<OnboardingView />} />
        <Route path="planifier/manuel" element={<ManualCanvasView />} />
        <Route path="planifier/wizard" element={<Wizard />} />

        <Route path="itineraire" element={<ItineraryView />} />
        <Route path="voyages" element={<TripsListView />} />
        <Route path="voyages/:tripId" element={<TripDetailView />} />
        <Route path="profil" element={<ProfileView />} />

        <Route path="legal/cgu" element={<TermsView />} />
        <Route path="legal/confidentialite" element={<PrivacyView />} />
        <Route path="legal/mentions" element={<MentionsLegalesView />} />

        <Route path="*" element={<NotFoundView />} />
      </Route>

      <Route path="/connexion" element={<Login />} />
      <Route path="/inscription" element={<RegisterView />} />
      <Route path="/mot-de-passe-oublie" element={<ForgotPasswordView />} />
      <Route path="/reinitialisation" element={<ResetPasswordView />} />
    </Routes>
  );
}
