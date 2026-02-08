import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, File, Plus, Minus, RotateCcw } from 'lucide-react';

interface GitFileStatus {
    path: string;
    status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'staged';
    index: string;
    workingTree: string;
}

interface TreeNode {
    name: string;
    path: string;
    children: Record<string, TreeNode>;
    file?: GitFileStatus;
}

interface FileTreeViewProps {
    files: GitFileStatus[];
    onStage?: (path: string) => void;
    onUnstage?: (path: string) => void;
    onDiscard?: (path: string) => void;
    onSelectDiff?: (path: string) => void;
    selectedPath?: string | null;
    isDark: boolean;
}

export const FileTreeView: React.FC<FileTreeViewProps> = ({ files, onStage, onUnstage, onDiscard, onSelectDiff, selectedPath, isDark }) => {
    const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
    const [hoveredPath, setHoveredPath] = useState<string | null>(null);

    const tree = useMemo(() => {
        const root: TreeNode = { name: '', path: '', children: {} };
        if (!files || !Array.isArray(files)) return root;

        files.forEach(file => {
            const parts = file.path.split('/');
            let current = root;
            parts.forEach((part, index) => {
                const isFile = index === parts.length - 1;
                const path = parts.slice(0, index + 1).join('/');

                if (!current.children[part]) {
                    current.children[part] = {
                        name: part,
                        path: path,
                        children: {}
                    };
                }
                current = current.children[part];
                if (isFile) {
                    current.file = file;
                }
            });
        });
        return root;
    }, [files]);

    const toggleFolder = (path: string) => {
        const newCollapsed = new Set(collapsedFolders);
        if (newCollapsed.has(path)) {
            newCollapsed.delete(path);
        } else {
            newCollapsed.add(path);
        }
        setCollapsedFolders(newCollapsed);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'modified': return '#eab308'; // yellow-500
            case 'added': return '#22c55e'; // green-500
            case 'deleted': return '#ef4444'; // red-500
            case 'untracked': return '#a8a29e'; // stone-400
            case 'renamed': return '#3b82f6'; // blue-500
            default: return '#a8a29e';
        }
    };

    const StatusBadge = ({ status }: { status: string }) => (
        <span style={{
            fontSize: '0.6rem',
            padding: '1px 4px',
            borderRadius: '4px',
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            color: getStatusColor(status),
            fontWeight: 700,
            marginLeft: 'auto',
            minWidth: '12px',
            textAlign: 'center'
        }}>
            {status === 'untracked' ? 'U' : status.charAt(0)}
        </span>
    );

    const renderNode = (node: TreeNode, depth = 0): React.ReactNode => {
        const isFolder = !node.file;
        const isCollapsed = collapsedFolders.has(node.path);
        const isHovered = hoveredPath === node.path;

        // Skip root render, just render children
        if (node.path === '') {
            return Object.values(node.children)
                .sort((a, b) => {
                    const aIsFolder = !a.file;
                    const bIsFolder = !b.file;
                    if (aIsFolder && !bIsFolder) return -1;
                    if (!aIsFolder && bIsFolder) return 1;
                    return a.name.localeCompare(b.name);
                })
                .map(child => <React.Fragment key={child.path}>{renderNode(child, depth)}</React.Fragment>);
        }

        return (
            <div key={node.path}>
                <div
                    style={{
                        padding: '4px 8px',
                        paddingLeft: `${depth * 14 + 8}px`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: isDark ? '#ddd' : '#333',
                        background: selectedPath === node.file?.path
                            ? (isDark ? 'rgba(52, 211, 153, 0.08)' : 'rgba(16, 185, 129, 0.08)')
                            : (isHovered ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') : 'transparent'),
                        border: selectedPath === node.file?.path
                            ? (isDark ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid rgba(16, 185, 129, 0.15)')
                            : '1px solid transparent',
                        borderRadius: '4px',
                        margin: '0 4px',
                        transition: 'background 0.1s'
                    }}
                    onMouseEnter={() => setHoveredPath(node.path)}
                    onMouseLeave={() => setHoveredPath(null)}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isFolder) {
                            toggleFolder(node.path);
                        } else if (onSelectDiff) {
                            onSelectDiff(node.file!.path);
                        }
                    }}
                >
                    {isFolder ? (
                        <>
                            {isCollapsed ? <ChevronRight size={14} color={isDark ? '#666' : '#999'} /> : <ChevronDown size={14} color={isDark ? '#666' : '#999'} />}
                            <Folder size={14} color={isDark ? '#4fc3f7' : '#0070f3'} fill={isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(0, 112, 243, 0.05)'} />
                            <span style={{ fontWeight: 600, opacity: 0.85 }}>{node.name}</span>
                        </>
                    ) : (
                        <>
                            <File size={14} color={isDark ? '#888' : '#777'} style={{ marginLeft: '14px' }} />
                            <span style={{
                                opacity: 0.9,
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: selectedPath === node.file!.path ? (isDark ? '#34d399' : '#10b981') : 'inherit',
                                fontWeight: selectedPath === node.file!.path ? 700 : 'normal'
                            }}>{node.name}</span>
                            <StatusBadge status={node.file!.status} />

                            {isHovered && (
                                <div style={{ display: 'flex', gap: '2px', marginLeft: '6px' }}>
                                    {onStage && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onStage(node.file!.path); }}
                                            title="Adicionar (Stage)"
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#4ade80' : '#16a34a', padding: '2px', display: 'flex' }}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    )}
                                    {onUnstage && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onUnstage(node.file!.path); }}
                                            title="Remover (Unstage)"
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#fbbf24' : '#d97706', padding: '2px', display: 'flex' }}
                                        >
                                            <Minus size={14} />
                                        </button>
                                    )}
                                    {onDiscard && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDiscard(node.file!.path); }}
                                            title="Descartar Alterações"
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#ef4444' : '#dc2626', padding: '2px', display: 'flex' }}
                                        >
                                            <RotateCcw size={14} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
                {isFolder && !isCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {Object.values(node.children)
                            .sort((a, b) => {
                                const aIsFolder = !a.file;
                                const bIsFolder = !b.file;
                                if (aIsFolder && !bIsFolder) return -1;
                                if (!aIsFolder && bIsFolder) return 1;
                                return a.name.localeCompare(b.name);
                            })
                            .map(child => <React.Fragment key={child.path}>{renderNode(child, depth + 1)}</React.Fragment>)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
            {Object.keys(tree.children).length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: isDark ? '#666' : '#999', fontSize: '0.75rem' }}>
                    Nenhum arquivo.
                </div>
            ) : (
                renderNode(tree)
            )}
        </div>
    );
};
