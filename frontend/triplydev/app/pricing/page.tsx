'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/src/components/Sidebar/Sidebar';
import { clearSession, getStoredSession } from '@/src/lib/auth-client';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: 'Pour découvrir Triply et planifier vos premiers voyages.',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      '3 itinéraires par mois',
      'Recherche vols & hôtels',
      'Assistant IA basique',
      'Carte interactive',
      'Export PDF',
    ],
    cta: 'Commencer gratuitement',
    popular: false,
    href: '/',
  },
  {
    id: 'silver',
    name: 'Silver',
    description: 'Pour les voyageurs réguliers qui veulent optimiser chaque détail.',
    monthlyPrice: 12,
    annualPrice: 99,
    features: [
      'Itinéraires illimités',
      'Comparaison vols & hôtels avancée',
      'Assistant IA prioritaire',
      'Suggestions personnalisées',
      'Export PowerPoint',
      'Support prioritaire',
    ],
    cta: 'Essayer Silver',
    popular: true,
    href: '/',
  },
  {
    id: 'gold',
    name: 'Gold',
    description: 'Pour les équipes et agences qui organisent des voyages à plusieurs.',
    monthlyPrice: 29,
    annualPrice: 249,
    features: [
      'Tout Silver inclus',
      'Gestion multi-utilisateurs',
      'Tableau de bord partagé',
      'API d\'intégration',
      'Facturation centralisée',
      'Account manager dédié',
    ],
    cta: 'Contacter les ventes',
    popular: false,
    href: '/',
  },
];

