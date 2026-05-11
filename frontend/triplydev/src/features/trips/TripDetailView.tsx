import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Wallet,
  Users,
  ArrowLeft,
  Map as MapIcon,
  Copy,
  Archive,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Bot,
  FileText,
} from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Map } from "../../components/Map/Map";
import { cn } from "../../lib/utils";
import { motion } from "motion/react";
import { getStoredTrip } from "../../lib/local-trips-store";
import { ErrorState } from "../../components/ui/ErrorState";
import { authClient } from "../../lib/auth-client";
import { tripsClient, type TripApi } from "../../lib/trips-client";
import { tripDetailFromApi, tripDetailFromStored, type TripDetailDisplay } from "../../lib/trip-view-adapter";

export function TripDetailView() {
  const { tripId } = useParams();
  const [activeTab, setActiveTab] = useState("itinerary");
  const [isLoading, setIsLoading] = useState(true);
  const [apiTrip, setApiTrip] = useState<TripApi | null | undefined>(undefined);
  const [storedOnly, setStoredOnly] = useState<ReturnType<typeof getStoredTrip>>(undefined);

  useEffect(() => {
    let cancelled = false;
    if (!tripId) {
      setApiTrip(null);
      setStoredOnly(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setApiTrip(undefined);
    setStoredOnly(undefined);

    (async () => {
      if (authClient.getToken()) {
        const remote = await tripsClient.get(tripId);
        if (cancelled) return;
        if (remote) {
          setApiTrip(remote);
          setStoredOnly(undefined);
          setIsLoading(false);
          return;
        }
      }
      const local = getStoredTrip(tripId);
      if (!cancelled) {
        setApiTrip(null);
        setStoredOnly(local);
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const trip: TripDetailDisplay | null = useMemo(() => {
    if (apiTrip) return tripDetailFromApi(apiTrip);
    if (storedOnly) return tripDetailFromStored(storedOnly);
    return null;
  }, [apiTrip, storedOnly]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 space-y-12 animate-pulse">
        <div className="h-10 bg-slate-200 w-1/4 rounded-lg" />
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-slate-100 rounded-[32px]" />
            ))}
          </div>
          <div className="h-96 bg-slate-100 rounded-[32px]" />
        </div>
      </div>
    );
  }

  if (!tripId || !trip) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <ErrorState
          title="Voyage introuvable"
          description="Aucun voyage avec cet identifiant sur le serveur (si vous êtes connecté) ni en brouillon local sur cet appareil."
          primaryAction={{ label: "Mes voyages", to: "/voyages" }}
          secondaryAction={{ label: "Planifier", to: "/planifier" }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
      <Link
        to="/voyages"
        className="inline-flex items-center gap-2 text-light-muted hover:text-brand font-bold text-xs uppercase mb-8 transition-colors"
      >
        <ArrowLeft size={14} /> Retour à mes voyages
      </Link>

      <PageHeader
        title={`Voyage — ${trip.destination}`}
        subtitle={`${trip.dates} • ${trip.travelers} voyageur${trip.travelers > 1 ? "s" : ""}`}
        actions={
          <div className="flex gap-3">
            <button
              type="button"
              className="btn-secondary py-2 px-4 text-xs flex items-center gap-2"
            >
              <Copy size={14} /> Dupliquer
            </button>
            <button
              type="button"
              className="btn-secondary py-2 px-4 text-xs flex items-center gap-2 text-red-600 hover:bg-red-50"
            >
              <Archive size={14} /> Archiver
            </button>
          </div>
        }
      />

      <p className="text-sm text-light-muted font-bold mb-10 max-w-2xl">{trip.fullLabel}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: "Budget total", val: `${trip.budget}€`, icon: Wallet, color: "text-brand" },
          { label: "Budget restant (estim.)", val: `${trip.remainingBudget}€`, icon: Sparkles, color: "text-emerald-600" },
          { label: "Statut", val: trip.statusLabel, icon: Clock, color: "text-amber-600" },
          { label: "Destination", val: trip.destination, icon: MapPin, color: "text-brand" },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-light-border p-6 rounded-3xl space-y-1">
            <p className="text-[10px] font-bold text-light-muted uppercase tracking-widest flex items-center gap-2">
              <stat.icon size={12} className={stat.color} /> {stat.label}
            </p>
            <p className={cn("text-xl font-display font-bold", stat.color)}>{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <nav className="flex flex-wrap gap-2 p-1.5 bg-light-bg rounded-2xl w-fit border border-light-border">
            {[
              { id: "itinerary", label: "Jour par jour" },
              { id: "map", label: "Carte interactive" },
              { id: "docs", label: "Notes & docs" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                  activeTab === tab.id
                    ? "bg-white text-brand shadow-sm"
                    : "text-light-muted hover:text-light-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <section>
            {activeTab === "itinerary" && (
              <div className="space-y-6">
                {trip.days.map((day) => (
                  <div key={day.id} className="triply-card p-8 group relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-brand/10 transition-colors group-hover:bg-brand" />
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-4">
                        <span className="text-[10px] font-bold text-brand bg-brand/5 px-2 py-1 rounded">
                          JOUR 0{day.id}
                        </span>
                        <h3 className="text-2xl font-bold">{day.title}</h3>
                        <div className="flex items-center gap-6 text-sm text-light-muted">
                          <span className="flex items-center gap-2">
                            <Clock size={14} /> 09:00 – 18:30
                          </span>
                          <span
                            className={cn(
                              "px-3 py-0.5 rounded-full text-[10px] font-bold uppercase",
                              day.status === "Cadré"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-amber-50 text-amber-600"
                            )}
                          >
                            {day.status}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="text-light-border group-hover:text-brand group-hover:translate-x-2 transition-all shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "map" && (
              <div className="aspect-video lg:aspect-auto lg:h-[600px] w-full bg-light-bg rounded-[40px] overflow-hidden border border-light-border">
                <Map />
              </div>
            )}

            {activeTab === "docs" && (
              <div className="triply-card p-8 lg:p-10 space-y-6">
                <div className="flex items-center gap-3 text-light-muted">
                  <FileText size={22} className="text-brand" />
                  <h3 className="text-lg font-bold text-light-foreground">Notes & documents</h3>
                </div>
                <p className="text-sm text-light-muted font-bold leading-relaxed">
                  Zone réservée aux PDF de réservation, confirmations et notes libres. Branchement stockage /
                  pièces jointes prévu côté API.
                </p>
                <ul className="space-y-3 text-sm font-bold text-light-foreground">
                  <li className="flex items-center justify-between p-4 bg-light-bg rounded-xl border border-light-border">
                    <span>Brief voyage (mock)</span>
                    <span className="text-[10px] text-light-muted uppercase">Bientôt</span>
                  </li>
                </ul>
                <button type="button" className="btn-secondary text-sm py-3 w-full sm:w-auto">
                  Ajouter un document
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="triply-card p-8 border-2 border-brand/20 bg-brand/5 space-y-6"
          >
            <header className="flex items-center gap-3 text-brand">
              <Bot size={24} />
              <h3 className="font-bold">Copilote</h3>
            </header>
            <p className="text-sm text-brand leading-relaxed">
              Suggestion : affinez le jour 3 ou demandez un arbitrage budget pour une activité prioritaire.
            </p>
            <div className="pt-4 border-t border-brand/10">
              <button
                type="button"
                className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2"
              >
                Proposer un arbitrage
              </button>
            </div>
          </motion.div>

          <div className="p-8 bg-white border border-light-border rounded-[32px] space-y-6">
            <h4 className="font-bold flex items-center gap-2">
              <MapIcon size={18} className="text-light-muted" /> Ressources
            </h4>
            <ul className="space-y-4">
              {[
                { t: "Billets & réservations", d: "À connecter à l’API", icon: ExternalLink },
                { t: "Hébergement", d: "Placeholder", icon: ExternalLink },
              ].map((res, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between p-4 bg-light-bg rounded-xl group hover:bg-white border border-transparent hover:border-light-border transition-all"
                >
                  <div>
                    <p className="text-sm font-bold">{res.t}</p>
                    <p className="text-[10px] text-light-muted">{res.d}</p>
                  </div>
                  <res.icon size={14} className="text-light-muted group-hover:text-brand" />
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="w-full text-xs font-bold text-light-muted hover:text-brand transition-colors text-center"
            >
              Ajouter un lien
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-light-muted">
            <Calendar size={14} />
            <span>{trip.dates}</span>
            <Users size={14} className="ml-2" />
            <span>{trip.travelers}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
