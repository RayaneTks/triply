<?php

namespace Tests\Feature\Http;

use App\Models\ShareLink;
use App\Models\User;
use App\Models\Voyage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TripSharingControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Voyage $voyage;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        $this->user = User::factory()->create();
        $this->voyage = Voyage::factory()->create(['user_id' => $this->user->id]);
        Sanctum::actingAs($this->user);
    }

    public function test_create_share_link_returns_201(): void
    {
        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/share", [
            'expires_at' => Carbon::now()->addDays(7)->toIso8601String(),
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('share_links', ['voyage_id' => $this->voyage->id]);
    }

    public function test_create_share_link_validates_password_min_length(): void
    {
        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/share", [
            'password' => 'abc',
        ]);

        $response->assertUnprocessable();
    }

    public function test_create_share_link_other_user_returns_404(): void
    {
        $other = User::factory()->create();
        $otherVoyage = Voyage::factory()->create(['user_id' => $other->id]);

        $response = $this->postJson("/api/v1/trips/{$otherVoyage->id}/share", []);

        $response->assertNotFound();
    }

    public function test_show_public_recap_with_valid_token(): void
    {
        $share = ShareLink::factory()->create([
            'voyage_id' => $this->voyage->id,
            'expires_at' => Carbon::now()->addDays(7),
        ]);

        // Public endpoint, no auth
        $this->app['auth']->forgetGuards();

        $response = $this->getJson("/api/v1/share/{$share->token}");

        $response->assertOk();
    }

    public function test_show_public_recap_with_expired_token_returns_error(): void
    {
        $share = ShareLink::factory()->create([
            'voyage_id' => $this->voyage->id,
            'expires_at' => Carbon::now()->subDay(),
        ]);

        $response = $this->getJson("/api/v1/share/{$share->token}");

        $this->assertContains($response->status(), [404, 410, 500]);
    }

    public function test_show_public_recap_unknown_token_returns_error(): void
    {
        $response = $this->getJson('/api/v1/share/unknown-token-xyz');

        $this->assertContains($response->status(), [404, 410, 500]);
    }
}
