import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, CheckCircle, ChevronRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { TriplyLogo } from "../../components/layout/TriplyLogo";
import { authClient } from "../../lib/auth-client";
import { ApiError, extractErrorMessage } from "../../lib/http";

export function ResetPasswordView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = searchParams.get("token") ?? "";
  const emailFromUrl = searchParams.get("email") ?? "";

  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState(emailFromUrl);
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await authClient.resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSent(true);
    } catch (err) {
      const message =
        err instanceof ApiError ? extractErrorMessage(err.body) ?? "Réinitialisation impossible." : "Réinitialisation impossible.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-bg flex flex-col items-center justify-center p-6">
      <Link to="/" className="mb-12"><TriplyLogo /></Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white triply-card p-8 lg:p-12 space-y-8"
      >
        <header className="space-y-4">
          <h1 className="text-3xl font-display font-bold">Nouveau mot de passe</h1>
          <p className="text-light-muted">Choisissez un mot de passe robuste pour sécuriser vos accès de pilotage.</p>
        </header>

        {sent ? (
          <div className="space-y-8">
            <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col items-center text-center gap-4">
              <CheckCircle className="text-emerald-500" size={32} />
              <p className="text-sm font-bold text-emerald-800 italic">Mot de passe réinitialisé !</p>
            </div>
            <button type="button" onClick={() => navigate("/connexion")} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
              Se connecter <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
               <label className="text-xs font-bold text-light-muted uppercase tracking-wider" htmlFor="reset-email">Email</label>
               <input
                 id="reset-email"
                 type="email"
                 required
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full bg-light-bg border border-light-border rounded-xl py-4 px-4 outline-none focus:ring-2 focus:ring-brand"
               />
            </div>
            <div className="space-y-2">
               <label className="text-xs font-bold text-light-muted uppercase tracking-wider" htmlFor="reset-token">Jeton (lien reçu par email)</label>
               <input
                 id="reset-token"
                 type="text"
                 required
                 value={token}
                 onChange={(e) => setToken(e.target.value)}
                 className="w-full bg-light-bg border border-light-border rounded-xl py-4 px-4 outline-none focus:ring-2 focus:ring-brand font-mono text-xs"
               />
            </div>
            <div className="space-y-2">
               <label className="text-xs font-bold text-light-muted uppercase tracking-wider" htmlFor="reset-pw">Nouveau mot de passe</label>
               <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-light-muted" size={18} />
                  <input
                    id="reset-pw"
                    type="password"
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-light-bg border border-light-border rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand"
                  />
               </div>
            </div>
            <div className="space-y-2">
               <label className="text-xs font-bold text-light-muted uppercase tracking-wider" htmlFor="reset-pw2">Confirmer</label>
               <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-light-muted" size={18} />
                  <input
                    id="reset-pw2"
                    type="password"
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="w-full bg-light-bg border border-light-border rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand"
                  />
               </div>
            </div>
            {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <><Loader2 size={18} className="animate-spin" /> Mise à jour…</> : "Mettre à jour"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
