<?php

namespace App\Services;

use App\Models\Hebergement;
use App\Models\Transport;
use App\Models\Voyage;
use App\Services\Contracts\CurrencyConverterInterface;
use App\Services\Contracts\TripAutoSelectionServiceInterface;
use App\Services\Integrations\AmadeusClient;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Implémentation best-effort de la sélection automatique vol + hôtel
 * « le moins cher selon les dates ». Toutes les erreurs sont capturées et
 * loggées en warning — la création du voyage reste prioritaire.
 */
class TripAutoSelectionService implements TripAutoSelectionServiceInterface
{
    public function __construct(
        private readonly AmadeusClient $amadeus,
        private readonly CurrencyConverterInterface $currencyConverter,
    ) {
    }

    public function runForTrip(Voyage $voyage): void
    {
        $snapshot = is_array($voyage->plan_snapshot) ? $voyage->plan_snapshot : [];
        $needs = is_array($snapshot['plannerNeeds'] ?? null) ? $snapshot['plannerNeeds'] : [];
        $wantsFlight = (bool) ($needs['flights'] ?? false);
        $wantsHotel = (bool) ($needs['hotels'] ?? false);

        if (! $wantsFlight && ! $wantsHotel) {
            return;
        }

        Log::info('TripAutoSelection: starting', [
            'voyage_id' => $voyage->id,
            'wantsFlight' => $wantsFlight,
            'wantsHotel' => $wantsHotel,
            'originIata' => $snapshot['origin']['iataCode'] ?? null,
            'destIata' => $snapshot['destinationSummary']['iataCode'] ?? null,
            'destCity' => $snapshot['destinationSummary']['cityName'] ?? $voyage->destination,
        ]);

        if ($wantsFlight) {
            try {
                $this->autoSelectCheapestFlight($voyage, $snapshot);
            } catch (Throwable $e) {
                Log::warning('TripAutoSelection: flight auto-select failed', [
                    'voyage_id' => $voyage->id,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        if ($wantsHotel) {
            try {
                // Recharger le snapshot au cas où la sélection vol l'a modifié
                $voyage->refresh();
                $snapshot = is_array($voyage->plan_snapshot) ? $voyage->plan_snapshot : [];
                $this->autoSelectCheapestHotel($voyage, $snapshot);
            } catch (Throwable $e) {
                Log::warning('TripAutoSelection: hotel auto-select failed', [
                    'voyage_id' => $voyage->id,
                    'message' => $e->getMessage(),
                ]);
            }
        }
    }

    private function autoSelectCheapestFlight(Voyage $voyage, array $snapshot): void
    {
        if ($voyage->transports()->exists()) {
            return; // Déjà des vols, ne pas écraser
        }

        $originIata = $this->extractIata($snapshot['origin']['iataCode'] ?? null);
        $destIata = $this->extractIata(
            $snapshot['destinationSummary']['iataCode']
            ?? $snapshot['flightSummary']['destinationIata']
            ?? null
        );

        if (! $originIata || ! $destIata) {
            // Tentative de résolution via le nom de ville destination si nécessaire
            if (! $destIata) {
                $cityName = (string) ($snapshot['destinationSummary']['cityName'] ?? $voyage->destination ?? '');
                if ($cityName !== '') {
                    $resolved = $this->amadeus->iataLookup($cityName, 'AIRPORT,CITY');
                    foreach ($resolved as $r) {
                        $code = (string) ($r['iataCode'] ?? '');
                        if ($code !== '' && strlen($code) === 3) {
                            $destIata = strtoupper($code);
                            break;
                        }
                    }
                }
            }
            if (! $originIata || ! $destIata) {
                return;
            }
        }

        $startDate = $voyage->date_debut ? Carbon::parse($voyage->date_debut)->toDateString() : null;
        $endDate = $voyage->date_fin ? Carbon::parse($voyage->date_fin)->toDateString() : null;
        if (! $startDate) {
            return;
        }

        $adults = max(1, (int) $voyage->nb_voyageurs);
        $maxPrice = (int) max(0, (int) $voyage->budget_total);

        $prefs = is_array($snapshot['plannerPreferences'] ?? null) ? $snapshot['plannerPreferences'] : [];
        $request = [
            'originLocationCode' => $originIata,
            'destinationLocationCode' => $destIata,
            'departureDate' => $startDate,
            'returnDate' => $endDate,
            'adults' => $adults,
            'max' => 10,
        ];
        if ($maxPrice > 0) {
            $request['maxPrice'] = $maxPrice;
        }
        if (! empty($prefs['flightNonStop'])) {
            $request['nonStop'] = true;
        }
        if (isset($prefs['flightTravelClass']) && is_string($prefs['flightTravelClass'])) {
            $request['travelClass'] = $prefs['flightTravelClass'];
        }

        $response = $this->amadeus->flightOffers($request);
        $offers = is_array($response['data'] ?? null) ? $response['data'] : [];
        if ($offers === []) {
            return;
        }

        // Tri par prix croissant
        usort($offers, function ($a, $b) {
            $pa = (float) ($a['price']['grandTotal'] ?? PHP_INT_MAX);
            $pb = (float) ($b['price']['grandTotal'] ?? PHP_INT_MAX);
            return $pa <=> $pb;
        });
        $cheapest = $offers[0];

        $outbound = $cheapest['itineraries'][0] ?? null;
        $segments = is_array($outbound['segments'] ?? null) ? $outbound['segments'] : [];
        if ($segments === []) {
            return;
        }
        $firstSeg = $segments[0];
        $lastSeg = $segments[count($segments) - 1];
        $carrierCode = (string) ($firstSeg['carrierCode'] ?? '');
        $flightNumber = trim($carrierCode . (string) ($firstSeg['number'] ?? ''));
        $price = (int) round((float) ($cheapest['price']['grandTotal'] ?? 0));
        $currency = (string) ($cheapest['price']['currency'] ?? 'EUR');
        $normalized = $this->normalizePriceToEur($price, $currency);

        Transport::query()->create([
            'voyage_id' => $voyage->id,
            'type' => $carrierCode !== '' ? $carrierCode : 'Vol',
            'depart_lieu' => (string) ($firstSeg['departure']['iataCode'] ?? $originIata),
            'arrivee_lieu' => (string) ($lastSeg['arrival']['iataCode'] ?? $destIata),
            'depart_le' => (string) ($firstSeg['departure']['at'] ?? $startDate),
            'arrivee_le' => (string) ($lastSeg['arrival']['at'] ?? $startDate),
            'prix' => $normalized['price'],
            'devise' => $normalized['currency'],
            'information_supplementaire' => json_encode([
                'flightNumber' => $flightNumber,
                'stops' => max(0, count($segments) - 1),
                'duration' => $outbound['duration'] ?? null,
                'offerId' => $cheapest['id'] ?? null,
                'autoSelected' => true,
            ], JSON_UNESCAPED_UNICODE),
        ]);

        $snapshot['flightSummary'] = [
            'carrier' => $carrierCode,
            'price' => (string) $normalized['price'],
            'currency' => $normalized['currency'],
            'originIata' => $originIata,
            'destinationIata' => $destIata,
            'outboundAt' => (string) ($firstSeg['departure']['at'] ?? ''),
            'returnAt' => isset($cheapest['itineraries'][1]['segments'][0]['departure']['at'])
                ? (string) $cheapest['itineraries'][1]['segments'][0]['departure']['at']
                : '',
        ];
        $voyage->plan_snapshot = $snapshot;
        $voyage->save();
    }

    private function autoSelectCheapestHotel(Voyage $voyage, array $snapshot): void
    {
        if ($voyage->hebergements()->exists()) {
            return;
        }

        $cityCode = $this->extractIata(
            $snapshot['destinationSummary']['iataCode']
            ?? $snapshot['hotelSummary']['cityCode']
            ?? null
        );

        if (! $cityCode) {
            $cityName = (string) ($snapshot['destinationSummary']['cityName'] ?? $voyage->destination ?? '');
            if ($cityName !== '') {
                $resolved = $this->amadeus->iataLookup($cityName, 'CITY');
                foreach ($resolved as $r) {
                    $code = (string) ($r['iataCode'] ?? '');
                    if ($code !== '' && strlen($code) === 3) {
                        $cityCode = strtoupper($code);
                        break;
                    }
                }
            }
        }
        if (! $cityCode) {
            return;
        }

        $checkIn = $voyage->date_debut ? Carbon::parse($voyage->date_debut)->toDateString() : null;
        $checkOut = $voyage->date_fin ? Carbon::parse($voyage->date_fin)->toDateString() : null;
        if (! $checkIn || ! $checkOut) {
            return;
        }

        $adults = max(1, (int) $voyage->nb_voyageurs);
        $prefs = is_array($snapshot['plannerPreferences'] ?? null) ? $snapshot['plannerPreferences'] : [];
        $body = [
            'cityCode' => $cityCode,
            'checkInDate' => $checkIn,
            'checkOutDate' => $checkOut,
            'adults' => $adults,
            'roomQuantity' => 1,
        ];
        $maxPrice = (int) max(0, (int) $voyage->budget_total);
        if ($maxPrice > 0) {
            $body['maxPrice'] = $maxPrice;
        }
        $minStars = isset($prefs['hotelMinStars']) ? (int) $prefs['hotelMinStars'] : 0;
        if ($minStars >= 1 && $minStars <= 5) {
            // Amadeus accepte une liste de ratings ("3,4,5"). On garde >= min étoiles.
            $allowed = [];
            for ($s = $minStars; $s <= 5; $s++) {
                $allowed[] = (string) $s;
            }
            $body['preferences'] = ['hôtel de luxe'];
            $body['ratings'] = implode(',', $allowed);
        }

        $response = $this->amadeus->hotelOffersSearch($body);
        $offers = is_array($response['data'] ?? null) ? $response['data'] : [];
        if ($offers === []) {
            return;
        }

        usort($offers, function ($a, $b) {
            $pa = (float) ($a['offers'][0]['price']['total'] ?? PHP_INT_MAX);
            $pb = (float) ($b['offers'][0]['price']['total'] ?? PHP_INT_MAX);
            return $pa <=> $pb;
        });
        $cheapest = $offers[0];

        $hotel = $cheapest['hotel'] ?? [];
        $offer = $cheapest['offers'][0] ?? [];
        $name = (string) ($hotel['name'] ?? 'Hôtel');
        $address = $hotel['address'] ?? [];
        $addressLine = is_array($address['lines'] ?? null) ? implode(', ', $address['lines']) : '';
        $latitude = isset($hotel['latitude']) ? (float) $hotel['latitude'] : null;
        $longitude = isset($hotel['longitude']) ? (float) $hotel['longitude'] : null;
        $price = (int) round((float) ($offer['price']['total'] ?? 0));
        $currency = (string) ($offer['price']['currency'] ?? 'EUR');
        $normalized = $this->normalizePriceToEur($price, $currency);

        Hebergement::query()->create([
            'voyage_id' => $voyage->id,
            'type' => 'hotel',
            'nom' => $name,
            'adresse' => $addressLine !== '' ? $addressLine : ($hotel['cityCode'] ?? $cityCode),
            'code_postal' => null,
            'ville' => (string) ($address['cityName'] ?? $snapshot['destinationSummary']['cityName'] ?? ''),
            'latitude' => $latitude,
            'longitude' => $longitude,
            'arrivee_le' => $checkIn,
            'depart_le' => $checkOut,
            'prix' => $normalized['price'],
            'devise' => $normalized['currency'],
            'informations_supplementaire' => json_encode([
                'offerId' => $offer['id'] ?? null,
                'hotelId' => $hotel['hotelId'] ?? null,
                'autoSelected' => true,
            ], JSON_UNESCAPED_UNICODE),
        ]);

        $snapshot['hotelSummary'] = [
            'name' => $name,
            'address' => $addressLine,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'cityCode' => $cityCode,
            'cityName' => (string) ($address['cityName'] ?? ''),
            'totalPrice' => (string) $normalized['price'],
            'currency' => $normalized['currency'],
            'checkInDate' => $checkIn,
            'checkOutDate' => $checkOut,
        ];
        $voyage->plan_snapshot = $snapshot;
        $voyage->save();
    }

    private function extractIata(mixed $raw): ?string
    {
        if (! is_string($raw)) {
            return null;
        }
        $clean = strtoupper(trim($raw));
        if (strlen($clean) !== 3 || ! ctype_alpha($clean)) {
            return null;
        }
        return $clean;
    }

    /**
     * @return array{price: int, currency: string}
     */
    private function normalizePriceToEur(float $amount, string $currency): array
    {
        $from = strtoupper(trim($currency));
        if ($from === '' || $from === 'EUR') {
            return ['price' => (int) round($amount), 'currency' => 'EUR'];
        }

        $eur = $this->currencyConverter->convert($amount, $from, 'EUR');

        return ['price' => (int) round($eur), 'currency' => 'EUR'];
    }
}
