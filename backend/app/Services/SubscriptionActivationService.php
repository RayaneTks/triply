<?php

namespace App\Services;

use App\Models\Abonnement;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SubscriptionActivationService
{
    public function isStripeSecretConfigured(): bool
    {
        return (string) config('services.stripe.secret', '') !== '';
    }

    /**
     * @return array<string, mixed>|null
     */
    public function fetchStripeSession(string $sessionId): ?array
    {
        $stripeSecret = (string) config('services.stripe.secret', '');
        if ($stripeSecret === '') {
            return null;
        }

        $response = Http::asForm()
            ->withBasicAuth($stripeSecret, '')
            ->acceptJson()
            ->timeout(8)
            ->get('https://api.stripe.com/v1/checkout/sessions/'.$sessionId);

        if (! $response->successful()) {
            Log::warning('subscription.stripe_lookup_failed', [
                'session_id' => $sessionId,
                'status' => $response->status(),
            ]);

            return null;
        }

        return $response->json();
    }

    public function isAlreadyActivatedForUser(User $user, string $sessionId): bool
    {
        return Abonnement::query()
            ->where('utilisateur_id', $user->id)
            ->where('abonnement_stripe_id', $sessionId)
            ->where('statut', 'active')
            ->exists();
    }

    /**
     * @param  array<string, mixed>  $sessionData
     * @return array{ok: bool, code?: string, message?: string}
     */
    public function validatePaidSession(array $sessionData, string $expectedPlan, string $expectedBilling): array
    {
        $sessionStatus = (string) ($sessionData['status'] ?? '');
        $paymentStatus = (string) ($sessionData['payment_status'] ?? '');
        $sessionMode = (string) ($sessionData['mode'] ?? '');

        if ($sessionStatus !== 'complete' || ! in_array($paymentStatus, ['paid', 'no_payment_required'], true)) {
            return [
                'ok' => false,
                'code' => 'PAYMENT_NOT_COMPLETED',
                'message' => 'Le paiement Stripe n est pas valide.',
            ];
        }

        if (! in_array($sessionMode, ['subscription', 'payment'], true)) {
            return [
                'ok' => false,
                'code' => 'PAYMENT_VERIFICATION_FAILED',
                'message' => 'Mode de session Stripe invalide.',
            ];
        }

        $metadataPlan = (string) ($sessionData['metadata']['plan'] ?? '');
        $metadataBilling = (string) ($sessionData['metadata']['billing'] ?? '');
        if ($metadataPlan !== '' && $metadataPlan !== $expectedPlan) {
            return [
                'ok' => false,
                'code' => 'PAYMENT_VERIFICATION_FAILED',
                'message' => 'Plan Stripe non coherent.',
            ];
        }
        if ($metadataBilling !== '' && $metadataBilling !== $expectedBilling) {
            return [
                'ok' => false,
                'code' => 'PAYMENT_VERIFICATION_FAILED',
                'message' => 'Facturation Stripe non coherente.',
            ];
        }

        return ['ok' => true];
    }

    /**
     * @param  array<string, mixed>  $sessionData
     */
    public function sessionBelongsToUser(User $user, array $sessionData): bool
    {
        $userId = (string) $user->id;
        $clientRef = (string) ($sessionData['client_reference_id'] ?? '');
        $metadataUserId = (string) ($sessionData['metadata']['user_id'] ?? '');

        if ($clientRef !== '' && $clientRef === $userId) {
            return true;
        }
        if ($metadataUserId !== '' && $metadataUserId === $userId) {
            return true;
        }

        $customerEmail = (string) ($sessionData['customer_details']['email'] ?? ($sessionData['customer_email'] ?? ''));
        if ($customerEmail !== '' && strcasecmp($customerEmail, (string) $user->email) === 0) {
            return true;
        }

        // Sessions legacy sans liaison utilisateur : auth Sanctum + session payée suffisent.
        if ($customerEmail === '' && $clientRef === '' && $metadataUserId === '') {
            return true;
        }

        return false;
    }

    /**
     * @param  array<string, mixed>  $sessionData
     * @return array{tier: string, billing: string}
     */
    public function activate(User $user, string $sessionId, string $plan, string $billing, array $sessionData = []): array
    {
        $resolvedPlan = (string) ($sessionData['metadata']['plan'] ?? '');
        if ($resolvedPlan === '' || ! in_array($resolvedPlan, ['voyageur', 'pilote'], true)) {
            $resolvedPlan = $plan;
        }

        $resolvedBilling = (string) ($sessionData['metadata']['billing'] ?? '');
        if ($resolvedBilling === '' || ! in_array($resolvedBilling, ['monthly', 'annual'], true)) {
            $resolvedBilling = $billing;
        }

        $duration = $resolvedBilling === 'annual' ? now()->addYear() : now()->addMonth();

        Abonnement::updateOrCreate(
            [
                'utilisateur_id' => $user->id,
                'abonnement_stripe_id' => $sessionId,
            ],
            [
                'tier' => $resolvedPlan,
                'plan_interval' => $resolvedBilling,
                'statut' => 'active',
                'date_debut' => now(),
                'date_fin' => $duration,
            ]
        );

        $user->update(['subscription_tier' => $resolvedPlan]);

        return [
            'tier' => $resolvedPlan,
            'billing' => $resolvedBilling,
        ];
    }

    /**
     * @param  array<string, mixed>  $sessionData
     */
    public function resolveUserFromSession(array $sessionData): ?User
    {
        $metadataUserId = (string) ($sessionData['metadata']['user_id'] ?? '');
        $clientRef = (string) ($sessionData['client_reference_id'] ?? '');

        if ($metadataUserId !== '') {
            $user = User::query()->find($metadataUserId);
            if ($user) {
                return $user;
            }
        }

        if ($clientRef !== '') {
            $user = User::query()->find($clientRef);
            if ($user) {
                return $user;
            }
        }

        $customerEmail = (string) ($sessionData['customer_details']['email'] ?? ($sessionData['customer_email'] ?? ''));
        if ($customerEmail === '') {
            return null;
        }

        return User::query()->where('email', $customerEmail)->first();
    }
}
