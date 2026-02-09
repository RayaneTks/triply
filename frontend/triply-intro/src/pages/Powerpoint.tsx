import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
    Button, 
    CentralText, 
    ImageCard, 
    SlidingDoorCard,
    SearchBar,
    TravelerCounter,
    Slide,
    SliderMenu,
    type SlideDefinition,
    type SlideDirection
} from 'triply-docs-lib';
import logoImage from "../assets/Logo-light.png";

const slides: SlideDefinition[] = [
    { id: '1', title: 'Bienvenue sur Triply', content: null },
    { id: '2', title: 'Recherche de destination', content: null },
    { id: '3', title: 'Sélection du nombre de voyageurs', content: null },
    { id: '4', title: 'Découvrez nos destinations', content: null },
    { id: '5', title: 'Planifiez votre voyage', content: null },
    { id: '6', title: 'Prêt à partir ?', content: null },
];

export default function Powerpoint() {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [direction, setDirection] = useState<SlideDirection>(1);
    const [travelerCount, setTravelerCount] = useState(1);

    const goToNext = () => {
        if (currentSlideIndex < slides.length - 1) {
            setDirection(1);
            setCurrentSlideIndex(currentSlideIndex + 1);
        }
    };

    const goToPrev = () => {
        if (currentSlideIndex > 0) {
            setDirection(-1);
            setCurrentSlideIndex(currentSlideIndex - 1);
        }
    };

    const goToSlide = (index: number) => {
        setDirection(index > currentSlideIndex ? 1 : -1);
        setCurrentSlideIndex(index);
    };

    const canNext = currentSlideIndex < slides.length - 1;
    const canPrev = currentSlideIndex > 0;

    const renderSlideContent = () => {
        switch (currentSlideIndex) {
            case 0:
                return (
                    <div className="flex flex-col items-center justify-center h-full bg-white p-8">
                        <CentralText
                            logoSrc={logoImage}
                            logoAlt="Triply Logo"
                            title="Bienvenue sur Triply"
                            subtitle="Votre compagnon de voyage idéal"
                            linkText="Commencer"
                            linkHref="#"
                        />
                        <div className="mt-8 text-center max-w-2xl">
                            <p className="text-xl text-gray-800 mb-4">
                                Planifiez vos voyages en toute simplicité
                            </p>
                            <p className="text-lg text-gray-600">
                                Trouvez les meilleures destinations, réservez vos hébergements et créez des souvenirs inoubliables
                            </p>
                        </div>
                    </div>
                );

            case 1:
                return (
                    <div className="flex flex-col items-center justify-center h-full bg-white p-8">
                        <h2 className="text-4xl font-bold text-gray-800 mb-8">Où souhaitez-vous aller ?</h2>
                        <div className="w-full max-w-4xl space-y-6">
                            <SearchBar 
                                placeholder="Recherchez une destination..." 
                                className="w-full"
                            />
                            <div className="grid grid-cols-3 gap-4 mt-8 w-full place-items-center">
                                <ImageCard
                                    imageSrc="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop"
                                    imageAlt="Paris"
                                    title="Paris, France"
                                    description="Découvrez la ville de l'amour avec ses monuments emblématiques et sa culture riche."
                                    buttonText="Explorer"
                                    onButtonClick={() => alert('Exploration de Paris')}
                                />
                                <ImageCard
                                    imageSrc="https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=400"
                                    imageAlt="Tokyo"
                                    title="Tokyo, Japon"
                                    description="Plongez dans l'univers fascinant de la capitale japonaise, entre tradition et modernité."
                                    buttonText="Explorer"
                                    onButtonClick={() => alert('Exploration de Tokyo')}
                                />
                                <ImageCard
                                    imageSrc="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400"
                                    imageAlt="New York"
                                    title="New York, USA"
                                    description="Vivez l'énergie de la ville qui ne dort jamais avec ses gratte-ciels et sa vie culturelle."
                                    buttonText="Explorer"
                                    onButtonClick={() => alert('Exploration de New York')}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="flex flex-col items-center justify-center h-full bg-white p-8">
                        <h2 className="text-4xl font-bold text-gray-800 mb-8">Combien de voyageurs ?</h2>
                        <div className="w-full max-w-md space-y-4">
                            <TravelerCounter 
                                count={travelerCount}
                                onChange={setTravelerCount}
                            />
                            <div className="mt-8 text-center">
                                <p className="text-lg text-gray-600 mb-4">
                                    Sélectionnez le nombre de personnes pour votre voyage
                                </p>
                                <Button
                                    label="Continuer"
                                    onClick={() => goToNext()}
                                    variant="light"
                                    tone="tone1"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="flex flex-col items-center justify-center h-full bg-white p-8">
                        <h2 className="text-4xl font-bold text-gray-800 mb-8">Nos destinations populaires</h2>
                        <div className="flex gap-6 justify-center items-center flex-wrap">
                            <SlidingDoorCard
                                imageSrc="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600"
                                imageAlt="Santorini"
                                title="Santorini, Grèce"
                                description="Découvrez les magnifiques couchers de soleil et les maisons blanches caractéristiques de cette île grecque paradisiaque."
                                buttonText="Réserver"
                                onButtonClick={() => alert('Réservation Santorini')}
                            />
                            <SlidingDoorCard
                                imageSrc="https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600"
                                imageAlt="Bali"
                                title="Bali, Indonésie"
                                description="Plongez dans la culture balinaise avec ses temples, ses rizières en terrasses et ses plages de rêve."
                                buttonText="Réserver"
                                onButtonClick={() => alert('Réservation Bali')}
                            />
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="flex flex-col items-center justify-center h-full bg-white p-8">
                        <h2 className="text-4xl font-bold text-gray-800 mb-8">Planifiez votre voyage étape par étape</h2>
                        <div className="grid grid-cols-2 gap-6 max-w-4xl">
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-2xl font-semibold text-primary mb-4">1. Recherche</h3>
                                <p className="text-gray-600">
                                    Utilisez notre barre de recherche pour trouver votre destination idéale parmi des milliers d'options.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-2xl font-semibold text-primary mb-4">2. Sélection</h3>
                                <p className="text-gray-600">
                                    Choisissez le nombre de voyageurs et les dates qui vous conviennent le mieux.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-2xl font-semibold text-primary mb-4">3. Réservation</h3>
                                <p className="text-gray-600">
                                    Réservez vos hébergements et activités en quelques clics avec notre système sécurisé.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-2xl font-semibold text-primary mb-4">4. Voyage</h3>
                                <p className="text-gray-600">
                                    Profitez de votre voyage en toute sérénité avec notre support disponible 24/7.
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-primary-dark to-primary text-white p-8">
                        <CentralText
                            logoAlt="Triply Logo"
                            title="Prêt à partir ?"
                            subtitle="Commencez votre aventure dès maintenant"
                            logoSize="large"
                            logoTone="dark"
                            textColor="white"
                        />
                        <div className="mt-12 flex gap-6">
                            <Button
                                label="Créer un compte"
                                onClick={() => alert('Création de compte')}
                                variant="light"
                                tone="tone1"
                            />
                            <Button
                                label="Explorer les destinations"
                                onClick={() => alert('Exploration')}
                                variant="light"
                                tone="tone1"
                            />
                        </div>
                        <div className="mt-12 text-center max-w-2xl">
                            <p className="text-xl text-white/90 mb-4">
                                Rejoignez des milliers de voyageurs satisfaits
                            </p>
                            <p className="text-lg text-white/80">
                                Triply vous accompagne dans chaque étape de votre voyage pour créer des souvenirs inoubliables
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="w-full h-screen bg-gray-200 flex items-center justify-center p-8">
            <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
                {/* Menu Burger - En dehors des slides pour qu'il persiste */}
                <SliderMenu
                    slides={slides}
                    currentIndex={currentSlideIndex}
                    onSelect={goToSlide}
                />
                <AnimatePresence mode="wait" custom={direction}>
                    <Slide
                        key={currentSlideIndex}
                        direction={direction}
                        onNext={canNext ? goToNext : undefined}
                        onPrev={canPrev ? goToPrev : undefined}
                        canNext={canNext}
                        canPrev={canPrev}
                    >
                        {renderSlideContent()}
                    </Slide>
                </AnimatePresence>
            </div>
        </div>
    );
}
