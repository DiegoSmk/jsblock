import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useTranslation } from 'react-i18next';
import {
    RefreshCw,
    Search
} from 'lucide-react';
import { CommitHistory } from './CommitHistory';
import { Tooltip } from '../Tooltip';

export const GitSidebarView: React.FC = () => {
    const {
        theme, git, refreshGit
    } = useStore();

    const { t } = useTranslation();
    const isDark = theme === 'dark';
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filter, setFilter] = useState('');

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshGit();
        } finally {
            setIsRefreshing(false);
        }
    };

    const filteredLogs = git.log.filter(log =>
        log.message.toLowerCase().includes(filter.toLowerCase()) ||
        log.hash.toLowerCase().includes(filter.toLowerCase()) ||
        log.author.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Sidebar Actions/Search */}
            <div style={{
                padding: '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        flex: 1,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <Search size={12} style={{
                            position: 'absolute',
                            left: '8px',
                            color: isDark ? '#666' : '#999'
                        }} />
                        <input
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            placeholder={t('git.status.history_filter_placeholder', { defaultValue: 'Filter history...' })}
                            style={{
                                width: '100%',
                                background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                                border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                                borderRadius: '4px',
                                padding: '4px 8px 4px 26px',
                                fontSize: '0.75rem',
                                color: isDark ? '#fff' : '#000',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <Tooltip content={t('git.common.refresh')} side="bottom">
                        <button
                            onClick={() => { void handleRefresh(); }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px',
                                color: isDark ? '#888' : '#666',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = isDark ? '#fff' : '#000'}
                            onMouseLeave={e => e.currentTarget.style.color = isDark ? '#888' : '#666'}
                            disabled={isRefreshing}
                        >
                            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* Commit List Area */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <CommitHistory
                    isDark={isDark}
                    logs={filteredLogs}
                    isOpen={true}
                    onToggle={() => { /* Not toggleable in this view */ }}
                />
            </div>
        </div>
    );
};
