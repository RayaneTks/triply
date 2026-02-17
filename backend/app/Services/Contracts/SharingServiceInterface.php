<?php

namespace App\Services\Contracts;

interface SharingServiceInterface
{
    public function createShareLink(string $tripId, array $payload): array;
    public function publicRecap(string $token): array;
}
