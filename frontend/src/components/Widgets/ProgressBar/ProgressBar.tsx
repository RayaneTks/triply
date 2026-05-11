import React from 'react';
import {ProgressBarData} from "../../../types/progress";

interface ProgressBarProps extends ProgressBarData {
    /** Hauteur de la barre en pixels. */
    height?: number;
}

const defaultColor = '#0070c0'; // Un bleu standard

export const ProgressBar: React.FC<ProgressBarProps> = ({
                                                            percentage,
                                                            label,
                                                            color = defaultColor,
                                                            height = 20
                                                        }) => {
    const clampedPercentage = Math.min(100, Math.max(0, percentage));

    return (
        <div style={{ padding: '10px 0', width: '100%', maxWidth: '400px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
                fontSize: '0.9rem'
            }}>
                <span style={{ fontWeight: 'bold' }}>{label}</span>
                <span>{clampedPercentage.toFixed(0)}%</span>
            </div>

            <div style={{
                height: `${height}px`,
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                overflow: 'hidden'
            }}>
                <div
                    style={{
                        height: '100%',
                        width: `${clampedPercentage}%`,
                        backgroundColor: color,
                        transition: 'width 0.5s ease-in-out'
                    }}
                    role="progressbar"
                    aria-valuenow={clampedPercentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                />
            </div>
        </div>
    );
};