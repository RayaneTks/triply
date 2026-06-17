<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Trips\ReplanTripRequest;
use App\Models\Voyage;
use App\Services\Integrations\ChatAssistantService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

/**
 * Constraint Replanner — endpoint /trips/{trip}/replan.
 *
 * Returns a PREVIEW of the replanned days. The frontend then shows a diff and
 * persists via the existing PATCH /trips/{trip} when the user accepts.
 */
class TripReplanController extends ApiController
{
    public function __construct(private readonly ChatAssistantService $assistant) {}

    public function store(ReplanTripRequest $request, string $trip): JsonResponse
    {
        $voyage = $this->findUserTrip($trip);

        $snapshot = is_array($voyage->plan_snapshot) ? $voyage->plan_snapshot : [];
        $travelDays = $this->resolveTravelDays($voyage, $snapshot);
        $destinationContext = $this->resolveDestination($voyage, $snapshot);

        $currentActivities = $this->extractCurrentActivities($snapshot);
        if ($currentActivities === []) {
            return $this->errorResponse(
                'REPLAN_EMPTY_TRIP',
                "Aucune étape n'est encore planifiée — rien à replanifier.",
                [],
                422,
            );
        }

        $lockedIds = $request->input('locked_activity_ids', []);
        $lockedIds = is_array($lockedIds) ? array_values(array_filter($lockedIds, 'is_string')) : [];
        if ($lockedIds !== []) {
            $lockedSet = array_flip($lockedIds);
            foreach ($currentActivities as &$activity) {
                if (isset($activity['_id']) && isset($lockedSet[$activity['_id']])) {
                    $activity['locked'] = true;
                }
            }
            unset($activity);
        }

        $userPrefs = [];
        if (Auth::user() && is_array(Auth::user()->preferences ?? null)) {
            $prefs = Auth::user()->preferences;
            if (isset($prefs['interests']) && is_array($prefs['interests'])) {
                $userPrefs = array_values(array_filter($prefs['interests'], 'is_string'));
            }
        }

        $body = [
            'destinationContext' => $destinationContext,
            'reason' => (string) $request->input('reason'),
            'details' => (string) ($request->input('details') ?? ''),
            'travelDays' => $travelDays,
            'currentActivities' => array_map(static function (array $a): array {
                unset($a['_id']);

                return $a;
            }, $currentActivities),
            'affectedDays' => $request->input('affected_days', []) ?: [],
            'userPreferences' => $userPrefs,
        ];

        $result = $this->assistant->replan($body);
        $status = (int) ($result['_httpStatus'] ?? 200);
        unset($result['_httpStatus']);

        if ($status >= 400) {
            $message = is_string($result['error'] ?? null)
                ? $result['error']
                : 'Le service replan est indisponible.';

            return $this->errorResponse('REPLAN_FAILED', $message, [], $status);
        }

        $result['trip_id'] = (string) $voyage->id;

        return $this->successResponse($result);
    }

    /**
     * @return list<array{_id: string, day: int, title: string, lat: float, lng: float, durationHours?: float}>
     */
    private function extractCurrentActivities(array $snapshot): array
    {
        $out = [];
        if (! isset($snapshot['days']) || ! is_array($snapshot['days'])) {
            return $out;
        }

        foreach ($snapshot['days'] as $dayIndex => $day) {
            if (! is_array($day)) {
                continue;
            }
            $dayNumber = isset($day['day']) && is_numeric($day['day'])
                ? (int) $day['day']
                : (is_int($dayIndex) ? $dayIndex + 1 : 1);

            $activities = $day['activities'] ?? $day['etapes'] ?? null;
            if (! is_array($activities)) {
                continue;
            }

            foreach ($activities as $activityIndex => $activity) {
                if (! is_array($activity)) {
                    continue;
                }
                $title = isset($activity['title']) && is_string($activity['title'])
                    ? trim($activity['title'])
                    : (isset($activity['name']) && is_string($activity['name']) ? trim($activity['name']) : '');
                $lat = $this->extractCoord($activity, ['lat', 'latitude']);
                $lng = $this->extractCoord($activity, ['lng', 'longitude']);
                if ($title === '' || $lat === null || $lng === null) {
                    continue;
                }
                $id = isset($activity['id']) && (is_string($activity['id']) || is_numeric($activity['id']))
                    ? (string) $activity['id']
                    : sprintf('d%d-a%d', $dayNumber, is_int($activityIndex) ? $activityIndex : 0);
                $row = [
                    '_id' => $id,
                    'day' => $dayNumber,
                    'title' => $title,
                    'lat' => $lat,
                    'lng' => $lng,
                ];
                $dur = $activity['durationHours'] ?? $activity['duration_hours'] ?? null;
                if (is_numeric($dur) && (float) $dur > 0) {
                    $row['durationHours'] = (float) $dur;
                }
                $out[] = $row;
            }
        }

        return $out;
    }

    private function extractCoord(array $activity, array $keys): ?float
    {
        foreach ($keys as $k) {
            if (isset($activity[$k]) && is_numeric($activity[$k])) {
                $v = (float) $activity[$k];
                if (is_finite($v)) {
                    return $v;
                }
            }
        }
        if (isset($activity['coordinates']) && is_array($activity['coordinates'])) {
            foreach ($keys as $k) {
                if (isset($activity['coordinates'][$k]) && is_numeric($activity['coordinates'][$k])) {
                    return (float) $activity['coordinates'][$k];
                }
            }
        }

        return null;
    }

    private function resolveTravelDays(Voyage $voyage, array $snapshot): int
    {
        if (isset($snapshot['travelDays']) && is_numeric($snapshot['travelDays'])) {
            return max(1, (int) $snapshot['travelDays']);
        }
        if (isset($snapshot['days']) && is_array($snapshot['days'])) {
            return max(1, count($snapshot['days']));
        }
        if ($voyage->date_debut && $voyage->date_fin) {
            try {
                $start = Carbon::parse($voyage->date_debut);
                $end = Carbon::parse($voyage->date_fin);

                return max(1, (int) $start->diffInDays($end) + 1);
            } catch (\Throwable) {
                // fallthrough
            }
        }

        return 1;
    }

    private function resolveDestination(Voyage $voyage, array $snapshot): string
    {
        if (isset($snapshot['destination']) && is_string($snapshot['destination']) && trim($snapshot['destination']) !== '') {
            return trim($snapshot['destination']);
        }
        if (is_string($voyage->destination) && trim($voyage->destination) !== '') {
            return trim($voyage->destination);
        }

        return '';
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
