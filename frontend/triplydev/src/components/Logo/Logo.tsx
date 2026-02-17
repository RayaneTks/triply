import React from 'react';
import logoLight from '../../assets/Logo-light.png';
import logoLightColorless from '../../assets/Logo-light-colorless.png';
import logoDark from '../../assets/Logo-dark.png';
import logoDarkColorless from '../../assets/Logo-dark-colorless.png';
import { useSlideContext } from '../PowerPoint/Slide';

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
    // Utiliser le contexte pour détecter la dernière slide
    let slideContext = { isLastSlide: false };
    try {
        slideContext = useSlideContext();
    } catch (e) {
        // Le contexte n'est pas disponible (pas dans une slide), utiliser la valeur par défaut
    }
    
    // Si c'est la dernière slide, utiliser le logo light-colorless
    const finalTone = slideContext.isLastSlide ? 'light-colorless' : tone;
    
    const sizeConfig = logoSizeVariants[size];
    const finalWidth = width ?? sizeConfig.width;
    const finalHeight = height ?? sizeConfig.height;
    const logoSrc = logoToneVariants[finalTone];

    const src = typeof logoSrc === 'string' ? logoSrc : logoSrc.src;
    return <img src={src} width={finalWidth} height={finalHeight} alt={alt} />;
};
