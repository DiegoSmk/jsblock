import React from 'react';
import { Blocks, Power, Trash2, Info, ShieldCheck, Cpu } from 'lucide-react';
import { useStore } from '../store/useStore';

export const ExtensionDetailsView: React.FC = () => {
    const {
        plugins,
        selectedPluginId,
        togglePlugin,
        uninstallPlugin,
        theme,
        setConfirmationModal
    } = useStore();

    const isDark = theme === 'dark';
    const plugin = plugins.find(p => p.id === selectedPluginId);

    if (!plugin) return null;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        void togglePlugin(plugin.id, !plugin.enabled);
    };

    const handleUninstall = (e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmationModal({
            isOpen: true,
            title: 'Desinstalar Extensão',
            message: `Tem certeza que deseja desinstalar "${plugin.name}"? Isso removerá permanentemente os arquivos da extensão.`,
            confirmLabel: 'Desinstalar',
            cancelLabel: 'Cancelar',
            variant: 'danger',
            onConfirm: () => void uninstallPlugin(plugin.id),
            onCancel: () => setConfirmationModal(null)
        });
    };

    // Helper for section headers to match SettingsView
    const SectionHeader = ({ title, icon: Icon }: { title: string, icon?: React.ElementType }) => (
        <h3 style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: isDark ? '#fff' : '#111',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        }}>
            {Icon && <Icon size={16} />}
            {title}
        </h3>
    );

    // Helper for information rows
    const InfoRow = ({ label, value, monospace = false }: { label: string, value: React.ReactNode, monospace?: boolean }) => (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: `1px solid ${isDark ? '#2d2d2d' : '#f0f0f0'}`,
            fontSize: '0.9rem'
        }}>
            <span style={{ color: isDark ? '#888' : '#666', fontWeight: 500 }}>{label}</span>
            <span style={{
                color: isDark ? '#ccc' : '#333',
                fontFamily: monospace ? '"JetBrains Mono", monospace' : 'inherit',
                fontSize: monospace ? '0.85rem' : 'inherit'
            }}>
                {value}
            </span>
        </div>
    );

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: isDark ? '#0a0a0a' : '#fff',
            color: isDark ? '#ccc' : '#333',
            overflow: 'auto'
        }}>
            <div style={{
                maxWidth: '900px',
                width: '100%',
                padding: '60px 40px',
                display: 'flex',
                flexDirection: 'column',
                gap: '40px'
            }}>
                {/* Header Section */}
                <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '20px',
                        background: isDark ? '#1a1a1a' : '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDark ? '#4fc3f7' : '#0070f3',
                        border: `1px solid ${isDark ? '#2d2d2d' : '#e5e5e5'}`
                    }}>
                        <Blocks size={40} />
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h1 style={{
                                    fontSize: '1.75rem',
                                    fontWeight: 800,
                                    color: isDark ? '#fff' : '#111',
                                    margin: '0 0 8px 0',
                                    letterSpacing: '-0.5px'
                                }}>
                                    {plugin.name}
                                </h1>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{
                                        padding: '2px 8px',
                                        background: isDark ? '#2d2d2d' : '#f0f0f0',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: isDark ? '#aaa' : '#666'
                                    }}>
                                        v{plugin.version}
                                    </span>
                                    <span style={{ fontSize: '0.9rem', color: isDark ? '#666' : '#999' }}>
                                        by {plugin.author || 'Unknown'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={handleToggle}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: plugin.enabled
                                            ? (isDark ? '#1a1a1a' : '#f0f0f0')
                                            : (isDark ? '#4fc3f7' : '#0070f3'),
                                        color: plugin.enabled
                                            ? (isDark ? '#bbb' : '#666')
                                            : '#fff',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s',
                                        boxShadow: !plugin.enabled ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                >
                                    <Power size={16} />
                                    {plugin.enabled ? 'Disabled' : 'Enable'}
                                </button>
                                <button
                                    onClick={handleUninstall}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '8px',
                                        border: `1px solid ${isDark ? '#2d2d2d' : '#e5e5e5'}`,
                                        background: 'transparent',
                                        color: isDark ? '#888' : '#666',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                    onMouseLeave={e => e.currentTarget.style.color = isDark ? '#888' : '#666'}
                                    title="Uninstall Extension"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <p style={{
                            marginTop: '24px',
                            fontSize: '1rem',
                            lineHeight: 1.6,
                            color: isDark ? '#bbb' : '#555'
                        }}>
                            {plugin.description}
                        </p>
                    </div>
                </div>

                <div style={{ height: '1px', background: isDark ? '#2d2d2d' : '#eee', width: '100%' }} />

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '40px' }}>

                    {/* Main Content */}
                    <div>
                        <div style={{ marginBottom: '40px' }}>
                            <SectionHeader title="Technical Overview" icon={Info} />
                            <div style={{
                                background: isDark ? '#161616' : '#fafafa',
                                border: `1px solid ${isDark ? '#2d2d2d' : '#eee'}`,
                                borderRadius: '12px',
                                overflow: 'hidden'
                            }}>
                                <InfoRow label="Identifier" value={plugin.id} monospace />
                                <InfoRow label="Entry Point" value={plugin.entry} monospace />
                                <InfoRow label="Execution" value={<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Cpu size={14} /><span>Isolated Proccess</span></div>} />
                            </div>
                        </div>
                    </div>

                    {/* Permissions Sidebar */}
                    <div>
                        <SectionHeader title="Permissions" icon={ShieldCheck} />
                        <div style={{
                            background: isDark ? '#161616' : '#fafafa',
                            border: `1px solid ${isDark ? '#2d2d2d' : '#eee'}`,
                            borderRadius: '12px',
                            padding: '20px'
                        }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {(plugin.permissions || ['No specific permissions']).map(p => (
                                    <span key={p} style={{
                                        fontSize: '0.8rem',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        background: isDark ? '#2d2d2d' : '#eee',
                                        color: isDark ? '#ccc' : '#444',
                                        border: `1px solid ${isDark ? '#333' : '#e0e0e0'}`
                                    }}>
                                        {p}
                                    </span>
                                ))}
                            </div>
                            <p style={{
                                marginTop: '16px',
                                fontSize: '0.8rem',
                                color: isDark ? '#666' : '#999',
                                lineHeight: 1.5
                            }}>
                                This extension runs in a restricted environment and only has access to the APIs listed above.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
