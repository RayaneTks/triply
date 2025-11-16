import {Bubble, CentralText} from "triply-docs-lib";
import logoImage from "../assets/logo.png";

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

                <div className="flex items-center justify-center gap-16">
                    <Bubble label="Storybook" angle={0} href={STORYBOOK_URL}/>
                    <Bubble label="Présentation" angle={36} href="/aboutus"/>
                    <Bubble label="Roadmap" angle={72} href="/roadmap"/>
                    <Bubble label="Dashboard" angle={108} href="/dashboard"/>
                    <Bubble label="Contact" angle={144} href="/contact"/>
                    <Bubble label="Organigramme" angle={180} href="/teamchar"/>
                </div>
            </div>
        </div>
    );
}