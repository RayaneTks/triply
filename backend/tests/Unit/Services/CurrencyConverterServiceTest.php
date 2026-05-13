<?php

namespace Tests\Unit\Services;

use App\Services\CurrencyConverterService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CurrencyConverterServiceTest extends TestCase
{
    use RefreshDatabase;

    private CurrencyConverterService $service;

    protected function setUp(): void
    {
        parent::setUp();
        config()->set('services.currency_rates.base_url', 'https://api.frankfurter.app');
        config()->set('services.currency_rates.cache_ttl_minutes', 360);
        config()->set('services.currency_rates.timeout_seconds', 4);
        Cache::flush();
        $this->service = new CurrencyConverterService();
    }

    public function test_convert_returns_zero_for_non_positive_amount(): void
    {
        $this->assertSame(0.0, $this->service->convert(0, 'USD', 'EUR'));
        $this->assertSame(0.0, $this->service->convert(-10, 'USD', 'EUR'));
    }

    public function test_convert_returns_amount_when_currencies_equal(): void
    {
        $this->assertSame(100.0, $this->service->convert(100, 'EUR', 'EUR'));
    }

    public function test_convert_returns_amount_when_currency_blank(): void
    {
        $this->assertSame(50.0, $this->service->convert(50, '', 'EUR'));
        $this->assertSame(50.0, $this->service->convert(50, 'EUR', ''));
    }

    public function test_convert_uses_frankfurter_rate(): void
    {
        Http::fake([
            'https://api.frankfurter.app/latest*' => Http::response([
                'amount' => 1,
                'base' => 'USD',
                'rates' => ['EUR' => 0.9],
            ], 200),
        ]);

        $result = $this->service->convert(100, 'USD', 'EUR');
        $this->assertEqualsWithDelta(90.0, $result, 0.001);
    }

    public function test_convert_caches_rate_to_avoid_repeat_calls(): void
    {
        Http::fake([
            'https://api.frankfurter.app/latest*' => Http::response([
                'rates' => ['EUR' => 0.9],
            ], 200),
        ]);

        $this->service->convert(100, 'USD', 'EUR');
        $this->service->convert(200, 'USD', 'EUR');
        $this->service->convert(50, 'USD', 'EUR');

        Http::assertSentCount(1);
    }

    public function test_convert_falls_back_to_amount_on_api_failure(): void
    {
        Http::fake([
            'https://api.frankfurter.app/latest*' => Http::response(['error' => 'down'], 500),
        ]);

        $result = $this->service->convert(100, 'USD', 'EUR');
        $this->assertSame(100.0, $result);
    }

    public function test_convert_falls_back_when_rate_missing(): void
    {
        Http::fake([
            'https://api.frankfurter.app/latest*' => Http::response([
                'rates' => [],
            ], 200),
        ]);

        $result = $this->service->convert(100, 'USD', 'EUR');
        $this->assertSame(100.0, $result);
    }

    public function test_convert_normalises_currency_codes_case_and_whitespace(): void
    {
        Http::fake([
            'https://api.frankfurter.app/latest*' => Http::response([
                'rates' => ['EUR' => 0.5],
            ], 200),
        ]);

        $result = $this->service->convert(20, ' usd ', ' eur ');
        $this->assertEqualsWithDelta(10.0, $result, 0.001);
    }
}
