<?php

namespace App\Services;

use App\Models\Abonnement;
use App\Models\Paiement;
use App\Models\User;
use App\Services\Contracts\ObservabilityServiceInterface;
use Illuminate\Support\Facades\DB;

class ObservabilityService implements ObservabilityServiceInterface
{
    /**
     * Prix catalogue en EUR (alignés sur le checkout Stripe frontend).
     *
     * @var array<string, array<string, int>>
     */
    private const PLAN_PRICES_EUR = [
        'voyageur' => [
            'monthly' => 12,
            'annual' => 108,
        ],
        'pilote' => [
            'monthly' => 24,
            'annual' => 228,
        ],
    ];

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

        // Paiements (réel) + fallback abonnement (estimé) pour l’admin panel.
        $totalPayments = Paiement::count();
        $revenuePaidEur = (float) Paiement::where('statut', 'paid')->sum('montant') / 100; // centimes -> EUR

        $activeSubsRows = Abonnement::query()
            ->where('statut', 'active')
            ->whereNotNull('tier')
            ->select(['tier', 'plan_interval'])
            ->get();

        $estimatedRevenueEur = 0.0;
        $estimatedMrrEur = 0.0;
        $estimatedArrEur = 0.0;
        $activeMonthly = 0;
        $activeAnnual = 0;

        foreach ($activeSubsRows as $sub) {
            $tier = strtolower((string) $sub->tier);
            $billing = strtolower((string) $sub->plan_interval);
            $price = self::PLAN_PRICES_EUR[$tier][$billing] ?? null;
            if (! is_int($price)) {
                continue;
            }

            $estimatedRevenueEur += $price;
            if ($billing === 'monthly') {
                $activeMonthly++;
                $estimatedMrrEur += $price;
                $estimatedArrEur += $price * 12;
            } elseif ($billing === 'annual') {
                $activeAnnual++;
                $estimatedArrEur += $price;
                $estimatedMrrEur += $price / 12;
            }
        }

        // Priorité au revenu réel; sinon fallback estimé pour éviter "0€" en sandbox.
        $revenueEur = $revenuePaidEur > 0 ? $revenuePaidEur : $estimatedRevenueEur;
        $source = $revenuePaidEur > 0 ? 'paid_payments' : 'estimated_active_subscriptions';

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
                'active_monthly' => $activeMonthly,
                'active_annual' => $activeAnnual,
            ],
            'payments' => [
                'total'       => $totalPayments,
                'revenue_eur' => round($revenueEur, 2),
                'revenue_source' => $source,
                'paid_revenue_eur' => round($revenuePaidEur, 2),
                'estimated_revenue_eur' => round($estimatedRevenueEur, 2),
                'estimated_mrr_eur' => round($estimatedMrrEur, 2),
                'estimated_arr_eur' => round($estimatedArrEur, 2),
            ],
        ];
    }
}
