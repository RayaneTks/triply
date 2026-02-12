<?php

namespace App\Services\Stubs;

use App\Services\Contracts\TripServiceInterface;

class TripServiceStub implements TripServiceInterface
{
    public function createTrip(array $payload): array
    {
        return ['id' => 'trip_stub_001', 'type' => 'trip', 'attributes' => $payload, 'todo' => 'Persist trip'];
    }

    public function listTrips(): array
    {
        return ['items' => [['id' => 'trip_stub_001', 'title' => 'Trip Stub']], 'todo' => 'Paginate user trips'];
    }

    public function showTrip(string $tripId): array
    {
        return ['id' => $tripId, 'type' => 'trip', 'attributes' => ['title' => 'Trip Stub'], 'todo' => 'Load trip detail'];
    }

    public function updateTrip(string $tripId, array $payload): array
    {
        return ['id' => $tripId, 'type' => 'trip', 'attributes' => $payload, 'todo' => 'Persist trip updates'];
    }

    public function duplicateTrip(string $tripId): array
    {
        return ['id' => 'trip_stub_copy_001', 'type' => 'trip', 'attributes' => ['source_trip_id' => $tripId], 'todo' => 'Duplicate trip graph'];
    }

    public function validateTrip(string $tripId): array
    {
        return ['id' => $tripId, 'type' => 'trip_validation', 'attributes' => ['validated' => true], 'todo' => 'Lock planning and publish trip'];
    }

    public function listDays(string $tripId): array
    {
        return ['trip_id' => $tripId, 'items' => [['id' => 'day_stub_001', 'index' => 1]], 'todo' => 'Load trip days'];
    }

    public function updateDay(string $tripId, string $dayId, array $payload): array
    {
        return ['id' => $dayId, 'type' => 'trip_day', 'attributes' => $payload + ['trip_id' => $tripId], 'todo' => 'Persist day settings'];
    }

    public function recap(string $tripId): array
    {
        return ['id' => $tripId, 'type' => 'trip_recap', 'attributes' => ['sections' => []], 'todo' => 'Build recap payload'];
    }
}
