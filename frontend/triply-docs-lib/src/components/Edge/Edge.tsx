import { useMemo } from 'react';

export type EdgeVariant = 'solid' | 'dashed';
export type ColorScheme = 'primary' | 'secondary' | 'neutral';
export type LabelPosition = 'above' | 'below';

export interface EdgeProps {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    label?: string;
    labelOffset?: number;
    labelPosition?: LabelPosition; // Nouvelle prop
    variant?: EdgeVariant;
    colorScheme?: ColorScheme;
}

const COLORS: Record<ColorScheme, string> = {
    primary: '#0096c7',
    secondary: '#F5E6CA',
    neutral: '#64748b',
};

const DEFAULT_LABEL_OFFSET = 25;

const calculateLabelPosition = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    offset: number,
    position: LabelPosition
) => {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const isInputEdge = x2 > x1;
    const labelX = isInputEdge ? midX - offset : midX + offset;

    // Si 'below', on ajoute 20px, sinon on retire 10px
    const labelY = position === 'below' ? midY + 20 : midY - 10;

    return { x: labelX, y: labelY };
};

export const Edge: React.FC<EdgeProps> = ({
                                              x1,
                                              y1,
                                              x2,
                                              y2,
                                              label,
                                              labelOffset = DEFAULT_LABEL_OFFSET,
                                              labelPosition = 'above', // Par défaut au-dessus
                                              variant = 'solid',
                                              colorScheme = 'neutral',
                                          }) => {

    const labelPos = useMemo(
        () => calculateLabelPosition(x1, y1, x2, y2, labelOffset, labelPosition),
        [x1, y1, x2, y2, labelOffset, labelPosition]
    );

    return (
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible z-0">
            <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={COLORS[colorScheme]}
                strokeWidth={2}
                strokeDasharray={variant === 'dashed' ? '5 5' : 'none'}
                className="transition-all duration-300"
            />

            {label && (
                <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    className="fill-slate-600 text-[12px] font-semibold pointer-events-auto select-none"
                    dominantBaseline={labelPosition === 'below' ? "hanging" : "auto"}
                >
                    {label}
                </text>
            )}
        </svg>
    );
};