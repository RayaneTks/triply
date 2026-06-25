<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Abonnement;
use App\Services\SubscriptionActivationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class SubscriptionController extends ApiController
{
    public function __construct(
        private readonly SubscriptionActivationService $activationService,
    ) {}

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

        if ($this->activationService->isAlreadyActivatedForUser($user, $payload['session_id'])) {
            $user->refresh();

            return $this->successResponse([
                'tier' => $user->subscription_tier ?? $payload['plan'],
                'billing' => $payload['billing'],
            ]);
        }

        if (! $this->activationService->isStripeSecretConfigured()) {
            Log::warning('subscription.confirm.stripe_secret_missing', [
                'user_id' => $user->id,
                'session_id' => $payload['session_id'],
            ]);

            return $this->errorResponse(
                'STRIPE_NOT_CONFIGURED',
                'Le service de paiement est temporairement indisponible. Reessayez plus tard.',
                [],
                503,
            );
        }

        $sessionData = $this->activationService->fetchStripeSession($payload['session_id']);
        if ($sessionData === null) {
            Log::warning('subscription.confirm.stripe_lookup_failed', [
                'user_id' => $user->id,
                'session_id' => $payload['session_id'],
            ]);

            return $this->errorResponse('PAYMENT_VERIFICATION_FAILED', 'Verification du paiement impossible.', [], 422);
        }

        $validation = $this->activationService->validatePaidSession(
            $sessionData,
            $payload['plan'],
            $payload['billing'],
        );
        if (! $validation['ok']) {
            return $this->errorResponse(
                (string) ($validation['code'] ?? 'PAYMENT_VERIFICATION_FAILED'),
                (string) ($validation['message'] ?? 'Verification du paiement impossible.'),
                [],
                422,
            );
        }

        if (! $this->activationService->sessionBelongsToUser($user, $sessionData)) {
            return $this->errorResponse('PAYMENT_VERIFICATION_FAILED', 'Session Stripe non associee a cet utilisateur.', [], 422);
        }

        $result = $this->activationService->activate(
            $user,
            $payload['session_id'],
            $payload['plan'],
            $payload['billing'],
            $sessionData,
        );

        return $this->successResponse($result);
    }
}
