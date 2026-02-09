
/**
 * Interface de base pour un élément d'action dans l'historique GIT.
 * Tous les événements partagent un type d'action (ActionType) et potentiellement un message de commit.
 */
export interface BaseGitAction {
    /** Le type d'opération GIT (commit, branch, merge, etc.). */
    type: 'commit' | 'branch' | 'merge' | 'tag';
    /** Le message associé à l'opération (s'applique principalement aux commits et merges). */
    message?: string;
}

/**
 * Définit une action de 'commit'.
 */
export interface CommitAction extends BaseGitAction {
    type: 'commit';
    /** La branche sur laquelle le commit doit être appliqué. */
    branchName: string;
    message: string;
}

/**
 * Définit une action de 'branch' (création d'une nouvelle branche).
 */
export interface BranchAction extends BaseGitAction {
    type: 'branch';
    /** Le nom de la nouvelle branche à créer. */
    newBranchName: string;
    /** Le nom de la branche parente ou de départ (d'où la nouvelle branche est créée). */
    fromBranchName: string;
}

/**
 * Définit une action de 'merge' (fusionner une branche dans une autre).
 */
export interface MergeAction extends BaseGitAction {
    type: 'merge';
    /** La branche source qui est fusionnée (la branche "fille"). */
    sourceBranchName: string;
    /** La branche de destination dans laquelle la fusion est appliquée (la branche "mère"). */
    targetBranchName: string;
    message?: string;
}

/**
 * Définit une action de 'tag' (ajouter une étiquette).
 */
export interface TagAction extends BaseGitAction {
    type: 'tag';
    /** Le nom de la branche sur laquelle le tag doit être appliqué (sur le dernier commit). */
    branchName: string;
    /** Le nom du tag (ex: 'v1.0.0'). */
    tagName: string;
}

/**
 * Type d'union représentant n'importe quelle action GIT valide.
 */
export type GitAction = CommitAction | BranchAction | MergeAction | TagAction;

/**
 * Le type principal de l'historique : un tableau ordonné d'actions GIT.
 */
export type GitHistory = GitAction[];