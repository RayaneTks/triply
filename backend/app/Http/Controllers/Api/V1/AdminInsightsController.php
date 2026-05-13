<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\User;
use App\Models\Voyage;
use Illuminate\Http\JsonResponse;

class AdminInsightsController extends ApiController
{
    public function index(): JsonResponse
    {
        $totalUsers = User::query()->count();
        $payingUsers = User::query()->whereNotNull('subscription_tier')->count();
        $newUsers30d = User::query()->where('created_at', '>=', now()->subDays(30))->count();

        $totalTrips = Voyage::query()->count();
        $newTrips30d = Voyage::query()->where('created_at', '>=', now()->subDays(30))->count();
        $usersWithTrips = Voyage::query()->distinct('user_id')->count('user_id');
        $usersWithoutTrips = max(0, $totalUsers - $usersWithTrips);
        $usersWith2PlusTrips = Voyage::query()
            ->selectRaw('user_id, count(*) as c')
            ->groupBy('user_id')
            ->havingRaw('count(*) >= 2')
            ->get()
            ->count();
        $tripsWithActivities = Voyage::query()->whereHas('journees.etapes')->count();

        $activationRate = $totalUsers > 0 ? round(($usersWithTrips / $totalUsers) * 100, 1) : 0.0;
        $subscriptionRate = $totalUsers > 0 ? round(($payingUsers / $totalUsers) * 100, 1) : 0.0;
        $repeatRate = $usersWithTrips > 0 ? round(($usersWith2PlusTrips / $usersWithTrips) * 100, 1) : 0.0;
        $planningCoverageRate = $totalTrips > 0 ? round(($tripsWithActivities / $totalTrips) * 100, 1) : 0.0;
        $avgTripsPerUser = $totalUsers > 0 ? round($totalTrips / $totalUsers, 2) : 0.0;
        $avgBudget = (float) Voyage::query()->whereNotNull('budget_total')->avg('budget_total');

        $topDestinations = Voyage::query()
            ->selectRaw('destination, count(*) as total')
            ->whereNotNull('destination')
            ->where('destination', '!=', '')
            ->groupBy('destination')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'destination' => (string) $row->destination,
                'total' => (int) $row->total,
            ])
            ->values()
            ->all();

        $improvementAxes = [];
        if ($activationRate < 60) {
            $improvementAxes[] = 'Améliorer l’onboarding: trop d’utilisateurs ne créent aucun voyage.';
        }
        if ($planningCoverageRate < 70) {
            $improvementAxes[] = 'Fiabiliser la génération d’activités: plusieurs voyages restent sans planning.';
        }
        if ($subscriptionRate < 15) {
            $improvementAxes[] = 'Optimiser la conversion payante: clarifier la valeur du plan Voyageur.';
        }
        if ($repeatRate < 25) {
            $improvementAxes[] = 'Renforcer la rétention: peu d’utilisateurs reviennent pour un 2e voyage.';
        }
        if ($improvementAxes === []) {
            $improvementAxes[] = 'Les KPI sont globalement sains, prioriser des A/B tests pricing et onboarding.';
        }

        return $this->successResponse([
            'users' => [
                'total' => $totalUsers,
                'new_30d' => $newUsers30d,
                'with_trips' => $usersWithTrips,
                'without_trips' => $usersWithoutTrips,
            ],
            'subscriptions' => [
                'paying' => $payingUsers,
                'conversion_rate' => $subscriptionRate,
            ],
            'trips' => [
                'total' => $totalTrips,
                'new_30d' => $newTrips30d,
                'avg_per_user' => $avgTripsPerUser,
                'with_activities' => $tripsWithActivities,
                'planning_coverage_rate' => $planningCoverageRate,
                'avg_budget_eur' => round($avgBudget, 0),
            ],
            'retention' => [
                'repeat_user_rate' => $repeatRate,
                'activation_rate' => $activationRate,
            ],
            'top_destinations' => $topDestinations,
            'improvement_axes' => $improvementAxes,
        ]);
    }
}

