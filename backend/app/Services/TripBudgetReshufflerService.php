<?php

namespace App\Services;

use App\Models\Voyage;

/**
 * Budget Reshuffler — deterministic swap proposals to reach a savings target.
 *
 * Ranks the user's planned costs (hotel nights, flights, paid étapes, local transports)
 * by impact and proposes downgrades or removals until the target is met.
 *
 * Returns proposals as a *preview only* — application happens through existing
 * PATCH endpoints (hotels/flights/activities) once the user accepts a swap.
 */
class TripBudgetReshufflerService
{
    private const HOTEL_DOWNGRADE_RATE = 0.30;
    private const TRANSPORT_DOWNGRADE_RATE = 0.25;
    private const ACTIVITY_PARTIAL_RATE = 0.50;

    /**
     * @return array{
     *   trip_id: string,
     *   savings_target_eur: float,
     *   total_cost_eur: float,
     *   total_savings_eur: float,
     *   target_met: bool,
     *   swaps: list<array<string, mixed>>
     * }
     */
    public function propose(Voyage $voyage, float $savingsTargetEur): array
    {
        $voyage->loadMissing(['hebergements', 'transports', 'journees.etapes']);

        $items = $this->collectCostItems($voyage);
        $totalCost = array_sum(array_map(fn ($i) => $i['cost'], $items));

        $proposals = [];
        foreach ($items as $item) {
            $proposal = $this->buildProposal($item);
            if ($proposal !== null) {
                $proposals[] = $proposal;
            }
        }

        // Rank by savings descending; greedy fill up to target.
        usort($proposals, fn ($a, $b) => $b['savings_eur'] <=> $a['savings_eur']);

        $accumulated = 0.0;
        $picked = [];
        foreach ($proposals as $p) {
            if ($accumulated >= $savingsTargetEur) {
                $p['recommended'] = false;
            } else {
                $p['recommended'] = true;
                $accumulated += $p['savings_eur'];
            }
            $picked[] = $p;
        }

        return [
            'trip_id' => (string) $voyage->id,
            'savings_target_eur' => round($savingsTargetEur, 2),
            'total_cost_eur' => round($totalCost, 2),
            'total_savings_eur' => round($accumulated, 2),
            'target_met' => $accumulated >= $savingsTargetEur,
            'swaps' => $picked,
        ];
    }

    /**
     * @return list<array{kind: string, id: string, title: string, cost: float}>
     */
    private function collectCostItems(Voyage $voyage): array
    {
        $items = [];

        foreach ($voyage->hebergements as $hotel) {
            $price = $this->toFloat($hotel->prix ?? 0);
            if ($price > 0) {
                $items[] = [
                    'kind' => 'hotel',
                    'id' => (string) $hotel->id,
                    'title' => (string) ($hotel->nom ?? 'Hébergement'),
                    'cost' => $price,
                ];
            }
        }

        foreach ($voyage->transports as $transport) {
            $price = $this->toFloat($transport->prix ?? 0);
            if ($price > 0) {
                $items[] = [
                    'kind' => 'transport',
                    'id' => (string) $transport->id,
                    'title' => sprintf(
                        '%s → %s',
                        (string) ($transport->depart_lieu ?? '—'),
                        (string) ($transport->arrivee_lieu ?? '—'),
                    ),
                    'cost' => $price,
                ];
            }
        }

        foreach ($voyage->journees as $day) {
            foreach ($day->etapes as $etape) {
                $price = $this->toFloat($etape->prix_estime ?? 0);
                if ($price > 0) {
                    $items[] = [
                        'kind' => 'activity',
                        'id' => (string) $etape->id,
                        'title' => (string) ($etape->titre ?? 'Activité'),
                        'cost' => $price,
                    ];
                }
            }
        }

        return $items;
    }

    /**
     * @param  array{kind: string, id: string, title: string, cost: float}  $item
     * @return ?array<string, mixed>
     */
    private function buildProposal(array $item): ?array
    {
        switch ($item['kind']) {
            case 'hotel':
                return [
                    'id' => 'swap-'.$item['kind'].'-'.$item['id'],
                    'kind' => $item['kind'],
                    'entity_id' => $item['id'],
                    'action' => 'downgrade',
                    'title' => 'Hôtel — '.$item['title'],
                    'description' => sprintf(
                        'Catégorie inférieure ou nuits réduites : −%d%% sur ce poste.',
                        (int) (self::HOTEL_DOWNGRADE_RATE * 100),
                    ),
                    'current_cost_eur' => round($item['cost'], 2),
                    'proposed_cost_eur' => round($item['cost'] * (1 - self::HOTEL_DOWNGRADE_RATE), 2),
                    'savings_eur' => round($item['cost'] * self::HOTEL_DOWNGRADE_RATE, 2),
                    'impact_level' => $item['cost'] >= 500 ? 'high' : 'medium',
                ];
            case 'transport':
                return [
                    'id' => 'swap-'.$item['kind'].'-'.$item['id'],
                    'kind' => $item['kind'],
                    'entity_id' => $item['id'],
                    'action' => 'cheaper_alternative',
                    'title' => 'Transport — '.$item['title'],
                    'description' => sprintf(
                        'Recherche une alternative plus économique (heures décalées / compagnie low-cost) : −%d%% en moyenne.',
                        (int) (self::TRANSPORT_DOWNGRADE_RATE * 100),
                    ),
                    'current_cost_eur' => round($item['cost'], 2),
                    'proposed_cost_eur' => round($item['cost'] * (1 - self::TRANSPORT_DOWNGRADE_RATE), 2),
                    'savings_eur' => round($item['cost'] * self::TRANSPORT_DOWNGRADE_RATE, 2),
                    'impact_level' => $item['cost'] >= 300 ? 'high' : 'medium',
                ];
            case 'activity':
                // Cheap activity → drop entirely; expensive → propose downgrade.
                if ($item['cost'] < 30) {
                    return [
                        'id' => 'swap-'.$item['kind'].'-'.$item['id'],
                        'kind' => $item['kind'],
                        'entity_id' => $item['id'],
                        'action' => 'drop',
                        'title' => 'Activité — '.$item['title'],
                        'description' => 'Remplaçable par une alternative gratuite (balade, point de vue, marché local).',
                        'current_cost_eur' => round($item['cost'], 2),
                        'proposed_cost_eur' => 0.0,
                        'savings_eur' => round($item['cost'], 2),
                        'impact_level' => 'low',
                    ];
                }

                return [
                    'id' => 'swap-'.$item['kind'].'-'.$item['id'],
                    'kind' => $item['kind'],
                    'entity_id' => $item['id'],
                    'action' => 'downgrade',
                    'title' => 'Activité — '.$item['title'],
                    'description' => sprintf(
                        'Version allégée (visite libre vs guidée) : −%d%%.',
                        (int) (self::ACTIVITY_PARTIAL_RATE * 100),
                    ),
                    'current_cost_eur' => round($item['cost'], 2),
                    'proposed_cost_eur' => round($item['cost'] * (1 - self::ACTIVITY_PARTIAL_RATE), 2),
                    'savings_eur' => round($item['cost'] * self::ACTIVITY_PARTIAL_RATE, 2),
                    'impact_level' => $item['cost'] >= 100 ? 'high' : 'medium',
                ];
            default:
                return null;
        }
    }

    private function toFloat(mixed $v): float
    {
        if (is_numeric($v)) {
            $f = (float) $v;

            return is_finite($f) ? max(0.0, $f) : 0.0;
        }

        return 0.0;
    }
}
