import React from 'react';
import { Branch, Gitgraph, TemplateName, Orientation, templateExtend, type CommitOptions } from "@gitgraph/react";

export interface CommitAction {
    type: 'commit';
    branchName: string;
    subject: string;
    author: string;
    hash?: string;
}

export interface BranchAction {
    type: 'branch';
    newBranchName: string;
    fromBranchName: string;
}

export interface MergeAction {
    type: 'merge';
    sourceBranchName: string;
    targetBranchName: string;
    subject: string;
    hash?: string;
}

export interface TagAction {
    type: 'tag';
    branchName: string;
    tagName: string;
}

export type GitAction = CommitAction | BranchAction | MergeAction | TagAction;
export type GitHistory = GitAction[];

export interface GitViewProps {
    history: GitHistory;
}

export interface LocalGitgraphUserApi {
    branch(name: string): Branch;
    commit(options?: CommitOptions): void;
}

const compactTemplate = templateExtend(TemplateName.Metro, {
    branch: {
        spacing: 20,
        lineWidth: 3,
        label: { font: "normal 10px Arial" }
    },
    commit: {
        spacing: 25,
        dot: { size: 5 },
        message: { font: "normal 12px Arial" }
    }
});

export const GitView: React.FC<GitViewProps> = ({ history }) => {
    return (
        <div className="w-full overflow-x-auto p-2 bg-white rounded-lg">
            <Gitgraph options={{
                orientation: Orientation.HorizontalReverse,
                template: compactTemplate,
            }}>
                {(gitgraph) => {
                    const branchMap = new Map<string, Branch>();
                    const mainBranch = gitgraph.branch('main');
                    branchMap.set('main', mainBranch);

                    const getAuthoredBranch = (branchName: string): Branch => {
                        if (!branchName || branchName === 'main') return mainBranch;

                        const cached = branchMap.get(branchName);
                        if (cached) return cached;

                        const newBranch = mainBranch.branch(branchName);
                        branchMap.set(branchName, newBranch);
                        return newBranch;
                    };

                    history.forEach((action) => {
                        switch (action.type) {
                            case 'commit': {
                                const commitAction = action as CommitAction;
                                const branch = getAuthoredBranch(commitAction.branchName);

                                branch.commit({
                                    subject: commitAction.subject,
                                    author: commitAction.author,
                                    hash: commitAction.hash,
                                });
                                break;
                            }

                            case 'merge': {
                                const mergeAction = action as MergeAction;

                                const sourceBranch = getAuthoredBranch(mergeAction.sourceBranchName);
                                const targetBranch = getAuthoredBranch(mergeAction.targetBranchName);

                                targetBranch.merge({
                                    branch: sourceBranch,
                                    commitOptions: {
                                        subject: mergeAction.subject,
                                        hash: mergeAction.hash,
                                        author: "Merge"
                                    }
                                });
                                break;
                            }
                        }
                    });
                }}
            </Gitgraph>
        </div>
    );
};