<?php

namespace App\Services\Contracts;

interface CurrencyConverterInterface
{
    public function convert(float $amount, string $fromCurrency, string $toCurrency = 'EUR'): float;
}
