import React from 'react';
import logoSrc from '../../assets/logo.png';

interface LogoProps {
    width?: number;
    height?: number;
    alt?: string
}

export const Logo: React.FC<LogoProps> = ({
                                              width = 100,
                                              height = 100,
                                              alt = 'Logo',
                                          }) => {
    return <img src={logoSrc} width={width} height={height} alt={alt} />;
};
