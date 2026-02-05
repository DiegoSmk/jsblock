import type { AppState } from '../../../../types/store';
import React from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw, Trash2, Palette, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NOTE_PALETTE, STROKE_OPACITY } from '../../../../constants/design';
import { type NodeChange } from '@xyflow/react';
import type { NodeCustomStyle } from '../../types';
import { MenuButton } from './MenuButton';

interface NoteNodeMenuProps {
    id: string;
    label: string;
    menuState: 'closed' | 'menu' | 'style' | 'details';
    setMenuState: (state: 'closed' | 'menu' | 'style' | 'details') => void;
    popupPosition: { top: number; left: number };
    popoverRef: React.RefObject<HTMLDivElement>;
    isDark: boolean;
    customStyle: NodeCustomStyle;
    handleStyleUpdate: (updates: Partial<NodeCustomStyle>) => void;
    onNodesChange: (changes: NodeChange[]) => void;
    setConfirmationModal: (modal: AppState['confirmationModal']) => void;
    createdAt?: number;
    updatedAt?: number;
    edgesCount: number;
    effectiveBorderColor: string;
}

export const NoteNodeMenu: React.FC<NoteNodeMenuProps> = ({
    id,
    label,
    menuState,
    setMenuState,
    popupPosition,
    popoverRef,
    isDark,
    customStyle,
    handleStyleUpdate,
    onNodesChange,
    setConfirmationModal,
    createdAt,
    updatedAt,
    edgesCount,
    effectiveBorderColor
}) => {
    const { t } = useTranslation();
    const borderOpacity = customStyle.borderOpacity ?? 1;
    const borderStyle = customStyle.borderStyle ?? 'solid';

    if (menuState === 'closed') return null;

    return createPortal(
        <>
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9998,
                    cursor: 'default'
                }}
                onMouseDown={(e) => {
                    e.stopPropagation();
                    setMenuState('closed');
                }}
                onClick={(e) => e.stopPropagation()}
            />
            <div
                ref={popoverRef}
                className="nodrag"
                style={{
                    position: 'fixed',
                    top: popupPosition.top,
                    left: popupPosition.left,
                    background: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                    padding: '12px',
                    zIndex: 9999,
                    width: '210px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                {menuState === 'menu' && (
                    <>
                        <MenuButton
                            icon={Trash2}
                            label={t('note.delete') || "Excluir"}
                            color={isDark ? '#ef4444' : '#dc2626'}
                            isDark={isDark}
                            onClick={() => {
                                setConfirmationModal({
                                    isOpen: true,
                                    title: t('note.delete_title') ?? 'Excluir Nota',
                                    message: t('note.delete_confirm', { label: label ?? 'Nota' }) ?? 'Tem certeza que deseja excluir esta nota?',
                                    confirmLabel: t('app.common.delete') ?? 'Excluir',
                                    cancelLabel: t('app.common.cancel') ?? 'Cancelar',
                                    variant: 'danger',
                                    onConfirm: () => {
                                        onNodesChange([{ id, type: 'remove' }]);
                                        setConfirmationModal(null);
                                    },
                                    onCancel: () => setConfirmationModal(null)
                                });
                                setMenuState('closed');
                            }}
                        />
                        <div style={{ height: '1px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', margin: '2px 0' }} />
                        <MenuButton
                            icon={Palette}
                            label="Estilo & Cores"
                            isDark={isDark}
                            onClick={() => setMenuState('style')}
                        />
                        <MenuButton
                            icon={Info}
                            label="Detalhes"
                            isDark={isDark}
                            onClick={() => setMenuState('details')}
                        />
                    </>
                )}

                {menuState === 'style' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <button
                                onClick={() => setMenuState('menu')}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#aaa' : '#666', fontSize: '0.8rem' }}
                            >
                                Estilo
                            </button>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                    onClick={() => handleStyleUpdate({ borderColor: undefined, borderOpacity: undefined, borderStyle: undefined })}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#aaa' : '#666' }}
                                >
                                    <RotateCcw size={14} />
                                </button>
                                <button
                                    onClick={() => setMenuState('closed')}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#aaa' : '#666' }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {Object.values(NOTE_PALETTE).map(color => (
                                <button
                                    key={color}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: color,
                                        border: customStyle.borderColor === color ? `2px solid ${isDark ? '#fff' : '#000'}` : '2px solid transparent',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => handleStyleUpdate({ borderColor: color })}
                                />
                            ))}
                        </div>

                        <div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: isDark ? '#aaa' : '#666' }}>Opacidade da Borda</span>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                {Object.entries(STROKE_OPACITY).map(([label, value]) => (
                                    <button
                                        key={label}
                                        style={{
                                            flex: 1,
                                            height: '6px',
                                            borderRadius: '3px',
                                            background: customStyle.borderColor ?? (isDark ? '#fff' : '#000'),
                                            opacity: value,
                                            border: borderOpacity === value ? `1px solid ${isDark ? '#fff' : '#000'}` : 'none',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handleStyleUpdate({ borderOpacity: value })}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: isDark ? '#aaa' : '#666' }}>Estilo da Linha</span>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                {(['solid', 'dashed', 'dotted'] as const).map(style => (
                                    <button
                                        key={style}
                                        style={{
                                            flex: 1,
                                            height: '24px',
                                            background: 'transparent',
                                            border: `1px ${style} ${isDark ? '#aaa' : '#666'}`,
                                            cursor: 'pointer',
                                            opacity: borderStyle === style ? 1 : 0.5,
                                            borderRadius: '4px'
                                        }}
                                        onClick={() => handleStyleUpdate({ borderStyle: style })}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {menuState === 'details' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <button
                                onClick={() => setMenuState('menu')}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#aaa' : '#666', fontSize: '0.8rem' }}
                            >
                                Detalhes
                            </button>
                            <button
                                onClick={() => setMenuState('closed')}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#aaa' : '#666' }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: isDark ? '#eee' : '#333' }}>
                            <div>
                                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: isDark ? '#aaa' : '#666' }}>Criação</span>
                                <div>{createdAt ? new Date(createdAt).toLocaleString() : '---'}</div>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: isDark ? '#aaa' : '#666' }}>Última Atualização</span>
                                <div>{updatedAt ? new Date(updatedAt).toLocaleString() : '---'}</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Conexões</span>
                                <span style={{
                                    background: effectiveBorderColor,
                                    color: '#fff',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700
                                }}>
                                    {edgesCount}
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>,
        document.body
    );
};
