import { StateCreator } from 'zustand';
import type {
    AppState,
    GitSlice,
    GitFileStatus,
    GitLogEntry,
    GitStashEntry,
    GitTag,
    GitProfile,
    CommitTemplate,
    QuickCommand,
    GitPanelConfig,
    GitPanelSection,
    GitAuthor
} from '../../types/store';

const gitHead = 'HEAD';
const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const createGitSlice: StateCreator<AppState, [], [], GitSlice> = (set, get) => ({
    git: {
        isRepo: false,
        currentBranch: '',
        changes: [],
        log: [],
        rawLog: '',
        globalAuthor: null,
        projectAuthor: null,
        activeView: 'status',
        sidebarView: 'info',
        branches: [],
        stashes: [],
        stats: {
            fileCount: 0,
            repoSize: '',
            projectSize: ''
        },
        tags: [],
        isInitialized: false
    },

    gitPanelConfig: (() => {
        const saved = localStorage.getItem('gitPanelConfig');
        const defaultView: GitPanelConfig = {
            sections: [
                { id: 'overview', label: 'Visão Geral', visible: true, expanded: true },
                { id: 'stats', label: 'Estatísticas', visible: true, expanded: true },
                { id: 'weekly', label: 'Atividade Semanal', visible: true, expanded: true },
                { id: 'hourly', label: 'Horários de Pico', visible: true, expanded: true },
                { id: 'contributors', label: 'Colaboradores', visible: true, expanded: true },
                { id: 'tags', label: 'Tags & Versões', visible: true, expanded: true }
            ]
        };
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as GitPanelConfig;
                const sections = [...defaultView.sections];

                parsed.sections.forEach((s: GitPanelSection) => {
                    const idx = sections.findIndex(def => def.id === s.id);
                    if (idx >= 0) {
                        sections[idx] = { ...sections[idx], ...s };
                    } else {
                        sections.push(s);
                    }
                });
                return { sections };
            } catch {
                return defaultView;
            }
        }
        return defaultView;
    })(),

    updateGitPanelConfig: (updates: Partial<GitPanelConfig>) => {
        const current = get().gitPanelConfig;
        const newValue = { ...current, ...updates };
        localStorage.setItem('gitPanelConfig', JSON.stringify(newValue));
        set({ gitPanelConfig: newValue });
    },

    resetGitPanelConfig: () => {
        const defaultView: GitPanelConfig = {
            sections: [
                { id: 'overview', label: 'Visão Geral', visible: true, expanded: true },
                { id: 'stats', label: 'Estatísticas', visible: true, expanded: true },
                { id: 'weekly', label: 'Atividade Semanal', visible: true, expanded: true },
                { id: 'hourly', label: 'Horários de Pico', visible: true, expanded: true },
                { id: 'contributors', label: 'Colaboradores', visible: true, expanded: true },
                { id: 'tags', label: 'Tags & Versões', visible: true, expanded: true }
            ]
        };
        localStorage.setItem('gitPanelConfig', JSON.stringify(defaultView));
        set({ gitPanelConfig: defaultView });
    },

    gitProfiles: JSON.parse(localStorage.getItem('gitProfiles') ?? '[]') as GitProfile[],
    commitTemplates: JSON.parse(localStorage.getItem('commitTemplates') ?? '[]') as CommitTemplate[],
    commitDetail: {
        isOpen: false,
        commit: null,
        files: [],
        fullMessage: '',
        stats: undefined
    },
    quickCommands: JSON.parse(localStorage.getItem('quickCommands') ?? '[]') as QuickCommand[],

    addQuickCommand: (cmd: Omit<QuickCommand, 'id'>) => {
        const newCmd = {
            ...cmd,
            id: Date.now().toString(),
            autoExecute: cmd.autoExecute ?? true
        };
        const quickCommands = [...get().quickCommands, newCmd];
        localStorage.setItem('quickCommands', JSON.stringify(quickCommands));
        set({ quickCommands });
    },

    removeQuickCommand: (id: string) => {
        const quickCommands = get().quickCommands.filter((c: QuickCommand) => c.id !== id);
        localStorage.setItem('quickCommands', JSON.stringify(quickCommands));
        set({ quickCommands });
    },

    setGitView: (view: 'status' | 'terminal' | 'graph') => {
        set((state) => ({
            git: { ...state.git, activeView: view }
        }));
    },

    setGitSidebarView: (view: 'history' | 'graph' | 'info') => {
        set((state) => ({
            git: { ...state.git, sidebarView: view }
        }));
    },

    openCommitDetail: async (commit: GitLogEntry) => {
        const { openedFolder, getCommitFiles } = get();
        if (!openedFolder || !window.electronAPI) return;

        try {
            const res = await window.electronAPI.gitCommand(openedFolder, ['show', '--pretty=format:%B', '-s', commit.hash]);
            const fullMessage = res.stdout.trim();
            const files = await getCommitFiles(commit.hash);

            let stats = { insertions: 0, deletions: 0, filesChanged: 0 };
            try {
                const statRes = await window.electronAPI.gitCommand(openedFolder, ['show', '--shortstat', '--format=', commit.hash]);
                const statLine = statRes.stdout.trim();
                if (statLine) {
                    const filesMatch = /(\d+) files? changed/.exec(statLine);
                    const insMatch = /(\d+) insertions?\(\+\)/.exec(statLine);
                    const delMatch = /(\d+) deletions?\(-\)/.exec(statLine);

                    stats = {
                        filesChanged: filesMatch ? parseInt(filesMatch[1]) : 0,
                        insertions: insMatch ? parseInt(insMatch[1]) : 0,
                        deletions: delMatch ? parseInt(delMatch[1]) : 0
                    };
                }
            } catch (err) {
                console.warn('Failed to fetch commit stats:', err);
            }

            set({
                commitDetail: {
                    isOpen: true,
                    commit,
                    files,
                    fullMessage,
                    stats
                }
            });
        } catch (err) {
            console.error('Failed to open commit detail:', err);
        }
    },

    closeCommitDetail: () => {
        set({
            commitDetail: {
                isOpen: false,
                commit: null,
                files: [],
                fullMessage: '',
                stats: undefined
            }
        });
    },

    refreshGit: async () => {
        const { openedFolder, fetchStashes, fetchTags } = get();
        if (!openedFolder || !window.electronAPI) return;

        try {
            const isRepoRes = await window.electronAPI.gitCommand(openedFolder, ['rev-parse', '--is-inside-work-tree']);
            const isRepo = isRepoRes.stdout.trim() === 'true';

            if (!isRepo) {
                set((state) => ({
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

            set((state) => ({
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
            set((state) => ({
                git: { ...state.git, isRepo: false, isInitialized: true }
            }));
        }
    },

    fetchGitConfig: async () => {
        const { openedFolder } = get();
        if (!window.electronAPI) return;

        const baseDir = openedFolder ?? '.';

        try {
            const gName = await window.electronAPI.gitCommand(baseDir, ['config', '--global', 'user.name']);
            const gEmail = await window.electronAPI.gitCommand(baseDir, ['config', '--global', 'user.email']);

            const globalAuthor = {
                name: gName.stdout.trim(),
                email: gEmail.stdout.trim()
            };

            let projectAuthor = null;
            if (openedFolder) {
                const lName = await window.electronAPI.gitCommand(openedFolder, ['config', '--local', 'user.name']);
                const lEmail = await window.electronAPI.gitCommand(openedFolder, ['config', '--local', 'user.email']);

                if (lName.stdout.trim() || lEmail.stdout.trim()) {
                    projectAuthor = {
                        name: lName.stdout.trim(),
                        email: lEmail.stdout.trim()
                    };
                }
            }

            set((state) => ({
                git: {
                    ...state.git,
                    globalAuthor: globalAuthor.name || globalAuthor.email ? globalAuthor : null,
                    projectAuthor
                }
            }));
        } catch (err) {
            console.error('Fetch git config failed:', err);
        }
    },

    gitStage: async (path: string) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electronAPI.gitCommand(openedFolder, ['add', path]);
            await refreshGit();
        } catch {
            addToast({ type: 'error', message: 'Erro ao adicionar arquivo (stage).' });
        }
    },

    gitUnstage: async (path: string) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            const headRes = await window.electronAPI.gitCommand(openedFolder, ['rev-parse', '--verify', gitHead]);
            const hasHead = !headRes.stderr && headRes.stdout.trim();

            if (hasHead) {
                await window.electronAPI.gitCommand(openedFolder, ['reset', gitHead, path]);
            } else {
                await window.electronAPI.gitCommand(openedFolder, ['rm', '--cached', path]);
            }

            await refreshGit();
        } catch {
            addToast({ type: 'error', message: 'Erro ao remover arquivo (unstage).' });
        }
    },

    gitStageAll: async () => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electronAPI.gitCommand(openedFolder, ['add', '.']);
            await refreshGit();
        } catch {
            addToast({ type: 'error', message: 'Erro ao adicionar todos os arquivos.' });
        }
    },

    gitUnstageAll: async () => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            const headRes = await window.electronAPI.gitCommand(openedFolder, ['rev-parse', '--verify', gitHead]);
            const hasHead = !headRes.stderr && headRes.stdout.trim();
            if (hasHead) {
                await window.electronAPI.gitCommand(openedFolder, ['reset', gitHead]);
            } else {
                await window.electronAPI.gitCommand(openedFolder, ['rm', '--cached', '-r', '.']);
            }
            await refreshGit();
        } catch {
            addToast({ type: 'error', message: 'Erro ao remover todos os arquivos (unstage).' });
        }
    },

    gitDiscard: async (path: string) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electronAPI.gitCommand(openedFolder, ['restore', path]);
            await refreshGit();
        } catch {
            addToast({ type: 'error', message: 'Erro ao descartar alterações.' });
        }
    },

    gitDiscardAll: async () => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electronAPI.gitCommand(openedFolder, ['restore', '.']);
            await refreshGit();
        } catch {
            addToast({ type: 'error', message: 'Erro ao descartar todas as alterações.' });
        }
    },

    gitCommit: async (message: string, isAmend = false) => {
        const { openedFolder, refreshGit } = get();
        if (!openedFolder) return;
        const args = ['commit', '-m', message];
        if (isAmend) {
            args.push('--amend');
        }
        await window.electronAPI.gitCommand(openedFolder, args);
        await refreshGit();
    },

    gitStash: async (message?: string) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            const args = ['stash', 'push', '-u'];
            if (message) {
                args.push('-m', message);
            } else {
                args.push('-m', `Rascunho: ${new Date().toLocaleTimeString()} em ${get().git.currentBranch}`);
            }
            await window.electronAPI.gitCommand(openedFolder, args);
            await refreshGit();
            addToast({ type: 'success', message: 'Alterações salvas na gaveta (Stash).' });
        } catch (e: unknown) {
            console.error('Stash error:', e);
            const error = e as { stderr?: string; message?: string };
            const msg = error.stderr ?? error.message ?? '';
            if (msg.includes('No local changes to save')) {
                addToast({ type: 'info', message: 'Nada para guardar no stash.' });
            } else {
                addToast({ type: 'error', message: 'Erro ao salvar stash.' });
            }
        }
    },

    gitPopStash: async (index = 0) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electronAPI.gitCommand(openedFolder, ['stash', 'pop', `stash@{${index}}`]);
            await refreshGit();
            addToast({ type: 'success', message: 'Gaveta recuperada com sucesso.' });
        } catch {
            addToast({ type: 'error', message: 'Erro ao recuperar stash (pode haver conflitos).' });
        }
    },

    gitApplyStash: async (index: number) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electronAPI.gitCommand(openedFolder, ['stash', 'apply', `stash@{${index}}`]);
            await refreshGit();
            addToast({ type: 'success', message: 'Alterações aplicadas com sucesso.' });
        } catch {
            addToast({ type: 'error', message: 'Erro ao aplicar stash (pode haver conflitos).' });
        }
    },

    gitDropStash: async (index: number) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electronAPI.gitCommand(openedFolder, ['stash', 'drop', `stash@{${index}}`]);
            await refreshGit();
            addToast({ type: 'success', message: 'Gaveta removida.' });
        } catch {
            addToast({ type: 'error', message: 'Erro ao remover stash.' });
        }
    },

    fetchStashes: async () => {
        const { openedFolder } = get();
        if (!openedFolder) return;
        try {
            const res = await window.electronAPI.gitCommand(openedFolder, ['stash', 'list']);
            const output = res.stdout || '';
            const stashes: GitStashEntry[] = output.split('\n')
                .filter((l: string) => l.trim())
                .map((line: string, index: number) => {
                    const match = /stash@{(\d+)}: (On [^:]+): (.*)/.exec(line);
                    if (match) {
                        return {
                            index: parseInt(match[1]),
                            branch: match[2].replace('On ', ''),
                            message: match[3],
                            description: line
                        };
                    }
                    return { index, branch: '?', message: line, description: line };
                });
            set((state) => ({ git: { ...state.git, stashes } }));
        } catch (err) {
            console.error('Error fetching stashes', err);
        }
    },

    fetchTags: async () => {
        const { openedFolder } = get();
        if (!openedFolder || !window.electronAPI) return;
        try {
            const res = await window.electronAPI.gitCommand(openedFolder, [
                'for-each-ref',
                '--sort=-creatordate',
                '--format=%(refname:short)|||%(objectname)|||%(contents:subject)|||%(creatordate:iso8601)',
                'refs/tags'
            ]);

            const tags: GitTag[] = res.stdout.split('\n')
                .filter((l: string) => l.trim())
                .map((line: string): GitTag | null => {
                    const parts = line.split('|||');
                    if (parts.length >= 2) {
                        return {
                            name: parts[0],
                            hash: parts[1],
                            message: parts[2] || undefined,
                            date: parts[3] || undefined
                        };
                    }
                    return null;
                })
                .filter((tag): tag is GitTag => tag !== null);

            set((state) => ({ git: { ...state.git, tags } }));
        } catch (err) {
            console.error('Error fetching tags', err);
        }
    },

    gitCreateTag: async (name: string, hash: string, message?: string) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            const args = ['tag'];
            if (message) {
                args.push('-a', name, '-m', message, hash);
            } else {
                args.push(name, hash);
            }
            await window.electronAPI.gitCommand(openedFolder, args);
            await refreshGit();
            addToast({ type: 'success', message: `Tag ${name} criada com sucesso!` });
        } catch (err) {
            console.error(err);
            addToast({ type: 'error', message: `Erro ao criar tag ${name}` });
        }
    },

    gitDeleteTag: async (name: string) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electronAPI.gitCommand(openedFolder, ['tag', '-d', name]);
            await refreshGit();
            addToast({ type: 'success', message: `Tag ${name} deletada.` });
        } catch {
            addToast({ type: 'error', message: `Erro ao deletar tag ${name}` });
        }
    },

    gitClean: async () => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electronAPI.gitCommand(openedFolder, ['clean', '-fd']);
            await refreshGit();
            addToast({ type: 'success', message: 'Diretório limpo com sucesso (arquivos untracked removidos).' });
        } catch (err) {
            console.error(err);
            addToast({ type: 'error', message: 'Erro ao limpar diretório.' });
        }
    },

    gitIgnore: async (pattern: string) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;

        const gitignorePath = openedFolder.endsWith('/') || openedFolder.endsWith('\\')
            ? `${openedFolder}.gitignore`
            : `${openedFolder}/.gitignore`;

        try {
            let content = '';
            try {
                content = await window.electronAPI.readFile(gitignorePath);
            } catch {
                // File likely doesn't exist, start empty
            }

            const lines = content.split('\n').map(l => l.trim());
            if (!lines.includes(pattern)) {
                const separator = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
                const newContent = `${content}${separator}${pattern}\n`;

                await window.electronAPI.writeFile(gitignorePath, newContent);
                await refreshGit();
                addToast({ type: 'success', message: `"${pattern}" adicionado ao .gitignore` });
            } else {
                addToast({ type: 'info', message: `"${pattern}" já está no .gitignore` });
            }
        } catch (err) {
            console.error(err);
            addToast({ type: 'error', message: 'Erro ao atualizar .gitignore' });
        }
    },

    gitUndoLastCommit: async () => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electronAPI.gitCommand(openedFolder, ['reset', '--soft', `${gitHead}~1`]);
            await refreshGit();
            addToast({ type: 'success', message: 'Último commit desfeito (Soft Reset).' });
        } catch {
            addToast({ type: 'error', message: 'Erro ao desfazer commit.' });
        }
    },

    gitInit: async (author?: GitAuthor, isGlobal = false) => {
        const { openedFolder, refreshGit, setGitConfig } = get();
        if (!openedFolder) return;

        await window.electronAPI.gitCommand(openedFolder, ['init']);

        if (author) {
            await setGitConfig(author, isGlobal);
        }

        await refreshGit();
    },

    setGitConfig: async (author: GitAuthor, isGlobal: boolean) => {
        const { openedFolder, fetchGitConfig, addToast } = get();
        if (!window.electronAPI) return;

        const dir = openedFolder ?? '.';

        if (isGlobal) {
            const argsBase = ['config', '--global'];
            try {
                if (author.name) await window.electronAPI.gitCommand(dir, [...argsBase, 'user.name', author.name]);
                if (author.email) await window.electronAPI.gitCommand(dir, [...argsBase, 'user.email', author.email]);

                addToast({
                    type: 'success',
                    message: 'Autor Global atualizado com sucesso!'
                });
            } catch {
                addToast({
                    type: 'error',
                    message: 'Erro ao atualizar Autor Global.'
                });
            }
        } else {
            try {
                if (author.name) {
                    await window.electronAPI.gitCommand(dir, ['config', '--local', 'user.name', author.name]);
                }
                if (author.email) {
                    await window.electronAPI.gitCommand(dir, ['config', '--local', 'user.email', author.email]);
                }

                addToast({
                    type: 'success',
                    message: `Autor Local definido para: ${author.name}`
                });
            } catch {
                addToast({
                    type: 'error',
                    message: 'Erro ao definir Autor Local.'
                });
            }
        }

        await fetchGitConfig();
    },

    resetToGlobal: async () => {
        const { openedFolder, fetchGitConfig, addToast } = get();
        if (!window.electronAPI || !openedFolder) return;

        try {
            await window.electronAPI.gitCommand(openedFolder, ['config', '--local', '--unset', 'user.name']);
            await window.electronAPI.gitCommand(openedFolder, ['config', '--local', '--unset', 'user.email']);

            addToast({
                type: 'info',
                message: 'Usando configuração Global (Local resetado).'
            });
        } catch {
            addToast({
                type: 'error',
                message: 'Erro ao resetar para configuração Global.'
            });
        }
        await fetchGitConfig();
    },

    getCommitFiles: async (hash: string) => {
        const { openedFolder } = get();
        if (!openedFolder || !window.electronAPI) return [];

        try {
            const res = await window.electronAPI.gitCommand(openedFolder, ['show', '--name-status', '--pretty=format:', hash]);
            return res.stdout.split('\n')
                .filter((line: string) => line.trim() !== '')
                .map((line: string) => {
                    const parts = line.split(/\t/);
                    const status = parts[0];
                    const path = parts[1] || "";
                    return { status, path };
                });
        } catch (err) {
            console.error('Failed to get commit files:', err);
            return [];
        }
    },

    addGitProfile: (profile: Omit<GitProfile, 'id'>) => {
        const id = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newProfiles = [...get().gitProfiles, { ...profile, id }];
        localStorage.setItem('gitProfiles', JSON.stringify(newProfiles));
        set({ gitProfiles: newProfiles });
    },

    removeGitProfile: (id: string) => {
        const newProfiles = get().gitProfiles.filter((p: GitProfile) => p.id !== id);
        localStorage.setItem('gitProfiles', JSON.stringify(newProfiles));
        set({ gitProfiles: newProfiles });
    },

    updateGitProfile: (id: string, updates: Partial<Omit<GitProfile, 'id'>>) => {
        const newProfiles = get().gitProfiles.map((p: GitProfile) =>
            p.id === id ? { ...p, ...updates } : p
        );
        localStorage.setItem('gitProfiles', JSON.stringify(newProfiles));
        set({ gitProfiles: newProfiles });
    },


    addCommitTemplate: (template: Omit<CommitTemplate, 'id'>) => {
        const id = generateId();
        const newTemplates = [...get().commitTemplates, { ...template, id }];
        localStorage.setItem('commitTemplates', JSON.stringify(newTemplates));
        set({ commitTemplates: newTemplates });
    },

    removeCommitTemplate: (id: string) => {
        const newTemplates = get().commitTemplates.filter((t: CommitTemplate) => t.id !== id);
        localStorage.setItem('commitTemplates', JSON.stringify(newTemplates));
        set({ commitTemplates: newTemplates });
    },

    changeBranch: async (branch: string) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electronAPI.gitCommand(openedFolder, ['checkout', branch]);
            await refreshGit();
            addToast({ type: 'success', message: `Mudou para o branch ${branch}` });
        } catch {
            addToast({ type: 'error', message: `Erro ao mudar para o branch ${branch}` });
        }
    },

    createBranch: async (branch: string, startPoint?: string) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            const args = ['checkout', '-b', branch];
            if (startPoint) args.push(startPoint);
            await window.electronAPI.gitCommand(openedFolder, args);
            await refreshGit();
            addToast({ type: 'success', message: `Branch ${branch} criado com sucesso!` });
        } catch {
            addToast({ type: 'error', message: `Erro ao criar branch ${branch}` });
        }
    },

    checkoutCommit: async (hash: string) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electronAPI.gitCommand(openedFolder, ['checkout', hash]);
            await refreshGit();
        } catch {
            addToast({ type: 'error', message: `Erro ao mudar para a versão ${hash}` });
        }
    },

    deleteBranch: async (branch: string) => {
        const { openedFolder, refreshGit, addToast } = get();
        if (!openedFolder) return;
        try {
            await window.electronAPI.gitCommand(openedFolder, ['branch', '-D', branch]);
            await refreshGit();
            addToast({ type: 'success', message: `Branch ${branch} deletado.` });
        } catch {
            addToast({ type: 'error', message: `Erro ao deletar branch ${branch}` });
        }
    }
});
