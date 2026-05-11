import { PrivacyView } from '@/src/features/legal/LegalViews';
import { AppShell } from '@/src/components/layout/AppShell';

export const metadata = {
  title: 'Politique de confidentialité | Triply',
};

export default function ConfidentialitePage() {
  return (
    <AppShell>
      <PrivacyView />
    </AppShell>
  );
}
