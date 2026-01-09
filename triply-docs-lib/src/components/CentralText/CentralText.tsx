import { Button } from '../Button/Button';
import { Logo, logoSizeVariants } from '../Logo/Logo';

export type CentralTextProps = {
    title: string;
    subtitle?: string;
    linkText?: string;
    linkHref?: string | (() => void);
    logoSrc?: string;
    logoAlt?: string;
    logoSize?: 'small' | 'default' | 'large';
    logoTone?: 'light' | 'light-colorless' | 'dark' | 'dark-colorless';
    textColor?: 'black' | 'white';
};

export const CentralText: React.FC<CentralTextProps> = ({ 
    title, 
    subtitle, 
    linkText, 
    linkHref, 
    logoSrc, 
    logoAlt,
    logoSize = 'large',
    logoTone = 'light',
    textColor = 'black'
}) => {
    const logoDimensions = logoSizeVariants[logoSize];
    const titleColor = textColor === 'white' ? 'text-white' : 'text-black';
    const subtitleColor = textColor === 'white' ? 'text-white/80' : 'text-black/80';

    return (
        <div className="text-center">
            {logoSrc ? (
                <div className="mx-auto mb-4 flex justify-center">
                    <img
                        src={logoSrc}
                        alt={logoAlt || 'Logo'}
                        className={`mx-auto ${logoDimensions.width}px ${logoDimensions.height}px w-auto mb-4`}
                        style={{
                            height: `${logoDimensions.height}px`
                        }}
                    />
                </div>
            ) : (
                <div className="mx-auto mb-4 flex justify-center">
                    <Logo alt={logoAlt || 'Logo'} size={logoSize} tone={logoTone} />
                </div>
            )}
            <h1 className={`text-4xl font-bold ${titleColor} mb-2`}>{title}</h1>
            {subtitle && <p className={`text-lg ${subtitleColor} mb-2`}>{subtitle}</p>}
            {linkText && linkHref && (
                typeof linkHref === 'string' ? (
                    <a href={linkHref} className="inline-block mt-4">
                        <Button
                            label={linkText}
                            variant="light"
                            tone="tone1"
                        />
                    </a>
                ) : (
                    <div className="inline-block mt-4" onClick={linkHref}>
                        <Button
                            label={linkText}
                            variant="light"
                            tone="tone1"
                        />
                    </div>
                )
            )}
        </div>
    );
};
