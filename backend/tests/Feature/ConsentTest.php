<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ConsentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
    }

    public function test_authenticated_user_consent_persists(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/consent', [
            'analytics' => true,
            'marketing' => false,
            'functional' => true,
            'version' => '2.0',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.attributes.analytics', true);
        $response->assertJsonPath('data.attributes.version', '2.0');

        $this->assertDatabaseHas('consents', [
            'user_id' => $user->id,
            'analytics' => true,
            'marketing' => false,
            'functional' => true,
            'version' => '2.0',
        ]);
    }

    public function test_authenticated_user_consent_is_read_back(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/consent', [
            'analytics' => true,
            'marketing' => true,
            'functional' => true,
            'version' => '1.5',
        ])->assertOk();

        $response = $this->getJson('/api/v1/consent');

        $response->assertOk();
        $response->assertJsonPath('data.attributes.analytics', true);
        $response->assertJsonPath('data.attributes.marketing', true);
        $response->assertJsonPath('data.attributes.version', '1.5');
    }

    public function test_consent_update_overwrites_previous_choice(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/consent', [
            'analytics' => true,
            'marketing' => true,
            'functional' => true,
            'version' => '1.0',
        ])->assertOk();

        $this->postJson('/api/v1/consent', [
            'analytics' => false,
            'marketing' => false,
            'functional' => true,
            'version' => '1.0',
        ])->assertOk();

        $this->assertDatabaseCount('consents', 1);
        $this->assertDatabaseHas('consents', [
            'user_id' => $user->id,
            'analytics' => false,
            'marketing' => false,
        ]);
    }

    public function test_default_consent_returned_when_none_stored(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/consent');

        $response->assertOk();
        $response->assertJsonPath('data.attributes.analytics', false);
        $response->assertJsonPath('data.attributes.functional', true);
    }

    public function test_consent_validation_rejects_missing_fields(): void
    {
        $response = $this->postJson('/api/v1/consent', [
            'analytics' => true,
        ]);

        $response->assertUnprocessable();
    }
}
