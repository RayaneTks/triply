<?php

namespace Tests\Feature;

use App\Models\ShareLink;
use App\Models\User;
use App\Models\Voyage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SharingPasswordTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Voyage $voyage;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        Http::fake([
            'api.frankfurter.app/*' => Http::response(['rates' => ['EUR' => 1.0]], 200),
            'test.api.amadeus.com/*' => Http::response([], 200),
            'api.amadeus.com/*' => Http::response([], 200),
        ]);

        $this->user = User::factory()->create();
        $this->voyage = Voyage::factory()->create(['user_id' => $this->user->id]);
    }

    public function test_creates_share_link_with_hashed_password(): void
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/share", [
            'password' => 'secret123',
        ]);

        $response->assertCreated();

        $link = ShareLink::query()->where('voyage_id', $this->voyage->id)->firstOrFail();
        $this->assertNotNull($link->password_hash);
        $this->assertNotSame('secret123', $link->password_hash);
        $this->assertTrue(Hash::check('secret123', $link->password_hash));
    }

    public function test_public_access_without_password_returns_401_when_password_set(): void
    {
        $link = ShareLink::factory()->create([
            'voyage_id' => $this->voyage->id,
            'expires_at' => Carbon::now()->addDays(7),
            'password_hash' => Hash::make('secret123'),
        ]);

        $this->app['auth']->forgetGuards();

        $response = $this->getJson("/api/v1/share/{$link->token}");

        $response->assertStatus(401);
        $response->assertJsonPath('error.code', 'SHARE_PASSWORD_REQUIRED');
    }

    public function test_public_access_with_wrong_password_returns_401(): void
    {
        $link = ShareLink::factory()->create([
            'voyage_id' => $this->voyage->id,
            'expires_at' => Carbon::now()->addDays(7),
            'password_hash' => Hash::make('secret123'),
        ]);

        $this->app['auth']->forgetGuards();

        $response = $this->getJson("/api/v1/share/{$link->token}?password=wrong");

        $response->assertStatus(401);
        $response->assertJsonPath('error.code', 'SHARE_PASSWORD_INVALID');
    }

    public function test_public_access_with_correct_password_returns_recap(): void
    {
        $link = ShareLink::factory()->create([
            'voyage_id' => $this->voyage->id,
            'expires_at' => Carbon::now()->addDays(7),
            'password_hash' => Hash::make('secret123'),
        ]);

        $this->app['auth']->forgetGuards();

        $response = $this->getJson("/api/v1/share/{$link->token}?password=secret123");

        $response->assertOk();
        $response->assertJsonPath('success', true);
    }

    public function test_public_access_without_password_still_works_when_no_password_set(): void
    {
        $link = ShareLink::factory()->create([
            'voyage_id' => $this->voyage->id,
            'expires_at' => Carbon::now()->addDays(7),
        ]);

        $this->app['auth']->forgetGuards();

        $response = $this->getJson("/api/v1/share/{$link->token}");

        $response->assertOk();
    }
}
