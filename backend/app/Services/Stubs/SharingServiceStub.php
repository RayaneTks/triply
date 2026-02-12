<?php

namespace App\Services\Stubs;

use App\Services\Contracts\SharingServiceInterface;

class SharingServiceStub implements SharingServiceInterface
{
    public function createShareLink(string $tripId, array $payload): array
    {
        return ['id' => 'share_stub_001', 'type' => 'share_link', 'attributes' => ['trip_id' => $tripId, 'token' => 'public-token-stub'] + $payload, 'todo' => 'Persist and secure share token'];
    }

    public function publicRecap(string $token): array
    {
        return ['id' => 'recap_public_stub', 'type' => 'trip_recap_public', 'attributes' => ['token' => $token], 'todo' => 'Resolve public recap from token'];
    }
}
