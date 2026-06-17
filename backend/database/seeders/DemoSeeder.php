<?php

namespace Database\Seeders;

use App\Models\Hebergement;
use App\Models\Journee;
use App\Models\LocalTransport;
use App\Models\Transport;
use App\Models\User;
use App\Models\Voyage;
use Carbon\CarbonImmutable;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * DemoSeeder — jeu de données « investor demo » riche et crédible.
 *
 * Objectif : alimenter les fonctionnalités différenciantes de Triply
 * (Constraint Replanner + Free-time Concierge + Budget) avec un voyage
 * « Rome, 4 jours » entièrement géolocalisé, plutôt que des données faker
 * aléatoires.
 *
 * Stratégie de lecture (cf. TripService::serializeTrip et TripFreeTimeService) :
 *  - les tables structurées (journees/etapes/transports/hebergements) sont
 *    relues via SnapshotSyncService::buildFromStructured ;
 *  - le Free-time Concierge lit directement Voyage->plan_snapshot.
 * On écrit donc les DEUX : un plan_snapshot complet ET les lignes structurées
 * cohérentes, sans aucun appel réseau (offline-safe au seed).
 *
 * Idempotent : ré-exécutable sans dupliquer (purge du voyage démo précédent).
 *
 * Lancement :
 *   php artisan db:seed --class=Database\\Seeders\\DemoSeeder
 *   (ou via `php artisan db:seed`, DemoSeeder est appelé par DatabaseSeeder)
 */
class DemoSeeder extends Seeder
{
    use WithoutModelEvents;

    private const DEMO_EMAIL = 'demo@triply.app';

    private const TRIP_TITLE = 'Rome — 4 jours entre antiquité et dolce vita';

    /**
     * Plafond d'heures d'activité par jour utilisé par le Free-time Concierge.
     * Chaque journée reste volontairement < 8h pour exposer du temps libre.
     */
    private const MAX_ACTIVITY_HOURS_PER_DAY = 8.0;

    public function run(): void
    {
        $user = $this->demoUser();

        // Fenêtre « à venir » (status « A venir ») pour une démo qui reste fraîche.
        $start = CarbonImmutable::now()->addWeeks(3)->startOfDay();
        $end = $start->addDays(3); // séjour de 4 jours (J1 → J4)

        $this->purgePreviousDemoTrip($user);

        $days = $this->buildDays();
        $hotel = $this->hotel();
        $flight = $this->flight($start, $end);

        $snapshot = $this->buildSnapshot($start, $days, $hotel, $flight);

        $voyage = Voyage::create([
            'titre' => self::TRIP_TITLE,
            'destination' => 'Rome',
            'date_debut' => $start->toDateString(),
            'date_fin' => $end->toDateString(),
            'budget_total' => 1860,
            'nb_voyageurs' => 2,
            'description' => 'City-break culturel : Colisée, Vatican, Trastevere et trésors du centre historique, '
                .'avec du temps libre chaque après-midi pour improviser.',
            'user_id' => $user->id,
            'plan_snapshot' => $snapshot,
        ]);

        $this->seedTransport($voyage, $start, $end, $flight);
        $this->seedHotel($voyage, $start, $end, $hotel);
        $this->seedDaysAndSteps($voyage, $start, $days);
        $this->seedLocalTransports($voyage, $start, $end);

        $this->command?->info(sprintf(
            'DemoSeeder : voyage « %s » (#%d) créé pour %s — %d jours, %d étapes.',
            $voyage->titre,
            $voyage->id,
            $user->email,
            count($days),
            array_sum(array_map(fn (array $d) => count($d['activities']), $days)),
        ));
    }

    private function demoUser(): User
    {
        $user = User::withTrashed()->firstOrNew(['email' => self::DEMO_EMAIL]);
        $user->forceFill([
            'name' => 'Démo Triply',
            'password' => 'demo1234',
            'est_admin' => false,
            'email_verified_at' => now(),
            'subscription_tier' => 'planner',
            'deleted_at' => null,
        ]);
        $user->save();

        return $user;
    }

