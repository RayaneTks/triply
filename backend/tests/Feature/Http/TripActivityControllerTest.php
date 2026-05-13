<?php

namespace Tests\Feature\Http;

use App\Models\Etape;
use App\Models\Journee;
use App\Models\User;
use App\Models\Voyage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TripActivityControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Voyage $voyage;
    private Journee $day;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        $this->user = User::factory()->create();
        $this->voyage = Voyage::factory()->create(['user_id' => $this->user->id]);
        $this->day = Journee::factory()->create(['voyage_id' => $this->voyage->id, 'numero_jour' => 1]);
        Sanctum::actingAs($this->user);
    }

    public function test_store_activity_returns_201(): void
    {
        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/activities", [
            'source' => 'manual',
            'title' => 'Musée du Louvre',
            'estimated_duration_minutes' => 120,
            'day_id' => (string) $this->day->id,
            'cost' => 25,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('etapes', [
            'titre' => 'Musée du Louvre',
            'journee_id' => $this->day->id,
        ]);
    }

    public function test_store_activity_requires_source_field(): void
    {
        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/activities", [
            'title' => 'No source',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonPath('error.code', 'VALIDATION_ERROR');
    }

    public function test_store_activity_validates_source_enum(): void
    {
        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/activities", [
            'source' => 'invalid_source',
            'title' => 'X',
        ]);

        $response->assertUnprocessable();
    }

    public function test_index_returns_all_activities_for_trip(): void
    {
        Etape::factory()->count(3)->create(['journee_id' => $this->day->id]);

        $response = $this->getJson("/api/v1/trips/{$this->voyage->id}/activities");

        $response->assertOk();
        $this->assertCount(3, $response->json('data.items'));
    }

    public function test_grouped_by_day_returns_days(): void
    {
        Etape::factory()->count(2)->create(['journee_id' => $this->day->id]);

        $response = $this->getJson("/api/v1/trips/{$this->voyage->id}/activities/grouped-by-day");

        $response->assertOk();
        $response->assertJsonPath('data.days.0.index', 1);
        $this->assertCount(2, $response->json('data.days.0.activities'));
    }

    public function test_show_activity_returns_attributes(): void
    {
        $etape = Etape::factory()->create(['journee_id' => $this->day->id, 'titre' => 'Tour Eiffel']);

        $response = $this->getJson("/api/v1/trips/{$this->voyage->id}/activities/{$etape->id}");

        $response->assertOk();
        $response->assertJsonPath('data.attributes.title', 'Tour Eiffel');
    }

    public function test_update_activity_changes_title(): void
    {
        $etape = Etape::factory()->create(['journee_id' => $this->day->id, 'titre' => 'Old']);

        $response = $this->patchJson("/api/v1/trips/{$this->voyage->id}/activities/{$etape->id}", [
            'title' => 'New title',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('etapes', ['id' => $etape->id, 'titre' => 'New title']);
    }

    public function test_update_activity_validates_liked_state(): void
    {
        $etape = Etape::factory()->create(['journee_id' => $this->day->id]);

        $response = $this->patchJson("/api/v1/trips/{$this->voyage->id}/activities/{$etape->id}", [
            'liked_state' => 'invalid',
        ]);

        $response->assertUnprocessable();
    }

    public function test_delete_activity_soft_deletes(): void
    {
        $etape = Etape::factory()->create(['journee_id' => $this->day->id]);

        $response = $this->deleteJson("/api/v1/trips/{$this->voyage->id}/activities/{$etape->id}");

        $response->assertOk();
        $this->assertSoftDeleted('etapes', ['id' => $etape->id]);
    }

    public function test_restore_activity_brings_back_soft_deleted(): void
    {
        $etape = Etape::factory()->create(['journee_id' => $this->day->id]);
        $etape->delete();

        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/activities/{$etape->id}/restore");

        $response->assertOk();
        $this->assertDatabaseHas('etapes', ['id' => $etape->id, 'deleted_at' => null]);
    }

    public function test_reorder_validates_activity_ids_required(): void
    {
        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/activities/reorder", []);

        $response->assertUnprocessable();
    }

    public function test_regenerate_activity_returns_202_with_job(): void
    {
        $etape = Etape::factory()->create(['journee_id' => $this->day->id]);

        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/activities/{$etape->id}/regenerate");

        $response->assertStatus(202);
        $response->assertJsonPath('data.type', 'ai_job');
    }

    public function test_other_user_cannot_access_activity(): void
    {
        $other = User::factory()->create();
        $otherVoyage = Voyage::factory()->create(['user_id' => $other->id]);
        $otherDay = Journee::factory()->create(['voyage_id' => $otherVoyage->id]);
        $etape = Etape::factory()->create(['journee_id' => $otherDay->id]);

        $response = $this->getJson("/api/v1/trips/{$otherVoyage->id}/activities/{$etape->id}");

        $response->assertNotFound();
    }
}
