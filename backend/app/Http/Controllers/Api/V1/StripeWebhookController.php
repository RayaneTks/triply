<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Abonnement;
use App\Services\SubscriptionActivationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Stripe webhook receiver.
 *
 * Public endpoint — Stripe POSTs raw JSON with a Stripe-Signature header.
 * We verify the signature against the configured webhook secret before
 * acting on the event. Unhandled events still return 200 so Stripe stops
 * retrying.
 */
class StripeWebhookController extends ApiController
{
    public function __construct(
        private readonly SubscriptionActivationService $activationService,
    ) {}

    public function handle(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $sig = (string) $request->header('Stripe-Signature', '');
        $secret = (string) config('services.stripe.webhook_secret');

        if ($secret === '') {
            Log::warning('stripe.webhook.unconfigured');

            return $this->errorResponse(
                'STRIPE_WEBHOOK_UNCONFIGURED',
                'Le webhook Stripe n est pas configure.',
                [],
                503,
            );
        }

        try {
            $event = \Stripe\Webhook::constructEvent($payload, $sig, $secret);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            Log::warning('stripe.webhook.invalid_signature', ['message' => $e->getMessage()]);

            return $this->errorResponse('STRIPE_INVALID_SIGNATURE', 'Signature Stripe invalide.', [], 400);
        } catch (\UnexpectedValueException $e) {
            Log::warning('stripe.webhook.invalid_payload', ['message' => $e->getMessage()]);

            return $this->errorResponse('STRIPE_INVALID_SIGNATURE', 'Signature Stripe invalide.', [], 400);
        }

        $type = (string) ($event->type ?? '');

        switch ($type) {
            case 'checkout.session.completed':
                $this->handleCheckoutCompleted($event);
                break;
            case 'invoice.payment_failed':
                $this->handlePaymentFailed($event);
                break;
            case 'customer.subscription.deleted':
                $this->handleSubscriptionDeleted($event);
                break;
            default:
                Log::info('stripe.webhook.unhandled_event', ['type' => $type]);
                break;
        }

        return response()->json([
            'received' => true,
            'type' => $type,
        ], 200);
    }

    private function handleCheckoutCompleted(\Stripe\Event $event): void
    {
        $session = $event->data->object ?? null;
        if (! $session) {
            return;
        }

        $sessionId = (string) ($session->id ?? '');
        if ($sessionId === '') {
            return;
        }

        $sessionData = json_decode(json_encode($session), true);
        if (! is_array($sessionData)) {
            return;
        }

        $user = $this->activationService->resolveUserFromSession($sessionData);
        if (! $user) {
            Log::info('stripe.webhook.checkout.user_not_found', [
                'session_id' => $sessionId,
                'client_reference_id' => $sessionData['client_reference_id'] ?? null,
                'metadata_user_id' => $sessionData['metadata']['user_id'] ?? null,
            ]);

            return;
        }

        $plan = (string) ($sessionData['metadata']['plan'] ?? 'voyageur');
        if (! in_array($plan, ['voyageur', 'pilote'], true)) {
            $plan = 'voyageur';
        }
        $billing = (string) ($sessionData['metadata']['billing'] ?? 'monthly');
        if (! in_array($billing, ['monthly', 'annual'], true)) {
            $billing = 'monthly';
        }

        $this->activationService->activate($user, $sessionId, $plan, $billing, $sessionData);
    }

    private function handlePaymentFailed(\Stripe\Event $event): void
    {
        $invoice = $event->data->object ?? null;
        if (! $invoice) {
            return;
        }

        $subscriptionId = (string) ($invoice->subscription ?? '');
        if ($subscriptionId === '') {
            return;
        }

        Abonnement::query()
            ->where('abonnement_stripe_id', $subscriptionId)
            ->update(['statut' => 'past_due']);
    }

    private function handleSubscriptionDeleted(\Stripe\Event $event): void
    {
        $subscription = $event->data->object ?? null;
        if (! $subscription) {
            return;
        }

        $subscriptionId = (string) ($subscription->id ?? '');
        if ($subscriptionId === '') {
            return;
        }

        $abonnements = Abonnement::query()
            ->where('abonnement_stripe_id', $subscriptionId)
            ->get();

        foreach ($abonnements as $abonnement) {
            $abonnement->update(['statut' => 'cancelled']);
            $user = $abonnement->user;
            if ($user) {
                $user->update(['subscription_tier' => null]);
            }
        }
    }
}