    private function purgePreviousDemoTrip(User $user): void
    {
        $previous = Voyage::query()
            ->where('user_id', $user->id)
            ->where('titre', self::TRIP_TITLE)
            ->get();

        foreach ($previous as $voyage) {
            DB::transaction(function () use ($voyage): void {
                foreach ($voyage->journees()->get() as $journee) {
                    // forceDelete : les etapes utilisent SoftDeletes.
                    $journee->etapes()->forceDelete();
                    $journee->delete();
                }
                $voyage->transports()->delete();
                $voyage->hebergements()->delete();
                LocalTransport::query()->where('voyage_id', $voyage->id)->delete();
                $voyage->delete();
            });
        }
    }

    /**
     * Programme réaliste, géolocalisé (coordonnées réelles), 4 journées
     * thématiques. Durées volontairement modérées pour laisser du temps libre.
     *
     * @return list<array{theme: string, activities: list<array{title: string, lat: float, lng: float, durationHours: float, category: string}>}>
     */
    private function buildDays(): array
    {
        return [
            [
                'theme' => 'Rome antique',
                'activities' => [
                    ['title' => 'Colisée — visite coupe-file', 'lat' => 41.8902, 'lng' => 12.4922, 'durationHours' => 2.0, 'category' => 'SIGHTS'],
                    ['title' => 'Forum Romain', 'lat' => 41.8925, 'lng' => 12.4853, 'durationHours' => 1.5, 'category' => 'SIGHTS'],
                    ['title' => 'Mont Palatin', 'lat' => 41.8892, 'lng' => 12.4875, 'durationHours' => 1.0, 'category' => 'SIGHTS'],
                    ['title' => 'Déjeuner dans le quartier Monti', 'lat' => 41.8945, 'lng' => 12.4925, 'durationHours' => 1.0, 'category' => 'RESTAURANT'],
                ],
            ],
            [
                'theme' => 'Vatican',
                'activities' => [
                    ['title' => 'Musées du Vatican', 'lat' => 41.9065, 'lng' => 12.4536, 'durationHours' => 3.0, 'category' => 'SIGHTS'],
                    ['title' => 'Chapelle Sixtine', 'lat' => 41.9029, 'lng' => 12.4545, 'durationHours' => 0.5, 'category' => 'SIGHTS'],
                    ['title' => 'Basilique Saint-Pierre', 'lat' => 41.9022, 'lng' => 12.4539, 'durationHours' => 1.5, 'category' => 'SIGHTS'],
                    ['title' => 'Château Saint-Ange', 'lat' => 41.9031, 'lng' => 12.4663, 'durationHours' => 1.0, 'category' => 'SIGHTS'],
                ],
            ],
            [
                'theme' => 'Centre historique',
                'activities' => [
                    ['title' => 'Fontaine de Trevi', 'lat' => 41.9009, 'lng' => 12.4833, 'durationHours' => 0.75, 'category' => 'SIGHTS'],
                    ['title' => 'Panthéon', 'lat' => 41.8986, 'lng' => 12.4769, 'durationHours' => 1.0, 'category' => 'SIGHTS'],
                    ['title' => 'Piazza Navona', 'lat' => 41.8992, 'lng' => 12.4731, 'durationHours' => 0.75, 'category' => 'SIGHTS'],
                    ['title' => 'Place d\'Espagne', 'lat' => 41.9058, 'lng' => 12.4823, 'durationHours' => 1.0, 'category' => 'SIGHTS'],
                    ['title' => 'Galerie Borghèse', 'lat' => 41.9142, 'lng' => 12.4923, 'durationHours' => 1.5, 'category' => 'SIGHTS'],
                ],
            ],
            [
                'theme' => 'Trastevere & départ',
                'activities' => [
                    ['title' => 'Balade dans le Trastevere', 'lat' => 41.8896, 'lng' => 12.4695, 'durationHours' => 1.5, 'category' => 'SIGHTS'],
                    ['title' => 'Basilique Santa Maria in Trastevere', 'lat' => 41.8896, 'lng' => 12.4694, 'durationHours' => 0.75, 'category' => 'SIGHTS'],
                    ['title' => 'Jardin des orangers (Aventin)', 'lat' => 41.8843, 'lng' => 12.4783, 'durationHours' => 0.75, 'category' => 'SIGHTS'],
                    ['title' => 'Déjeuner Campo de\' Fiori', 'lat' => 41.8957, 'lng' => 12.4722, 'durationHours' => 1.0, 'category' => 'RESTAURANT'],
                ],
            ],
        ];
    }

