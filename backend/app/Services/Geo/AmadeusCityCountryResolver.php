<?php

namespace App\Services\Geo;

use App\Services\Integrations\AmadeusClient;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Resolveur ville -> pays via Amadeus (subType=CITY) avec cache 30 jours.
 *
 * Strategie :
 *  1. Lookup interne sur une petite table FR (villes courantes) pour eviter un appel HTTP.
 *  2. Sinon, appel a `AmadeusClient::locationsByKeyword` puis traduction du `countryCode` ISO en libelle FR.
 *  3. Cache du resultat dans `Cache::store()` pendant 30 jours.
 */
class AmadeusCityCountryResolver implements CityCountryResolverInterface
{
    private const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;

    public function __construct(private readonly AmadeusClient $amadeus)
    {
    }

    public function resolve(?string $city): ?string
    {
        if ($city === null) {
            return null;
        }

        $normalized = $this->normalize($city);
        if ($normalized === '') {
            return null;
        }

        $cacheKey = 'geo:city-country:'.md5($normalized);

        $cached = Cache::get($cacheKey);
        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $local = $this->lookupLocal($normalized);
        if ($local !== null) {
            Cache::put($cacheKey, $local, self::CACHE_TTL_SECONDS);

            return $local;
        }

        try {
            $locations = $this->amadeus->locationsByKeyword($city);
        } catch (Throwable $e) {
            Log::info('CityCountryResolver: Amadeus indisponible.', [
                'city' => $city,
                'error' => $e->getMessage(),
            ]);

            return null;
        }

        foreach ($locations as $loc) {
            if (! is_array($loc)) {
                continue;
            }
            $address = is_array($loc['address'] ?? null) ? $loc['address'] : [];
            $countryName = isset($address['countryName']) && is_string($address['countryName'])
                ? trim($address['countryName'])
                : '';
            if ($countryName !== '') {
                Cache::put($cacheKey, $countryName, self::CACHE_TTL_SECONDS);

                return $countryName;
            }
        }

        return null;
    }

    private function normalize(string $value): string
    {
        $trimmed = trim($value);
        if ($trimmed === '') {
            return '';
        }

        $ascii = function_exists('iconv')
            ? @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $trimmed)
            : $trimmed;

        return strtolower((string) ($ascii ?: $trimmed));
    }

    /**
     * Petit dictionnaire local pour les villes mondiales courantes — evite un round-trip HTTP.
     *
     * @return string|null
     */
    private function lookupLocal(string $normalized): ?string
    {
        static $table = [
            // France
            'paris' => 'France',
            'lyon' => 'France',
            'marseille' => 'France',
            'bordeaux' => 'France',
            'toulouse' => 'France',
            'lille' => 'France',
            'nice' => 'France',
            'nantes' => 'France',
            'strasbourg' => 'France',
            // Europe
            'london' => 'Royaume-Uni',
            'londres' => 'Royaume-Uni',
            'edimbourg' => 'Royaume-Uni',
            'edinburgh' => 'Royaume-Uni',
            'dublin' => 'Irlande',
            'amsterdam' => 'Pays-Bas',
            'rotterdam' => 'Pays-Bas',
            'bruxelles' => 'Belgique',
            'brussels' => 'Belgique',
            'rome' => 'Italie',
            'florence' => 'Italie',
            'venise' => 'Italie',
            'milan' => 'Italie',
            'naples' => 'Italie',
            'barcelone' => 'Espagne',
            'barcelona' => 'Espagne',
            'madrid' => 'Espagne',
            'seville' => 'Espagne',
            'valence' => 'Espagne',
            'lisbonne' => 'Portugal',
            'lisbon' => 'Portugal',
            'porto' => 'Portugal',
            'berlin' => 'Allemagne',
            'munich' => 'Allemagne',
            'hambourg' => 'Allemagne',
            'francfort' => 'Allemagne',
            'vienne' => 'Autriche',
            'prague' => 'Tchequie',
            'budapest' => 'Hongrie',
            'varsovie' => 'Pologne',
            'cracovie' => 'Pologne',
            'athenes' => 'Grece',
            'istanbul' => 'Turquie',
            'oslo' => 'Norvege',
            'stockholm' => 'Suede',
            'helsinki' => 'Finlande',
            'copenhague' => 'Danemark',
            'copenhagen' => 'Danemark',
            'reykjavik' => 'Islande',
            'zurich' => 'Suisse',
            'geneve' => 'Suisse',
            'berne' => 'Suisse',
            // Amerique du Nord
            'new york' => 'Etats-Unis',
            'los angeles' => 'Etats-Unis',
            'san francisco' => 'Etats-Unis',
            'chicago' => 'Etats-Unis',
            'boston' => 'Etats-Unis',
            'miami' => 'Etats-Unis',
            'washington' => 'Etats-Unis',
            'seattle' => 'Etats-Unis',
            'toronto' => 'Canada',
            'montreal' => 'Canada',
            'vancouver' => 'Canada',
            'mexico' => 'Mexique',
            // Asie
            'tokyo' => 'Japon',
            'kyoto' => 'Japon',
            'osaka' => 'Japon',
            'seoul' => 'Coree du Sud',
            'beijing' => 'Chine',
            'pekin' => 'Chine',
            'shanghai' => 'Chine',
            'hong kong' => 'Hong Kong',
            'singapore' => 'Singapour',
            'singapour' => 'Singapour',
            'bangkok' => 'Thailande',
            'phuket' => 'Thailande',
            'bali' => 'Indonesie',
            'jakarta' => 'Indonesie',
            'hanoi' => 'Vietnam',
            'ho chi minh' => 'Vietnam',
            'kuala lumpur' => 'Malaisie',
            // Maghreb / Moyen-Orient
            'marrakech' => 'Maroc',
            'casablanca' => 'Maroc',
            'tunis' => 'Tunisie',
            'le caire' => 'Egypte',
            'cairo' => 'Egypte',
            'dubai' => 'Emirats Arabes Unis',
            'doha' => 'Qatar',
            // Oceanie
            'sydney' => 'Australie',
            'melbourne' => 'Australie',
            'auckland' => 'Nouvelle-Zelande',
            // Amerique du Sud
            'buenos aires' => 'Argentine',
            'sao paulo' => 'Bresil',
            'rio de janeiro' => 'Bresil',
            'lima' => 'Perou',
            'santiago' => 'Chili',
        ];

        return $table[$normalized] ?? null;
    }
}
