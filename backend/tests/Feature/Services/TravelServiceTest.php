<?php

namespace Tests\Feature\Services;

use App\Models\Hebergement;
use App\Models\LocalTransport;
use App\Models\Transport;
use App\Models\User;
use App\Models\Voyage;
use App\Services\Contracts\TravelServiceInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TravelServiceTest extends TestCase
{
    use RefreshDatabase;

    private TravelServiceInterface $service;
    private User $user;
    private Voyage $voyage;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        $this->user = User::factory()->create();
        Auth::login($this->user);
        $this->service = $this->app->make(TravelServiceInterface::class);
        $this->voyage = Voyage::factory()->create(['user_id' => $this->user->id]);
    }

    public function test_list_flights_returns_serialized_transports(): void
    {
        Transport::factory()->create([
            'voyage_id' => $this->voyage->id,
            'type' => 'Air France',
        ]);

        $result = $this->service->listFlights((string) $this->voyage->id);

        $this->assertCount(1, $result['items']);
        $this->assertSame('Air France', $result['items'][0]['type']);
    }

    public function test_list_hotels_returns_serialized_hebergements(): void
    {
        Hebergement::factory()->create([
            'voyage_id' => $this->voyage->id,
            'nom' => 'Hilton Paris',
        ]);

        $result = $this->service->listHotels((string) $this->voyage->id);

        $this->assertCount(1, $result['items']);
        $this->assertSame('Hilton Paris', $result['items'][0]['nom']);
    }

    public function test_create_local_transport_persists_row(): void
    {
        $result = $this->service->createLocalTransport((string) $this->voyage->id, [
            'type' => 'metro',
            'from' => 'Châtelet',
            'to' => 'République',
            'price' => 1.90,
            'currency' => 'EUR',
        ]);

        $this->assertSame('local_transport', $result['type']);
        $this->assertDatabaseHas('local_transports', [
            'voyage_id' => $this->voyage->id,
            'type' => 'metro',
            'from_label' => 'Châtelet',
            'to_label' => 'République',
        ]);
    }

    public function test_list_local_transports_orders_by_departure(): void
    {
        LocalTransport::factory()->create([
            'voyage_id' => $this->voyage->id,
            'from_label' => 'Second',
            'departure_at' => '2026-09-02 10:00:00',
        ]);
        LocalTransport::factory()->create([
            'voyage_id' => $this->voyage->id,
            'from_label' => 'First',
            'departure_at' => '2026-09-01 10:00:00',
        ]);

        $result = $this->service->listLocalTransports((string) $this->voyage->id);

        $this->assertSame('First', $result['items'][0]['attributes']['from']);
        $this->assertSame('Second', $result['items'][1]['attributes']['from']);
    }

    public function test_update_local_transport_changes_fields(): void
    {
        $lt = LocalTransport::factory()->create([
            'voyage_id' => $this->voyage->id,
            'type' => 'bus',
        ]);

        $this->service->updateLocalTransport(
            (string) $this->voyage->id,
            (string) $lt->id,
            ['type' => 'metro', 'notes' => 'changed']
        );

        $this->assertDatabaseHas('local_transports', [
            'id' => $lt->id,
            'type' => 'metro',
            'notes' => 'changed',
        ]);
    }

    public function test_delete_local_transport_removes_row(): void
    {
        $lt = LocalTransport::factory()->create(['voyage_id' => $this->voyage->id]);

        $this->service->deleteLocalTransport((string) $this->voyage->id, (string) $lt->id);

        $this->assertDatabaseMissing('local_transports', ['id' => $lt->id]);
    }

    public function test_list_flights_throws_for_other_user_trip(): void
    {
        $other = User::factory()->create();
        $otherVoyage = Voyage::factory()->create(['user_id' => $other->id]);

        $this->expectException(ModelNotFoundException::class);
        $this->service->listFlights((string) $otherVoyage->id);
    }
}
