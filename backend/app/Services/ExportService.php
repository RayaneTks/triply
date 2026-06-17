<?php

namespace App\Services;

use App\Models\Journee;
use App\Models\Voyage;
use App\Services\Contracts\ExportServiceInterface;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * Génère les exports tangibles d'un voyage : PDF itinéraire brandé (via dompdf)
 * et fichier ICS (calendrier Apple/Google) pour les étapes datées.
 *
 * Source de vérité = données structurées (journées, étapes, transports,
 * hébergements) dénormalisées depuis plan_snapshot par SnapshotSyncService.
 */
class ExportService implements ExportServiceInterface
{
    private const PDF_MIME = 'application/pdf';
    private const ICS_MIME = 'text/calendar';

    /**
     * @return array{content: string, filename: string, mime: string}
     */
    public function exportPdf(string $tripId, array $payload): array
    {
        $voyage = $this->findUserTrip($tripId);
        $data = $this->buildItineraryData($voyage);

        $pdf = Pdf::loadView('exports.itinerary', $data)
            ->setPaper('a4', 'portrait');

        return [
            'content' => $pdf->output(),
            'filename' => $this->filename($voyage, 'pdf'),
            'mime' => self::PDF_MIME,
        ];
    }

    /**
     * @return array{content: string, filename: string, mime: string}
     */
    public function exportIcs(string $tripId, array $payload): array
    {
        $voyage = $this->findUserTrip($tripId);

        return [
            'content' => $this->buildIcs($voyage),
            'filename' => $this->filename($voyage, 'ics'),
            'mime' => self::ICS_MIME,
        ];
    }

    private function findUserTrip(string $tripId): Voyage
    {
        $user = Auth::user();
        if (! $user) {
            throw new ModelNotFoundException('Utilisateur non authentifie.');
        }

        return Voyage::query()
            ->where('id', $tripId)
            ->where('user_id', $user->id)
            ->with(['transports', 'hebergements', 'journees.etapes'])
            ->firstOrFail();
    }

