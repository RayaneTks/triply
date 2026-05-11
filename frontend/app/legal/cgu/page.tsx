import { TermsView } from '@/src/features/legal/LegalViews';
import { AppShell } from '@/src/components/layout/AppShell';

export const metadata = {
  title: 'CGU | Triply',
};

export default function CguPage() {
  return (
    <AppShell>
      <TermsView />
    </AppShell>
  );
}
