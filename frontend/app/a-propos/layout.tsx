import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

const baseMetadata: Metadata = {
  title: 'À propos de Triply | Planificateur de voyage et assistant intelligent',
  description:
    'Triply aide les voyageurs à préparer leurs séjours : itinéraires sur mesure, idées d’activités, vols et hébergements, carte interactive et assistant dédié au voyage. Découvrez notre mission et nos formules.',
  keywords: [
    'planification de voyage',
    'organiser un voyage',
    'itinéraire de voyage',
    'assistant voyage',
    'voyage sur mesure',
    'préparer un séjour',
    'Triply',
  ],
  openGraph: {
    title: 'À propos de Triply — Votre copilote pour des voyages plus sereins',
    description:
      'Rassemblez idées, budget et étapes de voyage. Triply combine carte, comparatifs et assistant intelligent pour des séjours mieux préparés.',
    siteName: 'Triply',
    locale: 'fr_FR',
    type: 'website',
    ...(siteUrl ? { url: `${siteUrl}/a-propos` } : {}),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'À propos de Triply',
    description: 'Préparez vos voyages avec une expérience claire, visuelle et guidée.',
  },
};

export const metadata: Metadata = siteUrl
  ? {
      ...baseMetadata,
      alternates: { canonical: `${siteUrl}/a-propos` },
    }
  : baseMetadata;

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Triply',
  description:
    'Application de planification de voyage avec carte interactive, comparatifs vols et hébergements, et assistant intelligent pour itinéraires sur mesure.',
  ...(siteUrl ? { url: siteUrl } : {}),
};

export default function AProposLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      {children}
    </>
  );
}
