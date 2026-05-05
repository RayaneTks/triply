<?php

namespace App\Services\Integrations;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Client Amadeus (token + appels) — secrets côté serveur uniquement.
 */
class AmadeusClient
{
    private function baseUrl(): string
    {
        return rtrim((string) config('integrations.amadeus.base_url'), '/');
    }

    public function getAccessToken(): string
    {
        $clientId = config('integrations.amadeus.client_id');
        $clientSecret = config('integrations.amadeus.client_secret');
        if (! is_string($clientId) || $clientId === '' || ! is_string($clientSecret) || $clientSecret === '') {
            throw new \RuntimeException('AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET manquants.');
        }

        return Cache::remember('integrations:amadeus:access_token', 1700, function () use ($clientId, $clientSecret) {
            $res = Http::asForm()->timeout(20)->post($this->baseUrl().'/v1/security/oauth2/token', [
                'grant_type' => 'client_credentials',
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
            ]);
            if (! $res->successful()) {
                Log::warning('Amadeus token failed', ['body' => $res->body()]);

                throw new \RuntimeException('Échec authentification Amadeus.');
            }
            $token = $res->json('access_token');
            if (! is_string($token) || $token === '') {
                throw new \RuntimeException('Token Amadeus invalide.');
            }

            return $token;
        });
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function locationsByKeyword(string $keyword): array
    {
        $keyword = trim($keyword);
        if (strlen($keyword) < 2) {
            return [];
        }
        $token = $this->getAccessToken();
        $url = $this->baseUrl().'/v1/reference-data/locations?subType=CITY,AIRPORT&keyword='.rawurlencode($keyword).'&page[limit]=10&view=FULL';
        $res = Http::withToken($token)->acceptJson()->timeout(25)->get($url);
        if (! $res->successful()) {
            Log::warning('Amadeus locations', ['status' => $res->status(), 'body' => $res->body()]);

            return [];
        }

        $data = $res->json('data');
        if (! is_array($data)) {
            return [];
        }

        return array_map(fn ($loc) => $this->normalizeLocation(is_array($loc) ? $loc : []), $data);
    }

    /**
     * @param  array<string, mixed>  $flightRequestBody
     */
    public function flightOffers(array $flightRequestBody): array
    {
        $token = $this->getAccessToken();
        $body = array_merge($flightRequestBody, ['currencyCode' => 'EUR']);
        $res = Http::withToken($token)->acceptJson()->timeout(60)->post(
            $this->baseUrl().'/v2/shopping/flight-offers',
            $body
        );

        return $res->json() ?? ['error' => 'Réponse vide', 'details' => $res->body()];
    }

    /**
     * @return array{locations: array<int, array<string, mixed>>}
     */
    public function hotelsByGeocode(string $lat, string $lng, ?string $ratings): array
    {
        $token = $this->getAccessToken();
        $url = $this->baseUrl().'/v1/reference-data/locations/hotels/by-geocode?latitude='.$lat.'&longitude='.$lng.'&radius=15';
        if ($ratings !== null && trim($ratings) !== '') {
            $url .= '&ratings='.rawurlencode(trim($ratings));
        }
        $res = Http::withToken($token)->acceptJson()->timeout(30)->get($url);
        if (! $res->successful()) {
            return ['locations' => []];
        }
        $data = $res->json('data');
        if (! is_array($data)) {
            return ['locations' => []];
        }
        $locations = [];
        foreach ($data as $h) {
            if (! is_array($h)) {
                continue;
            }
            $geo = is_array($h['geoCode'] ?? null) ? $h['geoCode'] : [];
            $latN = $geo['latitude'] ?? $geo['lat'] ?? 0;
            $lngN = $geo['longitude'] ?? $geo['lng'] ?? $geo['lon'] ?? 0;
            $addr = $h['address'] ?? null;
            $formatted = $this->formatAddress(is_array($addr) ? $addr : null);
            $locations[] = [
                'id' => $h['hotelId'] ?? $h['iataCode'] ?? uniqid('h_', true),
                'title' => $h['name'] ?? 'Hôtel',
                'coordinates' => ['latitude' => (float) $latN, 'longitude' => (float) $lngN],
                'type' => 'hotel',
                ...($formatted !== null ? ['address' => $formatted] : []),
            ];
        }

        return ['locations' => $locations];
    }

    /**
     * Recherche offres hôtels (logique alignée sur l’ancienne route Next).
     *
     * @param  array<string, mixed>  $body
     * @return array<string, mixed>
     */
    public function hotelOffersSearch(array $body): array
    {
        $cityCode = isset($body['cityCode']) ? (string) $body['cityCode'] : '';
        $checkInDate = isset($body['checkInDate']) ? (string) $body['checkInDate'] : '';
        $checkOutDate = isset($body['checkOutDate']) ? (string) $body['checkOutDate'] : '';
        if ($cityCode === '' || $checkInDate === '' || $checkOutDate === '') {
            return ['error' => 'Paramètres manquants : cityCode, checkInDate, checkOutDate requis'];
        }

        $adults = (int) ($body['adults'] ?? 1);
        $roomQuantity = (int) ($body['roomQuantity'] ?? 1);
        $maxPrice = isset($body['maxPrice']) ? (int) $body['maxPrice'] : 0;
        $preferences = is_array($body['preferences'] ?? null) ? $body['preferences'] : [];
        $boardTypeFromBody = $body['boardType'] ?? $body['mealRegime'] ?? null;

        $token = $this->getAccessToken();
        $prefSet = [];
        foreach ($preferences as $p) {
            if (is_string($p)) {
                $prefSet[strtolower($p)] = true;
            }
        }
        $amenities = [];
        $ratings = null;
        if (isset($prefSet['spa/piscine'])) {
            $amenities[] = 'SWIMMING_POOL';
            $amenities[] = 'SAUNA';
        }
        if (isset($prefSet['plage'])) {
            $amenities[] = 'BEACH';
        }
        if (isset($prefSet['animaux domestiques'])) {
            $amenities[] = 'PETS_ALLOWED';
        }
        if (isset($prefSet['réservé aux adultes'])) {
            $amenities[] = 'NO_KID_ALLOWED';
        }
        if (isset($prefSet['wi-fi']) || isset($prefSet['équipement'])) {
            $amenities[] = 'WIFI';
        }
        if (isset($prefSet['équipement'])) {
            $amenities[] = 'FITNESS_CENTER';
        }
        if (isset($prefSet['hôtel de luxe'])) {
            $ratings = '5';
        }

        $hotelListParams = [
            'cityCode' => $cityCode,
            'radius' => '50',
            'radiusUnit' => 'KM',
        ];
        if ($amenities !== []) {
            $hotelListParams['amenities'] = implode(',', array_slice($amenities, 0, 3));
        }
        if ($ratings !== null) {
            $hotelListParams['ratings'] = $ratings;
        }

        $hotelListUrl = $this->baseUrl().'/v1/reference-data/locations/hotels/by-city?'.http_build_query($hotelListParams);
        $hotelListResponse = Http::withToken($token)->acceptJson()->timeout(40)->get($hotelListUrl);
        if (! $hotelListResponse->successful()) {
            return ['error' => 'Erreur liste hôtels', 'details' => $hotelListResponse->json() ?? $hotelListResponse->body()];
        }

        $hotelListData = $hotelListResponse->json();
        $hotels = is_array($hotelListData['data'] ?? null) ? $hotelListData['data'] : [];
        $hotelIds = [];
        foreach (array_slice($hotels, 0, 40) as $h) {
            if (is_array($h) && isset($h['hotelId']) && is_string($h['hotelId'])) {
                $hotelIds[] = $h['hotelId'];
            }
        }

        if ($hotelIds === [] && ($amenities !== [] || $ratings !== null)) {
            $fallbackUrl = $this->baseUrl().'/v1/reference-data/locations/hotels/by-city?'.http_build_query([
                'cityCode' => $cityCode,
                'radius' => '50',
                'radiusUnit' => 'KM',
            ]);
            $fallbackRes = Http::withToken($token)->acceptJson()->timeout(40)->get($fallbackUrl);
            $fallbackData = $fallbackRes->json();
            $hotels = is_array($fallbackData['data'] ?? null) ? $fallbackData['data'] : [];
            foreach (array_slice($hotels, 0, 40) as $h) {
                if (is_array($h) && isset($h['hotelId']) && is_string($h['hotelId'])) {
                    $hotelIds[] = $h['hotelId'];
                }
            }
        }

        if ($hotelIds === []) {
            return ['data' => [], 'dictionaries' => ['hotels' => new \stdClass]];
        }

        $hotelMetaById = [];
        foreach ($hotels as $h) {
            if (! is_array($h) || ! isset($h['hotelId']) || ! is_string($h['hotelId'])) {
                continue;
            }
            $hid = $h['hotelId'];
            $hotelMetaById[$hid] = [
                'address' => is_array($h['address'] ?? null) ? $h['address'] : null,
                'formattedAddress' => $this->formatAddress(is_array($h['address'] ?? null) ? $h['address'] : null),
                'geoCode' => is_array($h['geoCode'] ?? null) ? $h['geoCode'] : null,
            ];
        }

        $params = [
            'hotelIds' => implode(',', $hotelIds),
            'adults' => (string) max(1, $adults),
            'checkInDate' => $checkInDate,
            'checkOutDate' => $checkOutDate,
            'roomQuantity' => (string) max(1, $roomQuantity),
            'currency' => 'EUR',
            'bestRateOnly' => 'false',
        ];
        if ($maxPrice > 0) {
            $params['priceRange'] = '0-'.$maxPrice;
        }
        $allowedBoard = ['ROOM_ONLY', 'BREAKFAST', 'HALF_BOARD', 'FULL_BOARD', 'ALL_INCLUSIVE'];
        $boardFromRequest = is_string($boardTypeFromBody) && in_array(trim($boardTypeFromBody), $allowedBoard, true)
            ? trim($boardTypeFromBody) : '';
        if ($boardFromRequest !== '') {
            $params['boardType'] = $boardFromRequest;
        } elseif (isset($prefSet['petit déjeuner inclus'])) {
            $params['boardType'] = 'BREAKFAST';
        }

        $offersUrl = $this->baseUrl().'/v3/shopping/hotel-offers?'.http_build_query($params);
        $offersResponse = Http::withToken($token)->acceptJson()->timeout(60)->get($offersUrl);
        if (! $offersResponse->successful()) {
            return ['error' => 'Erreur recherche hôtels', 'details' => $offersResponse->json() ?? $offersResponse->body()];
        }

        $offersData = $offersResponse->json();
        if (isset($offersData['data']) && is_array($offersData['data'])) {
            $offersData['data'] = array_map(function ($entry) use ($hotelMetaById) {
                if (! is_array($entry)) {
                    return $entry;
                }
                $hotel = isset($entry['hotel']) && is_array($entry['hotel']) ? $entry['hotel'] : null;
                if ($hotel === null) {
                    return $entry;
                }
                $hotelId = isset($hotel['hotelId']) && is_string($hotel['hotelId']) ? $hotel['hotelId'] : '';
                $extra = $hotelId !== '' && isset($hotelMetaById[$hotelId]) ? $hotelMetaById[$hotelId] : null;
                if ($extra === null) {
                    return $entry;
                }
                $lat = is_array($extra['geoCode'] ?? null) && isset($extra['geoCode']['latitude']) ? $extra['geoCode']['latitude'] : null;
                $lng = is_array($extra['geoCode'] ?? null) && isset($extra['geoCode']['longitude']) ? $extra['geoCode']['longitude'] : null;
                $hotelOut = $hotel;
                if (is_array($extra['address'] ?? null)) {
                    $hotelOut['address'] = $extra['address'];
                }
                if (isset($extra['formattedAddress']) && is_string($extra['formattedAddress'])) {
                    $hotelOut['formattedAddress'] = $extra['formattedAddress'];
                }
                if ($lat !== null) {
                    $hotelOut['latitude'] = $lat;
                }
                if ($lng !== null) {
                    $hotelOut['longitude'] = $lng;
                }

                return array_merge($entry, ['hotel' => $hotelOut]);
            }, $offersData['data']);
        }

        return is_array($offersData) ? $offersData : ['error' => 'Réponse invalide'];
    }

    /**
     * @param  array<string, mixed>  $loc
     * @return array<string, mixed>
     */
    private function normalizeLocation(array $loc): array
    {
        $address = is_array($loc['address'] ?? null) ? $loc['address'] : [];
        $cityName = (string) ($address['cityName'] ?? $loc['cityName'] ?? $loc['name'] ?? '');
        $countryName = (string) ($address['countryName'] ?? $loc['countryName'] ?? '');
        $rawGeo = is_array($loc['geoCode'] ?? null) ? $loc['geoCode'] : [];
        $lat = isset($rawGeo['latitude']) ? (float) $rawGeo['latitude'] : (isset($rawGeo['lat']) ? (float) $rawGeo['lat'] : NAN);
        $lng = isset($rawGeo['longitude']) ? (float) $rawGeo['longitude'] : (isset($rawGeo['lng']) ? (float) $rawGeo['lng'] : NAN);
        $geoCode = is_finite($lat) && is_finite($lng) ? ['latitude' => $lat, 'longitude' => $lng] : null;
        $base = [
            'id' => $loc['id'] ?? $loc['iataCode'] ?? 'unknown',
            'name' => $loc['name'] ?? $cityName,
            'iataCode' => $loc['iataCode'] ?? '',
            'subType' => $loc['subType'] ?? 'CITY',
            'address' => ['cityName' => $cityName, 'countryName' => $countryName],
        ];
        if ($geoCode !== null) {
            $base['geoCode'] = $geoCode;
        }

        return $base;
    }

    /**
     * @param  array<string, mixed>|null  $address
     */
    private function formatAddress(?array $address): ?string
    {
        if ($address === null) {
            return null;
        }
        $lines = [];
        if (isset($address['lines']) && is_array($address['lines'])) {
            foreach ($address['lines'] as $line) {
                if (is_string($line) && trim($line) !== '') {
                    $lines[] = trim($line);
                }
            }
        }
        $city = isset($address['cityName']) && is_string($address['cityName']) ? trim($address['cityName']) : '';
        $zip = isset($address['postalCode']) && is_string($address['postalCode']) ? trim($address['postalCode']) : '';
        $country = isset($address['countryCode']) && is_string($address['countryCode']) ? trim($address['countryCode']) : '';
        $cityBlock = trim(implode(' ', array_filter([$zip, $city])));
        $all = [...$lines, $cityBlock, $country];
        $all = array_values(array_filter($all, fn ($x) => $x !== ''));

        return $all === [] ? null : implode(', ', $all);
    }

    /**
     * Première ville trouvée pour géocoder une chaîne (assistant).
     *
     * @return array{lat: float, lng: float, name: string}|null
     */
    public function firstCityGeo(string $keyword): ?array
    {
        $keyword = trim($keyword);
        if ($keyword === '') {
            return null;
        }
        try {
            $token = $this->getAccessToken();
            $url = $this->baseUrl().'/v1/reference-data/locations?subType=CITY&keyword='.rawurlencode($keyword).'&page[limit]=1';
            $res = Http::withToken($token)->acceptJson()->timeout(20)->get($url);
            if (! $res->successful()) {
                return null;
            }
            $first = $res->json('data.0');
            if (! is_array($first)) {
                return null;
            }
            $geo = $first['geoCode'] ?? null;
            if (! is_array($geo)) {
                return null;
            }
            $lat = isset($geo['latitude']) ? (float) $geo['latitude'] : null;
            $lng = isset($geo['longitude']) ? (float) $geo['longitude'] : null;
            if ($lat === null || $lng === null || ! is_finite($lat) || ! is_finite($lng)) {
                return null;
            }
            $name = is_string($first['name'] ?? null) ? $first['name'] : $keyword;

            return ['lat' => $lat, 'lng' => $lng, 'name' => $name];
        } catch (\Throwable) {
            return null;
        }
    }
}
