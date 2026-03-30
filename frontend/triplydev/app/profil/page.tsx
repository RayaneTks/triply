'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BedDouble, Bell, CircleUserRound, HeartHandshake, SlidersHorizontal } from 'lucide-react';
import { AppShell } from '@/src/components/AppShell/AppShell';
import { ContextSummaryCard } from '@/src/components/GuidedUI/ContextSummaryCard';
import { EmptyStateAction } from '@/src/components/GuidedUI/EmptyStateAction';
import { InlineStatus } from '@/src/components/GuidedUI/InlineStatus';
import {
    clearSession,
    fetchPreferences,
    getStoredSession,
    logout,
    me,
    saveSession,
    updatePreferences,
    updateProfile,
    type AuthUser,
    type UserPreferences,
} from '@/src/lib/auth-client';
import {
    PREFERENCES_STORAGE_KEY,
    preferencesPayloadToAssistantTags,
    TuPreferes,
    type PreferencesPayload,
} from '@/src/components/TuPreferes/TuPreferes';

const LABEL_MAP: Record<string, string> = {
    plage: 'Plage',
    montagne: 'Montagne',
    ville: 'Ville',
    campagne: 'Campagne',
    aventurier: 'Aventurier',
    epicurien: 'Epicurien',
    contemplatif: 'Contemplatif',
    fetard: 'Fetard',
    randonnee: 'Randonnee',
    gastronomie: 'Gastronomie',
    culture: 'Musees et culture',
    nautique: 'Sports nautiques',
    nightlife: 'Vie nocturne',
    shopping: 'Shopping',
    planifie: 'Programme cadre',
    spontane: 'Au feeling',
    flexible: 'Mix des deux',
    streetfood: 'Street food locale',
    gastro: 'Restaurants gastro',
    homecook: 'Je cuisine sur place',
    adaptable: "Je m'adapte",
    full_ai: 'Guide',
    semi_ai: 'Autonome',
    manual: 'Libre',
};

function Tag({ value }: { value: string }) {
    return (
        <span className="inline-flex rounded-full bg-[var(--app-brand-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--primary)]">
            {LABEL_MAP[value] ?? value}
        </span>
    );
}

function PreferenceRow({ label, values }: { label: string; values: string[] }) {
    if (!values.length) return null;
    return (
        <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[color:var(--app-muted)]">{label}</span>
            <div className="flex flex-wrap gap-2">
                {values.map((value) => (
                    <Tag key={value} value={value} />
                ))}
            </div>
        </div>
    );
}

