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
    /**
     * Static city → IATA map (major hubs). Used as a deterministic fallback when
     * Amadeus is unreachable or returns no IATA-coded results. Keys are normalized
     * (lowercase, no accents) via self::normalizeIataKey().
     *
     * Value tuple: [iataCode, displayName, countryName, latitude, longitude]
     */
    private const STATIC_IATA_MAP = [
        // France
        'paris' => ['CDG', 'Paris Charles de Gaulle', 'France', 49.0097, 2.5479],
        'marseille' => ['MRS', 'Marseille Provence', 'France', 43.4393, 5.2214],
        'lyon' => ['LYS', 'Lyon Saint-Exupéry', 'France', 45.7256, 5.0811],
        'nice' => ['NCE', 'Nice Côte d’Azur', 'France', 43.6584, 7.2159],
        'toulouse' => ['TLS', 'Toulouse-Blagnac', 'France', 43.6291, 1.3638],
        'bordeaux' => ['BOD', 'Bordeaux-Mérignac', 'France', 44.8283, -0.7156],
        'nantes' => ['NTE', 'Nantes Atlantique', 'France', 47.1532, -1.6109],
        'strasbourg' => ['SXB', 'Strasbourg-Entzheim', 'France', 48.5383, 7.6280],
        // UK / Ireland
        'londres' => ['LHR', 'London Heathrow', 'Royaume-Uni', 51.4700, -0.4543],
        'london' => ['LHR', 'London Heathrow', 'Royaume-Uni', 51.4700, -0.4543],
        'manchester' => ['MAN', 'Manchester', 'Royaume-Uni', 53.3537, -2.2750],
        'edimbourg' => ['EDI', 'Edinburgh', 'Royaume-Uni', 55.9500, -3.3725],
        'dublin' => ['DUB', 'Dublin', 'Irlande', 53.4213, -6.2701],
        // Spain
        'madrid' => ['MAD', 'Adolfo Suárez Madrid-Barajas', 'Espagne', 40.4936, -3.5668],
        'barcelone' => ['BCN', 'Barcelona-El Prat', 'Espagne', 41.2974, 2.0833],
        'barcelona' => ['BCN', 'Barcelona-El Prat', 'Espagne', 41.2974, 2.0833],
        'seville' => ['SVQ', 'Sevilla', 'Espagne', 37.4180, -5.8931],
        'valence' => ['VLC', 'Valencia', 'Espagne', 39.4893, -0.4816],
        'valencia' => ['VLC', 'Valencia', 'Espagne', 39.4893, -0.4816],
        'malaga' => ['AGP', 'Málaga-Costa del Sol', 'Espagne', 36.6749, -4.4991],
        'palma' => ['PMI', 'Palma de Mallorca', 'Espagne', 39.5517, 2.7388],
        'bilbao' => ['BIO', 'Bilbao', 'Espagne', 43.3011, -2.9106],
        // Portugal
        'lisbonne' => ['LIS', 'Lisboa Humberto Delgado', 'Portugal', 38.7813, -9.1359],
        'lisboa' => ['LIS', 'Lisboa Humberto Delgado', 'Portugal', 38.7813, -9.1359],
        'lisbon' => ['LIS', 'Lisboa Humberto Delgado', 'Portugal', 38.7813, -9.1359],
        'porto' => ['OPO', 'Porto Francisco Sá Carneiro', 'Portugal', 41.2481, -8.6814],
        'faro' => ['FAO', 'Faro', 'Portugal', 37.0144, -7.9659],
        // Italy
        'rome' => ['FCO', 'Roma Fiumicino', 'Italie', 41.8003, 12.2389],
        'roma' => ['FCO', 'Roma Fiumicino', 'Italie', 41.8003, 12.2389],
        'milan' => ['MXP', 'Milano Malpensa', 'Italie', 45.6306, 8.7281],
        'milano' => ['MXP', 'Milano Malpensa', 'Italie', 45.6306, 8.7281],
        'venise' => ['VCE', 'Venezia Marco Polo', 'Italie', 45.5053, 12.3519],
        'venezia' => ['VCE', 'Venezia Marco Polo', 'Italie', 45.5053, 12.3519],
        'naples' => ['NAP', 'Napoli Capodichino', 'Italie', 40.8860, 14.2908],
        'napoli' => ['NAP', 'Napoli Capodichino', 'Italie', 40.8860, 14.2908],
        'florence' => ['FLR', 'Firenze Peretola', 'Italie', 43.8100, 11.2051],
        'firenze' => ['FLR', 'Firenze Peretola', 'Italie', 43.8100, 11.2051],
        'bologne' => ['BLQ', 'Bologna Guglielmo Marconi', 'Italie', 44.5354, 11.2887],
        'palerme' => ['PMO', 'Palermo Falcone-Borsellino', 'Italie', 38.1759, 13.0910],
        'catane' => ['CTA', 'Catania Fontanarossa', 'Italie', 37.4668, 15.0664],
        // Germany / Central Europe
        'berlin' => ['BER', 'Berlin Brandenburg', 'Allemagne', 52.3667, 13.5033],
        'munich' => ['MUC', 'München Franz Josef Strauss', 'Allemagne', 48.3538, 11.7861],
        'frankfurt' => ['FRA', 'Frankfurt am Main', 'Allemagne', 50.0379, 8.5622],
        'francfort' => ['FRA', 'Frankfurt am Main', 'Allemagne', 50.0379, 8.5622],
        'hambourg' => ['HAM', 'Hamburg', 'Allemagne', 53.6304, 9.9882],
        'hamburg' => ['HAM', 'Hamburg', 'Allemagne', 53.6304, 9.9882],
        'cologne' => ['CGN', 'Köln/Bonn', 'Allemagne', 50.8659, 7.1427],
        'duesseldorf' => ['DUS', 'Düsseldorf', 'Allemagne', 51.2895, 6.7668],
        // Benelux / Switzerland / Austria
        'amsterdam' => ['AMS', 'Amsterdam Schiphol', 'Pays-Bas', 52.3105, 4.7683],
        'bruxelles' => ['BRU', 'Brussels Airport', 'Belgique', 50.9014, 4.4844],
        'brussels' => ['BRU', 'Brussels Airport', 'Belgique', 50.9014, 4.4844],
        'geneve' => ['GVA', 'Genève Aéroport', 'Suisse', 46.2381, 6.1090],
        'geneva' => ['GVA', 'Genève Aéroport', 'Suisse', 46.2381, 6.1090],
        'zurich' => ['ZRH', 'Zürich Kloten', 'Suisse', 47.4647, 8.5492],
        'vienne' => ['VIE', 'Vienna International', 'Autriche', 48.1103, 16.5697],
        'vienna' => ['VIE', 'Vienna International', 'Autriche', 48.1103, 16.5697],
        // Nordics
        'copenhague' => ['CPH', 'København Kastrup', 'Danemark', 55.6180, 12.6508],
        'copenhagen' => ['CPH', 'København Kastrup', 'Danemark', 55.6180, 12.6508],
        'stockholm' => ['ARN', 'Stockholm Arlanda', 'Suède', 59.6519, 17.9186],
        'oslo' => ['OSL', 'Oslo Gardermoen', 'Norvège', 60.1939, 11.1004],
        'helsinki' => ['HEL', 'Helsinki-Vantaa', 'Finlande', 60.3172, 24.9633],
        // East Europe
        'prague' => ['PRG', 'Praha Václav Havel', 'République tchèque', 50.1008, 14.2632],
        'budapest' => ['BUD', 'Budapest Ferenc Liszt', 'Hongrie', 47.4369, 19.2556],
        'varsovie' => ['WAW', 'Warszawa Chopin', 'Pologne', 52.1657, 20.9671],
        'warsaw' => ['WAW', 'Warszawa Chopin', 'Pologne', 52.1657, 20.9671],
        'cracovie' => ['KRK', 'Kraków-Balice', 'Pologne', 50.0777, 19.7848],
        // Greece / Turkey / Middle East
        'athenes' => ['ATH', 'Athens Eleftherios Venizelos', 'Grèce', 37.9364, 23.9445],
        'athens' => ['ATH', 'Athens Eleftherios Venizelos', 'Grèce', 37.9364, 23.9445],
        'istanbul' => ['IST', 'Istanbul Airport', 'Turquie', 41.2753, 28.7519],
        'dubai' => ['DXB', 'Dubai International', 'Émirats arabes unis', 25.2532, 55.3657],
        'doha' => ['DOH', 'Hamad International', 'Qatar', 25.2731, 51.6080],
        'tel-aviv' => ['TLV', 'Tel Aviv Ben Gurion', 'Israël', 32.0114, 34.8867],
        'tel aviv' => ['TLV', 'Tel Aviv Ben Gurion', 'Israël', 32.0114, 34.8867],
        // Egypt (Red Sea / Nile gateways)
        'hurghada' => ['HRG', 'Hurghada International', 'Égypte', 27.1783, 33.7994],
        'sharm el-sheikh' => ['SSH', 'Sharm El-Sheikh International', 'Égypte', 27.9773, 34.3949],
        'sharm' => ['SSH', 'Sharm El-Sheikh International', 'Égypte', 27.9773, 34.3949],
        'cairo' => ['CAI', 'Cairo International', 'Égypte', 30.1219, 31.4056],
        'le caire' => ['CAI', 'Cairo International', 'Égypte', 30.1219, 31.4056],
        'luxor' => ['LXR', 'Luxor International', 'Égypte', 25.6710, 32.7066],
        // North America
        'new york' => ['JFK', 'New York John F. Kennedy', 'États-Unis', 40.6413, -73.7781],
        'new-york' => ['JFK', 'New York John F. Kennedy', 'États-Unis', 40.6413, -73.7781],
        'newyork' => ['JFK', 'New York John F. Kennedy', 'États-Unis', 40.6413, -73.7781],
        'nyc' => ['JFK', 'New York John F. Kennedy', 'États-Unis', 40.6413, -73.7781],
        'los angeles' => ['LAX', 'Los Angeles International', 'États-Unis', 33.9416, -118.4085],
        'miami' => ['MIA', 'Miami International', 'États-Unis', 25.7959, -80.2870],
        'san francisco' => ['SFO', 'San Francisco International', 'États-Unis', 37.6213, -122.3790],
        'chicago' => ['ORD', 'Chicago O’Hare', 'États-Unis', 41.9742, -87.9073],
        'boston' => ['BOS', 'Boston Logan', 'États-Unis', 42.3656, -71.0096],
        'washington' => ['IAD', 'Washington Dulles', 'États-Unis', 38.9531, -77.4565],
        'montreal' => ['YUL', 'Montréal-Trudeau', 'Canada', 45.4706, -73.7408],
        'toronto' => ['YYZ', 'Toronto Pearson', 'Canada', 43.6777, -79.6248],
        'vancouver' => ['YVR', 'Vancouver International', 'Canada', 49.1939, -123.1840],
        // Latin America
        'mexico' => ['MEX', 'Ciudad de México Benito Juárez', 'Mexique', 19.4361, -99.0719],
        'sao paulo' => ['GRU', 'São Paulo-Guarulhos', 'Brésil', -23.4356, -46.4731],
        'rio' => ['GIG', 'Rio de Janeiro-Galeão', 'Brésil', -22.8089, -43.2436],
        'rio de janeiro' => ['GIG', 'Rio de Janeiro-Galeão', 'Brésil', -22.8089, -43.2436],
        'buenos aires' => ['EZE', 'Buenos Aires Ezeiza', 'Argentine', -34.8222, -58.5358],
        'lima' => ['LIM', 'Lima Jorge Chávez', 'Pérou', -12.0219, -77.1143],
        'bogota' => ['BOG', 'Bogotá El Dorado', 'Colombie', 4.7016, -74.1469],
        // Asia / Oceania
        'tokyo' => ['HND', 'Tokyo Haneda', 'Japon', 35.5494, 139.7798],
        'osaka' => ['KIX', 'Osaka Kansai', 'Japon', 34.4347, 135.2440],
        'kyoto' => ['KIX', 'Osaka Kansai (gateway Kyoto)', 'Japon', 34.4347, 135.2440],
        'seoul' => ['ICN', 'Seoul Incheon', 'Corée du Sud', 37.4602, 126.4407],
        'seoul ' => ['ICN', 'Seoul Incheon', 'Corée du Sud', 37.4602, 126.4407],
        'pekin' => ['PEK', 'Beijing Capital', 'Chine', 40.0801, 116.5846],
        'beijing' => ['PEK', 'Beijing Capital', 'Chine', 40.0801, 116.5846],
        'shanghai' => ['PVG', 'Shanghai Pudong', 'Chine', 31.1443, 121.8083],
        'hong kong' => ['HKG', 'Hong Kong International', 'Hong Kong', 22.3080, 113.9185],
        'singapour' => ['SIN', 'Singapore Changi', 'Singapour', 1.3644, 103.9915],
        'singapore' => ['SIN', 'Singapore Changi', 'Singapour', 1.3644, 103.9915],
        'bangkok' => ['BKK', 'Bangkok Suvarnabhumi', 'Thaïlande', 13.6900, 100.7501],
        'kuala lumpur' => ['KUL', 'Kuala Lumpur International', 'Malaisie', 2.7456, 101.7099],
        'bali' => ['DPS', 'Denpasar Ngurah Rai', 'Indonésie', -8.7482, 115.1675],
        'denpasar' => ['DPS', 'Denpasar Ngurah Rai', 'Indonésie', -8.7482, 115.1675],
        'sydney' => ['SYD', 'Sydney Kingsford Smith', 'Australie', -33.9399, 151.1753],
        'melbourne' => ['MEL', 'Melbourne Tullamarine', 'Australie', -37.6690, 144.8410],
        'auckland' => ['AKL', 'Auckland', 'Nouvelle-Zélande', -37.0082, 174.7917],
        // Africa
        'casablanca' => ['CMN', 'Casablanca Mohammed V', 'Maroc', 33.3675, -7.5898],
        'marrakech' => ['RAK', 'Marrakech Menara', 'Maroc', 31.6069, -8.0363],
        'rabat' => ['RBA', 'Rabat-Salé', 'Maroc', 34.0515, -6.7515],
        'tunis' => ['TUN', 'Tunis-Carthage', 'Tunisie', 36.8510, 10.2272],
        'alger' => ['ALG', 'Alger Houari Boumediene', 'Algérie', 36.6911, 3.2155],
        'le caire' => ['CAI', 'Cairo International', 'Égypte', 30.1219, 31.4056],
        'cairo' => ['CAI', 'Cairo International', 'Égypte', 30.1219, 31.4056],
        'johannesburg' => ['JNB', 'O.R. Tambo International', 'Afrique du Sud', -26.1392, 28.2460],
        'le cap' => ['CPT', 'Cape Town International', 'Afrique du Sud', -33.9715, 18.6021],
        'cape town' => ['CPT', 'Cape Town International', 'Afrique du Sud', -33.9715, 18.6021],
        'dakar' => ['DSS', 'Blaise Diagne', 'Sénégal', 14.6711, -17.0742],
    ];

    /**
     * Normalize a free-text city keyword for STATIC_IATA_MAP lookups:
     * lowercase, trim, strip accents, collapse internal whitespace.
     */
    private static function normalizeIataKey(string $keyword): string
    {
        $trimmed = trim($keyword);
        if ($trimmed === '') {
            return '';
        }
        $lower = mb_strtolower($trimmed, 'UTF-8');
        $stripped = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $lower);
        if (! is_string($stripped) || $stripped === '') {
            $stripped = $lower;
        }
        $stripped = preg_replace('/[\'\x60\x27\x22]/u', '', $stripped) ?? $stripped;
        $stripped = preg_replace('/\s+/u', ' ', $stripped) ?? $stripped;

        return trim($stripped);
    }

    /**
     * Resolve a free-text city keyword to IATA entries via STATIC_IATA_MAP.
     * Matches exact normalized key first, then any prefix match (so "Paris CDG"
     * still resolves). Returns up to 3 entries to keep parity with Amadeus shape.
     *
     * @return array<int, array<string, mixed>>
     */
    private function iataFromStaticMap(string $keyword): array
    {
        $key = self::normalizeIataKey($keyword);
        if ($key === '') {
            return [];
        }

        $entries = [];
        if (isset(self::STATIC_IATA_MAP[$key])) {
            $entries[] = [$key, self::STATIC_IATA_MAP[$key]];
        } else {
            foreach (self::STATIC_IATA_MAP as $candidate => $row) {
                if ($candidate === $key) {
                    continue;
                }
                if (str_starts_with($candidate, $key) || str_starts_with($key, $candidate)) {
                    $entries[] = [$candidate, $row];
                    if (count($entries) >= 3) {
                        break;
                    }
                }
            }
        }

        $out = [];
        foreach ($entries as [$mapKey, $row]) {
            [$iata, $name, $country, $lat, $lng] = $row;
            $out[] = [
                'id' => 'static-'.$iata,
                'name' => $name,
                'iataCode' => $iata,
                'subType' => 'CITY',
                'address' => ['cityName' => ucfirst($mapKey), 'countryName' => $country],
                'geoCode' => ['latitude' => (float) $lat, 'longitude' => (float) $lng],
            ];
        }

        return $out;
    }

    /**
     * IATA lookup with deterministic fallback. Amadeus is tried first; if it
     * fails or returns no IATA-coded entries, STATIC_IATA_MAP supplies major
     * hubs (Paris→CDG, Lisbonne→LIS, …). The shape is identical to Amadeus's
     * normalized response so the frontend doesn't need to branch.
     *
     * @return array<int, array<string, mixed>>
     */
    public function iataLookup(string $keyword, string $subType = 'AIRPORT,CITY'): array
    {
        $keyword = trim($keyword);
        if (strlen($keyword) < 2) {
            return [];
        }
        $allowed = ['AIRPORT', 'CITY', 'AIRPORT,CITY'];
        if (! in_array($subType, $allowed, true)) {
            $subType = 'AIRPORT,CITY';
        }

        try {
            $token = $this->getAccessToken();
            $url = $this->baseUrl().'/v1/reference-data/locations?subType='.rawurlencode($subType)
                .'&keyword='.rawurlencode($keyword).'&page[limit]=10&view=FULL';
            $res = Http::withToken($token)->acceptJson()->timeout(5)->get($url);
            if ($res->successful()) {
                $data = $res->json('data');
                if (is_array($data)) {
                    $out = [];
                    foreach ($data as $loc) {
                        if (! is_array($loc)) {
                            continue;
                        }
                        $normalized = $this->normalizeLocation($loc);
                        if (($normalized['iataCode'] ?? '') !== '') {
                            $out[] = $normalized;
                        }
                    }
                    if ($out !== []) {
                        return $out;
                    }
                }
            } else {
                Log::warning('Amadeus iata lookup', ['status' => $res->status(), 'body' => $res->body()]);
            }
        } catch (\Throwable $e) {
            Log::warning('Amadeus iata lookup exception', ['message' => $e->getMessage()]);
        }

        return $this->iataFromStaticMap($keyword);
    }

    public function locationsByKeyword(string $keyword): array
    {
        $keyword = trim($keyword);
        if (strlen($keyword) < 2) {
            return [];
        }

        $circuitKey = 'integrations:amadeus:locations:circuit_open';

        // Circuit breaker: if Amadeus failed recently, skip it for 5 min and
        // go straight to Nominatim. Keeps autocomplete fast when the account
        // is degraded.
        if (! Cache::store('file')->has($circuitKey)) {
            try {
                $token = $this->getAccessToken();
                $url = $this->baseUrl().'/v1/reference-data/locations?subType=CITY,AIRPORT&keyword='.rawurlencode($keyword).'&page[limit]=10&view=FULL';
                $res = Http::withToken($token)->acceptJson()->timeout(3)->get($url);
                if ($res->successful()) {
                    $data = $res->json('data');
                    if (is_array($data) && $data !== []) {
                        return array_map(fn ($loc) => $this->normalizeLocation(is_array($loc) ? $loc : []), $data);
                    }
                } else {
                    Log::warning('Amadeus locations', ['status' => $res->status(), 'body' => $res->body()]);
                    Cache::store('file')->put($circuitKey, true, 300);
                }
            } catch (\Throwable $e) {
                Log::warning('Amadeus locations exception', ['message' => $e->getMessage()]);
                Cache::store('file')->put($circuitKey, true, 300);
            }
        }

        // Fallback 1: Mapbox geocoding — handles prefix queries (e.g. "Marseill"),
        // free up to 100k req/month, same token as the frontend.
        $mapbox = $this->locationsFromMapbox($keyword);
        if ($mapbox !== []) {
            return $mapbox;
        }

        // Fallback 2: Nominatim (OpenStreetMap) — last resort if Mapbox is down.
        return $this->locationsFromNominatim($keyword);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function locationsFromMapbox(string $keyword): array
    {
        $token = (string) (config('integrations.mapbox.token') ?: env('NEXT_PUBLIC_MAPBOX_TOKEN', ''));
        if ($token === '') {
            return [];
        }

        $cacheKey = 'integrations:mapbox:loc:'.mb_strtolower(trim($keyword));

        return Cache::store('file')->remember($cacheKey, 600, function () use ($keyword, $token) {
            try {
                $url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'.rawurlencode(trim($keyword)).'.json';
                $res = Http::timeout(4)->get($url, [
                    'access_token' => $token,
                    'autocomplete' => 'true',
                    'limit' => 5,
                    'language' => 'fr',
                    'types' => 'place,locality,district',
                ]);
                if (! $res->successful()) {
                    Log::warning('Mapbox geocoding failed', ['status' => $res->status()]);

                    return [];
                }

                $features = $res->json('features');
                if (! is_array($features)) {
                    return [];
                }

                $out = [];
                foreach ($features as $f) {
                    if (! is_array($f)) {
                        continue;
                    }
                    $cityName = (string) ($f['text_fr'] ?? $f['text'] ?? '');
                    if ($cityName === '') {
                        continue;
                    }
                    $center = is_array($f['center'] ?? null) ? $f['center'] : null;
                    if (! is_array($center) || count($center) < 2) {
                        continue;
                    }
                    $lng = (float) $center[0];
                    $lat = (float) $center[1];

                    $countryName = '';
                    if (is_array($f['context'] ?? null)) {
                        foreach ($f['context'] as $ctx) {
                            if (is_array($ctx) && str_starts_with((string) ($ctx['id'] ?? ''), 'country.')) {
                                $countryName = (string) ($ctx['text_fr'] ?? $ctx['text'] ?? '');
                                break;
                            }
                        }
                    }

                    $out[] = [
                        'id' => 'mb-'.($f['id'] ?? uniqid()),
                        'name' => $cityName,
                        'iataCode' => '',
                        'subType' => 'CITY',
                        'address' => ['cityName' => $cityName, 'countryName' => $countryName],
                        'geoCode' => ['latitude' => $lat, 'longitude' => $lng],
                    ];
                }

                return $out;
            } catch (\Throwable $e) {
                Log::warning('Mapbox geocoding exception', ['message' => $e->getMessage()]);

                return [];
            }
        });
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function locationsFromNominatim(string $keyword): array
    {
        $cacheKey = 'integrations:nominatim:loc:'.mb_strtolower(trim($keyword));

        // Use the file store explicitly so the cache survives across PHP-FPM
        // requests even when the default cache driver is "array".
        return Cache::store('file')->remember($cacheKey, 600, function () use ($keyword) {
            return $this->fetchNominatimLocations($keyword);
        });
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function fetchNominatimLocations(string $keyword): array
    {
        try {
            $res = Http::withHeaders(['User-Agent' => 'Triply/1.0 (contact@triply.ovh)'])
                ->acceptJson()
                ->timeout(6)
                ->get('https://nominatim.openstreetmap.org/search', [
                    'q' => $keyword,
                    'format' => 'json',
                    'addressdetails' => 1,
                    'limit' => 10,
                    'accept-language' => 'fr',
                ]);
            if (! $res->successful()) {
                return [];
            }
            $rows = $res->json();
            if (! is_array($rows)) {
                return [];
            }

            $out = [];
            $seen = [];
            foreach ($rows as $row) {
                if (! is_array($row)) {
                    continue;
                }
                $cls = (string) ($row['class'] ?? '');
                $type = (string) ($row['type'] ?? '');
                $isCity = $cls === 'place' && in_array($type, ['city', 'town', 'village'], true);
                $isAirport = $cls === 'aeroway' && $type === 'aerodrome';
                $isAdmin = $cls === 'boundary' && $type === 'administrative';
                if (! $isCity && ! $isAirport && ! $isAdmin) {
                    continue;
                }

                $address = is_array($row['address'] ?? null) ? $row['address'] : [];
                $cityName = (string) ($address['city'] ?? $address['town'] ?? $address['village'] ?? $row['name'] ?? '');
                if ($cityName === '') {
                    $displayName = (string) ($row['display_name'] ?? '');
                    $cityName = $displayName !== '' ? trim(explode(',', $displayName)[0]) : '';
                }
                $countryName = (string) ($address['country'] ?? '');
                $lat = isset($row['lat']) ? (float) $row['lat'] : NAN;
                $lng = isset($row['lon']) ? (float) $row['lon'] : NAN;
                if (! is_finite($lat) || ! is_finite($lng) || $cityName === '') {
                    continue;
                }

                // Dedup by (cityName, countryName) — Nominatim often returns the same
                // place as several OSM entities (node, boundary, admin region).
                $key = mb_strtolower($cityName).'|'.mb_strtolower($countryName);
                if (isset($seen[$key])) {
                    continue;
                }
                $seen[$key] = true;

                $out[] = [
                    'id' => 'osm-'.($row['osm_id'] ?? uniqid()),
                    'name' => $cityName,
                    'iataCode' => '',
                    'subType' => $isAirport ? 'AIRPORT' : 'CITY',
                    'address' => ['cityName' => $cityName, 'countryName' => $countryName],
                    'geoCode' => ['latitude' => $lat, 'longitude' => $lng],
                ];
                if (count($out) >= 5) {
                    break;
                }
            }

            return $out;
        } catch (\Throwable $e) {
            Log::warning('Nominatim fallback failed', ['message' => $e->getMessage()]);

            return [];
        }
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

        $json = $res->json();
        if (! $res->successful()) {
            $detail = null;
            if (is_array($json)) {
                $errs = $json['errors'] ?? null;
                if (is_array($errs) && isset($errs[0]) && is_array($errs[0])) {
                    $detail = $errs[0]['detail'] ?? $errs[0]['title'] ?? null;
                }
                if ($detail === null && isset($json['error']) && is_string($json['error'])) {
                    $detail = $json['error'];
                }
            }
            if (! is_string($detail) || trim($detail) === '') {
                $detail = 'Amadeus a refusé la recherche de vols (HTTP '.$res->status().').';
            }

            return [
                'errors' => [
                    [
                        'status' => (string) $res->status(),
                        'title' => 'Flight search failed',
                        'detail' => $detail,
                    ],
                ],
            ];
        }

        if (! is_array($json)) {
            return [
                'errors' => [
                    [
                        'title' => 'Flight search failed',
                        'detail' => 'Réponse Amadeus vide ou invalide.',
                    ],
                ],
            ];
        }

        return $json;
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
            $res = Http::withToken($token)->acceptJson()->timeout(4)->get($url);
            if ($res->successful()) {
                $first = $res->json('data.0');
                if (is_array($first)) {
                    $geo = $first['geoCode'] ?? null;
                    if (is_array($geo)) {
                        $lat = isset($geo['latitude']) ? (float) $geo['latitude'] : null;
                        $lng = isset($geo['longitude']) ? (float) $geo['longitude'] : null;
                        if ($lat !== null && $lng !== null && is_finite($lat) && is_finite($lng)) {
                            $name = is_string($first['name'] ?? null) ? $first['name'] : $keyword;

                            return ['lat' => $lat, 'lng' => $lng, 'name' => $name];
                        }
                    }
                }
            }
        } catch (\Throwable) {
            // Falls through to Nominatim.
        }

        // Fallback: Mapbox then Nominatim.
        foreach ([...$this->locationsFromMapbox($keyword), ...$this->locationsFromNominatim($keyword)] as $loc) {
            $geo = $loc['geoCode'] ?? null;
            if (is_array($geo) && isset($geo['latitude'], $geo['longitude'])) {
                return [
                    'lat' => (float) $geo['latitude'],
                    'lng' => (float) $geo['longitude'],
                    'name' => (string) ($loc['name'] ?? $keyword),
                ];
            }
        }

        return null;
    }

    /**
     * Recupere des points d'interet (categorie RESTAURANT par defaut) autour d'un point.
     *
     * @param  list<string>  $categories  Categories Amadeus (ex: RESTAURANT, SIGHTS, NIGHTLIFE)
     * @return array<int, array<string, mixed>>
     */
    public function pointsOfInterest(float $lat, float $lng, int $radiusMeters = 1000, array $categories = ['RESTAURANT']): array
    {
        if (! is_finite($lat) || ! is_finite($lng)) {
            return [];
        }
        $radiusKm = max(1, min(20, (int) ceil($radiusMeters / 1000)));
        $cacheKey = sprintf('integrations:amadeus:poi:%.4f:%.4f:%d:%s', $lat, $lng, $radiusKm, implode(',', $categories));

        return Cache::remember($cacheKey, 60 * 60, function () use ($lat, $lng, $radiusKm, $categories) {
            try {
                $token = $this->getAccessToken();
                $url = $this->baseUrl().'/v1/reference-data/locations/pois?'.http_build_query([
                    'latitude' => $lat,
                    'longitude' => $lng,
                    'radius' => $radiusKm,
                    'categories' => implode(',', $categories),
                    'page[limit]' => 20,
                ]);
                $res = Http::withToken($token)->acceptJson()->timeout(25)->get($url);
                if (! $res->successful()) {
                    Log::warning('Amadeus POIs failed', ['status' => $res->status(), 'body' => $res->body()]);

                    return [];
                }
                $data = $res->json('data');
                if (! is_array($data)) {
                    return [];
                }

                return array_values(array_filter(array_map(function ($poi) {
                    if (! is_array($poi)) {
                        return null;
                    }
                    $geo = $poi['geoCode'] ?? [];
                    $plat = isset($geo['latitude']) && is_numeric($geo['latitude']) ? (float) $geo['latitude'] : null;
                    $plng = isset($geo['longitude']) && is_numeric($geo['longitude']) ? (float) $geo['longitude'] : null;
                    if ($plat === null || $plng === null) {
                        return null;
                    }

                    return [
                        'id' => isset($poi['id']) ? (string) $poi['id'] : null,
                        'name' => isset($poi['name']) ? (string) $poi['name'] : 'Restaurant',
                        'category' => isset($poi['category']) ? (string) $poi['category'] : 'RESTAURANT',
                        'rank' => isset($poi['rank']) && is_numeric($poi['rank']) ? (int) $poi['rank'] : null,
                        'tags' => isset($poi['tags']) && is_array($poi['tags']) ? array_values($poi['tags']) : [],
                        'lat' => $plat,
                        'lng' => $plng,
                    ];
                }, $data)));
            } catch (\Throwable $e) {
                Log::warning('Amadeus POIs exception', ['error' => $e->getMessage()]);

                return [];
            }
        });
    }
}
