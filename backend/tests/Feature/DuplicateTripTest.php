<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Voyage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DuplicateTripTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Http::fake([
            'api.frankfurter.app/*' => Http::response(['rates' => ['EUR' => 1.0]], 200),
            'test.api.amadeus.com/*' => Http::response([], 200),
            'api.amadeus.com/*' => Http::response([], 200),
        ]);
    }

    private function samplePlanSnapshot(): array
    {
        return [
            'days' => [
                [
                    'dayIndex' => 1,
                    'activities' => [
                        ['title' => 'Colisée', 'lat' => 41.8902, 'lng' => 12.4924, 'durationHours' => 2.0, 'city' => 'Rome'],
                        ['title' => 'Vatican', 'lat' => 41.9029, 'lng' => 12.4534, 'durationHours' => 3.0, 'city' => 'Rome'],
                    ],
                ],
                [
                    'dayIndex' => 2,
                    'activities' => [
                        ['title' => 'Forum Romain', 'lat' => 41.8925, 'lng' => 12.4853, 'durationHours' => 1.5, 'city' => 'Rome'],
                    ],
                ],
            ],
            'travelers' => 2,
            'budget' => 1500,
            'travelDays' => 2,
        ];
    }

    public function test_owner_duplicates_their_trip_into_a_new_trip(): void
    {
        $user = User::factory()->create();
        $voyage = Voyage::factory()->for($user, 'user')->create([
            'destination' => 'Rome',
            'titre' => 'Escapade Rome',
            'plan_snapshot' => $this->samplePlanSnapshot(),
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/v1/trips/{$voyage->id}/duplicate");

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.destination', 'Rome');

        $newId = $response->json('data.id');
        $this->assertNotNull($newId);
        $this->assertNotSame((string) $voyage->id, (string) $newId);
        $this->assertSame(2, Voyage::count());
    }

    public function test_duplicated_trip_is_independent_of_the_original(): void
    {
        $user = User::factory()->create();
        $voyage = Voyage::factory()->for($user, 'user')->create([
            'destination' => 'Rome',
            'titre' => 'Escapade Rome',
            'plan_snapshot' => $this->samplePlanSnapshot(),
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/v1/trips/{$voyage->id}/duplicate");

        $response->assertStatus(201);
        $newId = $response->json('data.id');

        $originalTitle = $voyage->titre;
        $copyTitleBefore = Voyage::find($newId)->titre;

        Voyage::find($voyage->id)->update(['titre' => 'changed']);

        $copyTitleAfter = Voyage::find($newId)->titre;

        $this->assertSame($copyTitleBefore, $copyTitleAfter);
        $this->assertNotSame('changed', $copyTitleAfter);
        $this->assertStringContainsString($originalTitle, $copyTitleAfter);
    }

    public function test_other_user_cannot_duplicate_someone_elses_trip(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $voyage = Voyage::factory()->for($owner, 'user')->create([
            'destination' => 'Rome',
            'plan_snapshot' => $this->samplePlanSnapshot(),
        ]);

        $response = $this->actingAs($intruder)
            ->postJson("/api/v1/trips/{$voyage->id}/duplicate");

        $response->assertNotFound();
        $this->assertSame(1, Voyage::count());
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->postJson('/api/v1/trips/some-uuid/duplicate');
        $response->assertUnauthorized();
    }
}
