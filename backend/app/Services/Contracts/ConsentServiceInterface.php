<?php

namespace App\Services\Contracts;

interface ConsentServiceInterface
{
    public function getConsent(): array;
    public function saveConsent(array $payload): array;
}
