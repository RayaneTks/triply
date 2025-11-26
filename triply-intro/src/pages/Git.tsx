import { useEffect, useState } from 'react';
import { GitView, type GitAction, type MergeAction, type CommitAction } from 'triply-docs-lib';

interface GitHubCommitResponse {
    sha: string;
    commit: {
        author: { name: string; email: string; date: string; };
        message: string;
    };
    parents: { sha: string; url: string; }[];
}

export default function Git() {
    const [history, setHistory] = useState<GitAction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const GITHUB_TOKEN = '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';
    const OWNER = 'RayaneTks';
    const REPO = 'triply';
    const BRANCH = 'main';

    useEffect(() => {
        const fetchCommits = async () => {
            try {
                setLoading(true);

                const response = await fetch(
                    `https://api.github.com/repos/${OWNER}/${REPO}/commits?sha=${BRANCH}&per_page=30`,
                    {
                        headers: {
                            'Authorization': `Bearer ${GITHUB_TOKEN}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(`Erreur GitHub: ${response.status}`);
                }

                const data: GitHubCommitResponse[] = await response.json();
                const chronologicalData = data.reverse();

                const formattedHistory: GitAction[] = chronologicalData.map((commitData) => {
                    const isMerge = commitData.parents.length > 1;
                    const cleanMessage = commitData.commit.message.split('\n')[0];
                    const shortHash = commitData.sha.substring(0, 7);

                    if (isMerge) {
                        let sourceBranch = 'unknown';
                        const match = commitData.commit.message.match(/from\s+([^\s]+)/);

                        if (match && match[1]) {
                            const parts = match[1].split('/');
                            sourceBranch = parts.length > 1 ? parts.slice(1).join('/') : parts[0];
                        }

                        return {
                            type: 'merge',
                            sourceBranchName: sourceBranch,
                            targetBranchName: 'main',
                            subject: cleanMessage,
                            hash: shortHash
                        } as MergeAction;
                    }

                    return {
                        type: 'commit',
                        branchName: 'main',
                        subject: cleanMessage,
                        author: commitData.commit.author.name,
                        hash: shortHash
                    } as CommitAction;
                });

                setHistory(formattedHistory);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur inconnue');
            } finally {
                setLoading(false);
            }
        };

        fetchCommits();
    }, []);

    if (loading) return <div className="p-10 text-blue-600 animate-pulse text-center">Chargement...</div>;
    if (error) return <div className="p-10 text-red-600 text-center font-bold">Erreur: {error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">
                Historique: {REPO}
            </h1>
            <div className="shadow border border-gray-200 bg-white rounded-lg">
                <GitView history={history} />
            </div>
        </div>
    );
}