export interface VelocityDataPoint {
    /** Le nom ou le numéro du sprint (Ex: "Sprint 12", "S12") */
    sprint: string;
    /** Le nombre de points engagés au début du sprint (Scope) */
    committed: number;
    /** Le nombre de points réellement terminés à la fin du sprint */
    completed: number;
}