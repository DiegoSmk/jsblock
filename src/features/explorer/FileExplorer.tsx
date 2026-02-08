import React, { useState, useEffect } from 'react';
import {
    FolderPlus,
    FolderOpen,
    LogOut,
    FileCode,
    FileText,
    X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { RecentEnvironments } from './RecentEnvironments';
import { FolderContextMenu } from './FolderContextMenu';
import { TreeItem } from '../workspace/components/TreeItem';
import { PanelSection } from '../git/components/PanelSection';
import { DESIGN_TOKENS } from '../../constants/design';
import type { FileNode } from '../workspace/types';

export const FileExplorer: React.FC = () => {
    const { t } = useTranslation();
    const {
        workspace,
        openedFolder,
        selectedFile,
        isDirty,
        theme,
        openWorkspace,
        refreshWorkspace,
        setOpenedFolder,
        setSelectedFile,
        updateFileTree,
        addToast,
        setConfirmationModal,
        setDirty
    } = useStore(useShallow(state => ({
        workspace: state.workspace,
        openedFolder: state.openedFolder,
        selectedFile: state.selectedFile,
        isDirty: state.isDirty,
        theme: state.theme,
        openWorkspace: state.openWorkspace,
        refreshWorkspace: state.refreshWorkspace,
        setOpenedFolder: state.setOpenedFolder,
        setSelectedFile: state.setSelectedFile,
        updateFileTree: state.updateFileTree,
        addToast: state.addToast,
        setConfirmationModal: state.setConfirmationModal,
        setDirty: state.setDirty
    })));

    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, node: FileNode } | null>(null);
    const [isCreating, setIsCreating] = useState<{ type: 'file' | 'folder', ext?: string, parentPath: string } | null>(null);
    const [newName, setNewName] = useState('');
    const [renamingPath, setRenamingPath] = useState<string | null>(null);

    const isDark = theme === 'dark';

    // Real-time updates
    useEffect(() => {
        if (!window.electron) return;

        const unsubscribe = window.electron.workspace.onUpdated((data) => {
            updateFileTree(data.tree);
        });

        return () => unsubscribe();
    }, [updateFileTree]);

    // Initial load for recently opened folder (if any)
    useEffect(() => {
        if (openedFolder && !workspace.rootPath) {
            // This handles the transition from legacy storage
            void refreshWorkspace();
        }
    }, [openedFolder, workspace.rootPath, refreshWorkspace]);

    const handleToggleFolder = (path: string) => {
        setExpandedPaths(prev => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    };

    const handleFileSelect = (path: string) => {
        void setSelectedFile(path);
    };

    const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, node });
    };

    const handleMenuAction = (type: 'file' | 'folder' | 'delete' | 'rename', ext?: string) => {
        if (!contextMenu) return;
        const { node } = contextMenu;

        if (type === 'delete') {
            setConfirmationModal({
                isOpen: true,
                title: t('file_explorer.delete_title') ?? 'Excluir Item',
                message: t('file_explorer.delete_confirm', { name: node.name }),
                confirmLabel: t('app.common.delete') ?? 'Excluir',
                cancelLabel: t('app.common.cancel') ?? 'Cancelar',
                variant: 'danger',
                onConfirm: async () => {
                    try {
                        if (!window.electron?.fileSystem) return;
                        await window.electron.fileSystem.delete(node.path);

                        const isInternalPath = (parent: string, child: string) => {
                            const normalizedParent = parent.replace(/\\/g, '/');
                            const normalizedChild = child.replace(/\\/g, '/');
                            return normalizedChild === normalizedParent || normalizedChild.startsWith(normalizedParent + '/');
                        };

                        if (selectedFile && isInternalPath(node.path, selectedFile)) {
                            setDirty(false);
                            await setSelectedFile(null);
                        }

                        addToast({ type: 'success', message: t('file_explorer.delete_success') ?? 'Item excluído com sucesso' });
                        setConfirmationModal(null);
                    } catch (err) {
                        addToast({ type: 'error', message: t('app.errors.delete', { error: err }) });
                        setConfirmationModal(null);
                    }
                },
                onCancel: () => setConfirmationModal(null)
            });
        } else if (type === 'rename') {
            setRenamingPath(node.path);
        } else {
            const lastIdx = Math.max(node.path.lastIndexOf('/'), node.path.lastIndexOf('\\'));
            const parentPath = node.isDirectory ? node.path : node.path.substring(0, lastIdx);
            setIsCreating({ type, ext, parentPath });
        }
        setContextMenu(null);
    };

    const handleRename = async (oldPath: string, newNameValue: string) => {
        if (!newNameValue || newNameValue === oldPath.split(/[\\/]/).pop()) {
            setRenamingPath(null);
            return;
        }

        try {
            const sep = oldPath.includes('\\') ? '\\' : '/';
            const lastIdx = Math.max(oldPath.lastIndexOf('/'), oldPath.lastIndexOf('\\'));
            const parent = oldPath.substring(0, lastIdx);
            const newPath = `${parent}${sep}${newNameValue}`;

            if (!window.electron?.fileSystem) return;
            await window.electron.fileSystem.move(oldPath, newPath);

            const isInternalPath = (parentDir: string, child: string) => {
                const normalizedParent = parentDir.replace(/\\/g, '/');
                const normalizedChild = child.replace(/\\/g, '/');
                return normalizedChild === normalizedParent || normalizedChild.startsWith(normalizedParent + '/');
            };

            if (selectedFile === oldPath) {
                await setSelectedFile(newPath);
            } else if (selectedFile && isInternalPath(oldPath, selectedFile)) {
                await setSelectedFile(selectedFile.replace(oldPath, newPath));
            }

            addToast({ type: 'success', message: t('file_explorer.rename_success') ?? 'Item renomeado' });
        } catch (err) {
            addToast({ type: 'error', message: String(err) });
        } finally {
            setRenamingPath(null);
        }
    };

    const renderActionButtons = () => (
        <div style={{
            height: DESIGN_TOKENS.RIBBON_WIDTH,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '0 4px',
            background: 'transparent',
            borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`
        }}>
            <ActionButton
                icon={FolderPlus}
                onClick={() => setIsCreating({ type: 'folder', parentPath: workspace.rootPath ?? '' })}
                title={t('file_explorer.actions.new_folder')}
                isDark={isDark}
            />
            <ActionButton
                icon={FileCode}
                color="#f7df1e"
                onClick={() => setIsCreating({ type: 'file', ext: '.js', parentPath: workspace.rootPath ?? '' })}
                title={t('file_explorer.actions.new_js')}
                isDark={isDark}
            />
            <ActionButton
                icon={FileCode}
                color="#3178c6"
                onClick={() => setIsCreating({ type: 'file', ext: '.ts', parentPath: workspace.rootPath ?? '' })}
                title={t('file_explorer.actions.new_ts')}
                isDark={isDark}
            />
            <ActionButton
                icon={FileText}
                color="#0ea5e9"
                onClick={() => setIsCreating({ type: 'file', ext: '.md', parentPath: workspace.rootPath ?? '' })}
                title={t('file_explorer.actions.new_md')}
                isDark={isDark}
            />
            <ActionButton
                label="Block"
                color="#a855f7"
                onClick={() => setIsCreating({ type: 'file', ext: '.block', parentPath: workspace.rootPath ?? '' })}
                title={t('file_explorer.actions.new_block')}
                isDark={isDark}
            />
        </div>
    );

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            backgroundColor: isDark ? '#1e1e1e' : '#f3f4f6',
        }}>
            {contextMenu && (
                <FolderContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    isDark={isDark}
                    t={t}
                    onClose={() => setContextMenu(null)}
                    onAction={handleMenuAction}
                />
            )}

            {workspace.rootPath ? (
                <PanelSection
                    id="current-workspace"
                    title={workspace.rootPath.split(/[\\/]/).pop() ?? t('app.folder')}
                    icon={FolderOpen}
                    isDark={isDark}
                    defaultOpen={true}
                    actions={
                        <button
                            onClick={() => {
                                setOpenedFolder(null); // Cleanup store
                                void setSelectedFile(null);
                                // In a real app we'd call workspaceService.stop()
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: isDark ? '#aaa' : '#666',
                                padding: 4,
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            title={t('file_explorer.close_folder')}
                        >
                            <LogOut size={14} />
                        </button>
                    }
                >
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '8px 0',
                        minHeight: 0
                    }}>
                        {workspace.fileTree.map(node => (
                            <TreeItem
                                key={node.path}
                                node={node}
                                depth={0}
                                isExpanded={expandedPaths.has(node.path)}
                                isSelected={selectedFile === node.path}
                                isDirty={selectedFile === node.path && isDirty}
                                isDark={isDark}
                                isRenaming={renamingPath === node.path}
                                expandedPaths={expandedPaths}
                                onToggle={handleToggleFolder}
                                onSelect={handleFileSelect}
                                onContextMenu={handleContextMenu}
                                onRename={handleRename}
                                onCancelRename={() => setRenamingPath(null)}
                            />
                        ))}
                    </div>
                </PanelSection>
            ) : (
                <div style={{ flex: 1, padding: '24px', textAlign: 'center' }}>
                    <div style={{ marginBottom: '28px' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: isDark ? '#fff' : '#000', opacity: 0.7 }}>
                            {t('recent.welcome')}
                        </h2>
                        <p style={{ fontSize: '0.85rem', opacity: 0.6, color: isDark ? '#ccc' : '#666' }}>
                            {t('recent.select_env')}
                        </p>
                    </div>

                    <button
                        onClick={() => void openWorkspace()}
                        style={{
                            backgroundColor: isDark ? '#2d2d2d' : '#fff',
                            border: `1px solid ${isDark ? '#444' : '#ccc'}`,
                            color: isDark ? '#ddd' : '#444',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            margin: '0 auto',
                            fontWeight: 500,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        <FolderPlus size={18} />
                        {t('file_explorer.open_button')}
                    </button>

                    <div style={{ marginTop: '24px', textAlign: 'left', borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`, paddingTop: '16px' }}>
                        <RecentEnvironments embedded />
                    </div>
                </div>
            )}

            {workspace.rootPath && renderActionButtons()}

            {isCreating && (
                <div style={{
                    padding: '12px',
                    background: isDark ? '#252525' : '#fff',
                    borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`
                }}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            void (async () => {
                                if (!newName) return;
                                try {
                                    const sep = isCreating.parentPath.includes('\\') ? '\\' : '/';
                                    if (isCreating.type === 'folder') {
                                        await window.electron?.fileSystem.createDirectory(`${isCreating.parentPath}${sep}${newName}`);
                                    } else {
                                        const ext = isCreating.ext ?? '';
                                        const fileName = newName.endsWith(ext) ? newName : `${newName}${ext}`;
                                        await window.electron?.fileSystem.createFile(`${isCreating.parentPath}${sep}${fileName}`, '');
                                    }
                                    setIsCreating(null);
                                    setNewName('');
                                } catch (err) {
                                    addToast({ type: 'error', message: String(err) });
                                }
                            })();
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <input
                            autoFocus
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={() => { if (!newName) setIsCreating(null); }}
                            placeholder={isCreating.type === 'folder' ? 'Folder name...' : 'File name...'}
                            style={{
                                flex: 1,
                                background: isDark ? '#1a1a1a' : '#f9f9f9',
                                border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                borderRadius: '4px',
                                padding: '4px 8px',
                                color: isDark ? '#fff' : '#000',
                                fontSize: '0.85rem',
                                outline: 'none'
                            }}
                        />
                        <button type="button" onClick={() => setIsCreating(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#888' }}>
                            <X size={16} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

const ActionButton = ({ icon: Icon, color, onClick, title, label, isDark }: {
    icon?: React.ElementType;
    color?: string;
    onClick: () => void;
    title: string;
    label?: string;
    isDark: boolean;
}) => (
    <button
        onClick={onClick}
        title={title}
        style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: color ?? (isDark ? '#888' : '#666'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '6px',
            transition: 'all 0.2s',
            flex: 1
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
            e.currentTarget.style.color = color ?? (isDark ? '#fff' : '#000');
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = color ?? (isDark ? '#888' : '#666');
        }}
    >
        {Icon ? <Icon size={18} /> : <span style={{ fontSize: '10px', fontWeight: 900 }}>{label}</span>}
    </button>
);
