import { PlanningNeeds } from "./planning-needs";

/**
 * Représentation d'un voyage actif ou archivé.
 */
export interface ActiveTrip {
  id: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  travelers: number;
  styles: string[];
  needs: PlanningNeeds;
  status: "draft" | "planned" | "archived";
}

/**
 * Contexte de l'application partagé via Outlet.
 */
export interface AppContextType {
  activeTrip: ActiveTrip | null;
  hasDraft: boolean;
  isConnected: boolean;
  openLogin: () => void;
  persistCurrentTrip: (trip: Partial<ActiveTrip>) => void;
}
