<?php

namespace App\Services\Stubs;

use App\Services\Contracts\TravelServiceInterface;

class TravelServiceStub implements TravelServiceInterface
{
    public function listFlights(string $tripId): array
    {
        return ['trip_id' => $tripId, 'items' => [], 'todo' => 'List flights'];
    }

    public function createFlight(string $tripId, array $payload): array
    {
        return ['id' => 'flight_stub_001', 'type' => 'flight', 'attributes' => $payload + ['trip_id' => $tripId], 'todo' => 'Persist flight'];
    }

    public function updateFlight(string $tripId, string $flightId, array $payload): array
    {
        return ['id' => $flightId, 'type' => 'flight', 'attributes' => $payload + ['trip_id' => $tripId], 'todo' => 'Update flight'];
    }

    public function deleteFlight(string $tripId, string $flightId): array
    {
        return ['id' => $flightId, 'type' => 'flight_deletion', 'attributes' => ['trip_id' => $tripId, 'deleted' => true], 'todo' => 'Delete flight'];
    }

    public function listHotels(string $tripId): array
    {
        return ['trip_id' => $tripId, 'items' => [], 'todo' => 'List hotels'];
    }

    public function createHotel(string $tripId, array $payload): array
    {
        return ['id' => 'hotel_stub_001', 'type' => 'hotel', 'attributes' => $payload + ['trip_id' => $tripId], 'todo' => 'Persist hotel'];
    }

    public function updateHotel(string $tripId, string $hotelId, array $payload): array
    {
        return ['id' => $hotelId, 'type' => 'hotel', 'attributes' => $payload + ['trip_id' => $tripId], 'todo' => 'Update hotel'];
    }

    public function deleteHotel(string $tripId, string $hotelId): array
    {
        return ['id' => $hotelId, 'type' => 'hotel_deletion', 'attributes' => ['trip_id' => $tripId, 'deleted' => true], 'todo' => 'Delete hotel'];
    }

    public function listLocalTransports(string $tripId): array
    {
        return ['trip_id' => $tripId, 'items' => [], 'todo' => 'List local transports'];
    }

    public function createLocalTransport(string $tripId, array $payload): array
    {
        return ['id' => 'transport_stub_001', 'type' => 'local_transport', 'attributes' => $payload + ['trip_id' => $tripId], 'todo' => 'Persist local transport'];
    }

    public function updateLocalTransport(string $tripId, string $transportId, array $payload): array
    {
        return ['id' => $transportId, 'type' => 'local_transport', 'attributes' => $payload + ['trip_id' => $tripId], 'todo' => 'Update local transport'];
    }

    public function deleteLocalTransport(string $tripId, string $transportId): array
    {
        return ['id' => $transportId, 'type' => 'local_transport_deletion', 'attributes' => ['trip_id' => $tripId, 'deleted' => true], 'todo' => 'Delete local transport'];
    }
}
