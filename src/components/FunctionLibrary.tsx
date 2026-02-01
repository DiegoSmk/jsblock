import { useState } from 'react';
import { Search, ChevronRight, Code2, StickyNote, Library } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useReactFlow } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import type { AppNode } from '../types/store';
import { SidebarPanel } from './ui/SidebarPanel';
import { PanelSection } from './git/PanelSection';

export const FunctionLibrary: React.FC = () => {
    const { t } = useTranslation();
    const { nodes, theme, navigateInto, addNoteNode, isBlockFile } = useStore();
    const { setCenter } = useReactFlow();
    const [searchTerm, setSearchTerm] = useState('');
    const isDark = theme === 'dark';

    // Get all functions in the current context
    const functions = nodes
        .filter(n => n.data.isDecl)
        .map(n => ({
            id: n.id,
            name: (n.data.label ?? '').replace('Definition: ', ''),
            node: n,
            args: n.data.args ?? []
        }))
        .filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleFocus = (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            void setCenter(node.position.x + 150, node.position.y + 100, { zoom: 1, duration: 800 });
        }
    };

    const handleEnter = (f: { node: AppNode }) => {
        const scope = f.node.data.scopes?.body;
        if (scope) {
            navigateInto(scope.id, scope.label);
        }
    };

    return (
        <SidebarPanel
            title={t('app.function_library')}
            icon={Library}
            isDark={isDark}
        >
            <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                width: '100%'
            }}>
                <div style={{ padding: '15px', borderBottom: `1px solid ${isDark ? '#333' : '#eee'}` }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: isDark ? '#252525' : '#f5f5f5',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${isDark ? '#444' : '#ddd'}`
                    }}>
                        <Search size={16} color={isDark ? '#888' : '#666'} />
                        <input
                            placeholder={t('library.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: isDark ? '#fff' : '#333',
                                fontSize: '0.85rem',
                                width: '100%'
                            }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                    {isBlockFile && (
                        <button
                            onClick={() => { void addNoteNode(); }}
                            style={{
                                width: '100%',
                                padding: '12px',
                                marginBottom: '20px',
                                background: isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.05)',
                                border: `2px dashed ${isDark ? '#a855f7' : '#a855f7'}`,
                                borderRadius: '12px',
                                color: '#a855f7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.05)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <StickyNote size={20} />
                            {t('library.new_block_note')}
                        </button>
                    )}

                    <PanelSection
                        id="functions-list"
                        title={t('library.categories.functions')}
                        count={functions.length}
                        defaultOpen={true}
                        isDark={isDark}
                    >
                        {functions.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '0.8rem' }}>
                                {t('library.no_functions')}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px 0' }}>
                                {functions.map(f => (
                                    <div
                                        key={f.id}
                                        style={{
                                            padding: '10px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            background: isDark ? 'transparent' : 'transparent',
                                            transition: 'all 0.2s',
                                            border: '1px solid transparent'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = isDark ? '#252525' : '#f9f9f9';
                                            e.currentTarget.style.borderColor = isDark ? '#444' : '#eee';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.borderColor = 'transparent';
                                        }}
                                        onClick={() => handleFocus(f.id)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <Code2 size={14} color="#4caf50" />
                                            <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: isDark ? '#ddd' : '#333' }}>
                                                {f.name}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#777', marginBottom: '8px', paddingLeft: '22px' }}>
                                            ({f.args.join(', ')})
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px', paddingLeft: '22px' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEnter(f); }}
                                                style={{
                                                    padding: '4px 8px',
                                                    fontSize: '0.7rem',
                                                    borderRadius: '4px',
                                                    border: 'none',
                                                    background: '#4caf50',
                                                    color: '#fff',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                {t('library.dive')} <ChevronRight size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </PanelSection>
                </div>
            </div>
        </SidebarPanel>
    );
};
