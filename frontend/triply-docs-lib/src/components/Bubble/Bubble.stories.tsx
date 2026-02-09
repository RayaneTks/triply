import type { Meta, StoryObj } from '@storybook/react';
import { Bubble } from './Bubble';

const meta: Meta<typeof Bubble> = {
    title: 'Components/Bubble',
    component: Bubble,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div style={{ 
                position: 'relative', 
                width: '100%', 
                height: '400px', 
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'visible'
            }}>
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof Bubble>;

export const Default: Story = {
    args: {
        label: 'Bubble',
        angle: 0,
        href: '#',
    },
};

export const MultipleBubbles: Story = {
    render: () => (
        <>
            <Bubble label="Bubble 1" angle={0} href="#" />
            <Bubble label="Bubble 2" angle={45} href="#" />
            <Bubble label="Bubble 3" angle={90} href="#" />
            <Bubble label="Bubble 4" angle={135} href="#" />
            <Bubble label="Bubble 5" angle={180} href="#" />
            <Bubble label="Bubble 6" angle={225} href="#" />
            <Bubble label="Bubble 7" angle={270} href="#" />
            <Bubble label="Bubble 8" angle={315} href="#" />
        </>
    ),
    decorators: [
        (Story) => (
            <div style={{ 
                position: 'relative', 
                width: '100%', 
                height: '500px', 
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'visible'
            }}>
                <Story />
            </div>
        ),
    ],
};

export const CustomRadius: Story = {
    args: {
        label: 'Bubble avec rayon personnalisé',
        angle: 45,
        radiusX: 150,
        radiusY: 75,
        href: '#',
    },
    decorators: [
        (Story) => (
            <div style={{ 
                position: 'relative', 
                width: '100%', 
                height: '400px', 
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'visible'
            }}>
                <Story />
            </div>
        ),
    ],
};

export const DifferentAngles: Story = {
    render: () => (
        <>
            <Bubble label="0°" angle={0} href="#" />
            <Bubble label="45°" angle={45} href="#" />
            <Bubble label="90°" angle={90} href="#" />
            <Bubble label="135°" angle={135} href="#" />
            <Bubble label="180°" angle={180} href="#" />
        </>
    ),
    decorators: [
        (Story) => (
            <div style={{ 
                position: 'relative', 
                width: '100%', 
                height: '400px', 
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'visible'
            }}>
                <Story />
            </div>
        ),
    ],
};

