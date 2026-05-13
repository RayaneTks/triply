<?php

namespace Tests\Feature\Http;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MiscControllersTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    // ---- ConsentController ----

    public function test_consent_show_is_public(): void
    {
        $this->app['auth']->forgetGuards();
        $response = $this->getJson('/api/v1/consent');
        $response->assertOk();
    }

    public function test_consent_store_validates_required_booleans(): void
    {
        $this->app['auth']->forgetGuards();
        $response = $this->postJson('/api/v1/consent', []);
        $response->assertUnprocessable();
    }

    public function test_consent_store_accepts_valid_payload(): void
    {
        $this->app['auth']->forgetGuards();
        $response = $this->postJson('/api/v1/consent', [
            'analytics' => true,
            'marketing' => false,
            'functional' => true,
            'version' => '1.0',
        ]);
        $response->assertOk();
    }

    // ---- UserAccountController ----

    public function test_user_export_returns_202(): void
    {
        $response = $this->getJson('/api/v1/user/export');
        $response->assertStatus(202);
    }

    public function test_user_delete_requires_confirm(): void
    {
        $response = $this->deleteJson('/api/v1/user', []);
        $response->assertUnprocessable();
    }

    public function test_user_delete_accepts_confirm_payload(): void
    {
        $response = $this->deleteJson('/api/v1/user', [
            'confirm' => true,
            'reason' => 'no longer need',
        ]);
        $response->assertOk();
    }

    // ---- RestaurantController ----

    public function test_nearby_restaurants_requires_lat_lng_or_activity_id(): void
    {
        $response = $this->getJson('/api/v1/restaurants/nearby');
        $response->assertUnprocessable();
    }

    public function test_nearby_restaurants_validates_radius_max(): void
    {
        $response = $this->getJson('/api/v1/restaurants/nearby?lat=48.85&lng=2.35&radius=999999');
        $response->assertUnprocessable();
    }

    public function test_nearby_restaurants_accepts_lat_lng(): void
    {
        Http::fake([
            '*/v1/security/oauth2/token' => Http::response(['access_token' => 'fake', 'expires_in' => 1799], 200),
            '*amadeus*pois*' => Http::response(['data' => []], 200),
            '*' => Http::response(['data' => []], 200),
        ]);

        $response = $this->getJson('/api/v1/restaurants/nearby?lat=48.85&lng=2.35&radius=800&limit=5');
        $this->assertContains($response->status(), [200, 503]);
    }

    // ---- AiController stubs ----

    public function test_ai_plan_requires_prompt(): void
    {
        $response = $this->postJson('/api/v1/ai/plan', []);
        $response->assertUnprocessable();
    }

    public function test_ai_plan_returns_stub_with_valid_prompt(): void
    {
        $response = $this->postJson('/api/v1/ai/plan', [
            'prompt' => 'Plan me a trip to Tokyo for 5 days',
        ]);
        $response->assertStatus(202);
        $response->assertJsonPath('data.type', 'ai_job');
    }

    public function test_ai_qa_requires_question(): void
    {
        $response = $this->postJson('/api/v1/ai/qa', []);
        $response->assertUnprocessable();
    }

    public function test_ai_qa_returns_stub_with_question(): void
    {
        $response = $this->postJson('/api/v1/ai/qa', [
            'question' => 'What is the best time to visit Tokyo?',
        ]);
        $response->assertOk();
        $response->assertJsonPath('data.type', 'ai_qa');
    }

    public function test_ai_job_status_returns_stub(): void
    {
        $response = $this->getJson('/api/v1/ai/jobs/job_xyz');
        $response->assertOk();
        $response->assertJsonPath('data.attributes.status', 'pending');
    }

    // ---- Auth-guarded routes deny anonymous ----

    public function test_profile_requires_auth(): void
    {
        $this->app['auth']->forgetGuards();
        $response = $this->withHeader('Authorization', 'Bearer bad')
            ->getJson('/api/v1/profile');
        $response->assertUnauthorized();
    }

    public function test_trips_index_requires_auth(): void
    {
        $this->app['auth']->forgetGuards();
        $response = $this->withHeader('Authorization', 'Bearer bad')
            ->getJson('/api/v1/trips');
        $response->assertUnauthorized();
    }
}
