import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Check, ChevronRight, Github, Bot, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { TriplyLogo } from "../../components/layout/TriplyLogo";
import { authClient } from "../../lib/auth-client";
import { ApiError, extractErrorMessage } from "../../lib/http";

export function RegisterView() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
      await authClient.register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(true);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? extractErrorMessage(err.body) ?? "Inscription impossible."
          : "Inscription impossible.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-light-bg flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white triply-card p-12 text-center space-y-8"
        >
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
             <Check size={40} />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-display font-bold">Compte créé !</h1>
            <p className="text-light-muted">Bienvenue à bord. Votre copilote est prêt à décoller avec vous.</p>
          </div>
          <button type="button" onClick={() => navigate("/planifier")} className="btn-primary w-full">Démarrer mon premier voyage</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col lg:flex-row overflow-hidden">
      <div className="hidden lg:flex lg:flex-1 relative bg-slate-900 items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand/20 via-transparent to-transparent opacity-50" />
        <div className="relative z-10 text-center space-y-8 p-12 max-w-xl">
           <div className="text-cyan-accent mb-4 mx-auto w-12 h-12 flex items-center justify-center bg-cyan-accent/10 rounded-2xl">
             <Bot size={32} />
           </div>
           <h2 className="text-5xl font-display font-bold text-white leading-tight underline decoration-cyan-accent underline-offset-8">Centralisez. Maîtrisez. Voyagez.</h2>
           <p className="text-dark-muted text-lg font-medium">Un compte Triply, c'est l'assurance d'avoir tous vos projets en un seul endroit, synchronisés et partagés.</p>
        </div>
      </div>

      <div className="w-full lg:w-[550px] bg-white flex flex-col p-8 lg:p-16 overflow-y-auto">
        <header className="mb-12">
           <Link to="/"><TriplyLogo /></Link>
        </header>

        <div className="flex-1 flex flex-col justify-center">
           <div className="mb-10">
             <h1 className="text-3xl font-display font-bold mb-2">Rejoignez Triply</h1>
             <p className="text-light-muted font-bold uppercase text-[10px] tracking-widest leading-loose">Inscription gratuite en moins de 30 secondes.</p>
           </div>

           <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                 <label className="text-xs font-bold text-light-muted uppercase tracking-wider" htmlFor="reg-name">Nom complet</label>
                 <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-light-muted" size={18} />
                    <input
                      id="reg-name"
                      type="text"
                      placeholder="Julien Martin"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-light-bg border border-light-border rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-light-muted uppercase tracking-wider" htmlFor="reg-email">Email</label>
                 <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-light-muted" size={18} />
                    <input
                      id="reg-email"
                      type="email"
                      placeholder="julien.martin@example.com"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-light-bg border border-light-border rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-light-muted uppercase tracking-wider" htmlFor="reg-password">Mot de passe</label>
                 <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-light-muted" size={18} />
                    <input
                      id="reg-password"
                      type="password"
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-light-bg border border-light-border rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-light-muted uppercase tracking-wider" htmlFor="reg-password2">Confirmer le mot de passe</label>
                 <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-light-muted" size={18} />
                    <input
                      id="reg-password2"
                      type="password"
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      className="w-full bg-light-bg border border-light-border rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all"
                    />
                 </div>
              </div>

              {error && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">{error}</p>
              )}

              <div className="pt-4">
                <button type="submit" disabled={submitting} className="btn-primary w-full py-4 flex items-center justify-center gap-2 group disabled:opacity-60">
                   {submitting ? <><Loader2 size={18} className="animate-spin" /> Inscription…</> : <>Finaliser l'inscription <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </div>
           </form>

           <div className="my-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-light-border" />
              <span className="text-[10px] font-bold text-light-muted uppercase">Ou avec vos comptes</span>
              <div className="flex-1 h-px bg-light-border" />
           </div>

           <div className="grid grid-cols-2 gap-4">
             <button type="button" className="py-4 bg-white border border-light-border rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-light-bg transition-colors">
                <Github size={20} />
                GitHub
             </button>
             <button type="button" className="py-4 bg-white border border-light-border rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-light-bg transition-colors">
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5 grayscale opacity-70" alt="Google" />
                Google
             </button>
           </div>
        </div>

        <footer className="mt-12 text-center text-sm border-t border-light-border pt-8">
           <span className="text-light-muted font-bold">Déjà parmi nous ?</span>{' '}
           <Link to="/connexion" className="text-brand font-bold hover:underline decoration-2">Se connecter</Link>
        </footer>
      </div>
    </div>
  );
}
