<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Abonnement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class SubscriptionController extends ApiController
{
    public function confirm(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (! $user) {
            return $this->errorResponse('UNAUTHORIZED', 'Authentification requise.', [], 401);
        }

        try {
            $payload = $request->validate([
                'session_id' => 'required|string|max:255',
                'plan' => 'required|in:voyageur,pilote',
                'billing' => 'required|in:monthly,annual',
            ]);
        } catch (ValidationException $e) {
            return $this->errorResponse('VALIDATION', 'Paramètres invalides.', $e->errors(), 422);
        }

        if (! str_starts_with($payload['session_id'], 'cs_')) {
            return $this->errorResponse('VALIDATION', 'session_id invalide.', [], 422);
        }

        $alreadyLinked = Abonnement::query()
            ->where('abonnement_stripe_id', $payload['session_id'])
            ->where('utilisateur_id', '!=', $user->id)
            ->exists();
        if ($alreadyLinked) {
            return $this->errorResponse('FORBIDDEN', 'Cette session Stripe est deja associee a un autre utilisateur.', [], 403);
        }

        $stripeSecret = (string) config('services.stripe.secret', env('STRIPE_SECRET_KEY', ''));
        if ($stripeSecret === '') {
            return $this->errorResponse('CONFIGURATION', 'Configuration Stripe indisponible.', [], 503);
        }

        $stripeSession = Http::asForm()
            ->withBasicAuth($stripeSecret, '')
            ->acceptJson()
            ->timeout(8)
            ->get('https://api.stripe.com/v1/checkout/sessions/'.$payload['session_id']);

        if (! $stripeSession->successful()) {
            Log::warning('subscription.confirm.stripe_lookup_failed', [
                'user_id' => $user->id,
                'session_id' => $payload['session_id'],
                'status' => $stripeSession->status(),
            ]);

            return $this->errorResponse('PAYMENT_VERIFICATION_FAILED', 'Verification du paiement impossible.', [], 422);
        }

        $sessionData = $stripeSession->json();
        $sessionStatus = (string) ($sessionData['status'] ?? '');
        $paymentStatus = (string) ($sessionData['payment_status'] ?? '');
        $sessionMode = (string) ($sessionData['mode'] ?? '');
        if ($sessionStatus !== 'complete' || ! in_array($paymentStatus, ['paid', 'no_payment_required'], true)) {
            return $this->errorResponse('PAYMENT_NOT_COMPLETED', 'Le paiement Stripe n est pas valide.', [], 422);
        }

        if (! in_array($sessionMode, ['subscription', 'payment'], true)) {
            return $this->errorResponse('PAYMENT_VERIFICATION_FAILED', 'Mode de session Stripe invalide.', [], 422);
        }

        $metadataPlan = (string) ($sessionData['metadata']['plan'] ?? '');
        $metadataBilling = (string) ($sessionData['metadata']['billing'] ?? '');
        if ($metadataPlan !== '' && $metadataPlan !== $payload['plan']) {
            return $this->errorResponse('PAYMENT_VERIFICATION_FAILED', 'Plan Stripe non coherent.', [], 422);
        }
        if ($metadataBilling !== '' && $metadataBilling !== $payload['billing']) {
            return $this->errorResponse('PAYMENT_VERIFICATION_FAILED', 'Facturation Stripe non coherente.', [], 422);
        }

        $customerEmail = (string) ($sessionData['customer_details']['email'] ?? '');
        if ($customerEmail !== '' && strcasecmp($customerEmail, (string) $user->email) !== 0) {
            return $this->errorResponse('PAYMENT_VERIFICATION_FAILED', 'Session Stripe non associee a cet utilisateur.', [], 422);
        }

        $duration = $payload['billing'] === 'annual' ? now()->addYear() : now()->addMonth();

        Abonnement::updateOrCreate(
            [
                'utilisateur_id' => $user->id,
                'abonnement_stripe_id' => $payload['session_id'],
            ],
            [
                'tier' => $payload['plan'],
                'plan_interval' => $payload['billing'],
                'statut' => 'active',
                'date_debut' => now(),
                'date_fin' => $duration,
            ]
        );

        $user->update(['subscription_tier' => $payload['plan']]);

        return $this->successResponse([
            'tier' => $payload['plan'],
            'billing' => $payload['billing'],
        ]);
    }
}
