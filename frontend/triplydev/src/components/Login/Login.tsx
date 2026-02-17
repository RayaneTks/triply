'use client';

import React, { useRef } from 'react';
import { Button } from '@/src/components/Button/Button';

export interface LoginProps {
    onLoginSuccess: () => void;
    onBack: () => void;
}

export const Login: React.FC<LoginProps> = ({
                                                onLoginSuccess,
                                                onBack,
                                            }) => {
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLoginSuccess();
    };

    return (
        <div className="w-full h-full flex items-center justify-center relative p-6">
            {/* Bouton retour */}
            <div className="absolute top-6 left-6">
                <Button
                    label="← Retour"
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
                {/* Header avec logo */}
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
                        Connexion
                    </h1>
                    <p className="text-sm mt-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        Accédez à votre espace voyage
                    </p>
                </div>

                <form ref={formRef} onSubmit={handleSubmit} className="p-8 space-y-5">
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
                                placeholder="••••••••"
                                className="w-full flex-grow"
                            />
                        </div>
                        <button
                            type="button"
                            className="text-xs mt-2 hover:underline"
                            style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                        >
                            Mot de passe oublié ?
                        </button>
                    </div>

                    <div className="pt-2">
                        <Button
                            label="Se connecter"
                            onClick={() => formRef.current?.requestSubmit()}
                            variant="dark"
                            tone="tone1"
                            className="w-full"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};