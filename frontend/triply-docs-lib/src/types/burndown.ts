export interface BurndownDataPoint {
    /** Le jour du sprint ou la date (Ex: "J1", "J2", "15 Nov") */
    day: string;
    /** Travail restant selon la ligne idéale (Ex: en Story Points) */
    ideal: number;
    /** Travail restant réel (Ex: en Story Points) */
    actual: number;
    [key: string]: any;
}