const FEATURES = [
  {
    icon: '🗺️',
    title: 'Carte 3D interactive',
    desc: 'Visualisez vos destinations sur une carte mondiale immersive, jour et nuit.',
  },
  {
    icon: '🤖',
    title: 'Assistant IA voyage',
    desc: 'Triply AI vous aide à trouver vols, hôtels, activités et restaurants selon votre budget.',
  },
  {
    icon: '✈️',
    title: 'Vols & hébergements',
    desc: 'Recherche Amadeus intégrée : comparez les offres en temps réel.',
  },
  {
    icon: '📋',
    title: 'Itinéraires sur mesure',
    desc: 'Générez des plans jour par jour, exportables en PDF ou PowerPoint.',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const toggleContainerRef = useRef<HTMLDivElement>(null);
  const btnMensuelRef = useRef<HTMLButtonElement>(null);
  const btnAnnuelRef = useRef<HTMLButtonElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  // #region agent log
  useLayoutEffect(() => {
    const log = () => {
      const c = toggleContainerRef.current;
      const m = btnMensuelRef.current;
      const a = btnAnnuelRef.current;
      const p = pillRef.current;
      if (!c || !m || !a || !p) return;
      const cr = c.getBoundingClientRect();
      const mr = m.getBoundingClientRect();
      const ar = a.getBoundingClientRect();
      const pr = p.getBoundingClientRect();
      const data = {
        container: { w: cr.width, left: cr.left },
        btnMensuel: { w: mr.width, left: mr.left - cr.left, right: mr.right - cr.left },
        btnAnnuel: { w: ar.width, left: ar.left - cr.left, right: ar.right - cr.left },
        pill: { w: pr.width, left: pr.left - cr.left, right: pr.right - cr.left },
        isAnnual,
      };
      fetch('http://127.0.0.1:7244/ingest/d2a5e5b7-70f8-499a-bec3-af5ab2ca2354',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pricing/page.tsx:toggle',message:'Toggle dimensions',data,timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    };
    log();
    const t = setTimeout(log, 100);
    return () => clearTimeout(t);
  }, [isAnnual]);
  // #endregion

  useEffect(() => {
    const session = getStoredSession();
    setIsConnected(!!session?.token);
  }, []);

  return (
    <div className="flex h-[100dvh] min-h-0 overflow-hidden w-full" style={{ backgroundColor: 'var(--background, #222222)' }}>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isConnected={isConnected}
        onLoginClick={() => router.push('/')}
        onLogoutClick={() => {
          clearSession();
          router.push('/');
        }}
      />

      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="relative mx-auto max-w-5xl px-6 pb-24 pt-8 sm:px-8">
          <div className="relative">
            <div className="flex items-center gap-4 mb-8">
              <Link
                href="/"
                className="text-sm font-medium hover:underline"
                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                {'<- Retour a l\'application'}
              </Link>
            </div>
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-20 text-center"
        >
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--primary)' }}>
            Tarification
          </p>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl" style={{ color: 'var(--foreground)' }}>
            Planifiez vos voyages
            <br />
            <span style={{ color: 'var(--primary)' }}>
              sans les galères
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Triply centralise vols, hôtels, activités et IA pour organiser vos voyages en quelques clics.
            Choisissez le plan adapté à votre usage.
          </p>
        </motion.section>

        {/* Features grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-[var(--primary)] hover:bg-white/[0.04]"
            >
              <span className="mb-3 block text-2xl">{f.icon}</span>
              <h3 className="mb-2 font-semibold" style={{ color: 'var(--foreground)' }}>{f.title}</h3>
              <p className="text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </motion.section>

        {/* Pricing toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12 flex justify-center"
        >
          <div ref={toggleContainerRef} className="relative grid min-w-[220px] grid-cols-2 rounded-full border border-white/10 bg-white/5 p-1">
            <motion.div
              ref={pillRef}
              className="absolute inset-y-1 rounded-full"
              style={{ backgroundColor: 'var(--primary)', width: 'calc(50% - 4px)' }}
              initial={false}
              animate={{
                left: isAnnual ? '50%' : '4px',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
            <button
              ref={btnMensuelRef}
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`relative z-10 flex min-w-0 items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                !isAnnual ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mensuel
            </button>
            <button
              ref={btnAnnuelRef}
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`relative z-10 flex min-w-0 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                isAnnual ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Annuel
              <span className="rounded-full px-2 py-0.5 text-xs font-medium shrink-0" style={{ backgroundColor: isAnnual ? 'rgba(255,255,255,0.2)' : 'color-mix(in srgb, #00A896 20%, transparent)', color: isAnnual ? 'white' : '#00A896' }}>
                -30%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid gap-6 lg:grid-cols-3"
        >
          {PLANS.map((plan, i) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const displayPrice = price === 0 ? '0' : price;
            const period = isAnnual ? '/an' : '/mois';

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 ${
                  plan.popular
                    ? 'border-[var(--primary)]'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                }`}
                style={plan.popular ? { backgroundColor: 'color-mix(in srgb, var(--primary) 10%, transparent)' } : undefined}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider text-white" style={{ backgroundColor: 'var(--primary)' }}>
                      Populaire
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{plan.name}</h3>
                  <p className="mt-2 text-sm text-slate-400">{plan.description}</p>
                </div>

                <div className="mb-6 flex items-baseline gap-1">
                  <div className="relative min-w-[90px]">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`${plan.id}-${displayPrice}-${period}`}
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="inline-block text-4xl font-bold"
                        style={{ fontFamily: 'var(--font-title)', color: 'var(--foreground)' }}
                      >
                        {displayPrice}€
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <span className="text-slate-500">{period}</span>
                  {isAnnual && plan.monthlyPrice > 0 && (
                    <span className="ml-2 text-xs text-slate-500">
                      soit {Math.round((plan.annualPrice / 12) * 10) / 10}€/mois
                    </span>
                  )}
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                      <svg
                        className="h-5 w-5 shrink-0"
                        style={{ color: 'var(--primary)' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block w-full rounded-xl py-3.5 text-center text-sm font-semibold transition-all ${
                    plan.popular
                      ? 'text-white hover:opacity-90'
                      : 'border border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                  style={plan.popular ? { backgroundColor: 'var(--primary)', color: 'white' } : { color: 'var(--foreground)' }}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            );
          })}
        </motion.section>

        {/* Footer CTA */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center text-sm text-slate-500"
        >
          Tous les plans incluent un essai gratuit. Sans engagement.
        </motion.p>
          </div>
        </div>
      </main>
    </div>
  );
}
