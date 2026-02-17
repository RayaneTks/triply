'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/src/components/Sidebar/Sidebar';
import { Button } from '@/src/components/Button/Button';

export default function ProfilPage() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isConnected, setIsConnected] = useState(true); // À connecter avec l'auth réelle

    const [profile, setProfile] = useState({
        firstName: 'Marie',
        lastName: 'Dupont',
        email: 'marie.dupont@email.com',
        phone: '+33 6 12 34 56 78',
        preferences: {
            newsletter: true,
            notifications: true,
        },
    });

    return (
        <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--background, #222222)' }}>
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isConnected={isConnected}
                onLoginClick={() => {}}
                onLogoutClick={() => setIsConnected(false)}
            />

            <main className="flex-1 overflow-y-auto min-w-0">
                <div className="max-w-2xl mx-auto p-8 md:p-12">
                    <div className="flex items-center gap-4 mb-8">
                        <Link
                            href="/"
                            className="text-sm font-medium hover:underline"
                            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                            ← Retour à l'accueil
                        </Link>
                    </div>

                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground, #ededed)', fontFamily: 'var(--font-title)' }}>
                        Mon profil
                    </h1>
                    <p className="mb-10" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Gérez vos informations personnelles et préférences
                    </p>

                    {/* Avatar + infos principales */}
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
                                {profile.firstName[0]}
                                {profile.lastName[0]}
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                                    {profile.firstName} {profile.lastName}
                                </h2>
                                <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{profile.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Informations personnelles */}
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
                                    Prénom
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
                                <input
                                    type="email"
                                    value={profile.email}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    className="input-assistant w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                    Téléphone
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

                    {/* Préférences */}
                    <section className="mb-8">
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
                            Préférences
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

                    <Button label="Enregistrer les modifications" variant="dark" tone="tone1" onClick={() => alert('Modifications enregistrées !')} />
                </div>
            </main>
        </div>
    );
}
