<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Voyage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TripFreeTimeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Http::fake([
            'api.frankfurter.app/*' => Http::response(['rates' => ['EUR' => 1.0]], 200),
            'test.api.amadeus.com/v1/security/oauth2/token' => Http::response([
                'access_token' => 'amadeus-test',
                'expires_in' => 3600,
            ], 200),
            'api.amadeus.com/v1/security/oauth2/token' => Http::response([
                'access_token' => 'amadeus-test',
                'expires_in' => 3600,
            ], 200),
            '*amadeus.com/v1/reference-data/locations/pois*' => Http::response([
                'data' => [
                    [
                        'id' => 'poi-1',
                        'name' => 'Gelato Storico',
                        'category' => 'RESTAURANT',
                        'rank' => 1,
                        'geoCode' => ['latitude' => 41.8910, 'longitude' => 12.4910],
                    ],
                    [
                        'id' => 'poi-2',
                        'name' => 'Pantheon Square',
                        'category' => 'SIGHTS',
                        'rank' => 2,
                        'geoCode' => ['latitude' => 41.8986, 'longitude' => 12.4769],
                    ],
                    [
                        'id' => 'poi-3',
                        'name' => 'Far Away Suburb',
                        'category' => 'SIGHTS',
                        'rank' => 3,
                        // ~50km out — filtered by walking budget.
                        'geoCode' => ['latitude' => 42.4000, 'longitude' => 13.4000],
                    ],
                ],
            ], 200),
            '*amadeus.com/*' => Http::response([], 200),
        ]);
    }

    public function test_returns_free_time_and_suggestions_when_day_has_capacity_left(): void
    {
        $user = User::factory()->create();
        $voyage = Voyage::factory()->for($user, 'user')->create([
            'destination' => 'Rome',
            'plan_snapshot' => [
                'days' => [[
                    'dayIndex' => 1,
                    'activities' => [
                        ['title' => 'Colisée', 'lat' => 41.8902, 'lng' => 12.4924, 'durationHours' => 2.0],
                        ['title' => 'Forum Romain', 'lat' => 41.8925, 'lng' => 12.4853, 'durationHours' => 1.5],
                    ],
                ]],
                'maxActivityHoursPerDay' => 8,
            ],
        ]);

        $response = $this->actingAs($user)
            ->getJson("/api/v1/trips/{$voyage->id}/days/1/free-time");

        $response->assertOk()
            ->assertJsonPath('data.has_free_time', true)
            ->assertJsonPath('data.day', 1)
            ->assertJsonPath('data.used_minutes', 210)
            ->assertJsonPath('data.max_minutes', 480)
            ->assertJsonPath('data.free_minutes', 270);

        $suggestions = $response->json('data.suggestions');
        $this->assertIsArray($suggestions);
        $this->assertGreaterThan(0, count($suggestions));
        $this->assertLessThanOrEqual(6, count($suggestions));
        // Far-away POI must be filtered out by walking budget.
        $this->assertEmpty(array_filter($suggestions, fn ($p) => $p['name'] === 'Far Away Suburb'));
    }

    public function test_returns_no_suggestions_when_day_is_packed(): void
    {
        $user = User::factory()->create();
        $voyage = Voyage::factory()->for($user, 'user')->create([
            'destination' => 'Rome',
            'plan_snapshot' => [
                'days' => [[
                    'dayIndex' => 1,
                    'activities' => [
                        ['title' => 'A1', 'lat' => 41.89, 'lng' => 12.49, 'durationHours' => 4.0],
                        ['title' => 'A2', 'lat' => 41.89, 'lng' => 12.49, 'durationHours' => 4.0],
                    ],
                ]],
                'maxActivityHoursPerDay' => 8,
            ],
        ]);

        $response = $this->actingAs($user)
            ->getJson("/api/v1/trips/{$voyage->id}/days/1/free-time");

        $response->assertOk()
            ->assertJsonPath('data.has_free_time', false)
            ->assertJsonPath('data.free_minutes', 0);
        $this->assertSame([], $response->json('data.suggestions'));
    }

    public function test_rejects_invalid_day_number(): void
    {
        $user = User::factory()->create();
        $voyage = Voyage::factory()->for($user, 'user')->create();

        $this->actingAs($user)
            ->getJson("/api/v1/trips/{$voyage->id}/days/0/free-time")
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'INVALID_DAY');

        $this->actingAs($user)
            ->getJson("/api/v1/trips/{$voyage->id}/days/999/free-time")
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'INVALID_DAY');
    }

    public function test_blocks_other_users(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $voyage = Voyage::factory()->for($owner, 'user')->create([
            'plan_snapshot' => [
                'days' => [['dayIndex' => 1, 'activities' => [['title' => 'X', 'lat' => 1.0, 'lng' => 1.0]]]],
            ],
        ]);

        $this->actingAs($intruder)
            ->getJson("/api/v1/trips/{$voyage->id}/days/1/free-time")
            ->assertNotFound();
    }

    public function test_requires_authentication(): void
    {
        $owner = User::factory()->create();
        $voyage = Voyage::factory()->for($owner, 'user')->create([
            'plan_snapshot' => [
                'days' => [['dayIndex' => 1, 'activities' => [['title' => 'X', 'lat' => 1.0, 'lng' => 1.0]]]],
            ],
        ]);

        $this->getJson("/api/v1/trips/{$voyage->id}/days/1/free-time")
            ->assertUnauthorized();
    }
}
