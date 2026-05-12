<?php

namespace Tests\Feature\Services;

use App\Models\User;
use App\Models\Voyage;
use App\Services\Contracts\BookingServiceInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BookingServiceTest extends TestCase
{
    use RefreshDatabase;

    private BookingServiceInterface $service;
    private User $user;
    private Voyage $voyage;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        $this->user = User::factory()->create();
        Auth::login($this->user);
        $this->service = $this->app->make(BookingServiceInterface::class);
        $this->voyage = Voyage::factory()->create([
            'user_id' => $this->user->id,
            'destination' => 'Lisbon',
            'date_debut' => '2026-09-01',
            'date_fin' => '2026-09-05',
            'nb_voyageurs' => 2,
        ]);
    }

    public function test_checkout_returns_booking_deeplink_by_default(): void
    {
        $result = $this->service->checkout((string) $this->voyage->id, []);

        $this->assertSame('booking_checkout', $result['type']);
        $this->assertSame('booking', $result['attributes']['provider']);
        $this->assertStringContainsString('booking.com', $result['attributes']['deeplink']);
    }

    public function test_checkout_returns_skyscanner_deeplink_for_flight_provider(): void
    {
        $result = $this->service->checkout((string) $this->voyage->id, [
            'provider' => 'skyscanner',
            'kind' => 'flight',
            'origin' => 'CDG',
            'destination_code' => 'LIS',
        ]);

        $this->assertStringContainsString('skyscanner.net', $result['attributes']['deeplink']);
        $this->assertStringContainsString('cdg/lis', $result['attributes']['deeplink']);
    }

    public function test_checkout_uses_trip_destination_when_payload_omits_it(): void
    {
        $result = $this->service->checkout((string) $this->voyage->id, ['provider' => 'getyourguide']);

        $this->assertSame('Lisbon', $result['attributes']['destination']);
        $this->assertStringContainsString('getyourguide.com', $result['attributes']['deeplink']);
    }

    public function test_checkout_clamps_adults_to_valid_range(): void
    {
        $result = $this->service->checkout((string) $this->voyage->id, ['adults' => 50]);

        $this->assertSame(20, $result['attributes']['adults']);
    }

    public function test_checkout_throws_for_other_user_trip(): void
    {
        $other = User::factory()->create();
        $otherVoyage = Voyage::factory()->create(['user_id' => $other->id]);

        $this->expectException(ModelNotFoundException::class);
        $this->service->checkout((string) $otherVoyage->id, []);
    }
}
