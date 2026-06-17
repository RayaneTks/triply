<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Voyage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PolicyAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [[
                    'message' => [
                        'content' => json_encode([
                            'reply' => 'noop',
                            'summary' => '',
                            'replannedActivities' => [],
                            'affectedDays' => [],
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

    private function makeOwnerTrip(): array
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $voyage = Voyage::factory()->for($owner, 'user')->create([
            'destination' => 'Rome',
            'plan_snapshot' => [
                'days' => [
                    [
                        'dayIndex' => 1,
                        'activities' => [
                            ['title' => 'Colisée', 'lat' => 41.8902, 'lng' => 12.4924, 'durationHours' => 2.0],
                        ],
                    ],
                ],
                'travelDays' => 1,
            ],
        ]);

        return [$owner, $intruder, $voyage];
    }

    public function test_user_a_cannot_show_user_bs_trip(): void
    {
        [$owner, $intruder, $voyage] = $this->makeOwnerTrip();

        $response = $this->actingAs($intruder)
            ->getJson("/api/v1/trips/{$voyage->id}");

        $response->assertNotFound();
    }

    public function test_user_a_cannot_update_user_bs_trip(): void
    {
        [$owner, $intruder, $voyage] = $this->makeOwnerTrip();

        $response = $this->actingAs($intruder)
            ->patchJson("/api/v1/trips/{$voyage->id}", [
                'destination' => 'Hacked',
            ]);

        $response->assertNotFound();
    }

    public function test_user_a_cannot_delete_user_bs_trip(): void
    {
        [$owner, $intruder, $voyage] = $this->makeOwnerTrip();

        $response = $this->actingAs($intruder)
            ->deleteJson("/api/v1/trips/{$voyage->id}");

        $response->assertNotFound();
        $this->assertDatabaseHas('voyages', ['id' => $voyage->id]);
    }

    public function test_user_a_cannot_replan_user_bs_trip(): void
    {
        [$owner, $intruder, $voyage] = $this->makeOwnerTrip();

        $response = $this->actingAs($intruder)
            ->postJson("/api/v1/trips/{$voyage->id}/replan", [
                'reason' => 'flight_delay',
            ]);

        $response->assertNotFound();
    }

    public function test_user_a_cannot_view_free_time_on_user_bs_trip(): void
    {
        [$owner, $intruder, $voyage] = $this->makeOwnerTrip();

        $response = $this->actingAs($intruder)
            ->getJson("/api/v1/trips/{$voyage->id}/days/1/free-time");

        $response->assertNotFound();
    }

    public function test_user_a_cannot_reshuffle_user_bs_trip_budget(): void
    {
        [$owner, $intruder, $voyage] = $this->makeOwnerTrip();

        $response = $this->actingAs($intruder)
            ->postJson("/api/v1/trips/{$voyage->id}/budget-reshuffle", [
                'savings_target_eur' => 500,
            ]);

        $response->assertNotFound();
    }
}
