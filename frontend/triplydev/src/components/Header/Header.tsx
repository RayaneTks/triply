import {Button, ButtonProps} from "../Button/Button";
import {FC} from "react";
import { Logo } from '../Logo/Logo'; // NOUVEAU : Importer le composant Logo

export interface NavItem {
    id: number | string;
    label: string;
    href: string;
}

export interface HeaderProps {
    logoAlt: string;
    navItems: NavItem[];
    ctaButtons: ButtonProps[];
}

const LOGO_SIZE_SMALL = 120;

export const Header: FC<HeaderProps> = ({ logoAlt, navItems, ctaButtons }) => {
    const linkTextColor = 'text-black hover:text-primary';

    return (
        <header className="w-full max-w-full flex !justify-between rounded-b-xl items-center px-8 py-4 bg-white"
                style={{ justifyContent: 'space-between' }}>

            <Logo
                width={LOGO_SIZE_SMALL}
                height={LOGO_SIZE_SMALL}
                alt={logoAlt}
            />

            <div className="flex items-center gap-10">

                <nav className="header-nav flex gap-4">
                    {navItems.map(item => (
                        <a key={item.id} href={item.href} className={`transition duration-150 ${linkTextColor}`}>
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="header-cta flex gap-3">
                    {ctaButtons.map((buttonProps, index) => {
                        const { variant, tone, ...restProps } = buttonProps;
void variant;
void tone;
                        return (
                            <Button
                                key={index}
                                {...restProps}
                                variant="light"
                                tone="tone1"
                            />
                        );
                    })}
                </div>
            </div>
        </header>
    );
};
