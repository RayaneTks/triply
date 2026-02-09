export interface ProgressBarData {
    /** Le pourcentage d'achèvement (entre 0 et 100). */
    percentage: number;
    /** Le titre ou la description de l'élément que l'on suit. */
    label: string;
    /** La couleur de la barre de progression (optionnel). */
    color?: string;
}