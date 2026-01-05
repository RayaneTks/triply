export interface ButtonProps {
    label: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary';
    tone?: 'light' | 'default' | 'dark';
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({
                                                  label,
                                                  onClick,
                                                  variant = 'primary',
                                                  tone = 'default',
                                                  className = '',
                                              }) => {
    const tones = {
        primary: {
            light: 'bg-primary-light hover:bg-primary',
            default: 'bg-primary hover:bg-primary-dark',
            dark: 'bg-primary-dark',
        },
        secondary: {
            light: 'bg-secondary-light hover:bg-secondary',
            default: 'bg-secondary hover:bg-secondary-dark hover:text-white',
            dark: 'bg-secondary-dark',
        },
    };

    const textColor = tone === 'dark' ? 'text-white' : (variant === 'secondary' ? 'text-black' : 'text-white');

    return (
        <button
            onClick={onClick}
            className={`px-6 py-1 rounded-md font-medium transition-colors duration-200 ${tones[variant][tone]} ${textColor} ${className}`}
        >
            {label}
        </button>
    )
};
