import { ProfileView } from '@/src/features/profile/ProfileView';
import { AppShell } from '@/src/components/layout/AppShell';

export const metadata = {
  title: 'Mon profil | Triply',
};

export default function ProfilPage() {
  return (
    <AppShell>
      <ProfileView />
    </AppShell>
  );
}
