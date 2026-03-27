<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Voyage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TripPersistenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_trip_persists_budget_and_destination_from_plan_snapshot(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $payload = [
            'title' => 'Rome · 2026-04-10',
            'destination' => "Leonardo da Vinci Int'l",
            'start_date' => '2026-04-10',
            'end_date' => '2026-04-15',
            'travelers_count' => 2,
            'plan_snapshot' => [
                'days' => [],
                'flightSummary' => [
                    'carrier' => 'ITA Airways',
                    'price' => '129.90',
                    'currency' => 'EUR',
                ],
                'hotelSummary' => [
                    'name' => 'Hotel Roma Centro',
                    'cityCode' => 'ROM',
                    'cityName' => 'Rome',
                    'totalPrice' => '470.10',
                    'currency' => 'EUR',
                ],
                'destinationSummary' => [
                    'cityName' => 'Rome',
                    'airportName' => "Leonardo da Vinci Int'l",
                    'iataCode' => 'FCO',
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/trips', $payload);

        $response->assertCreated();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.destination', 'Rome');
        $response->assertJsonPath('data.budget_total', 600);
        $response->assertJsonPath('data.currency', 'EUR');
        $response->assertJsonPath('data.start_date', '2026-04-10');
        $response->assertJsonPath('data.end_date', '2026-04-15');

        $tripId = $response->json('data.id');

        $this->assertDatabaseHas('voyages', [
            'id' => (int) $tripId,
            'user_id' => $user->id,
            'destination' => 'Rome',
            'budget_total' => 600,
            'date_debut' => '2026-04-10',
            'date_fin' => '2026-04-15',
        ]);

        $this->assertDatabaseHas('transports', [
            'voyage_id' => (int) $tripId,
            'type' => 'ITA Airways',
            'arrivee_lieu' => 'Rome',
            'prix' => 130,
            'devise' => 'EUR',
        ]);

        $this->assertDatabaseHas('hebergements', [
            'voyage_id' => (int) $tripId,
            'nom' => 'Hotel Roma Centro',
            'ville' => 'Rome',
            'prix' => 470,
            'devise' => 'EUR',
        ]);

        $this->assertDatabaseHas('journees', [
            'voyage_id' => (int) $tripId,
            'numero_jour' => 1,
        ]);

        $storedTrip = Voyage::query()->findOrFail($tripId);
        $this->assertIsArray($storedTrip->plan_snapshot);
        $this->assertArrayHasKey('destinationSummary', $storedTrip->plan_snapshot);
        $this->assertArrayNotHasKey('flightSummary', $storedTrip->plan_snapshot);
        $this->assertArrayNotHasKey('hotelSummary', $storedTrip->plan_snapshot);
        $this->assertArrayNotHasKey('days', $storedTrip->plan_snapshot);
    }

    public function test_store_trip_normalizes_snapshot_days_into_journees_and_etapes(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $response = $this->postJson('/api/v1/trips', [
            'title' => 'Lisbonne planifiee',
            'destination' => 'LIS',
            'start_date' => '2026-07-10',
            'end_date' => '2026-07-12',
            'travelers_count' => 2,
            'plan_snapshot' => [
                'days' => [
                    [
                        'dayIndex' => 1,
                        'activities' => [
                            ['title' => 'Tour de Belem', 'durationHours' => 2],
                            ['title' => 'Tram 28', 'durationHours' => 1.5],
                        ],
                    ],
                    [
                        'dayIndex' => 2,
                        'activities' => [
                            ['title' => 'Alfama', 'durationHours' => 3],
                        ],
                    ],
                ],
                'flightSummary' => [
                    'carrier' => 'TAP',
                    'price' => '220',
                    'currency' => 'EUR',
                    'originIata' => 'CDG',
                    'destinationIata' => 'LIS',
                    'outboundAt' => '2026-07-10T08:30:00',
                    'returnAt' => '2026-07-12T20:10:00',
                ],
                'hotelSummary' => [
                    'name' => 'Hotel Lisboa',
                    'address' => 'Rua Augusta 1',
                    'cityName' => 'Lisbonne',
                    'totalPrice' => '390',
                    'currency' => 'EUR',
                    'checkInDate' => '2026-07-10',
                    'checkOutDate' => '2026-07-12',
                ],
                'destinationSummary' => [
                    'cityName' => 'Lisbonne',
                ],
            ],
        ]);

        $response->assertCreated();
        $tripId = (int) $response->json('data.id');

        $this->assertDatabaseHas('transports', [
            'voyage_id' => $tripId,
            'type' => 'TAP',
            'depart_lieu' => 'CDG',
            'arrivee_lieu' => 'LIS',
            'prix' => 220,
            'devise' => 'EUR',
        ]);

        $this->assertDatabaseHas('hebergements', [
            'voyage_id' => $tripId,
            'nom' => 'Hotel Lisboa',
            'adresse' => 'Rua Augusta 1',
            'ville' => 'Lisbonne',
            'prix' => 390,
        ]);

        $this->assertDatabaseHas('journees', [
            'voyage_id' => $tripId,
            'numero_jour' => 1,
            'date_jour' => '2026-07-10',
        ]);

        $this->assertDatabaseHas('journees', [
            'voyage_id' => $tripId,
            'numero_jour' => 2,
            'date_jour' => '2026-07-11',
        ]);

        $this->assertDatabaseHas('journees', [
            'voyage_id' => $tripId,
            'numero_jour' => 3,
            'date_jour' => '2026-07-12',
        ]);

        $this->assertDatabaseHas('etapes', [
            'titre' => 'Tour de Belem',
            'ordre' => 1,
            'temps_estime' => '2h',
        ]);

        $this->assertDatabaseHas('etapes', [
            'titre' => 'Tram 28',
            'ordre' => 2,
            'temps_estime' => '1.5h',
        ]);

        $this->assertDatabaseHas('etapes', [
            'titre' => 'Alfama',
            'ordre' => 1,
            'temps_estime' => '3h',
        ]);
    }

    public function test_update_trip_recomputes_budget_from_snapshot_when_max_budget_is_not_provided(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $voyage = Voyage::query()->create([
            'titre' => 'Voyage test',
            'destination' => 'FCO',
            'date_debut' => '2026-05-01',
            'date_fin' => '2026-05-05',
            'budget_total' => 0,
            'nb_voyageurs' => 1,
            'description' => null,
            'user_id' => $user->id,
            'plan_snapshot' => null,
        ]);

        $response = $this->patchJson('/api/v1/trips/'.$voyage->id, [
            'plan_snapshot' => [
                'days' => [],
                'flightSummary' => [
                    'price' => '150.25',
                    'currency' => 'EUR',
                ],
                'hotelSummary' => [
                    'cityName' => 'Rome',
                    'totalPrice' => '249.75',
                    'currency' => 'EUR',
                ],
                'destinationSummary' => [
                    'cityName' => 'Rome',
                ],
            ],
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.budget_total', 400);
        $response->assertJsonPath('data.destination', 'Rome');

        $this->assertDatabaseHas('voyages', [
            'id' => $voyage->id,
            'budget_total' => 400,
            'destination' => 'Rome',
        ]);
    }

    public function test_store_trip_converts_non_eur_prices_to_eur_for_persisted_budget(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        Http::fake([
            'https://api.frankfurter.app/latest?from=MAD&to=EUR' => Http::response([
                'amount' => 1,
                'base' => 'MAD',
                'date' => '2026-03-27',
                'rates' => [
                    'EUR' => 0.09,
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/trips', [
            'title' => 'Marrakech | Menara',
            'destination' => 'Marrakech',
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-07',
            'plan_snapshot' => [
                'days' => [],
                'flightSummary' => [
                    'carrier' => 'AT',
                    'price' => '100',
                    'currency' => 'EUR',
                ],
                'hotelSummary' => [
                    'cityName' => 'Marrakech',
                    'totalPrice' => '1100',
                    'currency' => 'MAD',
                ],
                'destinationSummary' => [
                    'cityName' => 'Marrakech',
                    'airportName' => 'Marrakech Menara',
                ],
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.currency', 'EUR');
        $response->assertJsonPath('data.budget_total', 199);

        $tripId = (int) $response->json('data.id');

        $this->assertDatabaseHas('voyages', [
            'id' => $tripId,
            'budget_total' => 199,
            'destination' => 'Marrakech',
        ]);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://api.frankfurter.app/latest?from=MAD&to=EUR';
        });
    }
}
