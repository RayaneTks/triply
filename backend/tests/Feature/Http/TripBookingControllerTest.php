<?php

namespace Tests\Feature\Http;

use App\Models\User;
use App\Models\Voyage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TripBookingControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Voyage $voyage;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        $this->user = User::factory()->create();
        $this->voyage = Voyage::factory()->create([
            'user_id' => $this->user->id,
            'destination' => 'Barcelone',
        ]);
        Sanctum::actingAs($this->user);
    }

    public function test_checkout_returns_booking_deeplink(): void
    {
        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/booking/checkout", [
            'provider' => 'booking',
            'kind' => 'hotel',
            'destination' => 'Barcelone',
            'check_in' => '2026-09-01',
            'check_out' => '2026-09-05',
            'adults' => 2,
        ]);

        $response->assertStatus(202);
        $response->assertJsonPath('data.attributes.provider', 'booking');
        $this->assertStringContainsString('booking.com', $response->json('data.attributes.deeplink'));
    }

    public function test_checkout_skyscanner_deeplink_for_flight(): void
    {
        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/booking/checkout", [
            'provider' => 'skyscanner',
            'kind' => 'flight',
            'origin' => 'CDG',
            'destination_code' => 'BCN',
            'check_in' => '2026-09-01',
            'adults' => 1,
        ]);

        $response->assertStatus(202);
        $this->assertStringContainsString('skyscanner.net', $response->json('data.attributes.deeplink'));
    }

    public function test_checkout_validates_provider_required(): void
    {
        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/booking/checkout", []);

        $response->assertUnprocessable();
    }

    public function test_checkout_validates_kind_enum(): void
    {
        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/booking/checkout", [
            'provider' => 'booking',
            'kind' => 'invalid_kind',
        ]);

        $response->assertUnprocessable();
    }

    public function test_checkout_clamps_adults(): void
    {
        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/booking/checkout", [
            'provider' => 'booking',
            'adults' => 99,
        ]);

        $response->assertUnprocessable();
    }

    public function test_checkout_other_user_trip_returns_404(): void
    {
        $other = User::factory()->create();
        $otherVoyage = Voyage::factory()->create(['user_id' => $other->id]);

        $response = $this->postJson("/api/v1/trips/{$otherVoyage->id}/booking/checkout", [
            'provider' => 'booking',
        ]);

        $response->assertNotFound();
    }
}
