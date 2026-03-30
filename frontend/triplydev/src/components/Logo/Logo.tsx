import React from 'react';
import Image from 'next/image';

interface LogoProps {
    width?: number;
    height?: number;
    alt?: string;
    size?: 'small' | 'default' | 'large';
    tone?: 'light' | 'light-colorless' | 'dark' | 'dark-colorless';
}

export const logoSizeVariants = {
    small: { width: 60, height: 60 },
    default: { width: 120, height: 120 },
    large: { width: 180, height: 180 },
};

export const Logo: React.FC<LogoProps> = ({
                                              width,
                                              height,
                                              alt = 'Logo',
                                              size = 'default',
                                              tone = 'light',
                                          }) => {
    const sizeConfig = logoSizeVariants[size];
    const finalWidth = width ?? sizeConfig.width;
    const finalHeight = height ?? sizeConfig.height;

    // Robustesse build: les PNG de variantes n'existent pas toujours.
    // On utilise une source unique (SVG) déjà disponible dans `public`.
    // `tone` est conservé pour compatibilité API, mais n'affecte pas l'image pour l'instant.
    return <Image src="/Logo-triply.svg" width={finalWidth} height={finalHeight} alt={alt} />;
};
