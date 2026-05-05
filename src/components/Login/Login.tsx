import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TriplyLogo } from "../layout/TriplyLogo";
import { Mail, Lock, ChevronRight, Github, Loader2 } from "lucide-react";
import { authClient } from "../../lib/auth-client";
import { ApiError, extractErrorMessage } from "../../lib/http";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await authClient.login({ email, password });
      navigate("/voyages");
    } catch (err) {
      let message = "Connexion impossible.";
      if (err instanceof ApiError) {
        const fromBody = extractErrorMessage(err.body);
        if (fromBody) {
          message = fromBody;
        } else if (err.status === 401 || err.status === 422) {
          message = "Identifiants invalides.";
        }
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col lg:flex-row overflow-hidden">

      <div className="hidden lg:flex lg:flex-1 relative bg-slate-900 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand/20 via-transparent to-transparent opacity-50" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative z-10 text-center space-y-8 p-12 max-w-xl">
           <h2 className="text-5xl font-display font-bold text-white leading-tight">Reprenez le contrôle de vos projets.</h2>
           <p className="text-dark-muted text-lg">Connectez-vous pour accéder à votre cockpit et synchroniser vos voyages sur tous vos appareils.</p>
        </div>
      </div>

      <div className="w-full lg:w-[500px] bg-white flex flex-col p-8 lg:p-16">
        <header className="mb-12">
           <Link to="/"><TriplyLogo /></Link>
        </header>

        <div className="flex-1 flex flex-col justify-center">
           <h1 className="text-3xl font-display font-bold mb-2">Accès Copilote</h1>
           <p className="text-light-muted mb-10 font-bold uppercase text-[10px] tracking-widest leading-loose">Heureux de vous revoir à bord.</p>

           <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                 <label className="text-xs font-bold text-light-muted uppercase tracking-wider" htmlFor="login-email">Email</label>
                 <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-light-muted" size={18} />
                    <input
                      id="login-email"
                      type="email"
                      placeholder="votre@email.com"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-light-bg border border-light-border rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-light-muted uppercase tracking-wider" htmlFor="login-password">Mot de passe</label>
                    <Link to="/mot-de-passe-oublie" className="text-[10px] font-bold text-brand uppercase hover:underline">Oublié ?</Link>
                 </div>
                 <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-light-muted" size={18} />
                    <input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-light-bg border border-light-border rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand"
                    />
                 </div>
              </div>

              {error && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">{error}</p>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full py-4 flex items-center justify-center gap-2 group disabled:opacity-60">
                 {submitting ? <><Loader2 size={18} className="animate-spin" /> Connexion…</> : <>Se connecter <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
              </button>
           </form>

           <div className="my-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-light-border" />
              <span className="text-[10px] font-bold text-light-muted uppercase">Ou continuer avec</span>
              <div className="flex-1 h-px bg-light-border" />
           </div>

           <button type="button" className="w-full py-4 bg-white border border-light-border rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-light-bg transition-colors">
              <Github size={20} />
              GitHub
           </button>
        </div>

        <footer className="mt-12 text-center text-sm">
           <span className="text-light-muted font-bold">Nouveau ici ?</span>{' '}
           <Link to="/inscription" className="text-brand font-bold hover:underline">Créer un compte</Link>
        </footer>
      </div>
    </div>
  );
}