export default function ProfilPage() {
    const router = useRouter();
    const [isConnected, setIsConnected] = useState(false);
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPrefsModal, setShowPrefsModal] = useState(false);
    const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        preferences: {
            newsletter: true,
            notifications: true,
        },
    });

    useEffect(() => {
        const loadProfile = async () => {
            const session = getStoredSession();
            if (!session?.token) {
                setIsConnected(false);
                setLoading(false);
                return;
            }

            try {
                const user = await me(session.token);
                const chunks = (user.name || '').trim().split(/\s+/).filter(Boolean);
                const firstName = chunks[0] || '';
                const lastName = chunks.slice(1).join(' ');

                setCurrentUser(user);
                setProfile((prev) => ({
                    ...prev,
                    firstName,
                    lastName,
                    email: user.email || '',
                }));

                saveSession({ token: session.token, user });
                setIsConnected(true);

                try {
                    const prefs = await fetchPreferences(session.token);
                    setUserPreferences(prefs);
                } catch {
                    setError("Profil charge, mais les preferences n'ont pas pu etre recuperees.");
                }
            } catch {
                clearSession();
                setIsConnected(false);
                setError('Session invalide. Merci de vous reconnecter.');
            } finally {
                setLoading(false);
            }
        };

        void loadProfile();
    }, []);

    const initials = useMemo(() => {
        const first = profile.firstName?.[0] || '';
        const last = profile.lastName?.[0] || '';
        return `${first}${last}`.trim() || (profile.email?.[0] || 'U');
    }, [profile.email, profile.firstName, profile.lastName]);

    const hasPreferences = !!(
        userPreferences.environments?.length ||
        userPreferences.traveler_profile ||
        userPreferences.interests?.length ||
        userPreferences.pace ||
        userPreferences.food_preference ||
        userPreferences.planning_mode
    );

    const handleLogout = async () => {
        const session = getStoredSession();
        if (session?.token) {
            try {
                await logout(session.token);
            } catch {
                // no-op
            }
        }
        clearSession();
        setIsConnected(false);
        router.push('/');
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const session = getStoredSession();
            if (!session?.token) {
                throw new Error('Session invalide. Merci de vous reconnecter.');
            }

            const fullName = `${profile.firstName} ${profile.lastName}`.trim();
            if (fullName) {
                await updateProfile(session.token, { name: fullName });
                const nextUser = {
                    ...(session.user || { id: 0, email: profile.email, name: fullName }),
                    name: fullName,
                    email: profile.email,
                };
                saveSession({
                    token: session.token,
                    user: nextUser,
                });
                setCurrentUser(nextUser);
            }

            setSuccess('Profil mis a jour.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Impossible de mettre a jour le profil.');
        } finally {
            setSaving(false);
        }
    };

    const handlePreferencesComplete = async (prefs: PreferencesPayload) => {
        setShowPrefsModal(false);

        const session = getStoredSession();
        if (!session?.token) return;

        try {
            await updatePreferences(session.token, prefs);
            setUserPreferences(prefs);
            try {
                window.localStorage.setItem(
                    PREFERENCES_STORAGE_KEY,
                    JSON.stringify(preferencesPayloadToAssistantTags(prefs)),
                );
            } catch {
                // ignore
            }
            setSuccess('Preferences mises a jour.');
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Impossible de sauvegarder les preferences.');
        }
    };

    return (
        <AppShell
            activeTab="profil"
            title="Profil"
            subtitle="Compte et preferences."
            user={currentUser}
            isConnected={isConnected}
            onLoginClick={() => router.push('/')}
            onLogoutClick={handleLogout}
        >
            {loading ? (
                <div className="space-y-5">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                        <div className="h-56 animate-pulse rounded-[1.9rem] border border-[var(--app-border)] bg-white/60" />
                        <div className="h-56 animate-pulse rounded-[1.9rem] border border-[var(--app-border)] bg-white/60" />
                    </div>
                    <div className="h-64 animate-pulse rounded-[1.9rem] border border-[var(--app-border)] bg-white/60" />
                </div>
            ) : null}

            {!loading && !isConnected ? (
                <EmptyStateAction
                    icon={<CircleUserRound size={30} />}
                    eyebrow="Connexion requise"
                    title="Retrouvez vos preferences et vos voyages"
                    description="Connectez-vous pour retrouver vos voyages et vos preferences."
                    action={
                        <button
                            type="button"
                            onClick={() => router.push('/')}
                            className="inline-flex min-h-12 items-center justify-center rounded-[1.25rem] bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--secondary)]"
                        >
                            Aller a la connexion
                        </button>
                    }
                />
            ) : null}

            {!loading && isConnected ? (
                <div className="space-y-5">
                    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                        <section className="rounded-[1.9rem] border border-[var(--app-border)] bg-white/82 p-6 shadow-[var(--shadow-sm)]">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                                <div className="inline-flex h-20 w-20 items-center justify-center rounded-[1.8rem] bg-[var(--app-brand-soft)] text-3xl font-semibold text-[color:var(--primary)]">
                                    {initials.toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Compte Triply</p>
                                    <h2 className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
                                        {profile.firstName} {profile.lastName}
                                    </h2>
                                    <p className="mt-1 text-sm text-[color:var(--app-muted)]">{profile.email}</p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-[color:var(--app-muted)]">Prenom</label>
                                    <input
                                        type="text"
                                        value={profile.firstName}
                                        onChange={(event) => setProfile({ ...profile, firstName: event.target.value })}
                                        className="input-assistant w-full"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-[color:var(--app-muted)]">Nom</label>
                                    <input
                                        type="text"
                                        value={profile.lastName}
                                        onChange={(event) => setProfile({ ...profile, lastName: event.target.value })}
                                        className="input-assistant w-full"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-[color:var(--app-muted)]">Email</label>
                                    <input type="email" value={profile.email} readOnly className="input-assistant w-full opacity-80" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-[color:var(--app-muted)]">Telephone</label>
                                    <input
                                        type="tel"
                                        value={profile.phone}
                                        onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                                        className="input-assistant w-full"
                                    />
                                </div>
                            </div>
                        </section>

                        <ContextSummaryCard
                            eyebrow="Vos reperes"
                            title="Utilise pour vos voyages"
                            items={[
                                { label: 'Connexion', value: 'Reprise des voyages et brouillons' },
                                { label: 'Preferences', value: hasPreferences ? 'Actives dans les recommandations' : 'A configurer' },
                                { label: 'Continuite', value: 'Memes reperes sur mobile et web' },
                                { label: 'Confort', value: 'Notifications et suivi' },
                            ]}
                        />
                    </section>

                    {error ? <InlineStatus tone="error" message={error} className="w-full" /> : null}
                    {success ? <InlineStatus tone="success" message={success} className="w-full" /> : null}

                    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                        <section className="rounded-[1.9rem] border border-[var(--app-border)] bg-white/82 p-6 shadow-[var(--shadow-sm)]">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Preferences de voyage</p>
                                    <h3 className="mt-1 text-xl font-semibold text-[color:var(--foreground)]">Ce que Triply retient de vos gouts</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowPrefsModal(true)}
                                    className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--app-brand-soft)]"
                                >
                                    {hasPreferences ? 'Modifier mes preferences' : 'Configurer mes preferences'}
                                </button>
                            </div>

                            <div className="mt-6 space-y-4">
                                {hasPreferences ? (
                                    <>
                                        <PreferenceRow label="Environnements" values={userPreferences.environments ?? []} />
                                        <PreferenceRow label="Profil voyageur" values={userPreferences.traveler_profile ? [userPreferences.traveler_profile] : []} />
                                        <PreferenceRow label="Activites" values={userPreferences.interests ?? []} />
                                        <PreferenceRow label="Rythme" values={userPreferences.pace ? [userPreferences.pace] : []} />
                                        <PreferenceRow label="Cuisine" values={userPreferences.food_preference ? [userPreferences.food_preference] : []} />
                                        <PreferenceRow label="Mode prefere" values={userPreferences.planning_mode ? [userPreferences.planning_mode] : []} />
                                    </>
                                ) : (
                                    <div className="rounded-[1.5rem] bg-[var(--app-brand-soft)] p-4 text-sm text-[color:var(--app-muted)]">
                                        Aucune preference enregistree pour l instant.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <section className="rounded-[1.9rem] border border-[var(--app-border)] bg-white/82 p-6 shadow-[var(--shadow-sm)]">
                                <div className="flex items-center gap-3">
                                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-brand-soft)] text-[color:var(--primary)]">
                                        <Bell size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Parametres de confort</p>
                                        <h3 className="mt-1 text-lg font-semibold text-[color:var(--foreground)]">Votre rythme</h3>
                                    </div>
                                </div>
                                <div className="mt-5 space-y-4">
                                    <label className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-[var(--app-border)] bg-white/75 px-4 py-4">
                                        <span className="text-sm font-medium text-[color:var(--foreground)]">Recevoir la newsletter</span>
                                        <input
                                            type="checkbox"
                                            checked={profile.preferences.newsletter}
                                            onChange={(event) =>
                                                setProfile({
                                                    ...profile,
                                                    preferences: { ...profile.preferences, newsletter: event.target.checked },
                                                })
                                            }
                                            className="h-4 w-4 rounded"
                                            style={{ accentColor: 'var(--primary)' }}
                                        />
                                    </label>

                                    <label className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-[var(--app-border)] bg-white/75 px-4 py-4">
                                        <span className="text-sm font-medium text-[color:var(--foreground)]">Notifications par email</span>
                                        <input
                                            type="checkbox"
                                            checked={profile.preferences.notifications}
                                            onChange={(event) =>
                                                setProfile({
                                                    ...profile,
                                                    preferences: { ...profile.preferences, notifications: event.target.checked },
                                                })
                                            }
                                            className="h-4 w-4 rounded"
                                            style={{ accentColor: 'var(--primary)' }}
                                        />
                                    </label>
                                </div>
                            </section>

                            <section className="rounded-[1.9rem] border border-[var(--app-border)] bg-white/82 p-6 shadow-[var(--shadow-sm)]">
                                <div className="flex items-center gap-3">
                                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-brand-soft)] text-[color:var(--primary)]">
                                        <SlidersHorizontal size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Reperes utiles</p>
                                        <h3 className="mt-1 text-lg font-semibold text-[color:var(--foreground)]">Ce que Triply retient</h3>
                                    </div>
                                </div>
                                <div className="mt-5 space-y-3 text-sm text-[color:var(--app-muted)]">
                                    <div className="rounded-[1.35rem] bg-[var(--app-brand-soft)] p-4">
                                        <p className="font-semibold text-[color:var(--foreground)]">Hebergement et confort</p>
                                        <p className="mt-2 leading-relaxed">Rythme, cuisine et style de voyage servent a mieux cadrer les suggestions.</p>
                                    </div>
                                    <div className="rounded-[1.35rem] bg-[var(--app-brand-soft)] p-4">
                                        <p className="font-semibold text-[color:var(--foreground)]">Assistant plus pertinent</p>
                                        <p className="mt-2 leading-relaxed">Vos preferences evitent les suggestions trop generiques.</p>
                                    </div>
                                </div>
                            </section>
                        </section>
                    </section>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => void handleSave()}
                            disabled={saving}
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.25rem] bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--secondary)] disabled:opacity-50"
                        >
                            <HeartHandshake size={16} />
                            {saving ? 'Enregistrement...' : 'Enregistrer mes informations'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowPrefsModal(true)}
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.25rem] border border-[var(--app-border)] bg-white px-5 py-3 text-sm font-semibold text-[color:var(--foreground)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--app-brand-soft)]"
                        >
                            <BedDouble size={16} />
                            Ajuster mes preferences de voyage
                        </button>
                    </div>
                </div>
            ) : null}

            <TuPreferes
                visible={showPrefsModal}
                initialValues={userPreferences}
                onComplete={(prefs) => void handlePreferencesComplete(prefs)}
                onSkip={() => setShowPrefsModal(false)}
            />
        </AppShell>
    );
}
