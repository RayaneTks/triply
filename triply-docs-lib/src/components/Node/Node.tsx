import React from 'react';

export type NodeProps = {
    x: number;
    y: number;
    label: string;
    onClick?: (nodeId: string) => void;
    id: string;
    colorScheme?: 'primary' | 'secondary' | 'neutral';
    isActive?: boolean;
};

export const Node: React.FC<NodeProps> = ({
                                              x,
                                              y,
                                              label,
                                              id,
                                              onClick,
                                              colorScheme = 'primary',
                                              isActive = false
                                          }) => {

    const colorClasses = {
        primary: 'bg-primary text-white',
        secondary: 'bg-secondary text-black',
        neutral: 'bg-neutral text-white',
    };

    const dynamicStyles: React.CSSProperties = {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
    };

    const baseClasses = `
        w-20 h-20
        rounded-full
        cursor-pointer
        p-1.5
        flex items-center justify-center text-center
        transition-transform duration-200 hover:scale-105
    `;

    const interactionClasses = isActive
        ? 'scale-110 shadow-lg ring-4 ring-blue-500 ring-offset-2'
        : 'hover:scale-105';

    return (
        <div
            onClick={() => onClick?.(id)}
            className={`${baseClasses} ${colorClasses[colorScheme]} ${interactionClasses}`}
            style={dynamicStyles}
        >
            {label}
        </div>
    );
};