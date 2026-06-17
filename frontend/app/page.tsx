'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, MotionConfig, type Variants } from 'framer-motion';
import { Button } from '@/src/components/Button/Button';
import { ThemeToggle } from '@/src/components/ThemeToggle/ThemeToggle';
import { WorldMap } from '@/src/components/Map/Map';
import { TriplyLogo } from '@/src/components/layout/TriplyLogo';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

// Motion partagé : transitions sobres 200ms ease-out, stagger 50ms sur les listes.
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } },
};

type RevealProps = {
    children: ReactNode;
    className?: string;
};

function Reveal({ children, className }: RevealProps) {
    return (
        <motion.div
            className={className}
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
        >
            {children}
        </motion.div>
    );
}

export default function HomePage() {
    const router = useRouter();
    const enterApp = () => router.push('/planifier');
    const hasMapboxToken = MAPBOX_TOKEN.trim().length > 0;

    const verbs = [
        {
            id: 'plan',
            tag: 'Plan',
            index: '01',
            title: 'Un plan qui tient compte du réel',
            lede:
                "Pose ta destination, tes dates et ton budget. Triply construit des journées géolocalisées, rythmées et chiffrées — pas une simple liste à cocher.",
            points: [
                { label: 'Journées géolocalisées', text: 'Chaque étape porte ses coordonnées : trajets logiques, pas de zigzag dans la ville.' },
                { label: 'Budget intégré', text: 'Vols, hôtel et activités agrégés en euros, visibles dès la première version du plan.' },
                { label: 'Rythme maîtrisé', text: 'Un plafond d’heures par jour évite les itinéraires intenables.' },
            ],
        },
        {
            id: 'react',
            tag: 'React',
            index: '02',
            title: 'Le voyage bouge. Ton plan suit.',
            lede:
                "C’est là que Triply se sépare des planificateurs classiques : quand une contrainte tombe, il recompose la journée au lieu de te laisser tout refaire à la main.",
            points: [
                { label: 'Constraint Replanner', text: 'Vol de 7h35 retardé de 4h ? Triply redécoupe ta journée d’arrivée et décale les visites concernées.' },
                { label: 'Budget Reshuffle', text: 'Une dépense imprévue ? Réajuste l’enveloppe et vois quelles activités tiennent encore.' },
                { label: 'Décisions traçables', text: 'Chaque réorganisation est explicite : tu gardes la main sur ce qui change.' },
            ],
        },
        {
            id: 'live',
            tag: 'Live',
            index: '03',
            title: 'Sur place, le temps libre devient une opportunité',
            lede:
                "Triply suit ta journée en direct et transforme les creux en suggestions concrètes, à distance de marche de là où tu es.",
            points: [
                { label: 'Free-time Concierge', text: 'Deux heures de libre près du Trastevere ? Triply propose des lieux atteignables à pied dans ton temps restant.' },
                { label: 'À distance de marche', text: 'Les suggestions sont filtrées par temps de trajet réel, aller-retour compris.' },
                { label: 'Sans doublon', text: 'Ce que tu as déjà prévu n’est jamais reproposé.' },
            ],
        },
    ];

    return (
        <MotionConfig reducedMotion="user">
            <div className="min-h-dvh w-full bg-background text-foreground">
                <header className="fixed left-1/2 top-0 z-50 w-full max-w-7xl -translate-x-1/2 bg-background/80 px-6 py-4 backdrop-blur-md">
                    <div className="mx-auto flex w-full items-center justify-between">
                        <div className="flex items-center">
                            <TriplyLogo size={56} priority />
                        </div>
                        <nav className="hidden items-center gap-8 text-sm text-foreground/80 md:flex">
                            <a href="#plan" className="transition-colors hover:text-primary">Plan</a>
                            <a href="#react" className="transition-colors hover:text-primary">React</a>
                            <a href="#live" className="transition-colors hover:text-primary">Live</a>
                            <a href="#scenario" className="transition-colors hover:text-primary">En situation</a>
                        </nav>
                        <div className="flex items-center gap-3">
                            <ThemeToggle className="h-9 w-9" />
                            <Button label="Commencer" onClick={enterApp} variant="dark" tone="tone1" />
                        </div>
                    </div>
                </header>

                <main>
                    {/* HERO */}
                    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 z-0 overflow-hidden">
                            {hasMapboxToken ? (
                                <div className="h-[170%] w-full -translate-y-[36%]">
                                    <WorldMap
                                        accessToken={MAPBOX_TOKEN}
                                        initialLatitude={30}
                                        initialLongitude={5}
                                        initialZoom={1.9}
                                        mapStyle="mapbox://styles/mapbox/standard"
                                        mapConfig={{
                                            lightPreset: 'night',
                                            showPlaceLabels: false,
                                            showPointOfInterestLabels: false,
                                            showRoadLabels: false,
                                            showTransitLabels: false,
                                        }}
                                        pitch={50}
                                        interactive={false}
                                        autoRotateSpeed={5}
                                        height="100%"
                                        width="100%"
                                        className="h-full w-full"
                                    />
                                </div>
                            ) : (
                                <div className="h-full w-full bg-gradient-to-br from-secondary/35 via-background to-background" />
                            )}
                        </div>
                        <div className="absolute inset-0 z-10 bg-gradient-to-b from-background/70 via-background/75 to-background/90" />

                        <motion.div
                            className="relative z-20 mx-auto max-w-4xl px-6 text-center"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div variants={itemVariants} className="mb-7 flex justify-center">
                                <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                                    Plan <span className="text-primary/50">·</span> React <span className="text-primary/50">·</span> Live
                                </span>
                            </motion.div>
                            <motion.h1
                                variants={itemVariants}
                                className="font-title text-4xl font-black leading-tight text-foreground md:text-6xl"
                            >
                                Planifie ton voyage.<br className="hidden sm:block" /> Réagis quand il change.
                            </motion.h1>
                            <motion.p
                                variants={itemVariants}
                                className="mx-auto mt-6 max-w-2xl text-base text-foreground/85 md:text-lg"
                            >
                                La plupart des apps s’arrêtent au planning. Triply continue : quand un vol glisse,
                                qu’une visite ferme ou qu’il te reste deux heures, il recompose ta journée — pas seulement ta liste.
                            </motion.p>
                            <motion.div
                                variants={itemVariants}
                                className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
                            >
                                <Button label="Accéder à Triply" onClick={enterApp} variant="dark" tone="tone1" />
                                <a
                                    href="#react"
                                    className="text-sm font-semibold text-primary underline-offset-4 transition-opacity hover:opacity-80"
                                >
                                    Voir comment ça réagit →
                                </a>
                            </motion.div>
                        </motion.div>
                    </section>

                    {/* VERBES : Plan / React / Live */}
                    {verbs.map((verb) => (
                        <section
                            key={verb.id}
                            id={verb.id}
                            className="mx-auto w-full max-w-7xl scroll-mt-28 px-6 py-20"
                        >
                            <Reveal className="flex flex-col gap-3">
                                <div className="flex items-baseline gap-3">
                                    <span className="font-title text-sm font-bold tracking-[0.3em] text-primary">{verb.index}</span>
                                    <span className="text-sm font-semibold uppercase tracking-[0.2em] text-micro-design">{verb.tag}</span>
                                </div>
                                <h2 className="font-title text-3xl font-bold text-foreground md:text-4xl">{verb.title}</h2>
                                <p className="max-w-2xl text-foreground/75">{verb.lede}</p>
                            </Reveal>

                            <motion.ul
                                className="mt-10 grid gap-5 md:grid-cols-3"
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.2 }}
                            >
                                {verb.points.map((point) => (
                                    <motion.li
                                        key={point.label}
                                        variants={itemVariants}
                                        className="triply-card p-6"
                                    >
                                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                                            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="m5 12 5 5L20 7" />
                                            </svg>
                                        </div>
                                        <h3 className="font-title text-lg font-bold text-foreground">{point.label}</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-foreground/75">{point.text}</p>
                                    </motion.li>
                                ))}
                            </motion.ul>
                        </section>
                    ))}

                    {/* SCÉNARIO RÉEL (remplace le témoignage) */}
                    <section id="scenario" className="scroll-mt-28 bg-secondary/15 py-20">
                        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center">
                            <Reveal className="relative overflow-hidden rounded-3xl border border-secondary/40 bg-secondary/25 p-8 shadow-xl shadow-secondary/20">
                                <div className="relative h-[280px] overflow-hidden rounded-2xl border border-secondary/50 bg-background/45 backdrop-blur-sm">
                                    <Image
                                        src="/Triplypres.png"
                                        alt="Itinéraire Triply sur tablette"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                    />
                                </div>
                                <div className="absolute bottom-6 right-6 max-w-[26rem] rounded-2xl border border-primary/40 bg-background/65 p-5 shadow-lg shadow-secondary/25 backdrop-blur-md">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-micro-design">Scénario</p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                        Vol Paris → Rome retardé de 4 h. Triply décale l’arrivée, libère la matinée et garde la visite du Colisée l’après-midi.
                                    </p>
                                </div>
                            </Reveal>

                            <div>
                                <Reveal>
                                    <h2 className="font-title text-3xl font-bold text-foreground md:text-4xl">Planifier, ce n’est pas réagir</h2>
                                    <p className="mt-3 max-w-xl text-foreground/75">
                                        Un bon plan suppose que tout se passe comme prévu. Un voyage, non.
                                        Triply est pensé pour l’écart entre les deux.
                                    </p>
                                </Reveal>
                                <motion.ul
                                    className="mt-6 space-y-4 text-sm text-foreground/80"
                                    variants={containerVariants}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, amount: 0.2 }}
                                >
                                    {[
                                        'Une contrainte tombe → la journée se recompose, pas seulement la to-do.',
                                        'Le budget reste lisible à chaque arbitrage, en euros.',
                                        'Sur place, les temps morts deviennent des suggestions atteignables à pied.',
                                    ].map((line) => (
                                        <motion.li key={line} variants={itemVariants} className="triply-card p-4">
                                            {line}
                                        </motion.li>
                                    ))}
                                </motion.ul>
                            </div>
                        </div>
                    </section>

                    {/* CTA FINAL */}
                    <section className="px-6 py-20">
                        <motion.article
                            className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-secondary/35 bg-secondary/25 p-10 text-center md:p-14"
                            variants={itemVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                        >
                            <h2 className="font-title text-4xl font-bold text-foreground md:text-5xl">Prêt quand le voyage l’est ?</h2>
                            <p className="mx-auto mt-4 max-w-2xl text-foreground/85">
                                Construis un premier itinéraire, puis laisse Triply réagir avec toi quand les choses changent.
                            </p>
                            <Button
                                label="Créer mon itinéraire"
                                onClick={enterApp}
                                variant="light"
                                tone="tone2"
                                className="mt-8 inline-flex"
                            />
                            <p className="mt-4 text-xs text-primary/90">Gratuit pour votre premier voyage — Aucune carte requise</p>
                        </motion.article>
                    </section>
                </main>

                <footer className="border-t border-secondary/35 bg-secondary/15 px-6 py-10">
                    <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
                        <div>
                            <TriplyLogo size={50} />
                            <p className="mt-1 text-xs text-foreground/60">© 2026 Triply Technologies. Tous droits réservés.</p>
                        </div>
                        <nav aria-label="Liens légaux" className="flex flex-wrap items-center justify-center gap-6 text-sm text-foreground/75">
                            <a href="/legal/confidentialite" className="transition-colors hover:text-primary">Confidentialité</a>
                            <a href="/legal/cgu" className="transition-colors hover:text-primary">Conditions d&apos;utilisation</a>
                            <a href="mailto:support@triply.ovh" className="transition-colors hover:text-primary">Support</a>
                            <a href="/a-propos" className="transition-colors hover:text-primary">À propos</a>
                        </nav>
                    </div>
                </footer>
            </div>
        </MotionConfig>
    );
}
