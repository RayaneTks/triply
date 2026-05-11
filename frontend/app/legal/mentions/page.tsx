import { MentionsLegalesView } from '@/src/features/legal/LegalViews';
import { AppShell } from '@/src/components/layout/AppShell';

export const metadata = {
  title: 'Mentions légales | Triply',
};

export default function MentionsPage() {
  return (
    <AppShell>
      <MentionsLegalesView />
    </AppShell>
  );
}
