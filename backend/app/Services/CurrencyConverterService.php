<?php

namespace App\Services;

use App\Services\Contracts\CurrencyConverterInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CurrencyConverterService implements CurrencyConverterInterface
{
    public function convert(float $amount, string $fromCurrency, string $toCurrency = 'EUR'): float
    {
        if ($amount <= 0) {
            return 0.0;
        }

        $from = strtoupper(trim($fromCurrency));
        $to = strtoupper(trim($toCurrency));

        if ($from === '' || $to === '' || $from === $to) {
            return $amount;
        }

        $cacheMinutes = (int) config('services.currency_rates.cache_ttl_minutes', 360);
        $cacheKey = sprintf('fx:%s:%s', $from, $to);

        try {
            $rate = Cache::remember($cacheKey, now()->addMinutes($cacheMinutes), function () use ($from, $to): float {
                $baseUrl = rtrim((string) config('services.currency_rates.base_url', 'https://api.frankfurter.app'), '/');
                $url = sprintf('%s/latest?from=%s&to=%s', $baseUrl, rawurlencode($from), rawurlencode($to));

                $response = Http::timeout((int) config('services.currency_rates.timeout_seconds', 4))
                    ->acceptJson()
                    ->get($url)
                    ->throw();

                $data = $response->json();
                $rawRate = $data['rates'][$to] ?? null;

                if (! is_numeric($rawRate)) {
                    throw new \RuntimeException('Taux de conversion introuvable dans la reponse API.');
                }

                return (float) $rawRate;
            });

            return $amount * $rate;
        } catch (\Throwable $e) {
            Log::warning('Triply conversion devise: fallback sans conversion.', [
                'from' => $from,
                'to' => $to,
                'amount' => $amount,
                'error' => $e->getMessage(),
            ]);

            return $amount;
        }
    }
}
