import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function CheckoutSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <CheckCircle size={64} className="text-emerald-500 mx-auto mb-6" />
        <h1 className="text-3xl font-display font-bold mb-4">Abonnement activé !</h1>
        <p className="text-light-muted mb-8">
          Merci pour votre confiance. Votre abonnement Triply est maintenant actif.
        </p>
        <Link
          href="/planifier"
          className="inline-block bg-brand text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-hover transition-colors"
        >
          Commencer à planifier
        </Link>
      </div>
    </div>
  );
}