    /**
     * @return array{name: string, address: string, postal: string, city: string, lat: float, lng: float, price: int}
     */
    private function hotel(): array
    {
        return [
            'name' => 'Hotel Artemide',
            'address' => 'Via Nazionale 22',
            'postal' => '00184',
            'city' => 'Rome',
            'lat' => 41.9006,
            'lng' => 12.4922,
            'price' => 720, // 3 nuits, chambre double
        ];
    }

    /**
     * @return array{carrier: string, originIata: string, destinationIata: string, price: int, outboundAt: string, returnAt: string, bookingUrl: string}
     */
    private function flight(CarbonImmutable $start, CarbonImmutable $end): array
    {
        return [
            'carrier' => 'Air France AF1104',
            'originIata' => 'CDG',
            'destinationIata' => 'FCO',
            'price' => 198, // A/R, 2 voyageurs combinés indicatif
            'outboundAt' => $start->setTime(7, 35)->toIso8601String(),
            'returnAt' => $end->setTime(20, 10)->toIso8601String(),
            'bookingUrl' => 'https://wwws.airfrance.fr/',
        ];
    }

    /**
     * Construit le plan_snapshot complet attendu par le Free-time Concierge
     * et fusionné par serializeTrip.
     *
     * @param  list<array{theme: string, activities: list<array<string, mixed>>}>  $days
     * @param  array<string, mixed>  $hotel
     * @param  array<string, mixed>  $flight
     * @return array<string, mixed>
     */
    private function buildSnapshot(CarbonImmutable $start, array $days, array $hotel, array $flight): array
    {
        $snapshotDays = [];
        foreach ($days as $i => $day) {
            $activities = [];
            foreach ($day['activities'] as $activity) {
                $activities[] = [
                    'title' => $activity['title'],
                    'durationHours' => $activity['durationHours'],
                    'lat' => $activity['lat'],
                    'lng' => $activity['lng'],
                    'category' => $activity['category'],
                    'city' => 'Rome',
                ];
            }
            $snapshotDays[] = [
                'dayIndex' => $i + 1,
                'theme' => $day['theme'],
                'activities' => $activities,
            ];
        }

        return [
            'planningMode' => 'assisted',
            'maxActivityHoursPerDay' => self::MAX_ACTIVITY_HOURS_PER_DAY,
            'trip_budget_eur' => 1860,
            'destinationSummary' => [
                'cityName' => 'Rome',
                'airportName' => 'Aéroport de Rome–Fiumicino',
                'iataCode' => 'FCO',
            ],
            'origin' => [
                'cityName' => 'Paris',
                'iataCode' => 'CDG',
                'airportName' => 'Paris Charles-de-Gaulle',
                'countryName' => 'France',
                'lat' => 49.0097,
                'lng' => 2.5479,
            ],
            'flightSummary' => [
                'carrier' => $flight['carrier'],
                'price' => (string) $flight['price'],
                'currency' => 'EUR',
                'originIata' => $flight['originIata'],
                'destinationIata' => $flight['destinationIata'],
                'outboundAt' => $flight['outboundAt'],
                'returnAt' => $flight['returnAt'],
                'bookingUrl' => $flight['bookingUrl'],
            ],
            'hotelSummary' => [
                'name' => $hotel['name'],
                'address' => $hotel['address'].', '.$hotel['postal'].' '.$hotel['city'],
                'latitude' => $hotel['lat'],
                'longitude' => $hotel['lng'],
                'cityName' => $hotel['city'],
                'totalPrice' => (string) $hotel['price'],
                'currency' => 'EUR',
                'checkInDate' => $start->toDateString(),
                'checkOutDate' => $start->addDays(3)->toDateString(),
                'bookingUrl' => 'https://www.hotelartemide.it/',
            ],
            'days' => $snapshotDays,
        ];
    }

    /** @param array<string, mixed> $flight */
    private function seedTransport(Voyage $voyage, CarbonImmutable $start, CarbonImmutable $end, array $flight): void
    {
        Transport::create([
            'voyage_id' => $voyage->id,
            'type' => $flight['carrier'],
            'depart_lieu' => $flight['originIata'],
            'arrivee_lieu' => $flight['destinationIata'],
            'depart_le' => $start->setTime(7, 35),
            'arrivee_le' => $end->setTime(20, 10),
            'prix' => $flight['price'],
            'devise' => 'EUR',
            'information_supplementaire' => $flight['bookingUrl'],
        ]);
    }

