export interface KpiCardData {
    title: string;
    value: string | number;
    trendValue?: string;
    trendType?: 'positive' | 'negative' | 'neutral';
    icon?: string;
}
