<?php

namespace Tests\Feature;

use App\Models\Abonnement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StripeWebhookTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_400_on_invalid_signature(): void
    {
        config()->set('services.stripe.webhook_secret', 'whsec_test');

        $body = json_encode(['type' => 'checkout.session.completed', 'data' => ['object' => []]]);
        $response = $this->call(
            'POST',
            '/api/v1/stripe/webhook',
            [], [], [],
            [
                'HTTP_Stripe-Signature' => 'invalid_sig',
                'CONTENT_TYPE' => 'application/json',
            ],
            $body,
        );

        $response->assertStatus(400);
        $response->assertJsonPath('error.code', 'STRIPE_INVALID_SIGNATURE');
    }

    public function test_returns_503_when_webhook_secret_unconfigured(): void
    {
        config()->set('services.stripe.webhook_secret', null);

        $body = json_encode(['type' => 'checkout.session.completed']);
        $response = $this->call(
            'POST',
            '/api/v1/stripe/webhook',
            [], [], [],
            [
                'HTTP_Stripe-Signature' => 'whatever',
                'CONTENT_TYPE' => 'application/json',
            ],
            $body,
        );

        $response->assertStatus(503);
        $response->assertJsonPath('error.code', 'STRIPE_WEBHOOK_UNCONFIGURED');
    }

    public function test_handles_checkout_session_completed_event(): void
    {
        $secret = 'whsec_test_checkout';
        config()->set('services.stripe.webhook_secret', $secret);

        $user = User::factory()->create([
            'email' => 'paid@example.com',
            'subscription_tier' => null,
        ]);

        $payload = [
            'id' => 'evt_test_checkout',
            'object' => 'event',
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_test_abc123',
                    'object' => 'checkout.session',
                    'customer_email' => 'paid@example.com',
                    'subscription' => 'sub_test_xyz',
                    'metadata' => [
                        'plan' => 'voyageur',
                        'billing' => 'monthly',
                        'user_id' => (string) $user->id,
                    ],
                ],
            ],
        ];

        [$body, $sigHeader] = $this->signPayload($payload, $secret);

        $response = $this->call(
            'POST',
            '/api/v1/stripe/webhook',
            [], [], [],
            [
                'HTTP_Stripe-Signature' => $sigHeader,
                'CONTENT_TYPE' => 'application/json',
            ],
            $body,
        );

        $response->assertStatus(200);
        $response->assertJsonPath('received', true);
        $response->assertJsonPath('type', 'checkout.session.completed');

        $this->assertDatabaseHas('abonnements', [
            'utilisateur_id' => $user->id,
            'abonnement_stripe_id' => 'cs_test_abc123',
            'statut' => 'active',
            'tier' => 'voyageur',
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'subscription_tier' => 'voyageur',
        ]);
    }

    public function test_returns_200_on_unknown_event_type(): void
    {
        $secret = 'whsec_test_unknown';
        config()->set('services.stripe.webhook_secret', $secret);

        $payload = [
            'id' => 'evt_test_unknown',
            'object' => 'event',
            'type' => 'customer.created',
            'data' => ['object' => ['id' => 'cus_test_123']],
        ];

        [$body, $sigHeader] = $this->signPayload($payload, $secret);

        $response = $this->call(
            'POST',
            '/api/v1/stripe/webhook',
            [], [], [],
            [
                'HTTP_Stripe-Signature' => $sigHeader,
                'CONTENT_TYPE' => 'application/json',
            ],
            $body,
        );

        $response->assertStatus(200);
        $response->assertJsonPath('received', true);
        $response->assertJsonPath('type', 'customer.created');
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function signPayload(array $payload, string $secret): array
    {
        $body = json_encode($payload);
        $timestamp = time();
        $signedPayload = $timestamp.'.'.$body;
        $expectedSig = hash_hmac('sha256', $signedPayload, $secret);
        $sigHeader = 't='.$timestamp.',v1='.$expectedSig;

        return [$body, $sigHeader];
    }
}
