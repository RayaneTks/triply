import { Button, CentralText } from "triply-docs-lib";
import { Link } from "react-router-dom";
import logoImage from "../assets/Logo-light.png";

const STORYBOOK_URL =
    import.meta.env.VITE_PUBLIC_STORYBOOK_URL ||
    '/storybook';

export default function Home() {

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-page-background bg-cover bg-center blur-page"/>
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="relative z-10 flex flex-col items-center justify-center gap-8">
                <CentralText
                    logoSrc={logoImage}
                    logoAlt="Triply Logo"
                    title="Bienvenue"
                    subtitle="Choisissez votre destination ci-dessous"
                    linkText="Rejoignez-nous !"
                    linkHref="/signup"/>

                <div className="flex flex-wrap items-center justify-center gap-4">
                    <a href={STORYBOOK_URL}>
                        <Button label="Storybook" variant="secondary" tone="dark" />
                    </a>
                    <Link to="/powerpoint">
                        <Button label="Présentation" variant="secondary" tone="dark" />
                    </Link>
                    <Link to="/roadmap">
                        <Button label="Roadmap" variant="secondary" tone="dark" />
                    </Link>
                    <Link to="/dashboard">
                        <Button label="Dashboard" variant="secondary" tone="dark" />
                    </Link>
                    <Link to="/git">
                        <Button label="Git" variant="secondary" tone="dark" />
                    </Link>
                    <Link to="/teamchar">
                        <Button label="Organigramme" variant="secondary" tone="dark" />
                    </Link>
                </div>
            </div>
        </div>
    );
}