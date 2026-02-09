import { useEffect } from 'react';
import { useStore } from '../../../store/useStore';
import { RefreshCw } from 'lucide-react';
import { GitInitView } from './GitInitView';
import { GitStatusView } from './GitStatusView';
import { GitTerminalView } from './GitTerminalView';
import { GitGraphView } from './GitGraphView';
import type { AppState } from '../../../types/store';
import './GitPanel.css';

export const GitPanel: React.FC = () => {
    const {
        theme, git, refreshGit, fetchGitConfig,
        openedFolder
    } = useStore((state: AppState) => ({
        theme: state.theme,
        git: state.git,
        refreshGit: state.refreshGit,
        fetchGitConfig: state.fetchGitConfig,
        openedFolder: state.openedFolder
    }));

    const isDark = theme === 'dark';

    useEffect(() => {
        const loadGitData = async () => {
            if (openedFolder) {
                try {
                    await Promise.all([refreshGit(), fetchGitConfig()]);
                } catch (err) {
                    console.error('Git background refresh failed:', err);
                }
            }
        };
        loadGitData();
    }, [openedFolder, refreshGit, fetchGitConfig]);

    if (!openedFolder) {
        return (
            <div className="git-panel-container" style={{ alignItems: 'center', justifyContent: 'center', background: isDark ? '#1a1a1a' : '#fff', color: isDark ? '#666' : '#999' }}>
                Abra uma pasta para usar o Git
            </div>
        );
    }

    if (git.isLoading && !git.isRepo) {
        return (
            <div className="git-panel-container" style={{ alignItems: 'center', justifyContent: 'center', background: isDark ? '#1a1a1a' : '#fff' }}>
                <RefreshCw size={24} className="animate-spin" style={{ color: isDark ? '#555' : '#ccc' }} />
            </div>
        );
    }

    if (!git.isRepo) {
        return <GitInitView />;
    }

    // Active View Router
    if (git.activeView === 'terminal') return <GitTerminalView />;
    if (git.activeView === 'graph') return <GitGraphView />;
    return <GitStatusView />;
};
