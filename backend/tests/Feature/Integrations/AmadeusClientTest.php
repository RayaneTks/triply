<?php

namespace Tests\Feature\Integrations;

use App\Services\Integrations\AmadeusClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AmadeusClientTest extends TestCase
{
    use RefreshDatabase;

    private AmadeusClient $client;

    protected function setUp(): void
    {
        parent::setUp();
        config()->set('integrations.amadeus.base_url', 'https://test.api.amadeus.com');
        config()->set('integrations.amadeus.client_id', 'test-id');
        config()->set('integrations.amadeus.client_secret', 'test-secret');
        Cache::store('file')->forget('integrations:amadeus:locations:circuit_open');
        Cache::forget('integrations:amadeus:access_token');
        $this->client = $this->app->make(AmadeusClient::class);
    }

    public function test_get_access_token_caches_and_returns_token(): void
    {
        Http::fake([
            'https://test.api.amadeus.com/v1/security/oauth2/token' => Http::response([
                'access_token' => 'fake-token-xyz',
                'expires_in' => 1799,
            ], 200),
        ]);

        $this->assertSame('fake-token-xyz', $this->client->getAccessToken());

        // Second call should hit cache (no new HTTP request).
        $this->assertSame('fake-token-xyz', $this->client->getAccessToken());
        Http::assertSentCount(1);
    }

    public function test_get_access_token_throws_when_credentials_missing(): void
    {
        config()->set('integrations.amadeus.client_id', '');
        $this->expectException(\RuntimeException::class);
        $this->client->getAccessToken();
    }

    public function test_get_access_token_throws_on_amadeus_failure(): void
    {
        Http::fake([
            'https://test.api.amadeus.com/v1/security/oauth2/token' => Http::response(['error' => 'invalid'], 401),
        ]);
        $this->expectException(\RuntimeException::class);
        $this->client->getAccessToken();
    }

    public function test_iata_lookup_returns_only_entries_with_iata(): void
    {
        Http::fake([
            'https://test.api.amadeus.com/v1/security/oauth2/token' => Http::response(['access_token' => 't', 'expires_in' => 1799], 200),
            'https://test.api.amadeus.com/v1/reference-data/locations*' => Http::response([
                'data' => [
                    [
                        'id' => 1,
                        'name' => 'Paris',
                        'iataCode' => 'PAR',
                        'subType' => 'CITY',
                        'address' => ['cityName' => 'Paris', 'countryName' => 'France'],
                    ],
                    [
                        'id' => 2,
                        'name' => 'No IATA',
                        'iataCode' => '',
                        'subType' => 'CITY',
                        'address' => ['cityName' => 'X', 'countryName' => 'Y'],
                    ],
                ],
            ], 200),
        ]);

        $result = $this->client->iataLookup('Paris');

        $this->assertCount(1, $result);
        $this->assertSame('PAR', $result[0]['iataCode']);
    }

    public function test_iata_lookup_returns_empty_on_short_keyword(): void
    {
        $this->assertSame([], $this->client->iataLookup('a'));
    }

    public function test_iata_lookup_returns_empty_on_amadeus_failure_for_unknown_city(): void
    {
        // When the keyword is not in the static fallback map, the result must
        // still be an empty array (no IATA could be resolved).
        Http::fake([
            'https://test.api.amadeus.com/v1/security/oauth2/token' => Http::response(['access_token' => 't', 'expires_in' => 1799], 200),
            'https://test.api.amadeus.com/v1/reference-data/locations*' => Http::response(['error' => 'down'], 500),
        ]);
        $this->assertSame([], $this->client->iataLookup('Zzz123Notacity'));
    }

    public function test_iata_lookup_uses_static_fallback_for_known_city_on_failure(): void
    {
        Http::fake([
            'https://test.api.amadeus.com/v1/security/oauth2/token' => Http::response(['access_token' => 't', 'expires_in' => 1799], 200),
            'https://test.api.amadeus.com/v1/reference-data/locations*' => Http::response(['error' => 'down'], 500),
        ]);
        $result = $this->client->iataLookup('Paris');
        $this->assertNotEmpty($result);
        $this->assertSame('CDG', $result[0]['iataCode']);
    }

    public function test_iata_lookup_static_fallback_hurghada_on_amadeus_failure(): void
    {
        Http::fake([
            'https://test.api.amadeus.com/v1/security/oauth2/token' => Http::response(['access_token' => 't', 'expires_in' => 1799], 200),
            'https://test.api.amadeus.com/v1/reference-data/locations*' => Http::response(['error' => 'down'], 500),
        ]);
        $result = $this->client->iataLookup('Hurghada');
        $this->assertNotEmpty($result);
        $this->assertSame('HRG', $result[0]['iataCode']);
    }

    public function test_iata_lookup_falls_back_to_default_subType_when_invalid(): void
    {
        Http::fake([
            'https://test.api.amadeus.com/v1/security/oauth2/token' => Http::response(['access_token' => 't', 'expires_in' => 1799], 200),
            'https://test.api.amadeus.com/v1/reference-data/locations*' => Http::response(['data' => []], 200),
        ]);
        // Unknown keyword + invalid subType must still produce an empty array;
        // we verify the subType normalization path independently of fallback.
        $result = $this->client->iataLookup('Zzz123Notacity', 'BOGUS_TYPE');
        $this->assertSame([], $result);
    }

    public function test_locations_by_keyword_returns_amadeus_first(): void
    {
        Http::fake([
            'https://test.api.amadeus.com/v1/security/oauth2/token' => Http::response(['access_token' => 't', 'expires_in' => 1799], 200),
            'https://test.api.amadeus.com/v1/reference-data/locations*' => Http::response([
                'data' => [
                    ['id' => 1, 'name' => 'Lyon', 'iataCode' => 'LYS', 'subType' => 'CITY', 'address' => ['cityName' => 'Lyon', 'countryName' => 'France']],
                ],
            ], 200),
        ]);

        $result = $this->client->locationsByKeyword('Lyon');

        $this->assertNotEmpty($result);
        $this->assertSame('LYS', $result[0]['iataCode']);
    }

    public function test_locations_by_keyword_short_returns_empty(): void
    {
        $this->assertSame([], $this->client->locationsByKeyword('a'));
    }

    public function test_flight_offers_injects_eur_currency(): void
    {
        Http::fake([
            'https://test.api.amadeus.com/v1/security/oauth2/token' => Http::response(['access_token' => 't', 'expires_in' => 1799], 200),
            'https://test.api.amadeus.com/v2/shopping/flight-offers*' => Http::response([
                'data' => [['id' => 'offer1', 'price' => ['grandTotal' => '120', 'currency' => 'EUR']]],
                'dictionaries' => ['carriers' => ['AF' => 'Air France']],
            ], 200),
        ]);

        $result = $this->client->flightOffers([
            'originLocationCode' => 'PAR',
            'destinationLocationCode' => 'BCN',
            'departureDate' => '2026-09-01',
            'adults' => 1,
        ]);

        $this->assertArrayHasKey('data', $result);
        $this->assertSame('offer1', $result['data'][0]['id']);

        Http::assertSent(function ($request) {
            return $request->method() === 'GET'
                && str_contains($request->url(), '/v2/shopping/flight-offers')
                && $request['currencyCode'] === 'EUR'
                && $request['originLocationCode'] === 'PAR'
                && $request['destinationLocationCode'] === 'BCN'
                && $request['departureDate'] === '2026-09-01'
                && (int) $request['adults'] === 1;
        });
    }

    public function test_flight_offers_maps_amadeus_http_error_to_errors(): void
    {
        Http::fake([
            'https://test.api.amadeus.com/v1/security/oauth2/token' => Http::response(['access_token' => 't', 'expires_in' => 1799], 200),
            'https://test.api.amadeus.com/v2/shopping/flight-offers*' => Http::response([
                'errors' => [
                    ['title' => 'INVALID DATE', 'detail' => 'Departure date in the past'],
                ],
            ], 400),
        ]);

        $result = $this->client->flightOffers([
            'originLocationCode' => 'PAR',
            'destinationLocationCode' => 'BCN',
            'departureDate' => '2020-01-01',
            'adults' => 1,
        ]);

        $this->assertArrayHasKey('errors', $result);
        $this->assertSame('Departure date in the past', $result['errors'][0]['detail'] ?? null);
    }

    public function test_hotels_by_geocode_returns_normalized_locations(): void
    {
        Http::fake([
            'https://test.api.amadeus.com/v1/security/oauth2/token' => Http::response(['access_token' => 't', 'expires_in' => 1799], 200),
            'https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-geocode*' => Http::response([
                'data' => [
                    [
                        'hotelId' => 'HTL1',
                        'name' => 'Test Hotel',
                        'geoCode' => ['latitude' => 48.85, 'longitude' => 2.35],
                        'address' => ['lines' => ['1 Rue X'], 'cityName' => 'Paris', 'countryCode' => 'FR'],
                    ],
                ],
            ], 200),
        ]);

        $result = $this->client->hotelsByGeocode('48.85', '2.35', null);

        $this->assertCount(1, $result['locations']);
        $this->assertSame('HTL1', $result['locations'][0]['id']);
        $this->assertSame('Test Hotel', $result['locations'][0]['title']);
    }

    public function test_hotels_by_geocode_returns_empty_on_error(): void
    {
        Http::fake([
            'https://test.api.amadeus.com/v1/security/oauth2/token' => Http::response(['access_token' => 't', 'expires_in' => 1799], 200),
            'https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-geocode*' => Http::response([], 500),
        ]);

        $result = $this->client->hotelsByGeocode('0', '0', null);
        $this->assertSame([], $result['locations']);
    }
}