    /** @param array<string, mixed> $hotel */
    private function seedHotel(Voyage $voyage, CarbonImmutable $start, CarbonImmutable $end, array $hotel): void
    {
        Hebergement::create([
            'voyage_id' => $voyage->id,
            'type' => 'Hotel',
            'nom' => $hotel['name'],
            'adresse' => $hotel['address'],
            'code_postal' => $hotel['postal'],
            'ville' => $hotel['city'],
            'latitude' => $hotel['lat'],
            'longitude' => $hotel['lng'],
            'arrivee_le' => $start->setTime(15, 0),
            'depart_le' => $end->setTime(11, 0),
            'prix' => $hotel['price'],
            'devise' => 'EUR',
            'informations_supplementaire' => 'Boutique-hôtel central, à 5 min à pied de la gare Termini.',
        ]);
    }

    /**
     * @param  list<array{theme: string, activities: list<array<string, mixed>>}>  $days
     */
    private function seedDaysAndSteps(Voyage $voyage, CarbonImmutable $start, array $days): void
    {
        foreach ($days as $i => $day) {
            $journee = Journee::create([
                'voyage_id' => $voyage->id,
                'numero_jour' => $i + 1,
                'date_jour' => $start->addDays($i)->toDateString(),
            ]);

            foreach (array_values($day['activities']) as $ordre => $activity) {
                $journee->etapes()->create([
                    'temps_estime' => $this->formatDuration($activity['durationHours']),
                    'titre' => $activity['title'],
                    // lat/lng (+ layerId) sont relus par buildFromStructured depuis ce JSON.
                    'description' => json_encode(
                        [
                            'lat' => $activity['lat'],
                            'lng' => $activity['lng'],
                            'layerId' => $activity['category'],
                        ],
                        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
                    ),
                    'prix_estime' => 0,
                    'ville' => 'Rome',
                    'pays' => 'Italie',
                    'source_lien' => null,
                    'ordre' => $ordre + 1,
                    'liked_state' => 'neutral',
                ]);
            }
        }
    }

    private function seedLocalTransports(Voyage $voyage, CarbonImmutable $start, CarbonImmutable $end): void
    {
        $rows = [
            [
                'type' => 'train',
                'from_label' => 'Aéroport FCO',
                'to_label' => 'Roma Termini',
                'departure_at' => $start->setTime(11, 0),
                'arrival_at' => $start->setTime(11, 32),
                'price' => 14.00,
                'notes' => 'Leonardo Express, départ toutes les 15 min.',
            ],
            [
                'type' => 'metro',
                'from_label' => 'Termini',
                'to_label' => 'Colosseo (ligne B)',
                'departure_at' => $start->addDays(1)->setTime(9, 0),
                'arrival_at' => $start->addDays(1)->setTime(9, 8),
                'price' => 1.50,
                'notes' => 'Ticket BIT valable 100 min.',
            ],
            [
                'type' => 'taxi',
                'from_label' => 'Trastevere',
                'to_label' => 'Aéroport FCO',
                'departure_at' => $end->setTime(17, 30),
                'arrival_at' => $end->setTime(18, 15),
                'price' => 55.00,
                'notes' => 'Tarif forfaitaire centre ↔ Fiumicino.',
            ],
        ];

        foreach ($rows as $row) {
            LocalTransport::create([
                'voyage_id' => $voyage->id,
                'type' => $row['type'],
                'from_label' => $row['from_label'],
                'to_label' => $row['to_label'],
                'departure_at' => $row['departure_at'],
                'arrival_at' => $row['arrival_at'],
                'price' => $row['price'],
                'currency' => 'EUR',
                'notes' => $row['notes'],
            ]);
        }
    }

    /** Aligne le format sur SnapshotSyncService::formatDurationHours ("2h", "1.5h"). */
    private function formatDuration(float $hours): string
    {
        if ($hours <= 0) {
            return '0h';
        }

        return rtrim(rtrim(number_format($hours, 2, '.', ''), '0'), '.').'h';
    }
}
