import React from "react";

type BubbleProps = {
    label: string;
    angle: number;
    radiusX?: number;
    radiusY?: number;
    href: string;
};

export const Bubble: React.FC<BubbleProps> = ({
                                                  label,
                                                  angle,
                                                  radiusX = 500,
                                                  radiusY = 250,
                                                  href,
                                              }) => {
    const rad = (angle * Math.PI) / 180;
    const x = radiusX * Math.cos(rad);
    const y = radiusY * Math.sin(rad);

    return (
        <a
            href={href}
            className="absolute bg-primary-dark text-secondary-900 backdrop-blur-md rounded-full px-6 py-4 text-center cursor-pointer hover:bg-secondary-dark hover:scale-110 transition-all"
            style={{
                left: `50%`,
                top: `50%`,
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
            }}
        >
            {label}
        </a>
    );
};