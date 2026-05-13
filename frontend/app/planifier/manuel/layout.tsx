import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Mode manuel | Triply',
  description:
    'Créez votre itinéraire en mode manuel avec un canevas visuel et un contrôle total sur vos étapes.',
};

interface PlanifierManuelLayoutProps {
  children: ReactNode;
}

export default function PlanifierManuelLayout({ children }: PlanifierManuelLayoutProps) {
  return children;
}
