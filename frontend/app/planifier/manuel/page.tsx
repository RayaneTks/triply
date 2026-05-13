import { ManualCanvasView } from '@/src/features/modes/ManualCanvasView';
import { AppShell } from '@/src/components/layout/AppShell';
import { RedirectType } from 'next/dist/client/components/redirect';
import { redirect } from 'next/navigation';
import { authClient, type AuthUser } from '@/src/lib/auth-client';

export const metadata = {
  title: 'Mode manuel | Triply',
};

export default async function PlanifierManuelPage() {
  let user: AuthUser | null = null;
  try {
    user = await authClient.me();
  } catch {
    user = null;
  }

  if (!user) {
    redirect('/connexion?returnTo=/planifier/manuel', RedirectType.replace);
  }

  const hasVoyageurSub = user.subscription_tier === 'voyageur';

  if (!hasVoyageurSub) {
    redirect('/tarifs', RedirectType.replace);
  }

  return (
    <AppShell showFooter={false}>
      <ManualCanvasView />
    </AppShell>
  );
}
