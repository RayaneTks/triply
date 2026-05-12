<?php

namespace Tests\Unit\Services;

use App\Services\Geo\AmadeusCityCountryResolver;
use App\Services\Integrations\AmadeusClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Mockery;
use Tests\TestCase;

class CityCountryResolverTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_returns_null_for_null_city(): void
    {
        $amadeus = Mockery::mock(AmadeusClient::class);
        $resolver = new AmadeusCityCountryResolver($amadeus);
        $this->assertNull($resolver->resolve(null));
    }

    public function test_returns_null_for_empty_string(): void
    {
        $amadeus = Mockery::mock(AmadeusClient::class);
        $resolver = new AmadeusCityCountryResolver($amadeus);
        $this->assertNull($resolver->resolve('   '));
    }

    public function test_local_table_hits_avoid_amadeus_call(): void
    {
        Cache::flush();
        $amadeus = Mockery::mock(AmadeusClient::class);
        $amadeus->shouldNotReceive('locationsByKeyword');
        $resolver = new AmadeusCityCountryResolver($amadeus);

        $this->assertSame('France', $resolver->resolve('Paris'));
        $this->assertSame('Espagne', $resolver->resolve('Barcelone'));
        $this->assertSame('Japon', $resolver->resolve('Tokyo'));
    }

    public function test_normalisation_handles_diacritics_and_case(): void
    {
        Cache::flush();
        $amadeus = Mockery::mock(AmadeusClient::class);
        $amadeus->shouldNotReceive('locationsByKeyword');
        $resolver = new AmadeusCityCountryResolver($amadeus);

        $this->assertSame('Suisse', $resolver->resolve('GENÈVE'));
        $this->assertSame('France', $resolver->resolve('  paris  '));
    }

    public function test_falls_back_to_amadeus_for_unknown_city(): void
    {
        Cache::flush();
        $amadeus = Mockery::mock(AmadeusClient::class);
        $amadeus->shouldReceive('locationsByKeyword')
            ->with('Reykjholt')
            ->andReturn([
                ['address' => ['countryName' => 'Islande']],
            ]);

        $resolver = new AmadeusCityCountryResolver($amadeus);
        $this->assertSame('Islande', $resolver->resolve('Reykjholt'));
    }

    public function test_returns_null_when_amadeus_returns_empty(): void
    {
        Cache::flush();
        $amadeus = Mockery::mock(AmadeusClient::class);
        $amadeus->shouldReceive('locationsByKeyword')->andReturn([]);

        $resolver = new AmadeusCityCountryResolver($amadeus);
        $this->assertNull($resolver->resolve('Xyzabc'));
    }

    public function test_returns_null_when_amadeus_throws(): void
    {
        Cache::flush();
        $amadeus = Mockery::mock(AmadeusClient::class);
        $amadeus->shouldReceive('locationsByKeyword')->andThrow(new \RuntimeException('down'));

        $resolver = new AmadeusCityCountryResolver($amadeus);
        $this->assertNull($resolver->resolve('Xyzabc'));
    }

    public function test_caches_result_after_lookup(): void
    {
        Cache::flush();
        $amadeus = Mockery::mock(AmadeusClient::class);
        $amadeus->shouldReceive('locationsByKeyword')
            ->once()
            ->andReturn([['address' => ['countryName' => 'Pays Test']]]);

        $resolver = new AmadeusCityCountryResolver($amadeus);
        $this->assertSame('Pays Test', $resolver->resolve('CitéCache'));
        $this->assertSame('Pays Test', $resolver->resolve('CitéCache'));
    }
}
