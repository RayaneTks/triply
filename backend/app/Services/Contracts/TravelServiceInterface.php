<?php

namespace App\Services\Contracts;

interface TravelServiceInterface
{
    public function listFlights(string $tripId): array;
    public function createFlight(string $tripId, array $payload): array;
    public function updateFlight(string $tripId, string $flightId, array $payload): array;
    public function deleteFlight(string $tripId, string $flightId): array;
    public function listHotels(string $tripId): array;
    public function createHotel(string $tripId, array $payload): array;
    public function updateHotel(string $tripId, string $hotelId, array $payload): array;
    public function deleteHotel(string $tripId, string $hotelId): array;
    public function listLocalTransports(string $tripId): array;
    public function createLocalTransport(string $tripId, array $payload): array;
    public function updateLocalTransport(string $tripId, string $transportId, array $payload): array;
    public function deleteLocalTransport(string $tripId, string $transportId): array;
}
