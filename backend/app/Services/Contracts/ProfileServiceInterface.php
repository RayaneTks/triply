<?php

namespace App\Services\Contracts;

interface ProfileServiceInterface
{
    public function show(): array;
    public function updateProfile(array $payload): array;
    public function updatePreferences(array $payload): array;
    public function exportUserData(): array;
    public function deleteUser(array $payload): array;
}
