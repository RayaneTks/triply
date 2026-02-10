<?php

namespace App\Services\Contracts;

interface TripServiceInterface
{
    public function createTrip(array $payload): array;
    public function listTrips(): array;
    public function showTrip(string $tripId): array;
    public function updateTrip(string $tripId, array $payload): array;
    public function duplicateTrip(string $tripId): array;
    public function validateTrip(string $tripId): array;
    public function listDays(string $tripId): array;
    public function updateDay(string $tripId, string $dayId, array $payload): array;
    public function recap(string $tripId): array;
}
