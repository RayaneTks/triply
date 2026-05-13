'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthSession } from '../../src/hooks/useAuthSession';
import { authClient } from '../../src/lib/auth-client';
import { Users, Map, CreditCard, TrendingUp, ShieldAlert } from 'lucide-react';

interface Metrics {
  users: { total: number; new_this_month: number; growth: { month: string; count: number }[] };
  trips: { total: number; new_this_month: number };
  subscriptions: { total: number; active: number };
  payments: { total: number; revenue_eur: number };
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  est_admin: boolean;
  subscription_tier: string | null;
  created_at: string | null;
  suspended?: boolean;
}

interface AdminTrip {
  id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  budget_total: number | null;
  travelers_count: number | null;
  owner: { id: string; name: string | null; email: string | null };
  created_at: string | null;
}

interface AdminInsights {
  users: { total: number; new_30d: number; with_trips: number; without_trips: number };
  subscriptions: { paying: number; conversion_rate: number };
  trips: {
    total: number;
    new_30d: number;
    avg_per_user: number;
    with_activities: number;
    planning_coverage_rate: number;
    avg_budget_eur: number;
  };
  retention: { repeat_user_rate: number; activation_rate: number };
  top_destinations: Array<{ destination: string; total: number }>;
  improvement_axes: string[];
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
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [trips, setTrips] = useState<AdminTrip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [tripsError, setTripsError] = useState<string | null>(null);
  const [tripSearch, setTripSearch] = useState('');
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [insights, setInsights] = useState<AdminInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'overview' | 'users' | 'trips' | 'insights'>('overview');

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

