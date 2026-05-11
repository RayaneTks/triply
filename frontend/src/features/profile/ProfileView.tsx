'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Bell,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    Globe,
    LayoutGrid,
    LogOut,
    Mail,
    MapPin,
    Plus,
    Settings,
    Shield,
    Trash2,
    User as UserIcon,
    X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '../../lib/utils';
import { PageHeader } from '../../components/ui/PageHeader';
import {
    authClient,
    fetchProfile,
    updateProfile,
    updatePreferences,
    type ProfileAttributes,
    type UserPreferences,
} from '../../lib/auth-client';

type TabId = 'compte' | 'preferences' | 'notifications' | 'securite';

interface Feedback {
    kind: 'success' | 'error';
    message: string;
}

const PACE_OPTIONS: Array<{ value: NonNullable<UserPreferences['pace']>; label: string }> = [
    { value: 'slow', label: 'Tranquille' },
    { value: 'medium', label: 'Équilibré' },
    { value: 'fast', label: 'Intense' },
    { value: 'planifie', label: 'Planifié & dense' },
    { value: 'spontane', label: 'Spontané' },
    { value: 'flexible', label: 'Flexible' },
];

const PLANNING_MODE_OPTIONS: Array<{ value: NonNullable<UserPreferences['planning_mode']>; label: string }> = [
    { value: 'full_ai', label: 'Copilote assisté (IA complète)' },
    { value: 'semi_ai', label: 'Mixte (semi-IA)' },
    { value: 'manual', label: 'Manuel' },
];

const INTEREST_SUGGESTIONS = ['Culture', 'Nature', 'Gastronomie', 'Plages', 'Nuit', 'Shopping', 'Sport', 'Histoire'];
const DIET_SUGGESTIONS = ['Végétarien', 'Végan', 'Halal', 'Sans gluten', 'Sans lactose'];

function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'TR';
}

