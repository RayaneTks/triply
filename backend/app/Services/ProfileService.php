<?php

namespace App\Services;

use App\Services\Contracts\ProfileServiceInterface;
use Illuminate\Support\Facades\Auth;

class ProfileService implements ProfileServiceInterface
{
    public function show(): array
    {
        $user = Auth::user();

        return [
            'id' => $user->id,
            'type' => 'profile',
            'attributes' => [
                'name' => $user->name,
                'email' => $user->email,
                'photo_url' => $user->photo_url,
                'timezone' => $user->timezone,
                'preferences' => $user->preferences->toArray(),
            ],
        ];
    }

    public function updateProfile(array $payload): array
    {
        $user = Auth::user();
        $user->update($payload);

        return $this->show();
    }

    public function updatePreferences(array $payload): array
    {
        $user = Auth::user();
        $user->preferences = $user->preferences->merge($payload);
        $user->save();

        return $this->show();
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
