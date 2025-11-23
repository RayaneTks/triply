export interface SlideDefinition {
    id: string;
    title: string;
    content: React.ReactNode;
}

export type SlideDirection = 1 | -1;

export interface SlideContextProps {
    currentSlideIndex: number;
    totalSlides: number;
    goToNext: () => void;
    goToPrev: () => void;
    goToSlide: (index: number) => void;
    direction: SlideDirection;
}