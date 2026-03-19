import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarifs - Triply',
  description: 'Découvrez les offres Triply : plans Starter, Pro et Team pour planifier vos voyages avec l\'IA.',
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
