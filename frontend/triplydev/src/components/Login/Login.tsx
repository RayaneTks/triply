'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/Button/Button';
import { login, register, saveSession, type AuthUser } from '@/src/lib/auth-client';

export interface LoginProps {
    onLoginSuccess: (user: AuthUser) => void;
    onBack: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBack }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const executeAuth = async () => {
        if (loading) return;

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedName = name.trim();

        if (!normalizedEmail || !password) {
            setError('Email et mot de passe obligatoires.');
            return;
        }

        if (mode === 'register' && password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const session = mode === 'login'
                ? await login({ email: normalizedEmail, password })
                : await register({ name: normalizedName, email: normalizedEmail, password });

            saveSession(session);
            onLoginSuccess(session.user ?? { id: 0, name: normalizedName, email: normalizedEmail });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void executeAuth();
    };

    return (
        <div className="w-full h-full flex items-center justify-center relative p-6">
            <div className="absolute top-6 left-6">
                <Button
                    label="<- Retour"
                    onClick={onBack}
                    variant="dark"
                    tone="tone1"
                />
            </div>

            <div
                className="w-full max-w-md rounded-2xl overflow-hidden"
                style={{
                    background: 'linear-gradient(180deg, #1a1a1a 0%, var(--background, #222222) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.03)',
                }}
            >
                <div className="pt-10 pb-6 px-8 text-center border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                    <img
                        src="/Logo-triply.svg"
                        alt="Triply"
                        width={80}
                        height={45}
                        className="mx-auto object-contain mb-4"
                    />
                    <h1
                        className="text-2xl font-semibold"
                        style={{ color: 'var(--foreground, #ededed)', fontFamily: 'var(--font-title)' }}
                    >
                        {mode === 'login' ? 'Connexion' : 'Inscription'}
                    </h1>
                    <p className="text-sm mt-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {mode === 'login' ? 'Accedez a votre espace voyage' : 'Creez votre compte Triply'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {mode === 'register' && (
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                                Nom
                            </label>
                            <div className="input-assistant">
                                <input
                                    type="text"
                                    required
                                    placeholder="Votre nom"
                                    className="w-full flex-grow"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                            Email
                        </label>
                        <div className="input-assistant">
                            <input
                                type="email"
                                required
                                placeholder="vous@exemple.com"
                                className="w-full flex-grow"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                            Mot de passe
                        </label>
                        <div className="input-assistant">
                            <input
                                type="password"
                                required
                                placeholder="........"
                                className="w-full flex-grow"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {mode === 'register' && (
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground, #ededed)' }}>
                                Confirmation du mot de passe
                            </label>
                            <div className="input-assistant">
                                <input
                                    type="password"
                                    required
                                    placeholder="........"
                                    className="w-full flex-grow"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-sm" style={{ color: '#ff7d7d' }}>
                            {error}
                        </p>
                    )}

                    <div className="pt-2">
                        <Button
                            label={mode === 'login' ? 'Se connecter' : "S'inscrire"}
                            onClick={() => {
                                void executeAuth();
                            }}
                            variant="dark"
                            tone="tone1"
                            className="w-full"
                            disabled={loading}
                            loading={loading}
                        />
                    </div>

                    <button
                        type="button"
                        className="text-xs mt-2 hover:underline"
                        style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        onClick={() => {
                            setError('');
                            setMode(mode === 'login' ? 'register' : 'login');
                        }}
                    >
                        {mode === 'login' ? "Pas de compte ? S'inscrire" : 'Deja inscrit ? Se connecter'}
                    </button>
                </form>
            </div>
        </div>
    );
};
