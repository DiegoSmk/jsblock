import React from 'react';
import {
    ChevronRight,
    ChevronDown,
    Folder,
    FolderOpen,
    FileCode,
    FileText,
    Box,
    File as FileIcon,
    MoreVertical
} from 'lucide-react';
import type { FileNode } from '../types';

interface TreeItemProps {
    node: FileNode;
    depth: number;
    isExpanded: boolean;
    isSelected: boolean;
    isDirty?: boolean;
    isDark: boolean;
    isRenaming?: boolean;
    expandedPaths: Set<string>;
    onToggle: (path: string) => void;
    onSelect: (path: string) => void;
    onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
    onRename?: (oldPath: string, newName: string) => void;
    onCancelRename?: () => void;
}

export const TreeItem: React.FC<TreeItemProps> = ({
    node,
    depth,
    isExpanded,
    isSelected,
    isDirty,
    isDark,
    isRenaming,
    expandedPaths,
    onToggle,
    onSelect,
    onContextMenu,
    onRename,
    onCancelRename
}) => {
    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle(node.path);
    };

    const handleSelect = () => {
        if (node.isDirectory) {
            onToggle(node.path);
        } else {
            onSelect(node.path);
        }
    };

    const getFileIcon = (name: string) => {
        if (name.endsWith('.js') || name.endsWith('.ts')) {
            return <FileCode size={16} style={{ marginRight: 8, color: name.endsWith('.ts') ? '#3178c6' : '#f7df1e' }} />;
        }
        if (name.endsWith('.md')) {
            return <FileText size={16} style={{ marginRight: 8, color: '#0ea5e9' }} />;
        }
        if (name.endsWith('.block')) {
            return <Box size={16} style={{ marginRight: 8, color: '#a855f7' }} />;
        }
        return <FileIcon size={16} style={{ marginRight: 8, opacity: 0.6 }} />;
    };

    return (
        <div className="workspace-tree-item">
            <div
                onClick={handleSelect}
                onContextMenu={(e) => onContextMenu(e, node)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    paddingLeft: `${depth * 12 + 8}px`,
                    cursor: 'pointer',
                    backgroundColor: isSelected
                        ? (isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(0, 112, 243, 0.05)')
                        : 'transparent',
                    color: isSelected
                        ? (isDark ? '#4fc3f7' : '#0070f3')
                        : (isDark ? '#ccc' : '#444'),
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                    borderRadius: '4px',
                    margin: '1px 4px',
                }}
            >
                {node.isDirectory ? (
                    <>
                        <div onClick={handleToggle} style={{ display: 'flex', alignItems: 'center' }}>
                            {isExpanded ? (
                                <ChevronDown size={14} style={{ marginRight: 4, opacity: 0.6 }} />
                            ) : (
                                <ChevronRight size={14} style={{ marginRight: 4, opacity: 0.6 }} />
                            )}
                            {isExpanded ? (
                                <FolderOpen size={16} style={{ marginRight: 8, color: '#eab308' }} />
                            ) : (
                                <Folder size={16} style={{ marginRight: 8, color: '#eab308' }} />
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ width: 18 }} />
                        {getFileIcon(node.name)}
                    </>
                )}

                {isRenaming ? (
                    <input
                        autoFocus
                        defaultValue={node.name}
                        onFocus={(e) => {
                            // Select filename without extension if it's a file
                            const dotIndex = node.name.lastIndexOf('.');
                            if (!node.isDirectory && dotIndex > 0) {
                                e.target.setSelectionRange(0, dotIndex);
                            } else {
                                e.target.select();
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onRename?.(node.path, e.currentTarget.value);
                            } else if (e.key === 'Escape') {
                                onCancelRename?.();
                            }
                        }}
                        onBlur={(e) => {
                            if (e.currentTarget.value === node.name) {
                                onCancelRename?.();
                            } else {
                                onRename?.(node.path, e.currentTarget.value);
                            }
                        }}
                        style={{
                            flex: 1,
                            background: isDark ? '#1a1a1a' : '#fff',
                            border: `1px solid ${isDark ? '#4fc3f7' : '#0070f3'}`,
                            borderRadius: '2px',
                            color: isDark ? '#fff' : '#000',
                            fontSize: '0.85rem',
                            padding: '0 4px',
                            outline: 'none'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <>
                        <span style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1
                        }}>
                            {node.name}
                        </span>

                        {isDirty && (
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: isDark ? '#4fc3f7' : '#0070f3',
                                marginLeft: '6px',
                                flexShrink: 0
                            }} />
                        )}

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onContextMenu(e, node);
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px',
                                color: isDark ? '#888' : '#666',
                                borderRadius: '4px',
                                opacity: 0,
                            }}
                            className="item-actions-trigger"
                        >
                            <MoreVertical size={14} />
                        </button>
                    </>
                )}
            </div>

            {node.isDirectory && isExpanded && node.children && (
                <div className="tree-children">
                    {node.children.map((child) => (
                        <TreeItem
                            key={child.path}
                            node={child}
                            depth={depth + 1}
                            isExpanded={expandedPaths.has(child.path)}
                            isSelected={isSelected}
                            isDark={isDark}
                            expandedPaths={expandedPaths}
                            onToggle={onToggle}
                            onSelect={onSelect}
                            onContextMenu={onContextMenu}
                            onRename={onRename}
                            onCancelRename={onCancelRename}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
