
import React from 'react';
import {KpiCardData} from "../../../types/kpi.ts";
interface KpiCardProps extends KpiCardData {
    /** Couleur d'accentuation (optionnel) */
    accentColor?: string;
}

const getTrendStyle = (type: 'positive' | 'negative' | 'neutral'): React.CSSProperties => {
    switch (type) {
        case 'positive':
            return { color: '#28a745', fontWeight: 'bold' }; // Vert
        case 'negative':
            return { color: '#dc3545', fontWeight: 'bold' }; // Rouge
        default:
            return { color: '#6c757d' }; // Gris
    }
};

export const KpiCard: React.FC<KpiCardProps> = ({
                                                    title,
                                                    value,
                                                    trendValue,
                                                    trendType,
                                                    icon = '✨',
                                                    accentColor = '#007bff'
                                                }) => {
    const trendSymbol = trendType === 'positive' ? '▲' : trendType === 'negative' ? '▼' : '—';
    const trendText = trendValue ? `${trendSymbol} ${trendValue}` : '';

    return (
        <div style={{
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            backgroundColor: '#fff',
            width: '280px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderTop: `4px solid ${accentColor}`
        }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                <h4 style={{margin: 0, fontSize: '1rem', color: '#6c757d'}}>{title}</h4>
                <span style={{
                    color: accentColor,
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    {icon}
                </span>
            </div>

            <div style={{fontSize: '2.5rem', fontWeight: 600, margin: '10px 0'}}>
                {value}
            </div>

            <div style={{fontSize: '0.9rem', color: '#6c757d'}}>
                <span style={getTrendStyle(trendType)}>{trendText}</span>
                {trendValue && <span> vs période précédente</span>}
            </div>
        </div>
    );
};