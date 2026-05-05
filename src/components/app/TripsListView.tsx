import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Plus, MapPin, Calendar, ChevronRight, Inbox, Wallet } from "lucide-react";
import { EmptyState } from "../ui/EmptyState";
import { PageHeader } from "../ui/PageHeader";
import { listStoredTrips, type StoredTrip } from "../../lib/local-trips-store";
import { formatTripDateRange } from "../../lib/format-trip-dates";
import { authClient } from "../../lib/auth-client";
import { tripsClient } from "../../lib/trips-client";
import { tripApiToStoredTripForList } from "../../lib/trip-view-adapter";

export function TripsListView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [trips, setTrips] = useState<StoredTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const load = async () => {
      if (authClient.getToken()) {
        try {
          const items = await tripsClient.list();
          if (!cancelled) setTrips(items.map(tripApiToStoredTripForList));
        } catch {
          if (!cancelled) setTrips(listStoredTrips());
        }
      } else if (!cancelled) {
        setTrips(listStoredTrips());
      }
      if (!cancelled) setIsLoading(false);
    };

    const t = window.setTimeout(() => {
      void load();
    }, 150);

    const onAuth = () => {
      void load();
    };
    window.addEventListener("triply-auth-changed", onAuth);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      window.removeEventListener("triply-auth-changed", onAuth);
    };
  }, [location.key]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 animate-pulse space-y-12">
        <div className="h-12 bg-slate-200 w-1/3 rounded-lg"></div>
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-[32px] w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 lg:py-20">
      <PageHeader
        title="Mes voyages"
        subtitle="Retrouvez vos itinéraires cadrés et vos brouillons de planification."
        actions={
          <button
            type="button"
            onClick={() => navigate("/planifier")}
            className="btn-primary py-2 px-6 text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Nouveau voyage
          </button>
        }
      />

      {trips.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Le cockpit est vide"
          description="Aucun voyage côté serveur (connecté) ou en brouillon local. Terminez le wizard ou créez un voyage depuis l’API."
          action={<Link to="/planifier" className="btn-primary">Commencer le cadrage</Link>}
        />
      ) : (
        <div className="grid gap-6 mt-12">
          {trips.map((trip) => (
            <div
              key={trip.id}
              role="link"
              tabIndex={0}
              onClick={() => navigate(`/voyages/${trip.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/voyages/${trip.id}`);
                }
              }}
              className="triply-card p-8 group flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer"
            >
              <div className="flex gap-8 items-center">
                <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <MapPin size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2 group-hover:text-brand transition-colors">
                    {trip.destination}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-light-muted">
                    <span className="flex items-center gap-2">
                      <Calendar size={14} />{" "}
                      {formatTripDateRange(trip.startDate, trip.endDate)}
                    </span>
                    <span className="flex items-center gap-2">
                      <Wallet size={14} /> {trip.budget.toLocaleString("fr-FR")} €
                    </span>
                    <span
                      className={
                        trip.status === "planned"
                          ? "px-3 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] uppercase border border-emerald-100"
                          : "px-3 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] uppercase border border-amber-100"
                      }
                    >
                      {trip.status === "planned" ? "Enregistré" : "Brouillon"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <span className="text-sm font-bold text-brand md:opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 group-hover:translate-x-[-10px]">
                  Ouvrir <ChevronRight size={16} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
