<?php

namespace App\Services\Contracts;

interface PlacesServiceInterface
{
    public function details(string $placeId): array;
    public function reviews(string $placeId): array;
    public function routes(string $tripId): array;
    public function travelTimes(string $tripId): array;
    public function nearbyRestaurants(array $payload): array;
}
