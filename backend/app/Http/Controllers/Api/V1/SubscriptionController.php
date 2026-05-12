<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Abonnement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class SubscriptionController extends ApiController
{
    /**
     * Confirme une session Stripe et persiste le tier d'abonnement de l'utilisateur.
     *
     * MVP : on fait confiance au session_id retourné par Stripe success_url car la route
     * est protégée par auth:sanctum. Pour la prod réelle il faut valider la session
     * côté Stripe API (mode=subscription + payment_status=paid) ou implémenter le
     * webhook `checkout.session.completed`.
     */
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
