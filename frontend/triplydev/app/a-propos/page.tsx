'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sidebar } from '@/src/components/Sidebar/Sidebar';
import { clearSession, getStoredSession } from '@/src/lib/auth-client';

const SECTIONS = [
  {
    id: 'mission',
    title: 'Notre mission : des voyages mieux préparés',
    paragraphs: [
      'Préparer un voyage prend du temps : on ouvre dix onglets, on note des adresses au hasard, on oublie un créneau ou un budget réaliste. Triply existe pour rassembler tout cela dans une expérience fluide, du premier coup d’œil sur la carte jusqu’au détail du dernier jour.',
      'Nous croyons qu’un bon voyage commence par une vision claire : où aller, comment s’y rendre, où dormir, quoi vivre sur place — sans sacrifier la spontanéité. L’objectif n’est pas de tout verrouiller à l’avance, mais de vous donner assez de repères pour partir l’esprit léger.',
    ],
  },
  {
    id: 'proposition',
    title: 'Ce que Triply vous apporte au quotidien',
    paragraphs: [
      'Triply vous accompagne comme un carnet de voyage intelligent : vous visualisez votre parcours, vous comparez des options de transport et d’hébergement, vous recevez des pistes d’activités et de restauration alignées avec votre rythme et vos envies.',
      'Un assistant conversationnel, entièrement centré sur le voyage, aide à débloquer les moments où vous hésitez : trop de choix, budget serré, contraintes horaires, envie de découvrir un quartier plutôt qu’un autre. Il complète l’interface sans la remplacer : vous gardez la main sur vos décisions.',
    ],
  },
  {
    id: 'pour-qui',
    title: 'Pour qui ?',
    paragraphs: [
      'Les week-endistes qui veulent un fil conducteur sans passer leur samedi dans des tableurs. Les familles qui doivent jongler entre les horaires des uns et les envies des autres. Les voyageurs solo qui cherchent confiance et repères avant de partir. Les habitués des longs séjours qui veulent une base solide avant d’improviser sur place.',
      'Que vous partiez une fois par an ou plusieurs fois par saison, Triply s’adapte : des formules gratuites pour tester, des offres payantes lorsque le voyage devient un vrai sport.',
    ],
  },
  {
    id: 'engagement',
    title: 'Notre engagement',
    paragraphs: [
      'Nous améliorons Triply en continu : parcours plus clairs, suggestions plus pertinentes, contenus plus utiles. La page que vous lisez a aussi vocation à évoluer : elle décrit notre intention — vous aider à voyager avec plus de sérénité et moins de dispersion.',
      'Pour passer à l’action, vous pouvez créer un compte gratuit, explorer l’application et, lorsque vous serez prêt, choisir une formule qui correspond à votre rythme sur notre page tarifs.',
    ],
  },
];

export default function AProposPage() {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isConnected = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {};
      window.addEventListener('storage', onStoreChange);
      return () => window.removeEventListener('storage', onStoreChange);
    },
    () => !!getStoredSession()?.token,
    () => false,
  );

  return (
    <div className="flex h-dvh min-h-0 w-full overflow-hidden" style={{ backgroundColor: 'var(--background, #222222)' }}>
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

      <main className="min-w-0 flex-1 overflow-y-auto">
        <article className="relative mx-auto max-w-3xl px-6 pb-24 pt-8 sm:px-8">
          <div className="mb-10 flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium hover:underline"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              {'<- Retour à l’application'}
            </Link>
          </div>

          <motion.header
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-14"
          >
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--primary)' }}>
              À propos
            </p>
            <h1 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl" style={{ color: 'var(--foreground)' }}>
              Triply, votre copilote pour des voyages plus{' '}
              <span style={{ color: 'var(--primary)' }}>sereins</span>
            </h1>
            <p className="text-lg leading-relaxed text-slate-400">
              Triply est une application de planification de voyage qui réunit carte interactive, idées d’itinéraires,
              pistes pour vos vols et hébergements, et un assistant pensé uniquement pour vous aider à préparer votre
              prochain séjour — du week-end à la grande escapade.
            </p>
          </motion.header>

          <div className="space-y-14">
            {SECTIONS.map((section, i) => (
              <motion.section
                key={section.id}
                id={section.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 * (i + 1) }}
              >
                <h2 className="mb-4 text-xl font-semibold sm:text-2xl" style={{ color: 'var(--foreground)' }}>
                  {section.title}
                </h2>
                <div className="space-y-4 text-base leading-relaxed text-slate-400">
                  {section.paragraphs.map((p, j) => (
                    <p key={`${section.id}-${j}`}>{p}</p>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>

          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.45 }}
            className="mt-16 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/2 p-6 sm:flex-row sm:items-center sm:justify-between"
            aria-label="Liens utiles"
          >
            <p className="text-sm text-slate-400">
              Prêt à structurer votre prochain voyage ? Comparez les formules et lancez-vous.
            </p>
            <Link
              href="/pricing"
              className="inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Voir les tarifs
            </Link>
          </motion.nav>
        </article>
      </main>
    </div>
  );
}
