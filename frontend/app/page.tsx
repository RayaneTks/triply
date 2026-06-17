'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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

    // Comment ça marche — 3 étapes concrètes.
    const steps = [
        {
            index: '1',
            title: 'Créez votre voyage',
            text: 'Indiquez votre destination, vos dates, le nombre de voyageurs et votre budget. Triply pose les bases de votre itinéraire.',
        },
        {
            index: '2',
            title: 'Organisez vos journées',
            text: 'Ajoutez vos activités jour par jour, sur une carte, avec des trajets qui s’enchaînent logiquement.',
        },
        {
            index: '3',
            title: 'Ajustez budget et imprévus',
            text: 'Suivez vos dépenses en euros et adaptez votre voyage en quelques clics quand un plan change.',
        },
    ];

    // Aides concrètes à la planification — bénéfices utilisateur, pas des noms de feature.
    const aides = [
        {
            title: 'Un itinéraire jour par jour',
            text: 'Chaque journée est claire : activités, horaires et trajets enchaînés, sans zigzag dans la ville.',
        },
        {
            title: 'Un budget suivi en euros',
            text: 'Vols, hébergement et activités réunis au même endroit. Vous voyez ce que coûte votre voyage à tout moment.',
        },
        {
            title: 'Un voyage qui s’adapte',
            text: 'Un vol décalé, une visite fermée ? Réorganisez la journée concernée sans tout refaire à la main.',
        },
        {
            title: 'Vos temps libres mis à profit',
            text: 'Le copilote vous suggère quoi faire pendant les creux, à distance de marche de là où vous êtes.',
        },
        {
            title: 'Des variantes à comparer',
            text: 'Essayez une autre version d’une journée, gardez celle qui vous convient le mieux.',
        },
        {
            title: 'Un récap à partager',
            text: 'Partagez votre itinéraire avec vos compagnons de voyage grâce à un simple lien.',
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
                            <Link href="/planifier" className="transition-colors hover:text-primary">Planifier</Link>
                            <Link href="/voyages" className="transition-colors hover:text-primary">Voyages</Link>
                            <Link href="/tarifs" className="transition-colors hover:text-primary">Tarifs</Link>
                            <Link href="/a-propos" className="transition-colors hover:text-primary">À propos</Link>
                        </nav>
                        <div className="flex items-center gap-3">
                            <ThemeToggle className="h-9 w-9" />
                            <Button label="Créer un voyage" onClick={enterApp} variant="dark" tone="tone1" />
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
                            <motion.h1
                                variants={itemVariants}
                                className="font-title text-4xl font-black leading-tight text-foreground md:text-6xl"
                            >
                                Organisez votre voyage,<br className="hidden sm:block" /> jour par jour.
                            </motion.h1>
                            <motion.p
                                variants={itemVariants}
                                className="mx-auto mt-6 max-w-2xl text-base text-foreground/85 md:text-lg"
                            >
                                Triply vous aide à construire un itinéraire clair, à suivre votre budget
                                et à adapter votre voyage quand les choses changent. Sans prise de tête.
                            </motion.p>
                            <motion.div
                                variants={itemVariants}
                                className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
                            >
                                <Button label="Créer un voyage" onClick={enterApp} variant="dark" tone="tone1" />
                                <a
                                    href="#etapes"
                                    className="text-sm font-semibold text-primary underline-offset-4 transition-opacity hover:opacity-80"
                                >
                                    Voir comment ça marche →
                                </a>
                            </motion.div>
                        </motion.div>
                    </section>

                    {/* COMMENT ÇA MARCHE */}
                    <section id="etapes" className="mx-auto w-full max-w-7xl scroll-mt-28 px-6 py-20">
                        <Reveal className="flex flex-col gap-3">
                            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-micro-design">Comment ça marche</span>
                            <h2 className="font-title text-3xl font-bold text-foreground md:text-4xl">Votre voyage prend forme en trois étapes</h2>
                            <p className="max-w-2xl text-foreground/75">
                                De la première idée à l’itinéraire complet, vous gardez la main du début à la fin.
                            </p>
                        </Reveal>

                        <motion.ol
                            className="mt-10 grid gap-5 md:grid-cols-3"
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                        >
                            {steps.map((step) => (
                                <motion.li
                                    key={step.index}
                                    variants={itemVariants}
                                    className="triply-card p-6"
                                >
                                    <span className="font-title text-2xl font-black text-primary">{step.index}</span>
                                    <h3 className="mt-3 font-title text-lg font-bold text-foreground">{step.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-foreground/75">{step.text}</p>
                                </motion.li>
                            ))}
                        </motion.ol>
                    </section>

                    {/* CE QUE VOUS POUVEZ FAIRE */}
                    <section id="aides" className="scroll-mt-28 bg-secondary/15 py-20">
                        <div className="mx-auto w-full max-w-7xl px-6">
                            <Reveal className="flex flex-col gap-3">
                                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-micro-design">Ce que Triply fait pour vous</span>
                                <h2 className="font-title text-3xl font-bold text-foreground md:text-4xl">Tout pour planifier, simplement mais en profondeur</h2>
                                <p className="max-w-2xl text-foreground/75">
                                    Des outils concrets pour construire un voyage clair, maîtriser le budget et rester flexible.
                                </p>
                            </Reveal>

                            <motion.ul
                                className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.15 }}
                            >
                                {aides.map((aide) => (
                                    <motion.li
                                        key={aide.title}
                                        variants={itemVariants}
                                        className="triply-card p-6"
                                    >
                                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                                            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="m5 12 5 5L20 7" />
                                            </svg>
                                        </div>
                                        <h3 className="font-title text-lg font-bold text-foreground">{aide.title}</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-foreground/75">{aide.text}</p>
                                    </motion.li>
                                ))}
                            </motion.ul>
                        </div>
                    </section>

                    {/* APERÇU */}
                    <section id="apercu" className="scroll-mt-28 py-20">
                        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center">
                            <Reveal className="relative overflow-hidden rounded-3xl border border-secondary/40 bg-secondary/25 p-8 shadow-xl shadow-secondary/20">
                                <div className="relative h-[280px] overflow-hidden rounded-2xl border border-secondary/50 bg-background/45 backdrop-blur-sm">
                                    <Image
                                        src="/Triplypres.png"
                                        alt="Aperçu d’un itinéraire Triply"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                    />
                                </div>
                                <div className="absolute bottom-6 right-6 max-w-[26rem] rounded-2xl border border-primary/40 bg-background/65 p-5 shadow-lg shadow-secondary/25 backdrop-blur-md">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-micro-design">Exemple</p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                        Vol Paris → Rome décalé&nbsp;? Triply replanifie votre journée d’arrivée et garde la visite du Colisée l’après-midi.
                                    </p>
                                </div>
                            </Reveal>

                            <div>
                                <Reveal>
                                    <h2 className="font-title text-3xl font-bold text-foreground md:text-4xl">Votre itinéraire, d’un coup d’œil</h2>
                                    <p className="mt-3 max-w-xl text-foreground/75">
                                        Les journées, les activités, la carte et le budget réunis sur un seul écran.
                                        Vous gardez la vue d’ensemble du début à la fin du voyage.
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
                                        'Chaque journée détaillée : activités, horaires et trajets.',
                                        'Le budget total visible en euros, mis à jour à chaque ajout.',
                                        'Un imprévu ? Vous adaptez la journée concernée, le reste tient.',
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
                            <h2 className="font-title text-4xl font-bold text-foreground md:text-5xl">Prêt à organiser votre prochain voyage&nbsp;?</h2>
                            <p className="mx-auto mt-4 max-w-2xl text-foreground/85">
                                Créez votre premier voyage et construisez un itinéraire clair en quelques minutes.
                            </p>
                            <Button
                                label="Créer un voyage"
                                onClick={enterApp}
                                variant="light"
                                tone="tone2"
                                className="mt-8 inline-flex"
                            />
                            <p className="mt-4 text-xs text-primary/90">Gratuit pour votre premier voyage — aucune carte requise</p>
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
