<?php

namespace App\Services\Contracts;

interface ActivityServiceInterface
{
    public function create(string $tripId, array $payload): array;
    public function list(string $tripId, array $filters): array;
    public function groupedByDay(string $tripId): array;
    public function show(string $tripId, string $activityId): array;
    public function update(string $tripId, string $activityId, array $payload): array;
    public function regenerate(string $tripId, string $activityId): array;
    public function reorder(string $tripId, array $payload): array;
    public function delete(string $tripId, string $activityId): array;
    public function restore(string $tripId, string $activityId): array;
}
