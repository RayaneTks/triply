<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubscriptionConfirmationTest extends TestCase
{
    use RefreshDatabase;

    public function test_confirm_returns_503_when_stripe_secret_missing(): void
    {
        config()->set('services.stripe.secret', '');
        putenv('STRIPE_SECRET_KEY=');
        $user = User::factory()->create([
            'email' => 'payer@example.com',
            'subscription_tier' => null,
        ]);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/subscriptions/confirm', [
            'session_id' => 'cs_test_missing_secret',
            'plan' => 'voyageur',
            'billing' => 'monthly',
        ]);

        $response->assertStatus(503);
        $response->assertJsonPath('error.code', 'STRIPE_NOT_CONFIGURED');
        $this->assertDatabaseMissing('abonnements', [
            'utilisateur_id' => $user->id,
            'abonnement_stripe_id' => 'cs_test_missing_secret',
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'subscription_tier' => null,
        ]);
    }

    public function test_confirm_validates_against_stripe_when_secret_configured(): void
    {
        config()->set('services.stripe.secret', 'sk_test_123');
        $user = User::factory()->create([
            'email' => 'stripe-user@example.com',
            'subscription_tier' => null,
        ]);
        Sanctum::actingAs($user);

        Http::fake([
            'https://api.stripe.com/v1/checkout/sessions/cs_test_valid' => Http::response([
                'id' => 'cs_test_valid',
                'status' => 'complete',
                'payment_status' => 'paid',
                'mode' => 'subscription',
                'metadata' => [
                    'plan' => 'pilote',
                    'billing' => 'annual',
                ],
                'customer_details' => [
                    'email' => 'stripe-user@example.com',
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/subscriptions/confirm', [
            'session_id' => 'cs_test_valid',
            'plan' => 'pilote',
            'billing' => 'annual',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.tier', 'pilote');
        $response->assertJsonPath('data.billing', 'annual');
    }
}