  const loadUsers = useCallback(
    async (nextSearch?: string) => {
      if (isLoading || !currentUser?.est_admin) return;
      const token = authClient.getToken();
      if (!token) return;
      setUsersLoading(true);
      setUsersError(null);
      try {
        const q = (nextSearch ?? search).trim();
        const url = q ? `/api/v1/admin/users?search=${encodeURIComponent(q)}` : '/api/v1/admin/users';
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = body?.error?.message || body?.message || 'Impossible de charger les utilisateurs.';
          throw new Error(msg);
        }
        const items = body?.data?.items ?? [];
        setUsers(Array.isArray(items) ? items : []);
      } catch (e) {
        setUsersError(e instanceof Error ? e.message : 'Impossible de charger les utilisateurs.');
      } finally {
        setUsersLoading(false);
      }
    },
    [currentUser?.est_admin, isLoading, search],
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const loadTrips = useCallback(
    async (nextSearch?: string) => {
      if (isLoading || !currentUser?.est_admin) return;
      const token = authClient.getToken();
      if (!token) return;
      setTripsLoading(true);
      setTripsError(null);
      try {
        const q = (nextSearch ?? tripSearch).trim();
        const url = q ? `/api/v1/admin/trips?search=${encodeURIComponent(q)}` : '/api/v1/admin/trips';
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = body?.error?.message || body?.message || 'Impossible de charger les voyages.';
          throw new Error(msg);
        }
        const items = body?.data?.items ?? [];
        setTrips(Array.isArray(items) ? items : []);
      } catch (e) {
        setTripsError(e instanceof Error ? e.message : 'Impossible de charger les voyages.');
      } finally {
        setTripsLoading(false);
      }
    },
    [currentUser?.est_admin, isLoading, tripSearch],
  );

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const loadInsights = useCallback(async () => {
    if (isLoading || !currentUser?.est_admin) return;
    const token = authClient.getToken();
    if (!token) return;
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const res = await fetch('/api/v1/admin/insights', {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = body?.error?.message || body?.message || 'Impossible de charger les KPI.';
        throw new Error(msg);
      }
      setInsights(body?.data ?? null);
    } catch (e) {
      setInsightsError(e instanceof Error ? e.message : 'Impossible de charger les KPI.');
    } finally {
      setInsightsLoading(false);
    }
  }, [currentUser?.est_admin, isLoading]);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  const updateUser = async (userId: string, patch: Partial<Pick<AdminUser, 'est_admin' | 'subscription_tier'>>) => {
    const token = authClient.getToken();
    if (!token) return;
    setSavingUserId(userId);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patch),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = body?.error?.message || body?.message || 'Mise à jour impossible.';
        throw new Error(msg);
      }
      const updated = body?.data;
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Mise à jour impossible.');
    } finally {
      setSavingUserId(null);
    }
  };

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
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { id: 'overview', label: 'Vue globale' },
          { id: 'users', label: 'Utilisateurs' },
          { id: 'trips', label: 'Voyages' },
          { id: 'insights', label: 'KPI SaaS' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActivePanel(tab.id as typeof activePanel)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activePanel === tab.id
                ? 'bg-brand/15 text-brand border border-brand/30'
                : 'bg-card border border-light-border text-light-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
          {activePanel === 'overview' && (
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

          {activePanel === 'users' && (
          <div className="triply-card p-6 mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-sm font-semibold text-light-muted uppercase tracking-wider">
                Gestion utilisateurs
              </h2>
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void loadUsers(search);
                }}
              >
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher email/nom"
                  className="rounded-lg border border-light-border bg-card px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-light-border px-3 py-2 text-sm font-semibold hover:bg-light-bg"
                >
                  Filtrer
                </button>
              </form>
            </div>
            {usersError && <p className="text-sm text-red-500 mb-3">{usersError}</p>}
            {usersLoading ? (
              <p className="text-sm text-light-muted">Chargement des utilisateurs…</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-light-muted border-b border-light-border">
                      <th className="py-2 pr-3">Utilisateur</th>
                      <th className="py-2 pr-3">Rôle admin</th>
                      <th className="py-2 pr-3">Abonnement</th>
                      <th className="py-2">Créé le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-light-border/60">
                        <td className="py-3 pr-3">
                          <div className="font-semibold">{u.name}</div>
                          <div className="text-xs text-light-muted">{u.email}</div>
                        </td>
                        <td className="py-3 pr-3">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={u.est_admin}
                              disabled={savingUserId === u.id}
                              onChange={(e) => void updateUser(u.id, { est_admin: e.target.checked })}
                            />
                            <span>{u.est_admin ? 'Admin' : 'Utilisateur'}</span>
                          </label>
                          <button
                            type="button"
                            disabled={savingUserId === u.id}
                            onClick={() => void updateUser(u.id, { suspended: !(u.suspended === true) })}
                            className="ml-3 rounded border border-light-border px-2 py-1 text-xs hover:bg-light-bg"
                          >
                            {u.suspended ? 'Réactiver' : 'Suspendre'}
                          </button>
                        </td>
                        <td className="py-3 pr-3">
                          <select
                            value={u.subscription_tier ?? ''}
                            disabled={savingUserId === u.id}
                            onChange={(e) =>
                              void updateUser(u.id, { subscription_tier: e.target.value || null })
                            }
                            className="rounded-md border border-light-border bg-card px-2 py-1"
                          >
                            <option value="">gratuit</option>
                            <option value="voyageur">voyageur</option>
                            <option value="premium">premium</option>
                          </select>
                        </td>
                        <td className="py-3 text-light-muted">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          )}

          {activePanel === 'trips' && (
          <div className="triply-card p-6 mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-sm font-semibold text-light-muted uppercase tracking-wider">
                Gestion voyages
              </h2>
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void loadTrips(tripSearch);
                }}
              >
                <input
                  value={tripSearch}
                  onChange={(e) => setTripSearch(e.target.value)}
                  placeholder="Rechercher voyage/proprio"
                  className="rounded-lg border border-light-border bg-card px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-light-border px-3 py-2 text-sm font-semibold hover:bg-light-bg"
                >
                  Filtrer
                </button>
              </form>
            </div>
            {tripsError && <p className="text-sm text-red-500 mb-3">{tripsError}</p>}
            {tripsLoading ? (
              <p className="text-sm text-light-muted">Chargement des voyages…</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-light-muted border-b border-light-border">
                      <th className="py-2 pr-3">Voyage</th>
                      <th className="py-2 pr-3">Propriétaire</th>
                      <th className="py-2 pr-3">Période</th>
                      <th className="py-2 pr-3">Budget</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map((t) => (
                      <tr key={t.id} className="border-b border-light-border/60">
                        <td className="py-3 pr-3">
                          <div className="font-semibold">{t.title || 'Sans titre'}</div>
                          <div className="text-xs text-light-muted">{t.destination || '—'}</div>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="font-medium">{t.owner?.name || '—'}</div>
                          <div className="text-xs text-light-muted">{t.owner?.email || '—'}</div>
                        </td>
                        <td className="py-3 pr-3 text-light-muted">
                          {t.start_date || '—'} → {t.end_date || '—'}
                        </td>
                        <td className="py-3 pr-3">
                          {typeof t.budget_total === 'number' ? `${t.budget_total.toLocaleString('fr-FR')}€` : '—'}
                        </td>
                        <td className="py-3">
                          <button
                            type="button"
                            disabled={deletingTripId === t.id}
                            onClick={async () => {
                              if (!confirm(`Supprimer le voyage "${t.title}" ?`)) return;
                              const token = authClient.getToken();
                              if (!token) return;
                              setDeletingTripId(t.id);
                              try {
                                const res = await fetch(`/api/v1/admin/trips/${t.id}`, {
                                  method: 'DELETE',
                                  headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                                });
                                const body = await res.json().catch(() => null);
                                if (!res.ok) {
                                  const msg = body?.error?.message || body?.message || 'Suppression impossible.';
                                  throw new Error(msg);
                                }
                                setTrips((prev) => prev.filter((x) => x.id !== t.id));
                              } catch (e) {
                                alert(e instanceof Error ? e.message : 'Suppression impossible.');
                              } finally {
                                setDeletingTripId(null);
                              }
                            }}
                            className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          )}

          {activePanel === 'insights' && (
            <div className="space-y-6 mt-6">
              {insightsError && <p className="text-sm text-red-500">{insightsError}</p>}
              {insightsLoading || !insights ? (
                <p className="text-sm text-light-muted">Chargement des KPI SaaS…</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard icon={Users} label="Activation" value={`${insights.retention.activation_rate}%`} sub={`${insights.users.with_trips}/${insights.users.total} users avec voyage`} accent />
                    <KpiCard icon={TrendingUp} label="Rétention (2+ voyages)" value={`${insights.retention.repeat_user_rate}%`} sub="Utilisateurs qui reviennent" />
                    <KpiCard icon={CreditCard} label="Conversion abonnement" value={`${insights.subscriptions.conversion_rate}%`} sub={`${insights.subscriptions.paying} payants`} accent />
                    <KpiCard icon={Map} label="Couverture planning" value={`${insights.trips.planning_coverage_rate}%`} sub={`${insights.trips.with_activities}/${insights.trips.total} voyages avec activités`} />
                  </div>

                  <div className="triply-card p-6">
                    <h3 className="text-sm font-semibold text-light-muted uppercase tracking-wider mb-4">KPI produit complémentaires</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="rounded-xl border border-light-border p-4 bg-light-bg/20">
                        <p className="text-xs text-light-muted uppercase">Nouveaux users (30j)</p>
                        <p className="text-2xl font-bold mt-1">{insights.users.new_30d}</p>
                      </div>
                      <div className="rounded-xl border border-light-border p-4 bg-light-bg/20">
                        <p className="text-xs text-light-muted uppercase">Nouveaux voyages (30j)</p>
                        <p className="text-2xl font-bold mt-1">{insights.trips.new_30d}</p>
                      </div>
                      <div className="rounded-xl border border-light-border p-4 bg-light-bg/20">
                        <p className="text-xs text-light-muted uppercase">Budget moyen</p>
                        <p className="text-2xl font-bold mt-1">{insights.trips.avg_budget_eur.toLocaleString('fr-FR')}€</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="triply-card p-6">
                      <h3 className="text-sm font-semibold text-light-muted uppercase tracking-wider mb-4">Top destinations</h3>
                      <ul className="space-y-3">
                        {insights.top_destinations.length === 0 && (
                          <li className="text-sm text-light-muted">Pas assez de données.</li>
                        )}
                        {insights.top_destinations.map((d) => (
                          <li key={d.destination} className="flex items-center justify-between border-b border-light-border/50 pb-2">
                            <span className="font-medium">{d.destination}</span>
                            <span className="text-light-muted text-sm">{d.total} voyage(s)</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="triply-card p-6">
                      <h3 className="text-sm font-semibold text-light-muted uppercase tracking-wider mb-4">Axes d’amélioration SaaS</h3>
                      <ul className="space-y-3 list-disc pl-5 text-sm">
                        {insights.improvement_axes.map((axis) => (
                          <li key={axis}>{axis}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
