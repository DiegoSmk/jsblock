import React, { useState } from 'react';
import { Plus, Minus, RotateCcw, List as ListIcon, Indent } from 'lucide-react';
import { SectionHeader, ActionToolbar } from './SharedComponents';
import { FileTreeView } from './FileTreeView';

interface GitFile {
    path: string;
    index: string;
    workingTree: string;
    status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'staged';
}

interface GitStatusGroupsProps {
    isDark: boolean;
    staged: GitFile[];
    unstaged: GitFile[];
    gitUnstageAll: () => void;
    gitStageAll: () => void;
    gitDiscardAll: () => void;
    gitUnstage: (path: string) => void;
    gitStage: (path: string) => void;
    gitDiscard: (path: string) => void;
}

export const GitStatusGroups: React.FC<GitStatusGroupsProps> = ({
    isDark, staged, unstaged,
    gitUnstageAll, gitStageAll, gitDiscardAll,
    gitUnstage, gitStage, gitDiscard
}) => {
    const [isTreeView, setIsTreeView] = useState(false);

    const TreeToggle = ({ count }: { count: number }) => (
        <button
            onClick={(e) => {
                e.stopPropagation();
                if (count > 0) setIsTreeView(!isTreeView);
            }}
            disabled={count === 0}
            title={count === 0 ? "Nenhuma alteração para visualizar" : (isTreeView ? "Alternar para Lista" : "Alternar para Árvore")}
            style={{
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                borderRadius: '4px',
                cursor: count === 0 ? 'not-allowed' : 'pointer',
                color: count === 0 ? (isDark ? '#444' : '#ccc') : (isDark ? '#aaa' : '#666'),
                padding: '4px 6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: count === 0 ? 0.5 : 1,
                transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
                if (count > 0) {
                    e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';
                    e.currentTarget.style.color = isDark ? '#fff' : '#000';
                }
            }}
            onMouseLeave={(e) => {
                if (count > 0) {
                    e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
                    e.currentTarget.style.color = isDark ? '#aaa' : '#666';
                }
            }}
        >
            {isTreeView ? <ListIcon size={13} /> : <Indent size={13} />}
        </button>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Staged Changes */}
            <SectionHeader
                title="Alterações Preparadas"
                count={staged.length}
                isOpen={true}
                isDark={isDark}
                rightElement={<TreeToggle count={staged.length} />}
            />
            {staged.length > 0 && (
                <ActionToolbar isDark={isDark}>
                    <button
                        onClick={gitUnstageAll}
                        className="git-button-base"
                        style={{
                            border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                            color: isDark ? '#ddd' : '#555',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
                            e.currentTarget.style.borderColor = isDark ? '#666' : '#bbb';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = isDark ? '#444' : '#ddd';
                        }}
                    >
                        <Minus size={14} />
                        <span className="btn-text">Unstage All</span>
                    </button>
                </ActionToolbar>
            )}
            <div style={{ padding: '4px 0' }}>
                {isTreeView && staged.length > 0 ? (
                    <FileTreeView
                        files={staged}
                        onUnstage={gitUnstage}
                        isDark={isDark}
                    />
                ) : (
                    <>
                        {staged.map((file, i) => (
                            <div key={i} className="git-file-item">
                                <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(74, 222, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#4ade80', fontWeight: 800 }}>
                                    {file.index}
                                </div>
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.path}</span>
                                <button
                                    onClick={() => gitUnstage(file.path)}
                                    title="Remover do Stage"
                                    className="git-file-action-button discard"
                                    style={{ color: '#f87171' }}
                                >
                                    <Minus size={14} />
                                </button>
                            </div>
                        ))}
                        {staged.length === 0 && (
                            <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.75rem', color: isDark ? '#444' : '#ccc' }}>
                                Nenhuma alteração preparada
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Unstaged Changes */}
            <SectionHeader
                title="Alterações Não Preparadas"
                count={unstaged.length}
                isOpen={true}
                isDark={isDark}
                rightElement={<TreeToggle count={unstaged.length} />}
            />
            {unstaged.length > 0 && (
                <ActionToolbar isDark={isDark}>
                    <button
                        onClick={gitStageAll}
                        className="git-button-base"
                        style={{
                            border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                            color: isDark ? '#ddd' : '#555',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
                            e.currentTarget.style.borderColor = isDark ? '#666' : '#bbb';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = isDark ? '#444' : '#ddd';
                        }}
                    >
                        <Plus size={14} />
                        <span className="btn-text">Stage All Changes</span>
                    </button>
                    <button
                        onClick={gitDiscardAll}
                        className="git-button-base"
                        style={{
                            border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                            color: isDark ? '#f87171' : '#dc2626',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDark ? 'rgba(248, 113, 113, 0.08)' : 'rgba(220, 38, 38, 0.06)';
                            e.currentTarget.style.borderColor = isDark ? '#f87171' : '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = isDark ? '#444' : '#ddd';
                        }}
                    >
                        <RotateCcw size={14} />
                        <span className="btn-text">Discard All Changes</span>
                    </button>
                </ActionToolbar>
            )}
            <div style={{ padding: '4px 0' }}>
                {isTreeView && unstaged.length > 0 ? (
                    <FileTreeView
                        files={unstaged}
                        onStage={gitStage}
                        onDiscard={gitDiscard}
                        isDark={isDark}
                    />
                ) : (
                    <>
                        {unstaged.map((file, i) => (
                            <div key={i} className="git-file-item">
                                <div style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '4px',
                                    background: file.status === 'untracked' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(96, 165, 250, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    color: file.status === 'untracked' ? '#fbbf24' : '#60a5fa',
                                    fontWeight: 800
                                }}>
                                    {file.workingTree === '?' ? 'U' : file.workingTree}
                                </div>
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.path}</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        onClick={() => gitDiscard(file.path)}
                                        title="Descartar Alterações"
                                        className="git-file-action-button discard"
                                        style={{ color: '#f87171' }}
                                    >
                                        <RotateCcw size={14} />
                                    </button>
                                    <button
                                        onClick={() => gitStage(file.path)}
                                        title="Preparar Alteração (Stage)"
                                        className="git-file-action-button stage"
                                        style={{ color: '#4ade80' }}
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {unstaged.length === 0 && (
                            <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.75rem', color: isDark ? '#444' : '#ccc' }}>
                                Nenhuma alteração pendente
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
