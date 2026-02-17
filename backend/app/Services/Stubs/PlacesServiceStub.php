<?php

namespace App\Services\Stubs;

use App\Services\Contracts\PlacesServiceInterface;

class PlacesServiceStub implements PlacesServiceInterface
{
    public function details(string $placeId): array
    {
        return ['id' => $placeId, 'type' => 'place', 'attributes' => ['name' => 'Place Stub'], 'todo' => 'Proxy place details provider'];
    }

    public function reviews(string $placeId): array
    {
        return ['place_id' => $placeId, 'items' => [], 'todo' => 'Proxy place reviews provider'];
    }

    public function routes(string $tripId): array
    {
        return ['trip_id' => $tripId, 'polyline' => null, 'legs' => [], 'todo' => 'Build route polyline and legs'];
    }

    public function travelTimes(string $tripId): array
    {
        return ['trip_id' => $tripId, 'items' => [], 'todo' => 'Compute travel times between activities'];
    }

    public function nearbyRestaurants(array $payload): array
    {
        return ['query' => $payload, 'items' => [], 'todo' => 'Proxy nearby restaurants provider'];
    }
}
