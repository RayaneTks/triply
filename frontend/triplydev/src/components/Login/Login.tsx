'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, User } from 'lucide-react';
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void executeAuth();
    };

    const inputClasses = "w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all";

    return (
        <div className="flex h-full w-full items-center justify-center p-6 relative">
            <button 
                onClick={onBack}
                className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-white/10 bg-[#020617]/50 px-4 py-2 text-sm font-medium text-slate-300 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white"
            >
                <ArrowLeft size={16} /> Retour
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="w-full max-w-[400px] overflow-hidden rounded-3xl border border-white/10 bg-[#020617]/80 shadow-2xl backdrop-blur-xl"
            >
                <div className="border-b border-white/5 p-8 text-center">
                    <div className="flex justify-center mb-6">
                        <Logo size="small" tone="light" />
                    </div>
                    <h1 className="text-2xl font-bold text-white font-chillax tracking-tight">
                        {mode === 'login' ? 'Bon retour' : 'Rejoignez l\'aventure'}
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">
                        {mode === 'login' ? 'Accédez à vos voyages et préférences.' : 'Créez votre compte gratuit en quelques secondes.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {mode === 'register' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="relative">
                                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="text" required placeholder="Votre nom complet"
                                            value={name} onChange={e => setName(e.target.value)}
                                            className={inputClasses}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="email" required placeholder="Adresse email"
                                value={email} onChange={e => setEmail(e.target.value)}
                                className={inputClasses}
                            />
                        </div>

                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="password" required placeholder="Mot de passe"
                                value={password} onChange={e => setPassword(e.target.value)}
                                className={inputClasses}
                            />
                        </div>

                        <AnimatePresence mode="popLayout">
                            {mode === 'register' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="relative">
                                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="password" required placeholder="Confirmez le mot de passe"
                                            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                            className={inputClasses}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.p 
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="mt-4 rounded-lg bg-red-500/10 p-3 text-center text-xs font-medium text-red-400 border border-red-500/20"
                            >
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-6 w-full rounded-xl bg-cyan-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-900/20 transition-all hover:bg-cyan-400 active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? 'Veuillez patienter...' : (mode === 'login' ? 'Se connecter' : "S'inscrire")}
                    </button>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => { setError(''); setMode(mode === 'login' ? 'register' : 'login'); }}
                            className="text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                            {mode === 'login' ? "Nouveau sur Triply ? Créer un compte" : 'Déjà inscrit ? Se connecter'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
