<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Voyage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminTripsController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 50);
        $limit = max(1, min(200, $limit));
        $search = trim((string) $request->query('search', ''));

        $query = Voyage::query()
            ->with(['user:id,name,email'])
            ->orderByDesc('created_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $q->where('titre', 'like', '%'.$search.'%')
                    ->orWhere('destination', 'like', '%'.$search.'%')
                    ->orWhereHas('user', function ($u) use ($search): void {
                        $u->where('email', 'like', '%'.$search.'%')
                            ->orWhere('name', 'like', '%'.$search.'%');
                    });
            });
        }

        $items = $query->limit($limit)->get()->map(function (Voyage $trip) {
            return [
                'id' => (string) $trip->id,
                'title' => $trip->titre,
                'destination' => $trip->destination,
                'start_date' => $trip->date_debut?->toDateString(),
                'end_date' => $trip->date_fin?->toDateString(),
                'budget_total' => $trip->budget_total,
                'travelers_count' => $trip->nb_voyageurs,
                'owner' => [
                    'id' => (string) ($trip->user?->id ?? ''),
                    'name' => $trip->user?->name,
                    'email' => $trip->user?->email,
                ],
                'created_at' => $trip->created_at?->toISOString(),
            ];
        })->values()->all();

        return $this->successResponse([
            'items' => $items,
            'count' => count($items),
        ]);
    }

    public function destroy(string $tripId): JsonResponse
    {
        $trip = Voyage::query()->findOrFail($tripId);
        $trip->delete();

        return $this->successResponse([
            'deleted' => true,
            'id' => (string) $tripId,
        ]);
    }
}

