<?php

namespace App\Services;

use App\Models\Abonnement;
use App\Models\Paiement;
use App\Models\User;
use App\Services\Contracts\ObservabilityServiceInterface;
use Illuminate\Support\Facades\DB;

class ObservabilityService implements ObservabilityServiceInterface
{
    public function health(): array
    {
        return [
            'status' => 'ok',
            'app'    => config('app.name', 'Triply API'),
            'env'    => config('app.env'),
        ];
    }

    public function metrics(): array
    {
        $now = now();

        // Utilisateurs
        $totalUsers    = User::count();
        $newThisMonth  = User::whereYear('created_at', $now->year)
                             ->whereMonth('created_at', $now->month)
                             ->count();

        // Croissance sur 6 mois (pour mini-graphe)
        $userGrowth = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $userGrowth[] = [
                'month' => $month->format('M Y'),
                'count' => User::whereYear('created_at', $month->year)
                               ->whereMonth('created_at', $month->month)
                               ->count(),
            ];
        }

        // Voyages
        $totalTrips   = DB::table('voyages')->count();
        $tripsThisMonth = DB::table('voyages')
            ->whereYear('created_at', $now->year)
            ->whereMonth('created_at', $now->month)
            ->count();

        // Abonnements
        $totalSubs  = Abonnement::count();
        $activeSubs = Abonnement::where('statut', 'active')->count();

        // Paiements
        $totalPayments = Paiement::count();
        $revenueEur    = Paiement::where('statut', 'paid')
                                  ->sum('montant'); // stocké en centimes

        return [
            'users' => [
                'total'          => $totalUsers,
                'new_this_month' => $newThisMonth,
                'growth'         => $userGrowth,
            ],
            'trips' => [
                'total'          => $totalTrips,
                'new_this_month' => $tripsThisMonth,
            ],
            'subscriptions' => [
                'total'  => $totalSubs,
                'active' => $activeSubs,
            ],
            'payments' => [
                'total'       => $totalPayments,
                'revenue_eur' => round($revenueEur / 100, 2),
            ],
        ];
    }
}
