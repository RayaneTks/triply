<?php

namespace App\Services\Stubs;

use App\Services\Contracts\ProfileServiceInterface;

class ProfileServiceStub implements ProfileServiceInterface
{
    public function show(): array
    {
        return ['id' => 'usr_stub_001', 'type' => 'profile', 'attributes' => ['name' => 'Stub User', 'timezone' => 'Europe/Paris'], 'todo' => 'Load profile from persistence'];
    }

    public function updateProfile(array $payload): array
    {
        return ['id' => 'usr_stub_001', 'type' => 'profile', 'attributes' => $payload, 'todo' => 'Persist profile updates'];
    }

    public function updatePreferences(array $payload): array
    {
        return ['id' => 'usr_stub_001', 'type' => 'profile_preferences', 'attributes' => $payload, 'todo' => 'Persist user preferences'];
    }

    public function exportUserData(): array
    {
        return ['id' => 'user_export_stub', 'type' => 'user_export', 'attributes' => ['status' => 'queued'], 'todo' => 'Assemble GDPR export package'];
    }

    public function deleteUser(array $payload): array
    {
        return ['id' => 'usr_stub_001', 'type' => 'user_deletion', 'attributes' => ['accepted' => (bool) ($payload['confirm'] ?? false)], 'todo' => 'Soft delete user account and cascade cleanup'];
    }
}
