import { ForgotPasswordView } from '@/src/features/auth/ForgotPasswordView';
import { FloatingThemeToggle } from '@/src/components/layout/FloatingThemeToggle';

export const metadata = {
  title: 'Mot de passe oublié | Triply',
};

export default function MotDePasseOubliePage() {
  return (
    <>
      <FloatingThemeToggle />
      <ForgotPasswordView />
    </>
  );
}
