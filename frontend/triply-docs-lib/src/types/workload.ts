export interface WorkloadDataPoint {
    /** Le nom de l'axe des catégories (Ex: Nom de la personne) */
    assignee: string;
    /** Nombre de tickets "À Faire" */
    toDo: number;
    /** Nombre de tickets "En Cours" */
    inProgress: number;
    /** Nombre de tickets "En Revue" */
    inReview: number;
    /** Nombre de tickets "Bloqué" */
    blocked: number;
}