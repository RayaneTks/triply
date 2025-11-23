import React, { useMemo } from 'react';
import { Branch, Gitgraph } from "@gitgraph/react";


interface CommitAction {
    type: 'commit';
    branchName: string;
    subject: string;
    author: string;
}

interface BranchAction {
    type: 'branch';
    newBranchName: string;
    fromBranchName: string;
}

interface MergeAction {
    type: 'merge';
    sourceBranchName: string;
    targetBranchName: string;
    subject: string;
}

interface TagAction {
    type: 'tag';
    branchName: string;
    tagName: string;
}

type GitAction = CommitAction | BranchAction | MergeAction | TagAction;
type GitHistory = GitAction[];


interface GitViewProps {
    history: GitHistory;
}


interface LocalGitgraphUserApi {
    branch(name: string): Branch;
    commit(options: { subject: string, author: string } | string): void;
}


export const GitView: React.FC<GitViewProps> = ({ history }) => {

    const branchMap = useMemo(() => new Map<string, Branch>(), []);

    const processGitAction = (_gitgraph: LocalGitgraphUserApi, action: GitAction) => {

        switch (action.type) {
            case 'commit': {
                const commitAction = action as CommitAction;
                const branch = branchMap.get(commitAction.branchName) || branchMap.get('main');

                if (branch) {
                    branch.commit({
                        subject: commitAction.subject,
                        author: commitAction.author,
                    });
                }
                break;
            }

            case 'branch': {
                const branchAction = action as BranchAction;
                const fromBranch = branchMap.get(branchAction.fromBranchName);

                if (fromBranch && !branchMap.has(branchAction.newBranchName)) {
                    const newBranch = fromBranch.branch(branchAction.newBranchName);
                    branchMap.set(branchAction.newBranchName, newBranch);
                }
                break;
            }

            case 'merge': {
                const mergeAction = action as MergeAction;
                const sourceBranch = branchMap.get(mergeAction.sourceBranchName);
                const targetBranch = branchMap.get(mergeAction.targetBranchName);

                if (sourceBranch && targetBranch) {
                    sourceBranch.merge(targetBranch, mergeAction.subject);
                }
                break;
            }

            case 'tag': {
                const tagAction = action as TagAction;
                const branch = branchMap.get(tagAction.branchName);
                if (branch) {
                    branch.tag(tagAction.tagName);
                }
                break;
            }
        }
    };

    return (
        <div style={{ height: '500px', width: '700px', border: '1px solid #ddd', padding: '10px', overflow: 'auto' }}>
            <Gitgraph>
                {(gitgraph) => {
                    branchMap.clear();

                    const mainBranch = gitgraph.branch('main');
                    branchMap.set('main', mainBranch);

                    history.forEach(action => processGitAction(gitgraph as LocalGitgraphUserApi, action as GitAction));
                }}
            </Gitgraph>
        </div>
    );
};