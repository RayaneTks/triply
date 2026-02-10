<?php

namespace App\Services\Contracts;

interface AiServiceInterface
{
    public function plan(array $payload): array;
    public function generateDay(string $tripId, string $dayId, array $payload): array;
    public function generateActivity(string $activityId, array $payload): array;
    public function jobStatus(string $jobId): array;
    public function cancelJob(string $jobId): array;
    public function qa(array $payload): array;
    public function branch(array $payload): array;
}
