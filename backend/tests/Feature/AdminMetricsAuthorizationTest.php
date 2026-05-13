<?php

namespace Tests\Feature;

use App\Models\Abonnement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminMetricsAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_metrics_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/admin/metrics');

        $response->assertUnauthorized();
        $response->assertJsonPath('error.code', 'UNAUTHORIZED');
    }

    public function test_non_admin_user_cannot_access_admin_metrics(): void
    {
        $user = User::factory()->create();
        $user->forceFill(['est_admin' => false])->save();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/metrics');

        $response->assertForbidden();
        $response->assertJsonPath('error.code', 'FORBIDDEN');
    }

    public function test_admin_user_can_access_admin_metrics(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['est_admin' => true])->save();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/metrics');

        $response->assertOk();
        $response->assertJsonPath('success', true);
    }

    public function test_admin_metrics_reports_estimated_revenue_from_active_subscriptions(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['est_admin' => true])->save();

        $payingUser = User::factory()->create();
        Abonnement::query()->create([
            'utilisateur_id' => $payingUser->id,
            'abonnement_stripe_id' => 'cs_test_metrics_annual',
            'tier' => 'voyageur',
            'plan_interval' => 'annual',
            'statut' => 'active',
            'date_debut' => now(),
            'date_fin' => now()->addYear(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/metrics');

        $response->assertOk();
        $response->assertJsonPath('data.attributes.payments.revenue_eur', 108);
        $response->assertJsonPath('data.attributes.payments.revenue_source', 'estimated_active_subscriptions');
        $response->assertJsonPath('data.attributes.subscriptions.active_annual', 1);
    }
}
