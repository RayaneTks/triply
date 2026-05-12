<?php

namespace App\Services\Contracts;

use App\Models\Voyage;

/**
 * Builds the recap structure for a trip: ordered flight/hotel/day sections
 * with activities and route polylines.
 *
 * Read-only. Assumes voyage is already loaded with transports, hebergements,
 * journees.etapes relations.
 */
interface TripRecapServiceInterface
{
    /**
     * @param array<string, mixed> $serializedTrip
     * @return array<string, mixed>
     */
    public function build(Voyage $voyage, array $serializedTrip): array;
}
