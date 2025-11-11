import React from 'react';

export type EdgeProps = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    variant?: 'solid' | 'dashed';
    colorScheme?: 'primary' | 'secondary' | 'neutral';
};

const colorMap = {
    primary: '#35C497',
    secondary: '#F5E6CA',
    neutral: '#64748b',
};

export const Edge: React.FC<EdgeProps> = ({
                                              x1,
                                              y1,
                                              x2,
                                              y2,
                                              variant = 'solid',
                                              colorScheme = 'neutral',
                                          }) => {

    const lineStyle: React.CSSProperties = {
        stroke: colorMap[colorScheme],
        strokeWidth: 2,
        strokeDasharray: variant === 'dashed' ? '5 5' : 'none',
    };

    const svgStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
    };

    return (
        <svg style={svgStyle}>
            <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                style={lineStyle}
            />
        </svg>
    );
};