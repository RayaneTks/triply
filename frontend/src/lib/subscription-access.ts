/**
 * Tiers payants donnant accès aux fonctions « minimum Voyageur » (canvas manuel, etc.).
 * Pilote hérite de tout ce qui est débloqué pour Voyageur.
 */
const PAID_PLANNER_TIERS = new Set(['voyageur', 'pilote']);

export function hasPlannerPaidSubscription(
  subscriptionTier: string | null | undefined,
): boolean {
  if (!subscriptionTier) return false;
  return PAID_PLANNER_TIERS.has(subscriptionTier);
}
