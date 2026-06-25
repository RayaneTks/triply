<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Trips\ReshuffleBudgetRequest;
use App\Models\Voyage;
use App\Services\TripBudgetReshufflerService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * Budget Reshuffler — proposes swaps to reach a savings target.
 *
 * POST /api/v1/trips/{trip}/budget-reshuffle  { savings_target_eur: number }
 */
class TripBudgetController extends ApiController
{
    public function __construct(private readonly TripBudgetReshufflerService $reshuffler) {}

    public function reshuffle(ReshuffleBudgetRequest $request, string $trip): JsonResponse
    {
        $voyage = $this->findUserTrip($trip);
        $payload = $this->reshuffler->propose(
            $voyage,
            (float) $request->validated('savings_target_eur'),
        );

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
