import React, { useState } from 'react';
import { Search, MapPin, StickyNote, Plus } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { useReactFlow } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import { PanelSection } from './git/PanelSection';

export const NotesLibrary: React.FC = () => {
    const { t } = useTranslation();
    const { nodes, theme, addNoteNode } = useStore();
    const { setCenter } = useReactFlow();
    const [searchTerm, setSearchTerm] = useState('');
    const [isExpanded, setIsExpanded] = useState(true);
    const isDark = theme === 'dark';

    // Get all notes in the current context
    const notes = nodes
        .filter(n => n.type === 'noteNode')
        .map(n => ({
            id: n.id,
            title: n.data.label ?? t('note.title_placeholder'),
            text: n.data.text ?? '',
            node: n
        }))
        .filter(n =>
            n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.text.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const handleFocus = (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            // Center the view on the node with a nice zoom level
            void setCenter(node.position.x + 150, node.position.y + 100, { zoom: 1.2, duration: 800 });
        }
    };

    const truncateText = (text: string, length: number) => {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    };

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
        }}>
            {/* Search Header */}
            <div style={{ padding: '15px', borderBottom: `1px solid ${isDark ? '#333' : '#eee'}` }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: isDark ? '#252525' : '#f5f5f5',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                    transition: 'all 0.2s'
                }}>
                    <Search size={16} color={isDark ? '#888' : '#666'} />
                    <input
                        placeholder={t('library.notes.search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
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

            {/* Content List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <PanelSection
                    id="notes-list"
                    icon={StickyNote}
                    title={t('library.notes.title')}
                    count={notes.length}
                    isOpen={isExpanded}
                    onToggle={() => setIsExpanded(!isExpanded)}
                    isDark={isDark}
                    actions={
                        <button
                            onClick={(e) => { e.stopPropagation(); void addNoteNode(); }}
                            title={t('library.new_block_note')}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '4px',
                                cursor: 'pointer',
                                color: isDark ? '#666' : '#999',
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: '4px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                                e.currentTarget.style.color = '#a855f7';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = isDark ? '#666' : '#999';
                            }}
                        >
                            <Plus size={14} />
                        </button>
                    }
                >
                    {notes.length === 0 ? (
                        <div style={{ padding: '30px 20px', textAlign: 'center', color: '#777', fontSize: '0.85rem' }}>
                            {t('library.notes.no_notes')}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0' }}>
                            {notes.map(note => (
                                <div
                                    key={note.id}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '10px',
                                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                        border: `1px solid ${isDark ? '#333' : '#eee'}`,
                                        transition: 'all 0.2s',
                                        cursor: 'default'
                                    }}
                                    className="note-library-item"
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                            <StickyNote size={14} color="#a855f7" style={{ flexShrink: 0 }} />
                                            <span style={{
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                color: isDark ? '#eee' : '#333',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {note.title}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleFocus(note.id)}
                                            style={{
                                                padding: '4px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: isDark ? '#333' : '#eee',
                                                color: isDark ? '#aaa' : '#666',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            title="Ir para nota"
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#a855f7';
                                                e.currentTarget.style.color = '#fff';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = isDark ? '#333' : '#eee';
                                                e.currentTarget.style.color = isDark ? '#aaa' : '#666';
                                            }}
                                        >
                                            <MapPin size={14} />
                                        </button>
                                    </div>

                                    {note.text && (
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: isDark ? '#888' : '#777',
                                            lineHeight: '1.4',
                                            paddingLeft: '22px'
                                        }}>
                                            {truncateText(note.text, 80)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </PanelSection>
            </div>
        </div>
    );
};
