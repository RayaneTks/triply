import type { Meta, StoryObj } from '@storybook/react';
import { ImageCard } from './ImageCard';

// @ts-ignore
import node1 from '@assets/node1.jpg';

// @ts-ignore
import node2 from '@assets/node2.jpg';

// @ts-ignore
import node3 from '@assets/node3.jpg';

const meta: Meta<typeof ImageCard> = {
    title: 'Components/ImageCard',
    component: ImageCard,
    tags: ['autodocs'],
    argTypes: {
        imageSrc: { control: 'text' },
        imageAlt: { control: 'text' },
        title: { control: 'text' },
        description: { control: 'text' },
        buttonText: { control: 'text' },
        onButtonClick: { action: 'buttonClicked' },
        className: { control: 'text' },
    },
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj<typeof ImageCard>;

export const Default: Story = {
    args: {
        imageSrc: node1,
        imageAlt: 'alt text',
        title: 'Title',
        description: "description",
        buttonText: 'Button',
        onButtonClick: () => alert('Bouton cliqué !'),
    },
};

export const VueMer: Story = {
    args: {
        imageSrc: node2,
        imageAlt: 'alt text',
        title: 'Title',
        description: "description",
        buttonText: 'Button',
        onButtonClick: () => alert('Bouton cliqué !'),
    },
};

export const PaysageUrbain: Story = {
    args: {
        imageSrc: node3,
        imageAlt: 'alt text',
        title: 'Title',
        description: "description",
        buttonText: 'Button',
        onButtonClick: () => alert('Bouton cliqué !'),
    },
};

export const CardGrid: Story = {
    render: (args) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-8 bg-gray-100 min-h-screen items-center justify-center">
            <ImageCard
                {...args}
                imageSrc={node1}
                imageAlt="Alt text"
                title="Title"
                description="description"
                buttonText="Button"
            />
            <ImageCard
                {...args}
                imageSrc={node2}
                imageAlt="Alt text"
                title="Title"
                description="description"
                buttonText="Button"
            />
            <ImageCard
                {...args}
                imageSrc={node3}
                imageAlt="Alt text"
                title="Title"
                description="description"
                buttonText="Button"
            />
        </div>
    ),
    args: {
        onButtonClick: () => alert('Bouton cliqué !'),
    },
    parameters: {
        layout: 'fullscreen',
        controls: {
            exclude: ['imageSrc', 'imageAlt', 'title', 'description', 'buttonText', 'onButtonClick'],
        },
    },
};