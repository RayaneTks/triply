<?php

namespace Tests\Feature\Http;

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

class TripExportControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Voyage $voyage;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();

        $this->user = User::factory()->create();
        $this->voyage = Voyage::factory()->create([
            'user_id' => $this->user->id,
            'titre' => 'Roadtrip Portugal',
            'destination' => 'Lisbonne',
            'date_debut' => '2026-09-01',
            'date_fin' => '2026-09-03',
        ]);

        $journee = Journee::factory()->forVoyage($this->voyage, 1)->create();
        Etape::factory()->create([
            'journee_id' => $journee->id,
            'titre' => 'Tour Belém',
            'ville' => 'Lisbonne',
            'temps_estime' => '2h',
            'ordre' => 1,
        ]);
        Transport::factory()->create([
            'voyage_id' => $this->voyage->id,
            'type' => 'flight',
            'depart_le' => '2026-09-01 08:00:00',
            'arrivee_le' => '2026-09-01 10:30:00',
        ]);
        Hebergement::factory()->create([
            'voyage_id' => $this->voyage->id,
            'nom' => 'Hotel Tejo',
            'arrivee_le' => '2026-09-01 15:00:00',
            'depart_le' => '2026-09-03 11:00:00',
        ]);

        Sanctum::actingAs($this->user);
    }

    public function test_export_pdf_returns_binary_pdf(): void
    {
        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/export/pdf", []);

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $response->getContent());
        $this->assertGreaterThan(800, strlen($response->getContent()));
    }

    public function test_export_ics_returns_valid_calendar(): void
    {
        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/export/ics", []);

        $response->assertOk();
        $this->assertStringContainsString('text/calendar', (string) $response->headers->get('Content-Type'));

        $body = $response->getContent();
        $this->assertStringContainsString('BEGIN:VCALENDAR', $body);
        $this->assertStringContainsString('END:VCALENDAR', $body);
        $this->assertStringContainsString('BEGIN:VEVENT', $body);
        $this->assertStringContainsString('SUMMARY:Tour Belém', $body);
    }

    public function test_export_pdf_for_other_user_trip_returns_404(): void
    {
        $other = User::factory()->create();
        $otherVoyage = Voyage::factory()->create(['user_id' => $other->id]);

        $response = $this->postJson("/api/v1/trips/{$otherVoyage->id}/export/pdf", []);

        $response->assertNotFound();
    }

    public function test_export_requires_authentication(): void
    {
        $this->app['auth']->forgetGuards();

        $response = $this->postJson("/api/v1/trips/{$this->voyage->id}/export/pdf", []);

        $response->assertUnauthorized();
    }
}
