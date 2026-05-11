import type { Meta, StoryObj } from '@storybook/react';
import { Edge, EdgeProps } from './Edge';

const meta: Meta<typeof Edge> = {
    title: 'Components/Edge',
    component: Edge,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div style={{
                position: 'relative',
                height: '200px',
                width: '100%',
                border: '1px dashed #ccc',
                background: '#fafafa',
            }}>
                <Story />
            </div>
        ),
    ],
    argTypes: {
        variant: {
            control: { type: 'select' },
            options: ['solid', 'dashed'],
        },
        colorScheme: {
            control: { type: 'select' },
            options: ['primary', 'secondary', 'neutral'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof Edge>;

export const HorizontalLines: Story = {
    args: {
        variant: 'solid',
    },
    render: (args: EdgeProps) => (
        <>
            <Edge
                x1={50} y1={50}
                x2={350} y2={50}
                variant={args.variant}
                colorScheme="primary"
            />
            <Edge
                x1={50} y1={100}
                x2={350} y2={100}
                variant={args.variant}
                colorScheme="secondary"
            />
            <Edge
                x1={50} y1={150}
                x2={350} y2={150}
                variant={args.variant}
                colorScheme="neutral"
            />
        </>
    ),
};