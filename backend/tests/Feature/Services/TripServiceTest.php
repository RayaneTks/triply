<?php

namespace Tests\Feature\Services;

use App\Models\Etape;
use App\Models\Hebergement;
use App\Models\Journee;
use App\Models\Transport;
use App\Models\User;
use App\Models\Voyage;
use App\Services\Contracts\TripServiceInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Characterization tests for TripService.
 *
 * Locks current behavior before the planned extraction (SnapshotSyncService,
 * TripRecapService, RouteService). Tests assert observable behavior — DB state
 * and return shapes — not implementation details.
 */
class TripServiceTest extends TestCase
{
    use RefreshDatabase;

    private TripServiceInterface $service;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        Http::fake([
            'api.frankfurter.app/*' => Http::response([
                'amount' => 1,
                'base' => 'USD',
                'rates' => ['EUR' => 0.9],
            ], 200),
            '*/v1/reference-data/locations*' => Http::response([
                'data' => [],
            ], 200),
        ]);

        $this->user = User::factory()->create();
        Auth::login($this->user);
        $this->service = $this->app->make(TripServiceInterface::class);
    }

    // ------------------------------------------------------------------
    // CRUD
    // ------------------------------------------------------------------

    public function test_create_trip_persists_basic_fields(): void
    {
        $result = $this->service->createTrip([
            'title' => 'Voyage Lisbonne',
            'destination' => 'Lisbonne',
            'start_date' => '2026-06-01',
            'end_date' => '2026-06-05',
            'travelers_count' => 2,
        ]);

        $this->assertSame('Voyage Lisbonne', $result['title']);
        $this->assertSame('Lisbonne', $result['destination']);
        $this->assertSame(2, $result['travelers_count']);
        $this->assertDatabaseHas('voyages', [
            'titre' => 'Voyage Lisbonne',
            'user_id' => $this->user->id,
        ]);
    }

    public function test_create_trip_extracts_budget_and_destination_from_snapshot(): void
    {
        $result = $this->service->createTrip([
            'title' => 'Rome 2026',
            'destination' => 'FCO Airport',
            'start_date' => '2026-04-10',
            'end_date' => '2026-04-15',
            'plan_snapshot' => [
                'flightSummary' => ['carrier' => 'ITA', 'price' => '120', 'currency' => 'EUR'],
                'hotelSummary' => ['name' => 'Hotel Centro', 'totalPrice' => '480', 'currency' => 'EUR'],
                'destinationSummary' => ['cityName' => 'Rome'],
            ],
        ]);

        $this->assertSame('Rome', $result['destination']);
        $this->assertSame(600, $result['budget_total']);
        $this->assertDatabaseHas('transports', ['type' => 'ITA', 'voyage_id' => $result['id']]);
        $this->assertDatabaseHas('hebergements', ['nom' => 'Hotel Centro', 'voyage_id' => $result['id']]);
    }

    public function test_create_trip_without_auth_throws_exception(): void
    {
        Auth::logout();
        $this->expectException(ModelNotFoundException::class);
        $this->service->createTrip([
            'title' => 'X',
            'destination' => 'Y',
            'start_date' => '2026-01-01',
            'end_date' => '2026-01-02',
        ]);
    }

    public function test_list_trips_filters_by_authenticated_user(): void
    {
        $other = User::factory()->create();
        Voyage::factory()->create(['user_id' => $this->user->id, 'titre' => 'Mine']);
        Voyage::factory()->create(['user_id' => $other->id, 'titre' => 'Other']);

        $result = $this->service->listTrips();

        $this->assertCount(1, $result['items']);
        $this->assertSame('Mine', $result['items'][0]['title']);
    }

    public function test_show_trip_returns_serialized_trip(): void
    {
        $voyage = Voyage::factory()->create([
            'user_id' => $this->user->id,
            'titre' => 'Test trip',
            'destination' => 'Berlin',
        ]);

        $result = $this->service->showTrip((string) $voyage->id);

        $this->assertSame('Test trip', $result['title']);
        $this->assertSame('Berlin', $result['destination']);
        $this->assertArrayHasKey('flight', $result);
        $this->assertArrayHasKey('plan_snapshot', $result);
    }

    public function test_show_trip_throws_for_non_owned_trip(): void
    {
        $other = User::factory()->create();
        $voyage = Voyage::factory()->create(['user_id' => $other->id]);

        $this->expectException(ModelNotFoundException::class);
        $this->service->showTrip((string) $voyage->id);
    }

    public function test_update_trip_only_changes_provided_fields(): void
    {
        $voyage = Voyage::factory()->create([
            'user_id' => $this->user->id,
            'titre' => 'Original',
            'destination' => 'Original City',
            'nb_voyageurs' => 1,
        ]);

        $result = $this->service->updateTrip((string) $voyage->id, [
            'title' => 'Updated',
            'travelers_count' => 4,
        ]);

        $this->assertSame('Updated', $result['title']);
        $this->assertSame('Original City', $result['destination']);
        $this->assertSame(4, $result['travelers_count']);
    }

    public function test_duplicate_trip_creates_copy_with_suffix(): void
    {
        $voyage = Voyage::factory()->create([
            'user_id' => $this->user->id,
            'titre' => 'Voyage A',
        ]);
        Journee::factory()->forVoyage($voyage, 1)->create();

        $result = $this->service->duplicateTrip((string) $voyage->id);

        $this->assertSame('Voyage A (copie)', $result['title']);
        $this->assertNotSame((string) $voyage->id, $result['id']);
        $this->assertDatabaseCount('voyages', 2);
        $this->assertDatabaseHas('journees', ['voyage_id' => (int) $result['id']]);
    }

    public function test_delete_trip_cascades_to_relations(): void
    {
        $voyage = Voyage::factory()->create(['user_id' => $this->user->id]);
        $journee = Journee::factory()->forVoyage($voyage, 1)->create();
        $etape = Etape::factory()->create(['journee_id' => $journee->id]);
        Hebergement::factory()->create(['voyage_id' => $voyage->id]);
        Transport::factory()->create(['voyage_id' => $voyage->id]);

        $this->service->deleteTrip((string) $voyage->id);

        $this->assertDatabaseMissing('voyages', ['id' => $voyage->id]);
        // Etape uses SoftDeletes but FK cascadeOnDelete on journee_id hard-removes
        // etape rows once their parent journee is deleted — characterization of
        // current behavior.
        $this->assertDatabaseMissing('etapes', ['id' => $etape->id]);
    }

    public function test_delete_trip_city_soft_deletes_matching_etapes(): void
    {
        $voyage = Voyage::factory()->create(['user_id' => $this->user->id]);
        $journee = Journee::factory()->forVoyage($voyage, 1)->create();
        $rome = Etape::factory()->create(['journee_id' => $journee->id, 'ville' => 'Rome']);
        $paris = Etape::factory()->create(['journee_id' => $journee->id, 'ville' => 'Paris']);

        $result = $this->service->deleteTripCity((string) $voyage->id, 'rome');

        $this->assertSame(1, $result['deleted_count']);
        $this->assertSoftDeleted('etapes', ['id' => $rome->id]);
        $this->assertDatabaseHas('etapes', ['id' => $paris->id, 'deleted_at' => null]);
    }

    // ------------------------------------------------------------------
    // Days
    // ------------------------------------------------------------------

    public function test_list_days_returns_ordered_by_numero_jour(): void
    {
        $voyage = Voyage::factory()->create(['user_id' => $this->user->id]);
        Journee::factory()->forVoyage($voyage, 3)->create();
        Journee::factory()->forVoyage($voyage, 1)->create();
        Journee::factory()->forVoyage($voyage, 2)->create();

        $result = $this->service->listDays((string) $voyage->id);

        $this->assertCount(3, $result['items']);
        $this->assertSame([1, 2, 3], array_column($result['items'], 'index'));
    }

    public function test_update_day_changes_date_and_index(): void
    {
        $voyage = Voyage::factory()->create(['user_id' => $this->user->id]);
        $day = Journee::factory()->forVoyage($voyage, 1)->create();

        $result = $this->service->updateDay(
            (string) $voyage->id,
            (string) $day->id,
            ['date' => '2026-07-15', 'index' => 5]
        );

        $this->assertSame(5, $result['index']);
        $this->assertDatabaseHas('journees', [
            'id' => $day->id,
            'numero_jour' => 5,
            'date_jour' => '2026-07-15',
        ]);
    }

    public function test_update_day_for_other_user_trip_throws(): void
    {
        $other = User::factory()->create();
        $voyage = Voyage::factory()->create(['user_id' => $other->id]);
        $day = Journee::factory()->forVoyage($voyage, 1)->create();

        $this->expectException(ModelNotFoundException::class);
        $this->service->updateDay((string) $voyage->id, (string) $day->id, ['index' => 2]);
    }

    // ------------------------------------------------------------------
    // Recap
    // ------------------------------------------------------------------

    public function test_recap_returns_flight_hotel_and_day_sections(): void
    {
        $voyage = Voyage::factory()->create(['user_id' => $this->user->id]);
        Transport::factory()->create([
            'voyage_id' => $voyage->id,
            'type' => 'flight Air France',
            'depart_le' => '2026-06-01 10:00:00',
        ]);
        Hebergement::factory()->create(['voyage_id' => $voyage->id, 'nom' => 'Hotel X']);
        Journee::factory()->forVoyage($voyage, 1)->create();

        $result = $this->service->recap((string) $voyage->id);

        $types = array_column($result['sections'], 'type');
        $this->assertContains('flight', $types);
        $this->assertContains('hotel', $types);
        $this->assertContains('day', $types);
    }

    public function test_recap_builds_polyline_from_etape_coordinates(): void
    {
        $voyage = Voyage::factory()->create(['user_id' => $this->user->id]);
        $journee = Journee::factory()->forVoyage($voyage, 1)->create();
        Etape::factory()->create([
            'journee_id' => $journee->id,
            'ordre' => 1,
            'description' => json_encode(['lat' => 48.85, 'lng' => 2.35]),
        ]);
        Etape::factory()->create([
            'journee_id' => $journee->id,
            'ordre' => 2,
            'description' => json_encode(['lat' => 48.86, 'lng' => 2.36]),
        ]);

        $result = $this->service->recap((string) $voyage->id);

        $day = collect($result['sections'])->firstWhere('type', 'day');
        $this->assertCount(2, $day['route_polyline']);
        $this->assertEqualsWithDelta(48.85, $day['route_polyline'][0]['lat'], 0.001);
    }

    public function test_recap_includes_serialized_trip_metadata(): void
    {
        $voyage = Voyage::factory()->create([
            'user_id' => $this->user->id,
            'titre' => 'Recap Test',
        ]);

        $result = $this->service->recap((string) $voyage->id);

        $this->assertSame((string) $voyage->id, $result['id']);
        $this->assertSame('Recap Test', $result['trip']['title']);
    }

    public function test_recap_with_non_flight_transport_does_not_include_flight_section(): void
    {
        $voyage = Voyage::factory()->create(['user_id' => $this->user->id]);
        Transport::factory()->create([
            'voyage_id' => $voyage->id,
            'type' => 'train',
        ]);

        $result = $this->service->recap((string) $voyage->id);

        $flightSections = array_filter($result['sections'], fn ($s) => $s['type'] === 'flight');
        $this->assertEmpty($flightSections);
    }

    // ------------------------------------------------------------------
    // Routes
    // ------------------------------------------------------------------

    public function test_list_routes_returns_segments_between_consecutive_etapes(): void
    {
        $voyage = Voyage::factory()->create(['user_id' => $this->user->id]);
        $journee = Journee::factory()->forVoyage($voyage, 1)->create();
        Etape::factory()->create([
            'journee_id' => $journee->id,
            'ordre' => 1,
            'description' => json_encode(['lat' => 48.85, 'lng' => 2.35]),
        ]);
        Etape::factory()->create([
            'journee_id' => $journee->id,
            'ordre' => 2,
            'description' => json_encode(['lat' => 48.86, 'lng' => 2.36]),
        ]);
        Etape::factory()->create([
            'journee_id' => $journee->id,
            'ordre' => 3,
            'description' => json_encode(['lat' => 48.87, 'lng' => 2.37]),
        ]);

        $result = $this->service->listRoutes((string) $voyage->id);

        $this->assertCount(2, $result);
        $this->assertArrayHasKey('distance_km', $result[0]);
        $this->assertArrayHasKey('estimated_minutes', $result[0]);
    }

    public function test_list_routes_uses_walking_profile_for_short_distances(): void
    {
        $voyage = Voyage::factory()->create(['user_id' => $this->user->id]);
        $journee = Journee::factory()->forVoyage($voyage, 1)->create();
        // ~111m apart (walking)
        Etape::factory()->create([
            'journee_id' => $journee->id,
            'ordre' => 1,
            'description' => json_encode(['lat' => 48.85, 'lng' => 2.35]),
        ]);
        Etape::factory()->create([
            'journee_id' => $journee->id,
            'ordre' => 2,
            'description' => json_encode(['lat' => 48.851, 'lng' => 2.35]),
        ]);

        $result = $this->service->listRoutes((string) $voyage->id);

        $this->assertSame('walking', $result[0]['profile']);
    }

    public function test_list_routes_uses_driving_profile_for_long_distances(): void
    {
        $voyage = Voyage::factory()->create(['user_id' => $this->user->id]);
        $journee = Journee::factory()->forVoyage($voyage, 1)->create();
        // Paris → Lyon ~390km
        Etape::factory()->create([
            'journee_id' => $journee->id,
            'ordre' => 1,
            'description' => json_encode(['lat' => 48.85, 'lng' => 2.35]),
        ]);
        Etape::factory()->create([
            'journee_id' => $journee->id,
            'ordre' => 2,
            'description' => json_encode(['lat' => 45.75, 'lng' => 4.85]),
        ]);

        $result = $this->service->listRoutes((string) $voyage->id);

        $this->assertSame('driving', $result[0]['profile']);
        $this->assertGreaterThan(2.0, $result[0]['distance_km']);
    }

    // ------------------------------------------------------------------
    // Snapshot sync
    // ------------------------------------------------------------------

    public function test_snapshot_sync_creates_transport_from_flight_summary(): void
    {
        $result = $this->service->createTrip([
            'title' => 'X',
            'destination' => 'Y',
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-03',
            'plan_snapshot' => [
                'flightSummary' => [
                    'carrier' => 'KLM',
                    'price' => '350',
                    'currency' => 'EUR',
                ],
            ],
        ]);

        $this->assertDatabaseHas('transports', [
            'voyage_id' => $result['id'],
            'type' => 'KLM',
            'devise' => 'EUR',
        ]);
    }

    public function test_snapshot_sync_creates_hebergement_from_hotel_summary(): void
    {
        $result = $this->service->createTrip([
            'title' => 'X',
            'destination' => 'Y',
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-03',
            'plan_snapshot' => [
                'hotelSummary' => [
                    'name' => 'Hilton Paris',
                    'cityName' => 'Paris',
                    'totalPrice' => '300',
                    'currency' => 'EUR',
                ],
            ],
        ]);

        $this->assertDatabaseHas('hebergements', [
            'voyage_id' => $result['id'],
            'nom' => 'Hilton Paris',
            'ville' => 'Paris',
        ]);
    }

    public function test_snapshot_sync_creates_journees_and_etapes_from_days(): void
    {
        $result = $this->service->createTrip([
            'title' => 'X',
            'destination' => 'Y',
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-02',
            'plan_snapshot' => [
                'days' => [
                    [
                        'dayIndex' => 1,
                        'activities' => [
                            ['title' => 'Eiffel Tower', 'city' => 'Paris', 'durationHours' => 2.0],
                        ],
                    ],
                ],
            ],
        ]);

        $this->assertDatabaseHas('journees', [
            'voyage_id' => $result['id'],
            'numero_jour' => 1,
        ]);
        $this->assertDatabaseHas('etapes', [
            'titre' => 'Eiffel Tower',
            'ville' => 'Paris',
        ]);
    }

    public function test_update_trip_resync_clears_old_structured_data(): void
    {
        $result = $this->service->createTrip([
            'title' => 'X',
            'destination' => 'Y',
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-03',
            'plan_snapshot' => [
                'flightSummary' => ['carrier' => 'Air France', 'price' => '200', 'currency' => 'EUR'],
            ],
        ]);

        $this->service->updateTrip((string) $result['id'], [
            'plan_snapshot' => [
                'flightSummary' => ['carrier' => 'KLM', 'price' => '250', 'currency' => 'EUR'],
            ],
        ]);

        $this->assertDatabaseMissing('transports', ['voyage_id' => $result['id'], 'type' => 'Air France']);
        $this->assertDatabaseHas('transports', ['voyage_id' => $result['id'], 'type' => 'KLM']);
    }
}
