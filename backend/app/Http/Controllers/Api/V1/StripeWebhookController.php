<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Abonnement;
use App\Models\User;
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
        $subscriptionId = (string) ($session->subscription ?? '');
        $metadata = $session->metadata ?? null;
        $plan = '';
        $billing = '';
        if ($metadata) {
            $plan = (string) ($metadata->plan ?? '');
            $billing = (string) ($metadata->billing ?? '');
        }
        $customerEmail = (string) ($session->customer_email
            ?? ($session->customer_details->email ?? ''));

        if ($customerEmail === '') {
            Log::info('stripe.webhook.checkout.no_email', ['session_id' => $sessionId]);

            return;
        }

        $user = User::query()->where('email', $customerEmail)->first();
        if (! $user) {
            Log::info('stripe.webhook.checkout.user_not_found', [
                'session_id' => $sessionId,
                'email' => $customerEmail,
            ]);

            return;
        }

        $duration = $billing === 'annual' ? now()->addYear() : now()->addMonth();

        Abonnement::updateOrCreate(
            [
                'utilisateur_id' => $user->id,
                'abonnement_stripe_id' => $sessionId !== '' ? $sessionId : ($subscriptionId ?: 'sess_unknown'),
            ],
            [
                'tier' => $plan !== '' ? $plan : ($user->subscription_tier ?? 'voyageur'),
                'plan_interval' => $billing !== '' ? $billing : 'monthly',
                'statut' => 'active',
                'date_debut' => now(),
                'date_fin' => $duration,
            ]
        );

        if ($plan !== '') {
            $user->update(['subscription_tier' => $plan]);
        }
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
