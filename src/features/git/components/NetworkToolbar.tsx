import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../../store/useStore';
import { RefreshCw, Download, Upload, Cloud } from 'lucide-react';
import { Tooltip } from '../../../components/ui/Tooltip';

interface NetworkToolbarProps {
    isDark: boolean;
}

export const NetworkToolbar: React.FC<NetworkToolbarProps> = ({ isDark }) => {
    const { t } = useTranslation();
    const { gitSync, gitPull, gitPush, gitFetch } = useStore();
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const handleAction = async (actionName: string, action: () => Promise<void>) => {
        setIsProcessing(actionName);
        try {
            await action();
        } finally {
            setIsProcessing(null);
        }
    };

    const buttonStyle: React.CSSProperties = {
        background: isDark ? '#252525' : '#fff',
        border: `1px solid ${isDark ? '#333' : '#ddd'}`,
        borderRadius: '6px',
        cursor: isProcessing ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        fontSize: '0.75rem',
        color: isProcessing ? (isDark ? '#444' : '#ccc') : (isDark ? '#aaa' : '#666'),
        transition: 'all 0.2s',
        opacity: isProcessing ? 0.6 : 1,
        outline: 'none',
        flex: 1,
        justifyContent: 'center'
    };

    const activeButtonStyle: React.CSSProperties = {
        ...buttonStyle,
        color: isDark ? '#fff' : '#000',
        background: isDark ? '#333' : '#f5f5f5'
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
            background: isDark ? '#1f1f1f' : '#f9fafb'
        }}>
            <Tooltip content={t('git.network.sync_tooltip') || 'Sincronizar (Pull & Push)'} side="bottom">
                <button
                    onClick={() => void handleAction('sync', gitSync)}
                    disabled={!!isProcessing}
                    style={buttonStyle}
                    onMouseEnter={(e) => {
                        if (isProcessing) return;
                        Object.assign(e.currentTarget.style, activeButtonStyle);
                    }}
                    onMouseLeave={(e) => {
                        Object.assign(e.currentTarget.style, buttonStyle);
                    }}
                >
                    <RefreshCw size={14} className={isProcessing === 'sync' ? 'animate-spin' : ''} />
                    <span style={{ fontWeight: 600 }}>Sync</span>
                </button>
            </Tooltip>

            <Tooltip content={t('git.network.pull_tooltip') || 'Pull (Atualizar)'} side="bottom">
                <button
                    onClick={() => void handleAction('pull', gitPull)}
                    disabled={!!isProcessing}
                    style={buttonStyle}
                    onMouseEnter={(e) => {
                        if (isProcessing) return;
                        Object.assign(e.currentTarget.style, activeButtonStyle);
                    }}
                    onMouseLeave={(e) => {
                        Object.assign(e.currentTarget.style, buttonStyle);
                    }}
                >
                    <Download size={14} className={isProcessing === 'pull' ? 'animate-bounce' : ''} />
                    <span>Pull</span>
                </button>
            </Tooltip>

            <Tooltip content={t('git.network.push_tooltip') || 'Push (Enviar)'} side="bottom">
                <button
                    onClick={() => void handleAction('push', gitPush)}
                    disabled={!!isProcessing}
                    style={buttonStyle}
                    onMouseEnter={(e) => {
                        if (isProcessing) return;
                        Object.assign(e.currentTarget.style, activeButtonStyle);
                    }}
                    onMouseLeave={(e) => {
                        Object.assign(e.currentTarget.style, buttonStyle);
                    }}
                >
                    <Upload size={14} className={isProcessing === 'push' ? 'animate-bounce' : ''} />
                    <span>Push</span>
                </button>
            </Tooltip>

            <Tooltip content={t('git.network.fetch_tooltip') || 'Fetch (Buscar)'} side="bottom">
                <button
                    onClick={() => void handleAction('fetch', gitFetch)}
                    disabled={!!isProcessing}
                    style={{ ...buttonStyle, flex: 0 }}
                    onMouseEnter={(e) => {
                        if (isProcessing) return;
                        Object.assign(e.currentTarget.style, activeButtonStyle);
                    }}
                    onMouseLeave={(e) => {
                        Object.assign(e.currentTarget.style, buttonStyle);
                    }}
                >
                    <Cloud size={14} className={isProcessing === 'fetch' ? 'animate-pulse' : ''} />
                </button>
            </Tooltip>
        </div>
    );
};
