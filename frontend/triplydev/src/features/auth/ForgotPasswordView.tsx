'use client';

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { TriplyLogo } from "../../components/layout/TriplyLogo";
import { authClient } from "../../lib/auth-client";

export function ForgotPasswordView() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await authClient.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer l'email.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <Link href="/" className="mb-12"><TriplyLogo /></Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full triply-card p-8 lg:p-12 space-y-8"
      >
        <header className="space-y-4">
          <Link href="/connexion" className="text-light-muted hover:text-brand flex items-center gap-2 text-xs font-bold uppercase transition-colors">
            <ArrowLeft size={14} /> Retour à l'accès
          </Link>
          <h1 className="text-3xl font-display font-bold">Oubli de pilotage ?</h1>
          <p className="text-light-muted">Pas d'inquiétude, saisissez votre email pour réinitialiser vos accès.</p>
        </header>

        {sent ? (
          <div className="p-8 bg-brand/5 border border-brand/20 rounded-2xl flex flex-col items-center text-center gap-4">
            <CheckCircle className="text-brand" size={32} />
            <p className="text-sm font-bold text-brand italic">Si un compte existe pour cet email, vous recevrez un lien de réinitialisation.</p>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
               <label className="text-xs font-bold text-light-muted uppercase tracking-wider" htmlFor="forgot-email">Votre email</label>
               <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-light-muted" size={18} />
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="julien.martin@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-light-bg border border-light-border rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand focus:bg-card transition-all font-medium text-foreground placeholder:text-light-muted"
                  />
               </div>
            </div>
            {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <><Loader2 size={18} className="animate-spin" /> Envoi…</> : "Recevoir le lien"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
