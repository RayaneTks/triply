import React, { useId } from 'react';

export interface ButtonProps {
    label: string;
    onClick?: () => void;
    variant?: 'dark' | 'light';
    tone?: 'tone1' | 'tone2';
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({
                                                  label,
                                                  onClick,
                                                  variant = 'dark',
                                                  tone = 'tone2',
                                                  className = '',
                                              }) => {
    const buttonId = useId();
    const buttonClass = `triply-button-${buttonId.replace(/:/g, '-')}`;
    
    // Couleurs pour les variantes
    type Variant = 'dark' | 'light';
    type Tone = 'tone1' | 'tone2';
    
    const colors: Record<Variant, Record<Tone, { color: string; outline: string; textColor: string }>> = {
        dark: {
            tone1: {
                color: '#0096c7',
                outline: '#FFFFFF',
                textColor: '#FFFFFF',
            },
            tone2: {
                color: '#222222',
                outline: '#ffffff',
                textColor: '#ffffff',
            },
        },
        light: {
            tone1: {
                color: '#0096c7',
                outline: '#222222',
                textColor: '#FFFFFF',
            },
            tone2: {
                color: '#FFFFFF',
                outline: '#222222',
                textColor: '#222222',
            },
        },
    };

    const validVariant = (variant === 'dark' || variant === 'light') ? variant : 'dark';
    const validTone = (tone === 'tone1' || tone === 'tone2') ? tone : 'tone2';
    const buttonColors = colors[validVariant][validTone];

    return (
        <>
            <div className={className}>
                <button
                    type="button"
                    onClick={onClick}
                    className={buttonClass}
                    style={{
                        '--button_radius': '0.75em',
                        '--button_color': buttonColors.color,
                        '--button_outline_color': buttonColors.outline,
                        '--button_text_color': buttonColors.textColor,
                    } as React.CSSProperties}
                >
                    <span className={`${buttonClass}-top`}>{label}</span>
                </button>
            </div>
            <style>{`
                .${buttonClass} {
                    font-size: 17px;
                    font-weight: bold;
                    border: none;
                    cursor: pointer;
                    border-radius: var(--button_radius);
                    background: var(--button_outline_color);
                }

                .${buttonClass}-top {
                    display: block;
                    box-sizing: border-box;
                    border: 2px solid var(--button_outline_color);
                    border-radius: var(--button_radius);
                    padding: 0.75em 1.5em;
                    background: var(--button_color);
                    color: var(--button_text_color);
                    transform: translateY(-0.2em);
                    transition: transform 0.1s ease;
                }

                .${buttonClass}:hover .${buttonClass}-top {
                    transform: translateY(-0.33em);
                }

                .${buttonClass}:active .${buttonClass}-top {
                    transform: translateY(0);
                }
            `}</style>
        </>
    );
};
