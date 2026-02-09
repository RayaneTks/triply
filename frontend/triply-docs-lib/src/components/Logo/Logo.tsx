import React from 'react';
import logoLight from '../../assets/Logo-light.png';
import logoLightColorless from '../../assets/Logo-light-colorless.png';
import logoDark from '../../assets/Logo-dark.png';
import logoDarkColorless from '../../assets/Logo-dark-colorless.png';

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

export const logoToneVariants = {
    'light': logoLight,
    'light-colorless': logoLightColorless,
    'dark': logoDark,
    'dark-colorless': logoDarkColorless,
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
    const logoSrc = logoToneVariants[tone];

    return <img src={logoSrc} width={finalWidth} height={finalHeight} alt={alt} />;
};
