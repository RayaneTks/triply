import type { Meta, StoryObj } from '@storybook/react';
import { Node, NodeProps } from './Node';

const meta: Meta<typeof Node> = {
    title: 'Components/Node',
    component: Node,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div style={{
                position: 'relative',
                height: '200px',
                width: '100%',
                minWidth: '450px',
                border: '1px dashed #ccc'
            }}>
                <Story />
            </div>
        ),
    ],
    argTypes: {
        x: { control: { type: 'number' } },
        y: { control: { type: 'number' } },
        label: { control: 'text' },
        id: { control: 'text' },
        onClick: { action: 'clicked' },
        colorScheme: {
            control: { type: 'select' },
            options: ['primary', 'secondary', 'neutral'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof Node>;

export const Default: Story = {
    args: {
        id: 'node-1',
        label: 'Node 1',
        x: 100,
        y: 75,
        colorScheme: 'primary',
    },
};

export const ClickableNode: Story = {
    args: {
        id: 'node-2',
        label: 'Click Me',
        x: 250,
        y: 100,
        colorScheme: 'secondary',
    },
};

export const NodesInLine: Story = {
    args: {},
    render: (args: NodeProps) => (
        <>
            <Node
                id="line-1"
                label="Primary"
                x={80}
                y={100}
                onClick={args.onClick}
                colorScheme="primary"
            />
            <Node
                id="line-2"
                label="Secondary"
                x={200}
                y={100}
                onClick={args.onClick}
                colorScheme="secondary"
            />
            <Node
                id="line-3"
                label="Neutral"
                x={320}
                y={100}
                onClick={args.onClick}
                colorScheme="neutral"
            />
        </>
    ),
};