<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Voyage;
use App\Services\TripFreeTimeService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Free-time Concierge — surfaces unused day capacity + walkable POI suggestions.
 *
 * GET /api/v1/trips/{trip}/days/{day}/free-time
 */
class TripFreeTimeController extends ApiController
{
    public function __construct(private readonly TripFreeTimeService $freeTime) {}

    public function show(Request $request, string $trip, int $day): JsonResponse
    {
        if ($day < 1 || $day > 365) {
            return $this->errorResponse('INVALID_DAY', 'Numéro de jour invalide.', [], 422);
        }

        $voyage = $this->findUserTrip($trip);
        $payload = $this->freeTime->computeForDay($voyage, $day);
        $payload['trip_id'] = (string) $voyage->id;

        return $this->successResponse($payload);
    }

    private function findUserTrip(string $tripId): Voyage
    {
        $user = Auth::user();
        if (! $user) {
            throw new ModelNotFoundException('Utilisateur non authentifie.');
        }

        return Voyage::query()
            ->where('id', $tripId)
            ->where('user_id', $user->id)
            ->firstOrFail();
    }
}
