export interface KpiCardData {
    /** Titre de la métrique (Ex: Total Tickets, Vélocité Moyenne) */
    title: string;
    /** La valeur numérique ou formatée à afficher (Ex: 125, "12.5 pts") */
    value: string | number;
    /** Tendance par rapport à la période précédente (Ex: 5, -2, 10%) */
    trendValue?: string | number;
    /** Indique si la tendance est positive ou négative. */
    trendType: 'positive' | 'negative' | 'neutral';
    /** Icône pour la carte (Ex: un emoji ou un nom d'icône si vous utilisez une lib d'icônes). */
    icon?: React.ReactNode;
}