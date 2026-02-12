<?php

namespace App\Services\Contracts;

interface BookingServiceInterface
{
    public function checkout(string $tripId, array $payload): array;
}