export function ProfileView() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabId>('compte');
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [profile, setProfile] = useState<ProfileAttributes | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [accountForm, setAccountForm] = useState({ name: '', timezone: '', photo_url: '' });
    const [accountSaving, setAccountSaving] = useState(false);
    const [accountFeedback, setAccountFeedback] = useState<Feedback | null>(null);

    const [prefsForm, setPrefsForm] = useState<UserPreferences>({});
    const [prefsSaving, setPrefsSaving] = useState(false);
    const [prefsFeedback, setPrefsFeedback] = useState<Feedback | null>(null);

    const [newInterest, setNewInterest] = useState('');
    const [newDiet, setNewDiet] = useState('');
    const [newVisited, setNewVisited] = useState('');

    const tabs = useMemo(
        () => [
            { id: 'compte' as TabId, label: 'Compte', icon: UserIcon },
            { id: 'preferences' as TabId, label: 'Préférences', icon: Settings },
            { id: 'notifications' as TabId, label: 'Alertes', icon: Bell },
            { id: 'securite' as TabId, label: 'Sécurité', icon: Shield },
        ],
        [],
    );

    const loadProfile = useCallback(async () => {
        const token = authClient.getToken();
        if (!token) {
            setLoadError('Vous devez être connecté pour accéder à votre profil.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await fetchProfile(token);
            setProfile(data.attributes);
            setAccountForm({
                name: data.attributes.name ?? '',
                timezone: data.attributes.timezone ?? '',
                photo_url: data.attributes.photo_url ?? '',
            });
            setPrefsForm(data.attributes.preferences ?? {});
            setLoadError(null);
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : 'Erreur de chargement du profil.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleAccountSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const token = authClient.getToken();
        if (!token) {
            setAccountFeedback({ kind: 'error', message: 'Session expirée, reconnectez-vous.' });
            return;
        }

        setAccountSaving(true);
        setAccountFeedback(null);
        try {
            const updated = await updateProfile(token, {
                name: accountForm.name.trim() || undefined,
                timezone: accountForm.timezone.trim() || null,
                photo_url: accountForm.photo_url.trim() || null,
            });
            setProfile(updated.attributes);
            setAccountFeedback({ kind: 'success', message: 'Profil mis à jour.' });
        } catch (err) {
            setAccountFeedback({
                kind: 'error',
                message: err instanceof Error ? err.message : 'Mise à jour impossible.',
            });
        } finally {
            setAccountSaving(false);
        }
    };

    const persistPreferences = async (next: UserPreferences, successMessage = 'Préférences enregistrées.') => {
        const token = authClient.getToken();
        if (!token) {
            setPrefsFeedback({ kind: 'error', message: 'Session expirée, reconnectez-vous.' });
            return;
        }

        setPrefsSaving(true);
        setPrefsFeedback(null);
        try {
            await updatePreferences(token, next);
            setPrefsForm(next);
            setPrefsFeedback({ kind: 'success', message: successMessage });
        } catch (err) {
            setPrefsFeedback({
                kind: 'error',
                message: err instanceof Error ? err.message : 'Mise à jour des préférences impossible.',
            });
        } finally {
            setPrefsSaving(false);
        }
    };

    const updatePref = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
        const next = { ...prefsForm, [key]: value };
        persistPreferences(next);
    };

    const addToList = (key: 'interests' | 'diet' | 'visited_cities', value: string) => {
        const v = value.trim();
        if (!v) return;
        const current = (prefsForm[key] as string[] | undefined) ?? [];
        if (current.some((item) => item.toLowerCase() === v.toLowerCase())) return;
        persistPreferences({ ...prefsForm, [key]: [...current, v] });
    };

    const removeFromList = (key: 'interests' | 'diet' | 'visited_cities', value: string) => {
        const current = (prefsForm[key] as string[] | undefined) ?? [];
        persistPreferences({ ...prefsForm, [key]: current.filter((item) => item !== value) });
    };

    const handleLogout = async () => {
        try {
            await authClient.logout();
        } finally {
            router.push('/connexion');
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-6 py-12 lg:py-20">
            <PageHeader
                title="Mon Espace"
                subtitle="Gérez votre profil, vos préférences de voyage et vos accès en un seul endroit."
            />

            {loadError ? (
                <div className="mt-12 p-8 rounded-3xl border border-error/30 bg-error/5 text-error">
                    <p className="font-bold mb-2">Impossible de charger votre profil</p>
                    <p className="text-sm opacity-80">{loadError}</p>
                    <button
                        onClick={() => router.push('/connexion')}
                        className="mt-4 btn-primary py-2 px-6 text-sm"
                    >
                        Se connecter
                    </button>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-12 mt-12">
                    <aside className="w-full lg:w-64 space-y-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all',
                                    activeTab === tab.id
                                        ? 'bg-brand text-white shadow-lg shadow-brand/20 translate-x-2'
                                        : 'text-light-muted hover:bg-light-bg',
                                )}
                            >
                                <tab.icon size={20} />
                                {tab.label}
                            </button>
                        ))}
                        <div className="pt-8 mt-8 border-t border-light-border">
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm text-error hover:bg-red-50 transition-all"
                            >
                                <LogOut size={20} />
                                Déconnexion
                            </button>
                        </div>
                    </aside>

                    <main className="flex-1 triply-card p-8 lg:p-12 min-h-[600px]">
                        {loading ? (
                            <div className="flex items-center justify-center min-h-[400px] text-light-muted">
                                Chargement de votre profil…
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-12"
                                >
                                    {activeTab === 'compte' && profile && (
                                        <div className="space-y-10">
                                            <header className="flex flex-col md:flex-row gap-8 items-center border-b border-light-border pb-10">
                                                {profile.photo_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={profile.photo_url}
                                                        alt={profile.name}
                                                        className="w-24 h-24 rounded-full object-cover border-2 border-brand/20"
                                                    />
                                                ) : (
                                                    <div className="w-24 h-24 bg-brand/10 border-2 border-brand/20 rounded-full flex items-center justify-center text-brand font-display text-3xl font-bold">
                                                        {initials(profile.name)}
                                                    </div>
                                                )}
                                                <div className="flex-1 space-y-4 text-center md:text-left">
                                                    <h3 className="text-2xl font-bold">{profile.name}</h3>
                                                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                                        <span className="bg-light-bg px-3 py-1 rounded-full text-xs font-bold text-light-muted flex items-center gap-2 border border-light-border">
                                                            <Mail size={12} /> {profile.email}
                                                        </span>
                                                        {profile.timezone && (
                                                            <span className="bg-light-bg px-3 py-1 rounded-full text-xs font-bold text-light-muted flex items-center gap-2 border border-light-border">
                                                                <Clock size={12} /> {profile.timezone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </header>

                                            <form onSubmit={handleAccountSubmit} className="grid md:grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-light-muted">
                                                        Nom complet
                                                    </label>
                                                    <input
                                                        className="w-full bg-light-bg border border-light-border rounded-xl p-4 font-medium"
                                                        value={accountForm.name}
                                                        onChange={(e) =>
                                                            setAccountForm({ ...accountForm, name: e.target.value })
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-light-muted">
                                                        Email (non modifiable)
                                                    </label>
                                                    <input
                                                        readOnly
                                                        className="w-full bg-light-bg/50 border border-light-border rounded-xl p-4 font-medium text-light-muted"
                                                        value={profile.email}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-light-muted">
                                                        Fuseau horaire
                                                    </label>
                                                    <input
                                                        placeholder="Europe/Paris"
                                                        className="w-full bg-light-bg border border-light-border rounded-xl p-4 font-medium"
                                                        value={accountForm.timezone}
                                                        onChange={(e) =>
                                                            setAccountForm({ ...accountForm, timezone: e.target.value })
                                                        }
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-light-muted">
                                                        Photo de profil (URL)
                                                    </label>
                                                    <input
                                                        placeholder="https://…"
                                                        className="w-full bg-light-bg border border-light-border rounded-xl p-4 font-medium"
                                                        value={accountForm.photo_url}
                                                        onChange={(e) =>
                                                            setAccountForm({
                                                                ...accountForm,
                                                                photo_url: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="md:col-span-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                    {accountFeedback ? (
                                                        <span
                                                            className={cn(
                                                                'flex items-center gap-2 text-sm font-medium',
                                                                accountFeedback.kind === 'success'
                                                                    ? 'text-emerald-600'
                                                                    : 'text-error',
                                                            )}
                                                        >
                                                            <CheckCircle2 size={16} /> {accountFeedback.message}
                                                        </span>
                                                    ) : (
                                                        <span />
                                                    )}
                                                    <button
                                                        type="submit"
                                                        disabled={accountSaving}
                                                        className="btn-primary py-2 px-8 disabled:opacity-50"
                                                    >
                                                        {accountSaving ? 'Enregistrement…' : 'Enregistrer'}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    {activeTab === 'preferences' && profile && (
                                        <div className="space-y-10">
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-bold flex items-center gap-2">
                                                    <Globe size={20} className="text-brand" /> Style de voyage
                                                </h3>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-light-muted">
                                                            Rythme
                                                        </label>
                                                        <select
                                                            className="w-full bg-light-bg border border-light-border rounded-xl p-4 font-medium"
                                                            value={prefsForm.pace ?? ''}
                                                            onChange={(e) =>
                                                                updatePref('pace', e.target.value || null)
                                                            }
                                                        >
                                                            <option value="">— Choisir —</option>
                                                            {PACE_OPTIONS.map((opt) => (
                                                                <option key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-light-muted">
                                                            Mode de planification
                                                        </label>
                                                        <select
                                                            className="w-full bg-light-bg border border-light-border rounded-xl p-4 font-medium"
                                                            value={prefsForm.planning_mode ?? ''}
                                                            onChange={(e) =>
                                                                updatePref('planning_mode', e.target.value as UserPreferences['planning_mode'] || null)
                                                            }
                                                        >
                                                            <option value="">— Choisir —</option>
                                                            {PLANNING_MODE_OPTIONS.map((opt) => (
                                                                <option key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-light-muted">
                                                            Budget max / jour (€)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step={10}
                                                            className="w-full bg-light-bg border border-light-border rounded-xl p-4 font-medium"
                                                            value={prefsForm.max_budget ?? ''}
                                                            onChange={(e) =>
                                                                updatePref(
                                                                    'max_budget',
                                                                    e.target.value === '' ? null : Number(e.target.value),
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-2 flex flex-col">
                                                        <label className="text-[10px] font-bold uppercase tracking-widest text-light-muted">
                                                            Petit-déjeuner inclus
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                updatePref(
                                                                    'breakfast_included',
                                                                    !prefsForm.breakfast_included,
                                                                )
                                                            }
                                                            className={cn(
                                                                'mt-auto w-fit px-4 py-2 rounded-full text-sm font-bold border transition-all',
                                                                prefsForm.breakfast_included
                                                                    ? 'bg-brand text-white border-brand'
                                                                    : 'bg-light-bg text-light-muted border-light-border',
                                                            )}
                                                        >
                                                            {prefsForm.breakfast_included ? 'Activé' : 'Désactivé'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <ChipsField
                                                label="Centres d'intérêt"
                                                icon={<LayoutGrid size={18} className="text-brand" />}
                                                values={prefsForm.interests ?? []}
                                                onRemove={(v) => removeFromList('interests', v)}
                                                onAdd={(v) => {
                                                    addToList('interests', v);
                                                    setNewInterest('');
                                                }}
                                                inputValue={newInterest}
                                                onInputChange={setNewInterest}
                                                placeholder="Ex: Gastronomie"
                                                suggestions={INTEREST_SUGGESTIONS.filter(
                                                    (s) => !(prefsForm.interests ?? []).includes(s),
                                                )}
                                            />

                                            <ChipsField
                                                label="Restrictions alimentaires"
                                                icon={<CreditCard size={18} className="text-brand" />}
                                                values={prefsForm.diet ?? []}
                                                onRemove={(v) => removeFromList('diet', v)}
                                                onAdd={(v) => {
                                                    addToList('diet', v);
                                                    setNewDiet('');
                                                }}
                                                inputValue={newDiet}
                                                onInputChange={setNewDiet}
                                                placeholder="Ex: Végétarien"
                                                suggestions={DIET_SUGGESTIONS.filter(
                                                    (s) => !(prefsForm.diet ?? []).includes(s),
                                                )}
                                            />

                                            <ChipsField
                                                label="Villes déjà visitées"
                                                icon={<MapPin size={18} className="text-brand" />}
                                                values={prefsForm.visited_cities ?? []}
                                                onRemove={(v) => removeFromList('visited_cities', v)}
                                                onAdd={(v) => {
                                                    addToList('visited_cities', v);
                                                    setNewVisited('');
                                                }}
                                                inputValue={newVisited}
                                                onInputChange={setNewVisited}
                                                placeholder="Ex: Lisbonne"
                                                suggestions={[]}
                                            />

                                            <DoneActivitiesField
                                                value={prefsForm.done_activities ?? {}}
                                                onChange={(next) =>
                                                    setPrefsForm((prev) => ({ ...prev, done_activities: next }))
                                                }
                                            />

                                            {prefsFeedback && (
                                                <span
                                                    className={cn(
                                                        'flex items-center gap-2 text-sm font-medium',
                                                        prefsFeedback.kind === 'success'
                                                            ? 'text-emerald-600'
                                                            : 'text-error',
                                                    )}
                                                >
                                                    <CheckCircle2 size={16} /> {prefsFeedback.message}
                                                </span>
                                            )}
                                            {prefsSaving && (
                                                <p className="text-sm text-light-muted">Enregistrement…</p>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'notifications' && (
                                        <div className="space-y-8">
                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                <Bell size={20} className="text-brand" /> Rappels & alertes
                                            </h3>
                                            <div className="space-y-3">
                                                <ReminderToggle
                                                    icon={<Calendar size={18} className="text-brand" />}
                                                    title="Rappel la veille"
                                                    description="Recevez un récap par email la veille au soir de chaque journée."
                                                    checked={prefsForm.reminders_day_before === true}
                                                    onChange={(checked) =>
                                                        setPrefsForm((prev) => ({
                                                            ...prev,
                                                            reminders_day_before: checked,
                                                        }))
                                                    }
                                                />
                                                <ReminderToggle
                                                    icon={<Bell size={18} className="text-brand" />}
                                                    title="Rappel le matin"
                                                    description="Recevez un rappel le matin même avant votre première activité."
                                                    checked={prefsForm.reminders_morning === true}
                                                    onChange={(checked) =>
                                                        setPrefsForm((prev) => ({
                                                            ...prev,
                                                            reminders_morning: checked,
                                                        }))
                                                    }
                                                />
                                                {prefsFeedback && (
                                                    <span
                                                        className={cn(
                                                            'flex items-center gap-2 text-sm font-medium',
                                                            prefsFeedback.kind === 'success'
                                                                ? 'text-emerald-600'
                                                                : 'text-error',
                                                        )}
                                                    >
                                                        <CheckCircle2 size={16} /> {prefsFeedback.message}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'securite' && (
                                        <div className="space-y-12">
                                            <div className="p-10 border border-red-100 bg-red-50/30 rounded-[32px] space-y-6">
                                                <header>
                                                    <h3 className="text-xl font-bold text-error flex items-center gap-2">
                                                        <Trash2 size={20} /> Zone de danger
                                                    </h3>
                                                    <p className="text-sm text-red-700/70 mt-2">
                                                        Supprimer votre compte Triply entraînera la perte définitive
                                                        de tous vos itinéraires et brouillons.
                                                    </p>
                                                </header>
                                                <button
                                                    onClick={() => setShowDeleteModal(true)}
                                                    className="py-3 px-6 bg-card border border-red-200 text-error font-bold rounded-xl hover:bg-error hover:text-white transition-all shadow-sm"
                                                >
                                                    Effacer toutes mes données
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </main>
                </div>
            )}

            {showDeleteModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm"
                    style={{ backgroundColor: 'var(--overlay, rgba(15,23,42,0.6))' }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="max-w-md w-full bg-card rounded-[40px] p-10 space-y-8 shadow-2xl border border-light-border"
                    >
                        <div className="w-16 h-16 bg-red-50 text-error rounded-2xl flex items-center justify-center">
                            <AlertTriangle size={32} />
                        </div>
                        <div className="space-y-4 text-left">
                            <h3 className="text-2xl font-display font-bold">Êtes-vous certain ?</h3>
                            <p className="text-light-muted leading-relaxed">
                                Cette action sera disponible dans une prochaine itération. Pour le moment, contactez
                                le support pour supprimer votre compte.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="text-light-muted font-bold py-4 rounded-2xl hover:bg-light-bg"
                            >
                                Fermer
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

interface ChipsFieldProps {
    label: string;
    icon: React.ReactNode;
    values: string[];
    onRemove: (value: string) => void;
    onAdd: (value: string) => void;
    inputValue: string;
    onInputChange: (value: string) => void;
    placeholder: string;
    suggestions: string[];
}

function ChipsField({
    label,
    icon,
    values,
    onRemove,
    onAdd,
    inputValue,
    onInputChange,
    placeholder,
    suggestions,
}: ChipsFieldProps) {
    return (
        <div className="space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2 text-light-foreground">
                {icon}
                {label}
            </h4>
            {values.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {values.map((value) => (
                        <span
                            key={value}
                            className="inline-flex items-center gap-2 bg-brand/10 text-brand border border-brand/20 px-3 py-1 rounded-full text-sm font-medium"
                        >
                            {value}
                            <button
                                type="button"
                                onClick={() => onRemove(value)}
                                aria-label={`Retirer ${value}`}
                                className="hover:text-error"
                            >
                                <X size={14} />
                            </button>
                        </span>
                    ))}
                </div>
            )}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    onAdd(inputValue);
                }}
                className="flex gap-2"
            >
                <input
                    value={inputValue}
                    onChange={(e) => onInputChange(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-light-bg border border-light-border rounded-xl px-4 py-3 font-medium text-sm"
                />
                <button type="submit" className="btn-primary px-4 py-3 inline-flex items-center gap-1 text-sm">
                    <Plus size={14} /> Ajouter
                </button>
            </form>
            {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => onAdd(s)}
                            className="text-xs px-3 py-1 rounded-full bg-light-bg border border-light-border text-light-muted hover:border-brand/40 hover:text-brand transition-colors"
                        >
                            + {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

interface DoneActivitiesFieldProps {
    value: Record<string, string[]>;
    onChange: (next: Record<string, string[]>) => void;
}

function DoneActivitiesField({ value, onChange }: DoneActivitiesFieldProps) {
    const [city, setCity] = useState('');
    const [activity, setActivity] = useState('');

    const cities = Object.keys(value).sort((a, b) => a.localeCompare(b));

    const addActivity = (cityKey: string, label: string) => {
        const trimmedCity = cityKey.trim();
        const trimmedActivity = label.trim();
        if (!trimmedCity || !trimmedActivity) return;
        const current = value[trimmedCity] ?? [];
        if (current.includes(trimmedActivity)) return;
        onChange({ ...value, [trimmedCity]: [...current, trimmedActivity] });
    };

    const removeActivity = (cityKey: string, label: string) => {
        const next = { ...value };
        const list = (next[cityKey] ?? []).filter((a) => a !== label);
        if (list.length === 0) {
            delete next[cityKey];
        } else {
            next[cityKey] = list;
        }
        onChange(next);
    };

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2 text-light-foreground">
                <MapPin size={18} className="text-brand" />
                Activités déjà faites par ville
            </h4>
            {cities.length > 0 && (
                <div className="space-y-3">
                    {cities.map((c) => (
                        <div
                            key={c}
                            className="rounded-2xl bg-light-bg/50 border border-light-border p-4 space-y-2"
                        >
                            <div className="text-sm font-bold">{c}</div>
                            <div className="flex flex-wrap gap-2">
                                {(value[c] ?? []).map((act) => (
                                    <span
                                        key={`${c}-${act}`}
                                        className="inline-flex items-center gap-2 bg-brand/10 text-brand border border-brand/20 px-3 py-1 rounded-full text-xs font-medium"
                                    >
                                        {act}
                                        <button
                                            type="button"
                                            onClick={() => removeActivity(c, act)}
                                            aria-label={`Retirer ${act}`}
                                            className="hover:text-error"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    addActivity(city, activity);
                    setActivity('');
                }}
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2"
            >
                <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ville (ex: Rome)"
                    className="bg-light-bg border border-light-border rounded-xl px-4 py-3 font-medium text-sm"
                />
                <input
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    placeholder="Activité déjà faite (ex: Colisée)"
                    className="bg-light-bg border border-light-border rounded-xl px-4 py-3 font-medium text-sm"
                />
                <button type="submit" className="btn-primary px-4 py-3 inline-flex items-center gap-1 text-sm">
                    <Plus size={14} /> Ajouter
                </button>
            </form>
        </div>
    );
}

interface ReminderToggleProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

function ReminderToggle({ icon, title, description, checked, onChange }: ReminderToggleProps) {
    return (
        <label className="flex items-start justify-between gap-4 p-5 rounded-3xl bg-light-bg/50 border border-light-border cursor-pointer hover:border-brand/40 transition-colors">
            <div className="flex items-start gap-3 min-w-0">
                <span className="mt-0.5">{icon}</span>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-light-foreground">{title}</p>
                    <p className="text-xs text-light-muted mt-1">{description}</p>
                </div>
            </div>
            <span className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="sr-only peer"
                />
                <span className="w-11 h-6 bg-light-border rounded-full peer-checked:bg-brand transition-colors" />
                <span className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full shadow transition-transform peer-checked:translate-x-5" />
            </span>
        </label>
    );
}

const AlertTriangle = ({ size, className }: { size: number; className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
    </svg>
);
