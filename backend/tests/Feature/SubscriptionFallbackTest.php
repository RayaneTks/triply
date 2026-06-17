<?php

namespace Tests\Feature;

use App\Models\Abonnement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SubscriptionFallbackTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Http::fake([
            'api.frankfurter.app/*' => Http::response(['rates' => ['EUR' => 1.0]], 200),
            'test.api.amadeus.com/*' => Http::response([], 200),
            'api.amadeus.com/*' => Http::response([], 200),
        ]);
    }

    public function test_returns_503_when_stripe_secret_missing(): void
    {
        config()->set('services.stripe.secret', '');
        // env() fallback inside controller; ensure nothing leaks.
        putenv('STRIPE_SECRET_KEY=');

        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/v1/subscriptions/confirm', [
            'session_id' => 'cs_test_fallback_123',
            'plan' => 'voyageur',
            'billing' => 'monthly',
        ]);

        $response->assertStatus(503)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'STRIPE_NOT_CONFIGURED');

        $this->assertDatabaseMissing('abonnements', [
            'utilisateur_id' => $user->id,
            'abonnement_stripe_id' => 'cs_test_fallback_123',
        ]);
    }

    public function test_succeeds_when_stripe_secret_present_and_session_valid(): void
    {
        config()->set('services.stripe.secret', 'sk_test_fake');

        Http::fake([
            'api.stripe.com/v1/checkout/sessions/*' => Http::response([
                'status' => 'complete',
                'payment_status' => 'paid',
                'mode' => 'subscription',
                'subscription' => 'sub_xxx',
                'metadata' => ['plan' => 'voyageur', 'billing' => 'monthly'],
                'customer_details' => ['email' => null],
            ], 200),
            'api.frankfurter.app/*' => Http::response(['rates' => ['EUR' => 1.0]], 200),
            'test.api.amadeus.com/*' => Http::response([], 200),
            'api.amadeus.com/*' => Http::response([], 200),
        ]);

        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/v1/subscriptions/confirm', [
            'session_id' => 'cs_test_valid_456',
            'plan' => 'voyageur',
            'billing' => 'monthly',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.tier', 'voyageur')
            ->assertJsonPath('data.billing', 'monthly');

        $this->assertDatabaseHas('abonnements', [
            'utilisateur_id' => $user->id,
            'abonnement_stripe_id' => 'cs_test_valid_456',
            'tier' => 'voyageur',
            'statut' => 'active',
        ]);

        $this->assertSame('voyageur', $user->fresh()->subscription_tier);
    }
}
