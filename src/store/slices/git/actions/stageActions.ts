import type { GitSlice, AppState } from '../../../../types/store';

const gitHead = 'HEAD';

export const createStageActions = (set: any, get: any): Partial<GitSlice> => ({
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
});
