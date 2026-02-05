import type { AppState } from '../../../../types/store';
import type { GitSlice, GitFileStatus, GitLogEntry } from '../../types';

const gitHead = 'Head';

export const createLifecycleActions = (set: (nextState: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void, get: () => AppState): Partial<GitSlice> => ({
    refreshGit: async () => {
        const { openedFolder, fetchStashes, fetchTags } = get();
        if (!openedFolder || !window.electronAPI) return;

        try {
            const isRepoRes = await window.electronAPI.gitCommand(openedFolder, ['rev-parse', '--is-inside-work-tree']);
            const isRepo = isRepoRes.stdout.trim() === 'true';

            if (!isRepo) {
                set((state: AppState) => ({
                    git: { ...state.git, isRepo: false }
                }));
                return;
            }

            const branchRes = await window.electronAPI.gitCommand(openedFolder, ['rev-parse', '--abbrev-ref', gitHead]);
            const currentBranch = branchRes.stdout.trim();

            const branchesRes = await window.electronAPI.gitCommand(openedFolder, ['branch', '--format=%(refname:short)']);
            const branches = branchesRes.stdout.split('\n').filter((b: string) => b.trim() !== '');

            const statusRes = await window.electronAPI.gitCommand(openedFolder, ['status', '--porcelain', '-b', '-z']);
            const rawStatus = statusRes.stdout;
            const tokens = rawStatus.split('\0');
            const changes: GitFileStatus[] = [];

            let i = 0;
            while (i < tokens.length) {
                const token = tokens[i];
                if (!token) {
                    i++;
                    continue;
                }

                if (token.startsWith('##')) {
                    i++;
                    continue;
                }

                const index = token[0] || ' ';
                const workingTree = token[1] || ' ';
                let path = token.substring(3);
                let status: GitFileStatus['status'] = 'modified';

                if (index === 'R' || workingTree === 'R') {
                    status = 'renamed';
                    i++;
                    if (i < tokens.length) {
                        path = tokens[i];
                    }
                } else if (index === '?' || workingTree === '?') status = 'untracked';
                else if (index === 'A') status = 'added';
                else if (index === 'D' || workingTree === 'D') status = 'deleted';

                if (path) {
                    changes.push({ path, status, index, workingTree });
                }

                i++;
            }

            const delimiter = '|||';
            const logRes = await window.electronAPI.gitCommand(openedFolder, [
                'log', '--graph', '--all', '-n', '100', '--no-color',
                `--pretty=format:%h${delimiter}%d${delimiter}%s${delimiter}%an${delimiter}%aI`
            ]);
            const rawLog = logRes.stdout;

            const refinedEntries: GitLogEntry[] = [];
            const lines = logRes.stdout.split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;

                const parts = line.split(delimiter);

                if (parts.length >= 5) {
                    const part0 = parts[0];
                    const hashMatch = /([0-9a-f]{7,40})$/.exec(part0);
                    const hash = hashMatch ? hashMatch[1] : '';
                    const graph = hash ? part0.substring(0, part0.length - hash.length) : part0;

                    const refs = parts[1];
                    const message = parts[2];
                    const author = parts[3];
                    const date = parts[4];

                    if (hash) {
                        refinedEntries.push({
                            hash,
                            author: author || '?',
                            date: date ? date.trim() : new Date().toISOString(),
                            message: message || 'Sem mensagem',
                            graph,
                            refs: refs.trim()
                        });
                    } else {
                        refinedEntries.push({
                            hash: '', author: '', date: '', message: '', graph: line, isGraphOnly: true
                        });
                    }
                } else {
                    refinedEntries.push({
                        hash: '', author: '', date: '', message: '', graph: line, isGraphOnly: true
                    });
                }
            }

            let fileCount = 0;
            let repoSize = '0 B';
            let projectSize = '0 B';

            try {
                const filesRes = await window.electronAPI.gitCommand(openedFolder, ['ls-files']);
                fileCount = filesRes.stdout.split('\n').filter((l: string) => l.trim()).length;

                const sizeRes = await window.electronAPI.gitCommand(openedFolder, ['count-objects', '-vH']);
                const sizeOutput = sizeRes.stdout;
                const sizePackMatch = (/size-pack:\s*(.+)/).exec(sizeOutput);
                const sizeMatch = (/^size:\s*(.+)/m).exec(sizeOutput);
                const sizePack = sizePackMatch ? sizePackMatch[1].trim() : null;
                const sizeLoose = sizeMatch ? sizeMatch[1].trim() : null;

                if (sizePack && sizePack !== '0 bytes' && sizePack !== '0') {
                    repoSize = sizePack;
                } else if (sizeLoose) {
                    repoSize = sizeLoose;
                }

                try {
                    const treeRes = await window.electronAPI.gitCommand(openedFolder, ['ls-tree', '-r', '-l', gitHead]);
                    const treeLines = treeRes.stdout.split('\n');
                    let totalBytes = 0;
                    for (const line of treeLines) {
                        if (!line.trim()) continue;
                        const match = (/\s+blob\s+[0-9a-f]+\s+(\d+)/).exec(line);
                        if (match) {
                            totalBytes += parseInt(match[1], 10);
                        }
                    }

                    if (totalBytes < 1024) projectSize = totalBytes + ' B';
                    else if (totalBytes < 1024 * 1024) projectSize = (totalBytes / 1024).toFixed(1) + ' KB';
                    else projectSize = (totalBytes / (1024 * 1024)).toFixed(1) + ' MB';
                } catch {
                    // Ignore errors during size calculation
                }

            } catch (err) {
                console.warn('Failed to fetch repo stats', err);
            }

            set((state: AppState) => ({
                git: {
                    ...state.git,
                    isRepo: true,
                    currentBranch,
                    changes,
                    log: refinedEntries,
                    rawLog,
                    branches,
                    stats: {
                        fileCount,
                        repoSize,
                        projectSize
                    },
                    isInitialized: true
                }
            }));

            await fetchStashes();
            await fetchTags();
        } catch (err) {
            console.error('Git refresh failed:', err);
            set((state: AppState) => ({
                git: { ...state.git, isRepo: false, isInitialized: true }
            }));
        }
    },
});