    /**
     * @return array<string, mixed>
     */
    private function buildItineraryData(Voyage $voyage): array
    {
        $start = Carbon::parse($voyage->date_debut);
        $end = Carbon::parse($voyage->date_fin);

        $days = $voyage->journees
            ->sortBy('numero_jour')
            ->map(function (Journee $journee) {
                return [
                    'index' => $journee->numero_jour,
                    'date' => $journee->date_jour ? Carbon::parse($journee->date_jour) : null,
                    'activities' => $journee->etapes
                        ->sortBy('ordre')
                        ->map(fn ($etape) => [
                            'title' => $etape->titre,
                            'city' => $etape->ville,
                            'duration' => $etape->temps_estime,
                            'price' => $etape->prix_estime,
                        ])
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();

        $transports = $voyage->transports
            ->sortBy('depart_le')
            ->map(fn ($t) => [
                'type' => $t->type,
                'from' => $t->depart_lieu,
                'to' => $t->arrivee_lieu,
                'depart' => $t->depart_le,
                'arrivee' => $t->arrivee_le,
                'price' => $t->prix,
                'currency' => $t->devise,
            ])
            ->values()
            ->all();

        $hebergements = $voyage->hebergements
            ->sortBy('arrivee_le')
            ->map(fn ($h) => [
                'name' => $h->nom,
                'address' => $h->adresse,
                'city' => $h->ville,
                'checkin' => $h->arrivee_le,
                'checkout' => $h->depart_le,
                'price' => $h->prix,
                'currency' => $h->devise,
            ])
            ->values()
            ->all();

        return [
            'trip' => [
                'title' => $voyage->titre,
                'destination' => $voyage->destination,
                'start_date' => $start,
                'end_date' => $end,
                'travel_days' => max(1, $start->diffInDays($end) + 1),
                'travelers' => $voyage->nb_voyageurs,
                'budget' => $voyage->budget_total,
            ],
            'days' => $days,
            'transports' => $transports,
            'hebergements' => $hebergements,
            'generated_at' => now(),
        ];
    }

    private function buildIcs(Voyage $voyage): string
    {
        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Triply//Itineraire//FR',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:'.$this->escapeText((string) $voyage->titre),
        ];

        $stamp = now()->utc();

        // Étapes : événements horodatés en heure locale flottante, empilés par
        // durée à partir de 09:00 chaque jour.
        foreach ($voyage->journees->sortBy('numero_jour') as $journee) {
            if (! $journee->date_jour) {
                continue;
            }

            $cursor = Carbon::parse($journee->date_jour)->setTime(9, 0);
            foreach ($journee->etapes->sortBy('ordre') as $etape) {
                $hours = $this->parseDurationHours($etape->temps_estime);
                $startLocal = $cursor->copy();
                $endLocal = $cursor->copy()->addMinutes((int) round($hours * 60));

                $lines = array_merge($lines, $this->buildEvent(
                    uid: 'etape-'.$etape->id.'@triply',
                    stamp: $stamp,
                    summary: (string) $etape->titre,
                    location: (string) ($etape->ville ?? ''),
                    description: $this->etapeDescription($etape->temps_estime, $etape->prix_estime),
                    startLocal: $startLocal,
                    endLocal: $endLocal,
                ));

                $cursor = $endLocal;
            }
        }

        // Transports : événements horodatés en UTC (datetimes réels).
        foreach ($voyage->transports->sortBy('depart_le') as $transport) {
            if (! $transport->depart_le) {
                continue;
            }
            $depart = Carbon::parse($transport->depart_le);
            $arrivee = $transport->arrivee_le ? Carbon::parse($transport->arrivee_le) : $depart->copy()->addHours(2);

            $summary = trim(($transport->type ?: 'Transport').' '.($transport->depart_lieu ?? '').' → '.($transport->arrivee_lieu ?? ''));
            $lines = array_merge($lines, $this->buildEventUtc(
                uid: 'transport-'.$transport->id.'@triply',
                stamp: $stamp,
                summary: $summary,
                location: (string) ($transport->depart_lieu ?? ''),
                description: '',
                startUtc: $depart,
                endUtc: $arrivee,
            ));
        }

        // Hébergements : check-in / check-out.
        foreach ($voyage->hebergements->sortBy('arrivee_le') as $hebergement) {
            if ($hebergement->arrivee_le) {
                $checkin = Carbon::parse($hebergement->arrivee_le);
                $lines = array_merge($lines, $this->buildEventUtc(
                    uid: 'hotel-in-'.$hebergement->id.'@triply',
                    stamp: $stamp,
                    summary: 'Check-in : '.($hebergement->nom ?: 'Hébergement'),
                    location: (string) ($hebergement->adresse ?? $hebergement->ville ?? ''),
                    description: '',
                    startUtc: $checkin,
                    endUtc: $checkin->copy()->addHour(),
                ));
            }
            if ($hebergement->depart_le) {
                $checkout = Carbon::parse($hebergement->depart_le);
                $lines = array_merge($lines, $this->buildEventUtc(
                    uid: 'hotel-out-'.$hebergement->id.'@triply',
                    stamp: $stamp,
                    summary: 'Check-out : '.($hebergement->nom ?: 'Hébergement'),
                    location: (string) ($hebergement->adresse ?? $hebergement->ville ?? ''),
                    description: '',
                    startUtc: $checkout,
                    endUtc: $checkout->copy()->addHour(),
                ));
            }
        }

        $lines[] = 'END:VCALENDAR';

        return implode("\r\n", array_map([$this, 'foldLine'], $lines))."\r\n";
    }

    /**
     * @return array<int, string>
     */
    private function buildEvent(string $uid, CarbonInterface $stamp, string $summary, string $location, string $description, CarbonInterface $startLocal, CarbonInterface $endLocal): array
    {
        $event = [
            'BEGIN:VEVENT',
            'UID:'.$uid,
            'DTSTAMP:'.$stamp->format('Ymd\THis\Z'),
            'DTSTART:'.$startLocal->format('Ymd\THis'),
            'DTEND:'.$endLocal->format('Ymd\THis'),
            'SUMMARY:'.$this->escapeText($summary),
        ];
        if ($location !== '') {
            $event[] = 'LOCATION:'.$this->escapeText($location);
        }
        if ($description !== '') {
            $event[] = 'DESCRIPTION:'.$this->escapeText($description);
        }
        $event[] = 'END:VEVENT';

        return $event;
    }

    /**
     * @return array<int, string>
     */
    private function buildEventUtc(string $uid, CarbonInterface $stamp, string $summary, string $location, string $description, CarbonInterface $startUtc, CarbonInterface $endUtc): array
    {
        $event = [
            'BEGIN:VEVENT',
            'UID:'.$uid,
            'DTSTAMP:'.$stamp->format('Ymd\THis\Z'),
            'DTSTART:'.$startUtc->copy()->utc()->format('Ymd\THis\Z'),
            'DTEND:'.$endUtc->copy()->utc()->format('Ymd\THis\Z'),
            'SUMMARY:'.$this->escapeText($summary),
        ];
        if ($location !== '') {
            $event[] = 'LOCATION:'.$this->escapeText($location);
        }
        if ($description !== '') {
            $event[] = 'DESCRIPTION:'.$this->escapeText($description);
        }
        $event[] = 'END:VEVENT';

        return $event;
    }

    private function etapeDescription(?string $duration, mixed $price): string
    {
        $parts = [];
        if ($duration !== null && trim($duration) !== '' && $duration !== '0h') {
            $parts[] = 'Durée : '.$duration;
        }
        if (is_numeric($price) && (float) $price > 0) {
            $parts[] = 'Budget estimé : '.(int) $price.' EUR';
        }

        return implode(' — ', $parts);
    }

    private function parseDurationHours(?string $duration): float
    {
        if ($duration === null) {
            return 1.0;
        }

        $normalized = trim(str_ireplace('h', '', $duration));
        if ($normalized === '' || ! is_numeric($normalized)) {
            return 1.0;
        }

        $hours = (float) $normalized;

        return $hours > 0 ? $hours : 1.0;
    }

    private function escapeText(string $value): string
    {
        $value = str_replace('\\', '\\\\', $value);
        $value = str_replace(["\r\n", "\n", "\r"], '\\n', $value);
        $value = str_replace(',', '\\,', $value);
        $value = str_replace(';', '\\;', $value);

        return $value;
    }

    /**
     * Replie les lignes ICS à 75 octets (RFC 5545), continuation par espace.
     */
    private function foldLine(string $line): string
    {
        if (strlen($line) <= 75) {
            return $line;
        }

        $folded = '';
        $current = '';
        foreach (mb_str_split($line) as $char) {
            if (strlen($current.$char) > 74) {
                $folded .= $current."\r\n ";
                $current = $char;
            } else {
                $current .= $char;
            }
        }

        return $folded.$current;
    }

    private function filename(Voyage $voyage, string $extension): string
    {
        $slug = Str::slug((string) $voyage->titre) ?: 'voyage';

        return 'triply-'.$slug.'-'.$voyage->id.'.'.$extension;
    }
}
