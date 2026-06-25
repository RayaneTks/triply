<?php

namespace Tests\Feature;

use App\Models\Voyage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TripReplanTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Mock OpenAI + currency/geocode so the suite never touches the network.
        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [[
                    'message' => [
                        'content' => json_encode([
                            'reply' => 'Voyage replanifié.',
                            'summary' => "- Jour 1 compressé\n- Colisée préservé",
                            'replannedActivities' => [
                                ['title' => 'Colisée', 'lat' => 41.8902, 'lng' => 12.4924, 'durationHours' => 2.0, 'day' => 1, 'locked' => true],
                                ['title' => 'Forum Romain', 'lat' => 41.8925, 'lng' => 12.4853, 'durationHours' => 1.5, 'day' => 1],
                            ],
                            'affectedDays' => [1],
                        ]),
                    ],
                ]],
            ], 200),
            'api.frankfurter.app/*' => Http::response(['rates' => ['EUR' => 1.0]], 200),
            'test.api.amadeus.com/*' => Http::response([], 200),
            'api.amadeus.com/*' => Http::response([], 200),
        ]);
        config()->set('integrations.openai.api_key', 'sk-test');
        config()->set('integrations.openai.model', 'gpt-4o-mini');
        config()->set('integrations.openai.base_url', 'https://api.openai.com/v1');
    }

    public function test_replan_endpoint_returns_preview_for_authenticated_trip_owner(): void
    {
        $user = User::factory()->create();
        $voyage = Voyage::factory()->for($user, 'user')->create([
            'destination' => 'Rome',
            'plan_snapshot' => [
                'days' => [
                    [
                        'dayIndex' => 1,
                        'activities' => [
                            ['title' => 'Colisée', 'lat' => 41.8902, 'lng' => 12.4924, 'durationHours' => 2.0],
                            ['title' => 'Vatican', 'lat' => 41.9029, 'lng' => 12.4534, 'durationHours' => 3.0],
                        ],
                    ],
                ],
                'travelDays' => 3,
            ],
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/v1/trips/{$voyage->id}/replan", [
                'reason' => 'flight_delay',
                'details' => 'Vol retardé de 5h.',
                'locked_activity_ids' => [],
                'affected_days' => [1],
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.reason', 'flight_delay')
            ->assertJsonPath('data.trip_id', (string) $voyage->id)
            ->assertJsonStructure(['data' => ['reply', 'summary', 'replannedActivities', 'affectedDays', 'lockedCount']]);

        $this->assertSame([1], $response->json('data.affectedDays'));
        $this->assertNotEmpty($response->json('data.replannedActivities'));
    }

    public function test_replan_endpoint_rejects_empty_trip(): void
    {
        $user = User::factory()->create();
        $voyage = Voyage::factory()->for($user, 'user')->create([
            'destination' => 'Rome',
            'plan_snapshot' => ['days' => []],
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/v1/trips/{$voyage->id}/replan", [
                'reason' => 'weather',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('error.code', 'REPLAN_EMPTY_TRIP');
    }

    public function test_replan_endpoint_rejects_invalid_reason(): void
    {
        $user = User::factory()->create();
        $voyage = Voyage::factory()->for($user, 'user')->create([
            'plan_snapshot' => [
                'days' => [['dayIndex' => 1, 'activities' => [['title' => 'X', 'lat' => 1.0, 'lng' => 1.0]]]],
            ],
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/v1/trips/{$voyage->id}/replan", [
                'reason' => 'totally_invalid',
            ]);

        $response->assertStatus(422);
    }

    public function test_replan_endpoint_blocks_other_users(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $voyage = Voyage::factory()->for($owner, 'user')->create([
            'plan_snapshot' => [
                'days' => [['dayIndex' => 1, 'activities' => [['title' => 'X', 'lat' => 1.0, 'lng' => 1.0]]]],
            ],
        ]);

        $response = $this->actingAs($intruder)
            ->postJson("/api/v1/trips/{$voyage->id}/replan", [
                'reason' => 'health',
            ]);

        $response->assertNotFound();
    }

    public function test_replan_endpoint_requires_authentication(): void
    {
        $response = $this->postJson('/api/v1/trips/some-uuid/replan', [
            'reason' => 'weather',
        ]);
        $response->assertUnauthorized();
    }
}
