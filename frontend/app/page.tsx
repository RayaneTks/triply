'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/Button/Button';
import { ThemeToggle } from '@/src/components/ThemeToggle/ThemeToggle';
import { WorldMap } from '@/src/components/Map/Map';
import { TriplyLogo } from '@/src/components/layout/TriplyLogo';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

export default function HomePage() {
    const router = useRouter();
    const enterApp = () => router.push('/planifier');
    const hasMapboxToken = MAPBOX_TOKEN.trim().length > 0;

    const howItWorks = [
        { step: '1', title: 'Destination', description: 'Saisissez votre destination et vos dates de voyage souhaitées.' },
        { step: '2', title: 'Analyse IA', description: 'Triply analyse vos préférences, votre rythme et votre budget.' },
        { step: '3', title: 'Itinéraire', description: 'Recevez un plan complet optimisé pour vos contraintes réelles.' },
    ];

    const aiCards = [
        {
            title: "Optimisation d'itinéraire",
            text: 'Réduisez vos temps de trajet grâce à des parcours logiques ajustés en temps réel.',
            tag: 'FONCTION IA',
            note: 'Réorganisation automatique basée sur la météo prévue',
            icon: 'route',
        },
        {
            title: 'Recommandations locales',
            text: 'Découvrez des adresses pertinentes selon vos goûts gastronomiques et culturels.',
            tag: 'ANALYSE DE DONNÉES',
            note: "Score d'affinité calculé selon vos préférences",
            icon: 'spark',
        },
        {
            title: 'Gestion du budget',
            text: 'Suivez vos dépenses prévisionnelles avec des alternatives pour rester maître du coût.',
            tag: 'BUDGET MALIN',
            note: 'Économies détectées sur hébergement et activités',
            icon: 'wallet',
        },
    ];

    return (
        <div className="min-h-dvh w-full bg-background text-foreground">
            <header className="fixed left-1/2 top-0 z-50 w-full max-w-7xl -translate-x-1/2 bg-background/80 px-6 py-4 backdrop-blur-md">
                <div className="mx-auto flex w-full items-center justify-between">
                    <div className="flex items-center">
                        <TriplyLogo size={56} priority />
                    </div>
                    <nav className="hidden items-center gap-8 text-sm text-foreground/80 md:flex">
                        <a href="#features" className="border-b-2 border-primary pb-1 font-semibold text-primary transition-opacity hover:opacity-80">Accueil</a>
                        <a href="#fonctionnement" className="transition-colors hover:text-primary">Fonctionnement</a>
                        <a href="#pricing" className="transition-colors hover:text-primary">Intelligence IA</a>
                        <a href="#about" className="transition-colors hover:text-primary">Pourquoi Triply</a>
                    </nav>
                    <div className="flex items-center gap-3">
                        <ThemeToggle className="h-9 w-9" />
                        <Button
                            label="Commencer"
                            onClick={enterApp}
                            variant="dark"
                            tone="tone1"
                        />
                    </div>
                </div>
            </header>

            <main>
                <section id="features" className="relative flex min-h-[100dvh] scroll-mt-28 items-center justify-center overflow-hidden">
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
                    <div className="relative z-20 mx-auto max-w-4xl px-6 text-center">
                        <h1 className="font-title text-4xl font-black leading-tight text-foreground md:text-6xl">
                            Construisez un voyage sur mesure avec Triply
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-base text-foreground/85 md:text-lg">
                            Destination, activités, budget et rythme : Triply crée un itinéraire clair et exploitable en quelques instants.
                        </p>
                        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Button
                                label="Accéder à Triply"
                                onClick={enterApp}
                                variant="dark"
                                tone="tone1"
                            />
                        </div>
                    </div>
                </section>

                <section id="fonctionnement" className="mx-auto w-full max-w-7xl scroll-mt-28 px-6 py-20">
                    <div className="text-center">
                        <h2 className="font-title text-3xl font-bold text-foreground md:text-4xl">Comment ça marche</h2>
                        <p className="mx-auto mt-3 max-w-2xl text-foreground/75">Trois étapes simples pour transformer vos envies en itinéraire exploitable.</p>
                    </div>
                    <div className="mt-12 grid gap-6 md:grid-cols-3">
                        {howItWorks.map((item) => (
                            <article key={item.step} className="rounded-2xl border border-secondary/35 bg-secondary/20 p-7 text-center backdrop-blur-sm">
                                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-xl font-bold text-primary">
                                    {item.step}
                                </div>
                                <h3 className="font-title text-2xl font-bold text-foreground">{item.title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-foreground/75">{item.description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="pricing" className="scroll-mt-28 bg-secondary/15 py-20">
                    <div className="mx-auto w-full max-w-7xl px-6">
                        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div className="max-w-2xl">
                                <h2 className="font-title text-3xl font-bold text-foreground md:text-4xl">Intelligence artificielle</h2>
                                <p className="mt-3 text-foreground/75">Des outils puissants pour une planification sans effort, fidèles à la direction artistique de Triply.</p>
                            </div>
                            <a href="#destinations" className="text-sm font-semibold text-primary transition-colors hover:text-primary/80">Explorer toutes les fonctionnalités</a>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            {aiCards.map((card) => (
                                <article key={card.title} className="rounded-2xl border border-secondary/35 bg-secondary/20 p-6 shadow-lg shadow-secondary/25 backdrop-blur-sm">
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                                        {card.icon === 'route' && (
                                            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                                                <path d="M19 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                                                <path d="M7 17h3a4 4 0 0 0 4-4V9" />
                                                <path d="M14 9h3" />
                                            </svg>
                                        )}
                                        {card.icon === 'spark' && (
                                            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 3 9.8 8.2 5 10.4l4.8 2.2L12 18l2.2-5.4 4.8-2.2-4.8-2.2L12 3Z" />
                                                <path d="M5 3v3" />
                                                <path d="M3.5 4.5h3" />
                                                <path d="M19 16v3" />
                                                <path d="M17.5 17.5h3" />
                                            </svg>
                                        )}
                                        {card.icon === 'wallet' && (
                                            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="6" width="18" height="12" rx="2" />
                                                <path d="M3 10h18" />
                                                <circle cx="16.5" cy="14" r="1" />
                                            </svg>
                                        )}
                                    </div>
                                    <h3 className="font-title text-2xl font-bold text-foreground">{card.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-foreground/75">{card.text}</p>
                                    <div className="mt-5 rounded-lg border border-micro-design/45 bg-micro-design/15 p-3">
                                        <p className="text-xs font-semibold tracking-[0.12em] text-micro-design">{card.tag}</p>
                                        <p className="mt-1 text-xs italic text-foreground/80">{card.note}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="destinations" className="mx-auto grid w-full max-w-7xl scroll-mt-28 gap-10 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center">
                    <div className="relative overflow-hidden rounded-3xl border border-secondary/40 bg-secondary/25 p-8 shadow-xl shadow-secondary/20">
                        <div className="relative h-[280px] overflow-hidden rounded-2xl border border-secondary/50 bg-background/45 backdrop-blur-sm">
                            <Image
                                src="/Triplypres.png"
                                alt="Présentation de Triply sur tablette"
                                fill
                                className="object-cover"
                                sizes="(max-width: 1024px) 100vw, 50vw"
                            />
                        </div>
                        <div className="absolute bottom-6 right-6 max-w-[26rem] rounded-2xl border border-micro-design/45 bg-background/65 p-5 shadow-lg shadow-secondary/25 backdrop-blur-md">
                            <p className="text-2xl leading-none text-micro-design">&ldquo;</p>
                            <p className="text-sm font-semibold text-foreground">Une révolution dans ma façon de voyager.</p>
                            <p className="mt-2 text-xs text-foreground/75">Marc D. — Voyageur fréquent</p>
                        </div>
                    </div>
                    <div id="about" className="scroll-mt-28">
                        <h2 className="font-title text-3xl font-bold text-foreground md:text-4xl">Pourquoi choisir Triply ?</h2>
                        <ul className="mt-6 space-y-4 text-sm text-foreground/75">
                            <li className="rounded-xl border border-secondary/35 bg-secondary/20 p-4">Gain de temps massif : passez de longues recherches à des suggestions instantanées.</li>
                            <li className="rounded-xl border border-secondary/35 bg-secondary/20 p-4">Précision locale : recommandations contextuelles selon vos habitudes et vos contraintes.</li>
                            <li className="rounded-xl border border-secondary/35 bg-secondary/20 p-4">Multi-plateforme : continuez votre voyage sans friction entre mobile et bureau.</li>
                        </ul>
                    </div>
                </section>

                <section className="px-6 pb-20">
                    <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-secondary/35 bg-secondary/25 p-10 text-center md:p-14">
                        <h2 className="font-title text-4xl font-bold text-foreground md:text-5xl">Prêt à explorer ?</h2>
                        <p className="mx-auto mt-4 max-w-2xl text-foreground/85">
                            Rejoignez les voyageurs qui utilisent Triply pour organiser des expériences mémorables en quelques minutes.
                        </p>
                        <Button
                            label="Créer mon itinéraire"
                            onClick={enterApp}
                            variant="light"
                            tone="tone2"
                            className="mt-8 inline-flex"
                        />
                        <p className="mt-4 text-xs text-primary/90">Gratuit pour votre premier voyage — Aucune carte requise</p>
                    </div>
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
                        <a href="mailto:hello@triply.io" className="transition-colors hover:text-primary">Support</a>
                        <a href="/a-propos" className="transition-colors hover:text-primary">À propos</a>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
