import { useStore } from '../../store/useStore';
import { Blocks, Trash2, Power, Download, Search, Info, Settings, RefreshCw } from 'lucide-react';
import { PanelSection } from './git/PanelSection';
import { Tooltip } from './Tooltip';
import { SidebarPanel } from './ui/SidebarPanel';
import type { PluginManifest } from './types';
import './git/GitPanel.css';
import React, { useEffect, useState } from 'react';

export const ExtensionsView: React.FC = () => {
    const {
        plugins,
        discoverPlugins,
        togglePlugin,
        uninstallPlugin,
        installPlugin,
        theme,
        setConfirmationModal,
        selectedPluginId,
        setSelectedPluginId
    } = useStore();

    const isDark = theme === 'dark';
    const [search, setSearch] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        void discoverPlugins();
    }, [discoverPlugins]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await discoverPlugins();
        } finally {
            setIsRefreshing(false);
        }
    };

    const filteredPlugins = plugins.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    );

    const activePlugins = filteredPlugins.filter(p => p.enabled);
    const inactivePlugins = filteredPlugins.filter(p => !p.enabled);

    const renderPluginItem = (plugin: PluginManifest) => {
        const isSelected = selectedPluginId === plugin.id;

        return (
            <div
                key={plugin.id}
                onClick={() => setSelectedPluginId(isSelected ? null : plugin.id)}
                style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    background: isSelected
                        ? (isDark ? 'rgba(79, 195, 247, 0.08)' : 'rgba(0, 112, 243, 0.04)')
                        : 'transparent',
                    borderLeft: `2px solid ${isSelected ? (isDark ? '#4fc3f7' : '#0070f3') : 'transparent'}`
                }}
                onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)';
                }}
                onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px', minWidth: 0 }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: isDark ? '#2d2d2d' : '#f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isDark ? '#4fc3f7' : '#0070f3',
                            flexShrink: 0,
                            border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`
                        }}>
                            <Blocks size={18} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: isDark ? '#fff' : '#1a1a1a',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {plugin.name}
                                </span>
                                <span style={{
                                    fontSize: '0.65rem',
                                    color: isDark ? '#666' : '#999',
                                    background: isDark ? '#2a2a2a' : '#f0f0f0',
                                    padding: '1px 4px',
                                    borderRadius: '4px'
                                }}>
                                    v{plugin.version}
                                </span>
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: isDark ? '#888' : '#666',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                marginTop: '2px',
                                lineHeight: '1.4'
                            }}>
                                {plugin.description}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                    <button
                        onClick={() => void togglePlugin(plugin.id, !plugin.enabled)}
                        style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: 'none',
                            background: plugin.enabled
                                ? (isDark ? 'rgba(74, 222, 128, 0.1)' : 'rgba(34, 197, 94, 0.1)')
                                : (isDark ? '#2d2d2d' : '#f5f5f5'),
                            color: plugin.enabled
                                ? (isDark ? '#4ade80' : '#16a34a')
                                : (isDark ? '#aaa' : '#666'),
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Power size={11} strokeWidth={2.5} />
                        {plugin.enabled ? 'Ativo' : 'Inativo'}
                    </button>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                        <Tooltip content="Configurações" side="top">
                            <button style={{
                                background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#666' : '#999', padding: '4px', borderRadius: '4px',
                                transition: 'all 0.2s'
                            }} onMouseEnter={e => e.currentTarget.style.color = isDark ? '#ddd' : '#333'}>
                                <Settings size={14} />
                            </button>
                        </Tooltip>

                        <Tooltip content="Desinstalar" side="top">
                            <button
                                onClick={() => {
                                    setConfirmationModal({
                                        isOpen: true,
                                        title: 'Desinstalar Plugin',
                                        message: `Tem certeza que deseja remover o plugin "${plugin.name}"? Esta ação não pode ser desfeita.`,
                                        variant: 'danger',
                                        onConfirm: () => { void uninstallPlugin(plugin.id); },
                                        onCancel: () => setConfirmationModal(null)
                                    });
                                }}
                                style={{
                                    background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#666' : '#999', padding: '4px', borderRadius: '4px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                onMouseLeave={e => e.currentTarget.style.color = isDark ? '#666' : '#999'}
                            >
                                <Trash2 size={14} />
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <SidebarPanel
            title="Extensões"
            icon={Blocks}
            isDark={isDark}
            headerActions={
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                        onClick={() => void installPlugin()}
                        title="Instalar de Pasta"
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '4px',
                            cursor: 'pointer',
                            color: isDark ? '#888' : '#666',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <Download size={14} />
                    </button>
                    <button
                        onClick={() => void handleRefresh()}
                        title="Sincronizar"
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '4px',
                            cursor: 'pointer',
                            color: isDark ? '#888' : '#666',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        disabled={isRefreshing}
                    >
                        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            }
        >
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Search Bar */}
                <div style={{ padding: '8px 16px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <Search
                            size={12}
                            style={{
                                position: 'absolute',
                                left: '10px',
                                color: isDark ? '#555' : '#ccc'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Pesquisar extensões..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '6px 10px 6px 30px',
                                background: isDark ? '#0a0a0a' : '#f9fafb',
                                border: `1px solid ${isDark ? '#2d2d2d' : '#e5e7eb'}`,
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                color: isDark ? '#ddd' : '#333',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = isDark ? '#4fc3f7' : '#0070f3'}
                            onBlur={e => e.currentTarget.style.borderColor = isDark ? '#2d2d2d' : '#e5e7eb'}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {activePlugins.length > 0 && (
                        <PanelSection
                            id="active"
                            title="Ativas"
                            isDark={isDark}
                            count={activePlugins.length}
                            icon={Blocks}
                        >
                            {activePlugins.map(renderPluginItem)}
                        </PanelSection>
                    )}

                    {inactivePlugins.length > 0 && (
                        <PanelSection
                            id="inactive"
                            title="Inativas"
                            isDark={isDark}
                            count={inactivePlugins.length}
                            icon={Blocks}
                            defaultOpen={false}
                        >
                            {inactivePlugins.map(renderPluginItem)}
                        </PanelSection>
                    )}

                    {filteredPlugins.length === 0 && (
                        <div style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px',
                            color: isDark ? '#444' : '#ccc'
                        }}>
                            <Blocks size={48} opacity={0.3} />
                            <div style={{ fontSize: '0.85rem' }}>
                                {plugins.length === 0
                                    ? "Nenhuma extensão instalada"
                                    : "Nenhuma extensão encontrada"}
                            </div>
                        </div>
                    )}
                </div>

                {/* Hint Footer */}
                <div style={{
                    padding: '10px 16px',
                    borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                    background: isDark ? 'rgba(0,0,0,0.1)' : '#f9fafb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.65rem',
                    color: isDark ? '#666' : '#999'
                }}>
                    <Info size={12} />
                    <span>Reinicie para aplicar alterações de estado.</span>
                </div>
            </div>
        </SidebarPanel>
    );
};
