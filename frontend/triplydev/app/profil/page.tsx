'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/src/components/Sidebar/Sidebar';
import { Button } from '@/src/components/Button/Button';
import { clearSession, getStoredSession, logout, me, saveSession, updateProfile } from '@/src/lib/auth-client';

export default function ProfilPage() {
    const router = useRouter();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

                setProfile((prev) => ({
                    ...prev,
                    firstName,
                    lastName,
                    email: user.email || '',
                }));

                saveSession({ token: session.token, user });
                setIsConnected(true);
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
    }, [profile.firstName, profile.lastName, profile.email]);

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
                saveSession({
                    token: session.token,
                    user: {
                        ...(session.user || { id: 0, email: profile.email, name: fullName }),
                        name: fullName,
                        email: profile.email,
                    },
                });
            }

            setSuccess('Profil mis a jour.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Impossible de mettre a jour le profil.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center" style={{ backgroundColor: 'var(--background, #222222)' }}>
                <p style={{ color: 'var(--foreground, #ededed)' }}>Chargement du profil...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--background, #222222)' }}>
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isConnected={isConnected}
                onLoginClick={() => router.push('/')}
                onLogoutClick={handleLogout}
            />

            <main className="flex-1 overflow-y-auto min-w-0">
                <div className="max-w-2xl mx-auto p-8 md:p-12">
                    <div className="flex items-center gap-4 mb-8">
                        <Link
                            href="/"
                            className="text-sm font-medium hover:underline"
                            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                            {'<- Retour a l\'application'}
                        </Link>
                    </div>

                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground, #ededed)', fontFamily: 'var(--font-title)' }}>
                        Mon profil
                    </h1>
                    <p className="mb-10" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Gere tes informations personnelles
                    </p>

                    {!isConnected && (
                        <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <p style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Tu dois etre connecte pour acceder au profil.</p>
                            <Button label="Se connecter" variant="dark" tone="tone1" onClick={() => router.push('/')} className="mt-4" />
                        </div>
                    )}

                    {isConnected && (
                        <>
                            <div
                                className="rounded-2xl p-6 mb-6"
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                            >
                                <div className="flex items-center gap-6">
                                    <div
                                        className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
                                        style={{
                                            backgroundColor: 'var(--primary, #0096c7)',
                                            color: '#fff',
                                        }}
                                    >
                                        {initials.toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                                            {profile.firstName} {profile.lastName}
                                        </h2>
                                        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{profile.email}</p>
                                    </div>
                                </div>
                            </div>

                            <section className="mb-8">
                                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                                    Informations personnelles
                                </h3>
                                <div
                                    className="rounded-2xl p-6 space-y-4"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    <div>
                                        <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                            Prenom
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.firstName}
                                            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                            className="input-assistant w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                            Nom
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.lastName}
                                            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                            className="input-assistant w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                            Email
                                        </label>
                                        <input type="email" value={profile.email} readOnly className="input-assistant w-full opacity-80" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                            Telephone
                                        </label>
                                        <input
                                            type="tel"
                                            value={profile.phone}
                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            className="input-assistant w-full"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="mb-8">
                                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                                    Preferences
                                </h3>
                                <div
                                    className="rounded-2xl p-6 space-y-4"
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                >
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <span style={{ color: 'var(--foreground)' }}>Recevoir la newsletter</span>
                                        <input
                                            type="checkbox"
                                            checked={profile.preferences.newsletter}
                                            onChange={(e) =>
                                                setProfile({
                                                    ...profile,
                                                    preferences: { ...profile.preferences, newsletter: e.target.checked },
                                                })
                                            }
                                            className="w-4 h-4 rounded"
                                            style={{ accentColor: 'var(--primary)' }}
                                        />
                                    </label>
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <span style={{ color: 'var(--foreground)' }}>Notifications par email</span>
                                        <input
                                            type="checkbox"
                                            checked={profile.preferences.notifications}
                                            onChange={(e) =>
                                                setProfile({
                                                    ...profile,
                                                    preferences: { ...profile.preferences, notifications: e.target.checked },
                                                })
                                            }
                                            className="w-4 h-4 rounded"
                                            style={{ accentColor: 'var(--primary)' }}
                                        />
                                    </label>
                                </div>
                            </section>

                            {error && <p className="mb-4 text-sm" style={{ color: '#ff7d7d' }}>{error}</p>}
                            {success && <p className="mb-4 text-sm" style={{ color: '#77e69c' }}>{success}</p>}

                            <Button
                                label="Enregistrer les modifications"
                                variant="dark"
                                tone="tone1"
                                onClick={() => {
                                    void handleSave();
                                }}
                                disabled={saving}
                                loading={saving}
                            />
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
