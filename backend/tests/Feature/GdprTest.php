<?php

namespace Tests\Feature;

use App\Models\Abonnement;
use App\Models\Etape;
use App\Models\Hebergement;
use App\Models\Journee;
use App\Models\Transport;
use App\Models\User;
use App\Models\Voyage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GdprTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
    }

    private function seedTripFor(User $user): Voyage
    {
        $voyage = Voyage::factory()->create([
            'user_id' => $user->id,
            'titre' => 'Voyage RGPD',
            'destination' => 'Rome',
        ]);
        $journee = Journee::factory()->forVoyage($voyage, 1)->create();
        Etape::factory()->create([
            'journee_id' => $journee->id,
            'titre' => 'Colisée',
            'ville' => 'Rome',
            'ordre' => 1,
        ]);
        Transport::factory()->create(['voyage_id' => $voyage->id, 'type' => 'flight']);
        Hebergement::factory()->create(['voyage_id' => $voyage->id, 'nom' => 'Hotel Roma']);

        return $voyage;
    }

    public function test_export_contains_user_data_archive(): void
    {
        $user = User::factory()->create(['email' => 'gdpr@example.com', 'name' => 'Jane Doe']);
        $this->seedTripFor($user);
        Abonnement::create([
            'utilisateur_id' => $user->id,
            'abonnement_stripe_id' => 'sub_test_123',
            'tier' => 'premium',
            'plan_interval' => 'monthly',
            'statut' => 'active',
            'date_debut' => now(),
            'date_fin' => now()->addMonth(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/user/export');

        $response->assertOk();
        $response->assertJsonPath('data.profile.email', 'gdpr@example.com');
        $response->assertJsonPath('data.profile.name', 'Jane Doe');
        $response->assertJsonPath('data.trips.0.title', 'Voyage RGPD');
        $response->assertJsonPath('data.trips.0.days.0.activities.0.title', 'Colisée');
        $response->assertJsonPath('data.subscriptions.0.tier', 'premium');

        $data = $response->json('data');
        $this->assertNotEmpty($data['activities']);
        $this->assertNotEmpty($data['bookings']['flights']);
        $this->assertNotEmpty($data['bookings']['accommodations']);
    }

    public function test_delete_account_anonymizes_and_soft_deletes(): void
    {
        $user = User::factory()->create(['email' => 'todelete@example.com', 'name' => 'To Delete']);
        $voyage = $this->seedTripFor($user);

        Sanctum::actingAs($user);

        $response = $this->deleteJson('/api/v1/user', ['confirm' => true]);

        $response->assertOk();
        $response->assertJsonPath('data.attributes.deleted', true);
        $response->assertJsonPath('data.attributes.anonymized', true);

        $this->assertSoftDeleted('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('users', ['email' => 'todelete@example.com']);
        $this->assertDatabaseMissing('voyages', ['id' => $voyage->id]);
    }

    public function test_delete_account_requires_confirmation(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->deleteJson('/api/v1/user', ['confirm' => false]);

        $response->assertStatus(422);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'deleted_at' => null]);
    }
}
