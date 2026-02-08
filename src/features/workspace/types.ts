import type { FileNode } from '../../../electron/shared/ipc-types';
export type { FileNode };

export interface WorkspaceSlice {
    workspace: {
        rootPath: string | null;
        fileTree: FileNode[];
        isWatching: boolean;
        isLoading: boolean;
    };

    // Actions
    openWorkspace: () => Promise<void>;
    refreshWorkspace: () => Promise<void>;
    setWorkspaceRoot: (path: string | null) => void;
    updateFileTree: (tree: FileNode[]) => void;
}
