<?php

namespace App\Services\Contracts;

use App\Models\Voyage;

/**
 * Builds activity-to-activity route segments per day with profile selection
 * (walking <2km, driving otherwise) and ETA estimation.
 */
interface RouteServiceInterface
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function buildSegments(Voyage $voyage): array;
}
