<?php

namespace Tests\Feature\Http;

use App\Models\Hebergement;
use App\Models\LocalTransport;
use App\Models\Transport;
use App\Models\User;
use App\Models\Voyage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TripTravelControllerTest extends TestCase
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

    // ---- Flights ----

    public function test_list_flights_returns_200_with_items(): void
    {
        Transport::factory()->create(['voyage_id' => $this->voyage->id, 'type' => 'Air France']);

        $response = $this->getJson("/api/v1/trips/{$this->voyage->id}/flights");

        $response->assertOk();
        $response->assertJsonPath('data.items.0.type', 'Air France');
    }

    public function test_list_flights_requires_auth(): void
    {
        Sanctum::actingAs($this->user, []);
        auth()->forgetUser();
        $this->app['auth']->forgetGuards();

        $response = $this->withHeader('Authorization', 'Bearer invalid')
            ->getJson("/api/v1/trips/{$this->voyage->id}/flights");

        $response->assertUnauthorized();
    }

    public function test_store_flight_persists_and_returns_201(): void
    {
        $payload = [
            'type' => 'Air France',
            'depart_lieu' => 'CDG',
            'arrivee_lieu' => 'BCN',
            'depart_le' => '2026-09-01T08:00:00Z',
            'arrivee_le' => '2026-09-01T10:00:00Z',
            'prix' => 189,
            'devise' => 'EUR',
        ];

        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/flights", $payload);

        $response->assertCreated();
        $response->assertJsonPath('data.type', 'Air France');
        $this->assertDatabaseHas('transports', [
            'voyage_id' => $this->voyage->id,
            'type' => 'Air France',
            'prix' => 189,
        ]);
    }

    public function test_store_flight_validates_required_fields(): void
    {
        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/flights", []);

        $response->assertUnprocessable();
        $response->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_store_flight_rejects_arrival_before_departure(): void
    {
        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/flights", [
            'type' => 'KL',
            'depart_lieu' => 'CDG',
            'arrivee_lieu' => 'BCN',
            'depart_le' => '2026-09-02T08:00:00Z',
            'arrivee_le' => '2026-09-01T08:00:00Z',
            'prix' => 100,
        ]);

        $response->assertUnprocessable();
    }

    public function test_update_flight_changes_fields(): void
    {
        $transport = Transport::factory()->create(['voyage_id' => $this->voyage->id, 'prix' => 99]);

        $response = $this->patchJson("/api/v1/trips/{$this->voyage->id}/flights/{$transport->id}", [
            'prix' => 150,
            'type' => 'Vueling',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('transports', ['id' => $transport->id, 'prix' => 150, 'type' => 'Vueling']);
    }

    public function test_delete_flight_removes_row(): void
    {
        $transport = Transport::factory()->create(['voyage_id' => $this->voyage->id]);

        $response = $this->deleteJson("/api/v1/trips/{$this->voyage->id}/flights/{$transport->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('transports', ['id' => $transport->id]);
    }

    public function test_update_flight_for_other_user_returns_404(): void
    {
        $other = User::factory()->create();
        $otherVoyage = Voyage::factory()->create(['user_id' => $other->id]);
        $transport = Transport::factory()->create(['voyage_id' => $otherVoyage->id]);

        $response = $this->patchJson("/api/v1/trips/{$otherVoyage->id}/flights/{$transport->id}", ['prix' => 1]);

        $response->assertNotFound();
    }

    // ---- Hotels ----

    public function test_store_hotel_persists_and_returns_201(): void
    {
        $payload = [
            'type' => 'hotel',
            'nom' => 'Hotel Arts',
            'adresse' => 'Marina 19',
            'ville' => 'Barcelone',
            'arrivee_le' => '2026-09-01',
            'depart_le' => '2026-09-05',
            'prix' => 720,
            'devise' => 'EUR',
        ];

        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/hotels", $payload);

        $response->assertCreated();
        $response->assertJsonPath('data.nom', 'Hotel Arts');
        $this->assertDatabaseHas('hebergements', [
            'voyage_id' => $this->voyage->id,
            'nom' => 'Hotel Arts',
            'prix' => 720,
        ]);
    }

    public function test_store_hotel_rejects_depart_before_arrival(): void
    {
        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/hotels", [
            'type' => 'hotel',
            'nom' => 'X',
            'adresse' => 'Y',
            'arrivee_le' => '2026-09-05',
            'depart_le' => '2026-09-01',
            'prix' => 100,
        ]);

        $response->assertUnprocessable();
    }

    public function test_update_hotel_changes_fields(): void
    {
        $hotel = Hebergement::factory()->create(['voyage_id' => $this->voyage->id, 'prix' => 300]);

        $response = $this->patchJson("/api/v1/trips/{$this->voyage->id}/hotels/{$hotel->id}", ['prix' => 450]);

        $response->assertOk();
        $this->assertDatabaseHas('hebergements', ['id' => $hotel->id, 'prix' => 450]);
    }

    public function test_delete_hotel_removes_row(): void
    {
        $hotel = Hebergement::factory()->create(['voyage_id' => $this->voyage->id]);

        $response = $this->deleteJson("/api/v1/trips/{$this->voyage->id}/hotels/{$hotel->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('hebergements', ['id' => $hotel->id]);
    }

    public function test_list_hotels_scoped_to_owner(): void
    {
        $other = User::factory()->create();
        $otherVoyage = Voyage::factory()->create(['user_id' => $other->id]);
        Hebergement::factory()->create(['voyage_id' => $otherVoyage->id]);

        $response = $this->getJson("/api/v1/trips/{$otherVoyage->id}/hotels");

        $response->assertNotFound();
    }

    // ---- Local transports ----

    public function test_store_local_transport_persists(): void
    {
        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/local-transports", [
            'type' => 'metro',
            'from' => 'Châtelet',
            'to' => 'République',
            'price' => 1.90,
            'currency' => 'EUR',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('local_transports', [
            'voyage_id' => $this->voyage->id,
            'type' => 'metro',
            'from_label' => 'Châtelet',
        ]);
    }

    public function test_delete_local_transport_removes_row(): void
    {
        $lt = LocalTransport::factory()->create(['voyage_id' => $this->voyage->id]);

        $response = $this->deleteJson("/api/v1/trips/{$this->voyage->id}/local-transports/{$lt->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('local_transports', ['id' => $lt->id]);
    }
}
