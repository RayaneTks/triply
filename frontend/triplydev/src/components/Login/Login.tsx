'use client';

import React from 'react';

export interface LoginProps {
    onLoginSuccess: () => void;
    onBack: () => void;
}

export const Login: React.FC<LoginProps> = ({
                                                onLoginSuccess,
                                                onBack,
                                            }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 🔴 PLUS TARD :
        // appel API / auth réelle

        // ✅ TEMPORAIRE
        onLoginSuccess();
    };

    return (
        <div className="w-full h-full flex items-center justify-center relative">
            {/* Bouton retour */}
            <button
                onClick={onBack}
                className="absolute top-6 left-6 text-sm hover:text-primary transition-colors"
                style={{ color: 'var(--foreground, #ededed)' }}
            >
                ← Retour
            </button>

            <div
                className="w-full max-w-md p-8 rounded-lg"
                style={{
                    backgroundColor: 'var(--background, #222222)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                }}
            >
                <h1
                    className="text-2xl font-semibold mb-6 text-center"
                    style={{ color: 'var(--foreground, #ededed)' }}
                >
                    Connexion
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-3 py-2 rounded bg-gray-800 text-white outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Mot de passe</label>
                        <input
                            type="password"
                            required
                            className="w-full px-3 py-2 rounded bg-gray-800 text-white outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2 rounded bg-primary hover:opacity-90 transition"
                    >
                        Se connecter
                    </button>
                </form>
            </div>
        </div>
    );
};