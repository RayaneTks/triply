<?php

namespace Tests\Feature\Services;

use App\Models\Etape;
use App\Models\Journee;
use App\Models\User;
use App\Models\Voyage;
use App\Services\Contracts\ActivityServiceInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ActivityServiceTest extends TestCase
{
    use RefreshDatabase;

    private ActivityServiceInterface $service;
    private User $user;
    private Voyage $voyage;
    private Journee $journee;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        Http::fake([
            '*/v1/reference-data/locations*' => Http::response(['data' => []], 200),
        ]);

        $this->user = User::factory()->create();
        Auth::login($this->user);
        $this->service = $this->app->make(ActivityServiceInterface::class);
        $this->voyage = Voyage::factory()->create(['user_id' => $this->user->id]);
        $this->journee = Journee::factory()->forVoyage($this->voyage, 1)->create();
    }

    public function test_create_persists_etape_with_defaults(): void
    {
        $result = $this->service->create((string) $this->voyage->id, [
            'title' => 'Visit Eiffel',
            'city' => 'Paris',
        ]);

        $this->assertSame('Visit Eiffel', $result['attributes']['title']);
        $this->assertDatabaseHas('etapes', ['titre' => 'Visit Eiffel', 'ville' => 'Paris']);
    }

    public function test_create_uses_provided_day_id_when_valid(): void
    {
        $secondDay = Journee::factory()->forVoyage($this->voyage, 2)->create();

        $result = $this->service->create((string) $this->voyage->id, [
            'title' => 'Day 2 activity',
            'day_id' => (string) $secondDay->id,
        ]);

        $this->assertDatabaseHas('etapes', [
            'titre' => 'Day 2 activity',
            'journee_id' => $secondDay->id,
        ]);
        $this->assertNotNull($result['id']);
    }

    public function test_update_changes_liked_state(): void
    {
        $etape = Etape::factory()->create([
            'journee_id' => $this->journee->id,
            'liked_state' => 'neutral',
        ]);

        $this->service->update(
            (string) $this->voyage->id,
            (string) $etape->id,
            ['liked_state' => 'liked']
        );

        $this->assertDatabaseHas('etapes', ['id' => $etape->id, 'liked_state' => 'liked']);
    }

    public function test_update_ignores_invalid_liked_state(): void
    {
        $etape = Etape::factory()->create([
            'journee_id' => $this->journee->id,
            'liked_state' => 'liked',
        ]);

        $this->service->update(
            (string) $this->voyage->id,
            (string) $etape->id,
            ['liked_state' => 'invalid_value']
        );

        $this->assertDatabaseHas('etapes', ['id' => $etape->id, 'liked_state' => 'liked']);
    }

    public function test_delete_soft_deletes_etape(): void
    {
        $etape = Etape::factory()->create(['journee_id' => $this->journee->id]);

        $this->service->delete((string) $this->voyage->id, (string) $etape->id);

        $this->assertSoftDeleted('etapes', ['id' => $etape->id]);
    }

    public function test_restore_brings_back_soft_deleted_etape(): void
    {
        $etape = Etape::factory()->create(['journee_id' => $this->journee->id]);
        $etape->delete();
        $this->assertSoftDeleted('etapes', ['id' => $etape->id]);

        $this->service->restore((string) $this->voyage->id, (string) $etape->id);

        $this->assertDatabaseHas('etapes', ['id' => $etape->id, 'deleted_at' => null]);
    }

    public function test_reorder_updates_ordre_field_sequentially(): void
    {
        $a = Etape::factory()->create(['journee_id' => $this->journee->id, 'ordre' => 1]);
        $b = Etape::factory()->create(['journee_id' => $this->journee->id, 'ordre' => 2]);
        $c = Etape::factory()->create(['journee_id' => $this->journee->id, 'ordre' => 3]);

        $this->service->reorder((string) $this->voyage->id, [
            'order' => [(string) $c->id, (string) $a->id, (string) $b->id],
        ]);

        $this->assertSame(1, $c->fresh()->ordre);
        $this->assertSame(2, $a->fresh()->ordre);
        $this->assertSame(3, $b->fresh()->ordre);
    }

    public function test_grouped_by_day_returns_days_with_activities(): void
    {
        Etape::factory()->create(['journee_id' => $this->journee->id, 'ordre' => 2, 'titre' => 'B']);
        Etape::factory()->create(['journee_id' => $this->journee->id, 'ordre' => 1, 'titre' => 'A']);

        $result = $this->service->groupedByDay((string) $this->voyage->id);

        $this->assertCount(1, $result['days']);
        $this->assertCount(2, $result['days'][0]['activities']);
        $this->assertSame('A', $result['days'][0]['activities'][0]['attributes']['title']);
    }

    public function test_list_filters_by_liked_state(): void
    {
        Etape::factory()->liked()->create(['journee_id' => $this->journee->id]);
        Etape::factory()->disliked()->create(['journee_id' => $this->journee->id]);
        Etape::factory()->create(['journee_id' => $this->journee->id, 'liked_state' => 'neutral']);

        $result = $this->service->list((string) $this->voyage->id, ['liked_state' => 'liked']);

        $this->assertCount(1, $result['items']);
    }

    public function test_regenerate_returns_stub_job_metadata(): void
    {
        $etape = Etape::factory()->create(['journee_id' => $this->journee->id]);

        $result = $this->service->regenerate((string) $this->voyage->id, (string) $etape->id);

        $this->assertSame('ai_job', $result['type']);
        $this->assertSame('queued', $result['attributes']['status']);
    }

    public function test_show_throws_for_non_existent_activity(): void
    {
        $this->expectException(ModelNotFoundException::class);
        $this->service->show((string) $this->voyage->id, '99999');
    }

    public function test_delete_throws_for_other_user_trip(): void
    {
        $other = User::factory()->create();
        $otherVoyage = Voyage::factory()->create(['user_id' => $other->id]);

        $this->expectException(ModelNotFoundException::class);
        $this->service->delete((string) $otherVoyage->id, '1');
    }
}
