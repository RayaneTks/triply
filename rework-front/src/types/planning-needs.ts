/**
 * Types des besoins de planification pour un voyage.
 */
export interface PlanningNeeds {
  flights: boolean;
  hotels: boolean;
  activities: boolean;
  restaurants: boolean;
}

export const DEFAULT_PLANNING_NEEDS: PlanningNeeds = {
  flights: false,
  hotels: false,
  activities: false,
  restaurants: false,
};

/**
 * Helper pour vérifier si au moins un besoin est coché.
 */
export function hasAnyPlanningNeed(needs: PlanningNeeds): boolean {
  return Object.values(needs).some((val) => val === true);
}
