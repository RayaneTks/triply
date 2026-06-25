<?php

namespace Tests\Feature;

use App\Models\Hebergement;
use App\Models\Transport;
use App\Models\Etape;
use App\Models\Journee;
use App\Models\User;
use App\Models\Voyage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TripBudgetReshuffleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Http::fake([
            'api.frankfurter.app/*' => Http::response(['rates' => ['EUR' => 1.0]], 200),
            '*amadeus.com/*' => Http::response([], 200),
        ]);
    }

    public function test_proposes_swaps_to_meet_savings_target(): void
    {
        $user = User::factory()->create();
        $voyage = Voyage::factory()->for($user, 'user')->create(['destination' => 'Rome']);

        Hebergement::factory()->for($voyage, 'voyage')->create(['nom' => 'Grand Hotel', 'prix' => 1000]);
        Transport::factory()->for($voyage, 'voyage')->create([
            'depart_lieu' => 'Paris',
            'arrivee_lieu' => 'Rome',
            'prix' => 400,
        ]);
        $day = Journee::factory()->for($voyage, 'voyage')->create();
        Etape::factory()->for($day, 'journee')->create(['titre' => 'Visite guidée Vatican', 'prix_estime' => 80]);
        Etape::factory()->for($day, 'journee')->create(['titre' => 'Snack', 'prix_estime' => 15]);

        $response = $this->actingAs($user)
            ->postJson("/api/v1/trips/{$voyage->id}/budget-reshuffle", [
                'savings_target_eur' => 250,
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.trip_id', (string) $voyage->id)
            ->assertJsonPath('data.savings_target_eur', 250)
            ->assertJsonPath('data.target_met', true);

        $swaps = $response->json('data.swaps');
        $this->assertIsArray($swaps);
        $this->assertGreaterThan(0, count($swaps));

        // Top swap should be the hotel (highest absolute savings: 300€).
        $this->assertSame('hotel', $swaps[0]['kind']);
        $this->assertEqualsWithDelta(300.0, $swaps[0]['savings_eur'], 0.01);
        $this->assertTrue($swaps[0]['recommended']);

        // total_savings_eur must cover the target if possible.
        $this->assertGreaterThanOrEqual(250, $response->json('data.total_savings_eur'));
    }

    public function test_returns_target_not_met_when_no_costs_exist(): void
    {
        $user = User::factory()->create();
        $voyage = Voyage::factory()->for($user, 'user')->create();

        $response = $this->actingAs($user)
            ->postJson("/api/v1/trips/{$voyage->id}/budget-reshuffle", [
                'savings_target_eur' => 100,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.target_met', false)
            ->assertJsonPath('data.total_savings_eur', 0)
            ->assertJsonPath('data.swaps', []);
    }

    public function test_validates_savings_target(): void
    {
        $user = User::factory()->create();
        $voyage = Voyage::factory()->for($user, 'user')->create();

        $this->actingAs($user)
            ->postJson("/api/v1/trips/{$voyage->id}/budget-reshuffle", [
                'savings_target_eur' => -5,
            ])
            ->assertStatus(422);

        $this->actingAs($user)
            ->postJson("/api/v1/trips/{$voyage->id}/budget-reshuffle", [])
            ->assertStatus(422);
    }

    public function test_blocks_other_users(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $voyage = Voyage::factory()->for($owner, 'user')->create();

        $this->actingAs($intruder)
            ->postJson("/api/v1/trips/{$voyage->id}/budget-reshuffle", [
                'savings_target_eur' => 100,
            ])
            ->assertNotFound();
    }
}
