import type { Meta, StoryObj } from '@storybook/react';
import { GitView } from './GitView';

const meta: Meta<typeof GitView> = {
    title: 'Visualisation/GitView',
    component: GitView,
    tags: ['autodocs'],
    argTypes: {
        history: { control: 'object' },
    },
};

export default meta;

type Story = StoryObj<typeof GitView>;

const historySimple: any[] = [
    { type: 'commit', branchName: 'main', subject: 'Initialisation du projet', author: 'Rayane BOUDAOUD <rayane.b@projet.com>' },
    { type: 'commit', branchName: 'main', subject: 'Ajout du header', author: 'Elias SAADI <elias.s@projet.com>' },
];

const historyFeatureMerge: any[] = [
    { type: 'commit', branchName: 'main', subject: 'Initial commit', author: 'Rayane BOUDAOUD <rayane.b@projet.com>' },

    { type: 'branch', newBranchName: 'feature/login', fromBranchName: 'main' },

    { type: 'commit', branchName: 'feature/login', subject: 'Dev de la page de login', author: 'Florent <florent@projet.com>' },
    { type: 'commit', branchName: 'feature/login', subject: 'Test unitaire login', author: 'Florent <florent@projet.com>' },

    { type: 'merge', sourceBranchName: 'feature/login', targetBranchName: 'main', subject: 'Merge feature login' },
];

const historyHotfix: any[] = [
    { type: 'commit', branchName: 'main', subject: 'Version stable', author: 'Elias SAADI <elias.s@projet.com>' },

    { type: 'branch', newBranchName: 'hotfix/bug-prod', fromBranchName: 'main' },

    { type: 'commit', branchName: 'hotfix/bug-prod', subject: 'Correction du bug critique', author: 'Kévin <kevin@projet.com>' },

    { type: 'merge', sourceBranchName: 'hotfix/bug-prod', targetBranchName: 'main', subject: 'Merge hotfix' },

    { type: 'tag', branchName: 'main', tagName: 'v1.0.1' },
];

export const DefaultView: Story = {
    args: {
        history: historySimple,
    },
};

export const SimpleHistory: Story = {
    args: {
        history: historySimple,
    },
};

export const FeatureMergeWorkflow: Story = {
    args: {
        history: historyFeatureMerge,
    },
};

export const HotfixWorkflow: Story = {
    args: {
        history: historyHotfix,
    },
};