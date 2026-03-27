import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarifs - Triply',
  description:
    'Formules Free, Silver et Gold : préparez vos voyages avec carte interactive, comparatifs et assistant voyage. Choisissez l’offre adaptée à votre rythme.',
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
