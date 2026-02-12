<?php

namespace App\Services\Stubs;

use App\Services\Contracts\BookingServiceInterface;

class BookingServiceStub implements BookingServiceInterface
{
    public function checkout(string $tripId, array $payload): array
    {
        return ['id' => 'checkout_stub_001', 'type' => 'booking_checkout', 'attributes' => ['trip_id' => $tripId] + $payload, 'todo' => 'Create checkout intent with external booking provider'];
    }
}
