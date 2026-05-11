'use client';

import { useEffect, useState } from 'react';
import { useAuthSession } from '../../src/hooks/useAuthSession';
import { authClient } from '../../src/lib/auth-client';
import { Users, Map, CreditCard, TrendingUp, ShieldAlert } from 'lucide-react';

interface Metrics {
  users: { total: number; new_this_month: number; growth: { month: string; count: number }[] };
  trips: { total: number; new_this_month: number };
  subscriptions: { total: number; active: number };
  payments: { total: number; revenue_eur: number };
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="triply-card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-light-muted uppercase tracking-wider">{label}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent ? 'bg-brand/15 text-brand' : 'bg-light-border text-light-muted'}`}>
          <Icon size={20} />
        </div>
      </div>
      <div>
        <p className="text-4xl font-display font-bold">{value}</p>
        {sub && <p className="text-xs text-light-muted mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { currentUser, isLoading } = useAuthSession();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || !currentUser?.est_admin) return;
    const token = authClient.getToken();
    if (!token) return;

    fetch('/api/v1/admin/metrics', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then((r) => r.json())
      .then((body) => {
        const attrs = body?.data?.attributes ?? body?.data;
        setMetrics(attrs);
      })
      .catch(() => setError('Impossible de charger les métriques.'));
  }, [currentUser, isLoading]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-light-muted">Chargement…</div>;
  }

  if (!currentUser?.est_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-6">
        <ShieldAlert size={48} className="text-red-400" />
        <h1 className="text-2xl font-bold">Accès réservé</h1>
        <p className="text-light-muted">Cette page est réservée aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-display font-bold">Back office</h1>
        <p className="text-light-muted mt-1">Vue d'ensemble de l'activité Triply</p>
      </div>

      {error && (
        <div className="triply-card border-red-500/30 bg-red-500/5 p-4 text-red-400 text-sm mb-8 rounded-xl">
          {error}
        </div>
      )}

      {!metrics ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="triply-card p-6 h-36 animate-pulse bg-light-border/20" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <KpiCard
              icon={Users}
              label="Utilisateurs"
              value={metrics.users.total}
              sub={`+${metrics.users.new_this_month} ce mois`}
              accent
            />
            <KpiCard
              icon={Map}
              label="Voyages planifiés"
              value={metrics.trips.total}
              sub={`+${metrics.trips.new_this_month} ce mois`}
            />
            <KpiCard
              icon={TrendingUp}
              label="Abonnements actifs"
              value={metrics.subscriptions.active}
              sub={`${metrics.subscriptions.total} au total`}
              accent
            />
            <KpiCard
              icon={CreditCard}
              label="Revenus"
              value={`${metrics.payments.revenue_eur.toLocaleString('fr-FR')} €`}
              sub={`${metrics.payments.total} paiement(s)`}
            />
          </div>

          {/* Croissance utilisateurs */}
          <div className="triply-card p-6">
            <h2 className="text-sm font-semibold text-light-muted uppercase tracking-wider mb-6">
              Nouveaux utilisateurs — 6 derniers mois
            </h2>
            <div className="flex items-end gap-3 h-28">
              {metrics.users.growth.map((g) => {
                const max = Math.max(...metrics.users.growth.map((x) => x.count), 1);
                const pct = Math.round((g.count / max) * 100);
                return (
                  <div key={g.month} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-xs font-bold text-light-muted">{g.count}</span>
                    <div
                      className="w-full bg-brand/70 rounded-t-md transition-all"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                    <span className="text-xs text-light-muted">{g.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tableau utilisateurs récents */}
          <div className="triply-card p-6 mt-6">
            <h2 className="text-sm font-semibold text-light-muted uppercase tracking-wider mb-4">
              Aperçu abonnements
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-light-border/20 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold">{metrics.subscriptions.active}</p>
                <p className="text-xs text-light-muted mt-1">Actifs</p>
              </div>
              <div className="bg-light-border/20 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold">
                  {metrics.subscriptions.total - metrics.subscriptions.active}
                </p>
                <p className="text-xs text-light-muted mt-1">Inactifs / expirés</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
