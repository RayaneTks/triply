<?php

namespace Tests\Feature;

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
}
