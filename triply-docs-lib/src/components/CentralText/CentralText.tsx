export type CentralTextProps = {
    title: string;
    subtitle?: string;
    linkText?: string;
    linkHref?: string;
    logoSrc?: string;
    logoAlt?: string;
};

export const CentralText: React.FC<CentralTextProps> = ({ title, subtitle, linkText, linkHref, logoSrc, logoAlt }) => {
    return (
        <div className="text-center">
            {logoSrc && (
                <img
                    src={logoSrc}
                    alt={logoAlt || 'Logo'}
                    className="mx-auto h-16 w-auto mb-4"
                />
            )}
            <h1 className="text-4xl font-bold mb-2">{title}</h1>
            {subtitle && <p className="text-lg text-white/80 mb-2">{subtitle}</p>}
            {linkText && linkHref && (
                <a
                    href={linkHref}
                    className="text-lg text-blue-400 cursor-pointer hover:underline"
                >
                    {linkText}
                </a>
            )}
        </div>
    );
};
