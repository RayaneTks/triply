<?php

namespace Tests\Feature\Services;

use App\Models\ShareLink;
use App\Models\User;
use App\Models\Voyage;
use App\Services\Contracts\SharingServiceInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SharingServiceTest extends TestCase
{
    use RefreshDatabase;

    private SharingServiceInterface $service;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        Http::fake([
            'api.frankfurter.app/*' => Http::response(['rates' => ['EUR' => 1]], 200),
            '*/v1/reference-data/locations*' => Http::response(['data' => []], 200),
        ]);

        $this->user = User::factory()->create();
        Auth::login($this->user);
        $this->service = $this->app->make(SharingServiceInterface::class);
    }

    public function test_create_share_link_persists_token_with_expiry(): void
    {
        $voyage = Voyage::factory()->create(['user_id' => $this->user->id]);

        $result = $this->service->createShareLink((string) $voyage->id, ['ttl_days' => 14]);

        $this->assertArrayHasKey('token', $result);
        $this->assertNotEmpty($result['token']);
        $this->assertDatabaseHas('share_links', [
            'voyage_id' => $voyage->id,
            'token' => $result['token'],
        ]);
    }

    public function test_create_share_link_defaults_ttl_to_30_days(): void
    {
        $voyage = Voyage::factory()->create(['user_id' => $this->user->id]);

        $result = $this->service->createShareLink((string) $voyage->id, []);

        $expiresAt = \Carbon\Carbon::parse($result['expires_at']);
        $this->assertEqualsWithDelta(30, now()->diffInDays($expiresAt), 1);
    }

    public function test_create_share_link_clamps_ttl_to_valid_range(): void
    {
        $voyage = Voyage::factory()->create(['user_id' => $this->user->id]);

        $result = $this->service->createShareLink((string) $voyage->id, ['ttl_days' => 999]);

        $expiresAt = \Carbon\Carbon::parse($result['expires_at']);
        $this->assertEqualsWithDelta(365, now()->diffInDays($expiresAt), 1);
    }

    public function test_public_recap_returns_recap_for_valid_token(): void
    {
        $voyage = Voyage::factory()->create(['user_id' => $this->user->id]);
        $link = ShareLink::factory()->create(['voyage_id' => $voyage->id]);
        Auth::logout();

        $result = $this->service->publicRecap($link->token);

        $this->assertArrayHasKey('trip', $result);
        $this->assertSame((string) $voyage->id, $result['id']);
    }

    public function test_public_recap_throws_for_expired_token(): void
    {
        $voyage = Voyage::factory()->create(['user_id' => $this->user->id]);
        $link = ShareLink::factory()->expired()->create(['voyage_id' => $voyage->id]);
        Auth::logout();

        $this->expectException(ModelNotFoundException::class);
        $this->service->publicRecap($link->token);
    }

    public function test_public_recap_throws_for_unknown_token(): void
    {
        Auth::logout();
        $this->expectException(ModelNotFoundException::class);
        $this->service->publicRecap('nonexistent_token_xyz');
    }

    public function test_public_recap_scrubs_booking_urls(): void
    {
        $voyage = Voyage::factory()->withSnapshot([
            'flightSummary' => ['bookingUrl' => 'https://private.booking/abc', 'carrier' => 'X'],
            'hotelSummary' => ['bookingUrl' => 'https://private.hotel/xyz', 'name' => 'Y'],
        ])->create(['user_id' => $this->user->id]);
        $link = ShareLink::factory()->create(['voyage_id' => $voyage->id]);
        Auth::logout();

        $result = $this->service->publicRecap($link->token);

        $snapshot = $result['trip']['plan_snapshot'];
        $this->assertArrayNotHasKey('bookingUrl', $snapshot['flightSummary'] ?? []);
        $this->assertArrayNotHasKey('bookingUrl', $snapshot['hotelSummary'] ?? []);
    }
}
