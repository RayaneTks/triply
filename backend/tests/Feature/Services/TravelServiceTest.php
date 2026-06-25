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

    public function test_create_flight_persists_transport(): void
    {
        $payload = [
            'type' => 'Air France',
            'depart_lieu' => 'Paris CDG',
            'arrivee_lieu' => 'Barcelone BCN',
            'depart_le' => '2026-09-01 08:00:00',
            'arrivee_le' => '2026-09-01 10:15:00',
            'prix' => 189,
            'devise' => 'EUR',
            'information_supplementaire' => 'AF1248 · direct',
        ];

        $result = $this->service->createFlight((string) $this->voyage->id, $payload);

        $this->assertSame('Air France', $result['type']);
        $this->assertSame('Paris CDG', $result['depart_lieu']);
        $this->assertDatabaseHas('transports', [
            'voyage_id' => $this->voyage->id,
            'type' => 'Air France',
            'depart_lieu' => 'Paris CDG',
            'arrivee_lieu' => 'Barcelone BCN',
            'prix' => 189,
            'devise' => 'EUR',
        ]);
    }

    public function test_update_flight_changes_fields(): void
    {
        $t = Transport::factory()->create([
            'voyage_id' => $this->voyage->id,
            'type' => 'EasyJet',
            'prix' => 99,
        ]);

        $this->service->updateFlight(
            (string) $this->voyage->id,
            (string) $t->id,
            ['type' => 'Vueling', 'prix' => 120]
        );

        $this->assertDatabaseHas('transports', [
            'id' => $t->id,
            'type' => 'Vueling',
            'prix' => 120,
        ]);
    }

    public function test_delete_flight_removes_row(): void
    {
        $t = Transport::factory()->create(['voyage_id' => $this->voyage->id]);

        $this->service->deleteFlight((string) $this->voyage->id, (string) $t->id);

        $this->assertDatabaseMissing('transports', ['id' => $t->id]);
    }

    public function test_update_flight_throws_for_other_user_trip(): void
    {
        $other = User::factory()->create();
        $otherVoyage = Voyage::factory()->create(['user_id' => $other->id]);
        $foreignTransport = Transport::factory()->create(['voyage_id' => $otherVoyage->id]);

        $this->expectException(ModelNotFoundException::class);
        $this->service->updateFlight(
            (string) $this->voyage->id,
            (string) $foreignTransport->id,
            ['type' => 'hacked'],
        );
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

    public function test_create_hotel_persists_hebergement(): void
    {
        $payload = [
            'type' => 'hotel',
            'nom' => 'Hôtel Arts Barcelone',
            'adresse' => 'Marina 19',
            'ville' => 'Barcelone',
            'arrivee_le' => '2026-09-01',
            'depart_le' => '2026-09-05',
            'prix' => 720,
            'devise' => 'EUR',
        ];

        $result = $this->service->createHotel((string) $this->voyage->id, $payload);

        $this->assertSame('Hôtel Arts Barcelone', $result['nom']);
        $this->assertSame('EUR', $result['devise']);
        $this->assertDatabaseHas('hebergements', [
            'voyage_id' => $this->voyage->id,
            'nom' => 'Hôtel Arts Barcelone',
            'ville' => 'Barcelone',
            'prix' => 720,
            'devise' => 'EUR',
        ]);
    }

    public function test_create_hotel_converts_non_eur_price_to_eur(): void
    {
        Http::fake([
            'https://api.frankfurter.app/latest?from=JPY&to=EUR' => Http::response([
                'amount' => 1,
                'base' => 'JPY',
                'date' => '2026-06-01',
                'rates' => ['EUR' => 0.0062],
            ], 200),
        ]);

        $result = $this->service->createHotel((string) $this->voyage->id, [
            'type' => 'hotel',
            'nom' => 'HILTON TOKYO',
            'adresse' => 'Shinjuku',
            'ville' => 'Tokyo',
            'arrivee_le' => '2026-06-26',
            'depart_le' => '2026-06-30',
            'prix' => 403258,
            'devise' => 'JPY',
        ]);

        $this->assertSame('EUR', $result['devise']);
        $this->assertSame(2500, $result['prix']);
        $this->assertDatabaseHas('hebergements', [
            'voyage_id' => $this->voyage->id,
            'nom' => 'HILTON TOKYO',
            'prix' => 2500,
            'devise' => 'EUR',
        ]);
    }

    public function test_list_hotels_migrates_legacy_non_eur_prices_to_eur(): void
    {
        Http::fake([
            'https://api.frankfurter.app/latest?from=JPY&to=EUR' => Http::response([
                'amount' => 1,
                'base' => 'JPY',
                'date' => '2026-06-01',
                'rates' => ['EUR' => 0.0062],
            ], 200),
        ]);

        Hebergement::factory()->create([
            'voyage_id' => $this->voyage->id,
            'nom' => 'HILTON TOKYO',
            'prix' => 403258,
            'devise' => 'JPY',
        ]);

        $result = $this->service->listHotels((string) $this->voyage->id);

        $this->assertSame('EUR', $result['items'][0]['devise']);
        $this->assertSame(2500, $result['items'][0]['prix']);
    }

    public function test_update_hotel_changes_fields(): void
    {
        $h = Hebergement::factory()->create([
            'voyage_id' => $this->voyage->id,
            'nom' => 'Old name',
            'prix' => 300,
        ]);

        $this->service->updateHotel(
            (string) $this->voyage->id,
            (string) $h->id,
            ['nom' => 'New name', 'prix' => 450]
        );

        $this->assertDatabaseHas('hebergements', [
            'id' => $h->id,
            'nom' => 'New name',
            'prix' => 450,
        ]);
    }

    public function test_delete_hotel_removes_row(): void
    {
        $h = Hebergement::factory()->create(['voyage_id' => $this->voyage->id]);

        $this->service->deleteHotel((string) $this->voyage->id, (string) $h->id);

        $this->assertDatabaseMissing('hebergements', ['id' => $h->id]);
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
