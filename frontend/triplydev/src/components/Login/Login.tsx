'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Lock, Mail, User } from 'lucide-react';
import { login, register, saveSession, type AuthUser } from '@/src/lib/auth-client';
import { Logo } from '../Logo/Logo';

export interface LoginProps {
    onLoginSuccess: (user: AuthUser, isNewUser?: boolean) => void;
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
            onLoginSuccess(session.user ?? { id: 0, name: normalizedName, email: normalizedEmail }, mode === 'register');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Identifiants invalides ou erreur serveur.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        void executeAuth();
    };

    const inputClasses =
        'w-full rounded-2xl border border-[var(--app-border-strong)] bg-white/90 py-3.5 pl-11 pr-4 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--app-muted)] outline-none transition-all focus:border-[var(--primary)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,118,110,0.12)]';

    return (
        <div className="relative flex min-h-dvh w-full items-center justify-center p-5 sm:p-8">
            <button
                onClick={onBack}
                className="absolute left-5 top-[calc(env(safe-area-inset-top)+1rem)] flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white/80 px-4 py-2 text-sm font-medium text-[color:var(--foreground)] shadow-[var(--shadow-sm)] backdrop-blur-md transition-all hover:bg-white sm:left-8"
            >
                <ArrowLeft size={16} />
                Retour
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="w-full max-w-[420px] overflow-hidden rounded-[2rem] border border-[var(--app-border)] bg-[color:var(--app-surface-elevated)] shadow-[var(--shadow-lg)] backdrop-blur-xl"
            >
                <div className="border-b border-[var(--app-border)] p-7 text-center sm:p-8">
                    <div className="mb-6 flex justify-center">
                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-[#0b1f33] shadow-[var(--shadow-sm)]">
                            <Logo size="small" tone="dark" width={56} height={56} />
                        </div>
                    </div>
                    <h1 className="font-chillax text-2xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-[2rem]">
                        {mode === 'login' ? 'Bon retour sur Triply' : 'Creez votre espace Triply'}
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-[color:var(--app-muted)]">
                        {mode === 'login'
                            ? 'Retrouvez vos voyages.'
                            : 'Sauvegardez votre voyage et reprenez-le plus tard.'}
                    </p>
                    <div className="mt-5 grid gap-2 text-left">
                        {[
                            'Sauvegarder un voyage en cours',
                            'Retrouver vos preferences',
                            'Reprendre plus tard',
                        ].map((item) => (
                            <div key={item} className="flex items-center gap-2 rounded-2xl bg-[var(--app-brand-soft)] px-3 py-2 text-sm text-[color:var(--foreground)]">
                                <CheckCircle2 size={16} className="text-[var(--primary)]" />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {mode === 'register' ? (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="relative">
                                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--app-muted)]" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="Votre nom complet"
                                            value={name}
                                            onChange={(event) => setName(event.target.value)}
                                            className={inputClasses}
                                        />
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>

                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--app-muted)]" />
                            <input
                                type="email"
                                required
                                placeholder="Adresse email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className={inputClasses}
                            />
                        </div>

                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--app-muted)]" />
                            <input
                                type="password"
                                required
                                placeholder="Mot de passe"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                className={inputClasses}
                            />
                        </div>

                        <AnimatePresence mode="popLayout">
                            {mode === 'register' ? (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="relative">
                                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--app-muted)]" />
                                        <input
                                            type="password"
                                            required
                                            placeholder="Confirmez le mot de passe"
                                            value={confirmPassword}
                                            onChange={(event) => setConfirmPassword(event.target.value)}
                                            className={inputClasses}
                                        />
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {error ? (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs font-medium text-red-500"
                            >
                                {error}
                            </motion.p>
                        ) : null}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-6 w-full rounded-2xl bg-[var(--primary)] py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--secondary)] active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? 'Veuillez patienter...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
                    </button>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setError('');
                                setMode(mode === 'login' ? 'register' : 'login');
                            }}
                            className="text-xs font-medium text-[color:var(--app-muted)] transition-colors hover:text-[color:var(--primary)]"
                        >
                            {mode === 'login' ? 'Nouveau sur Triply ? Creer un compte' : 'Deja inscrit ? Se connecter'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
