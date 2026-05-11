import { AboutView } from '@/src/features/about/AboutView';
import { AppShell } from '@/src/components/layout/AppShell';

export const metadata = {
  title: 'À propos | Triply',
};

export default function AProposPage() {
  return (
    <AppShell>
      <AboutView />
    </AppShell>
  );
}
