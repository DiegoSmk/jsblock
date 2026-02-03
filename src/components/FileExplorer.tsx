
import React, { useState, useEffect, useRef } from 'react';
import { FolderPlus, ChevronRight, ChevronDown, Folder, FileCode, MoreVertical, File as FileIcon, LogOut, FolderOpen, FileText, Box, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RecentEnvironments } from './RecentEnvironments';
import { FolderContextMenu } from './FolderContextMenu';
import 'allotment/dist/style.css';
import { useStore } from '../store/useStore';
import { DESIGN_TOKENS } from '../constants/design';
import type { ElectronAPI } from '../types/electron';
import { PanelSection } from './git/PanelSection';

interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    isOpen?: boolean;
    children?: FileEntry[];
}

interface FileSystemEntry {
    name: string;
    isDirectory: boolean;
}

export const FileExplorer: React.FC = () => {
    const { t } = useTranslation();
    const { openedFolder, setOpenedFolder, selectedFile, setSelectedFile, theme, isDirty, setDirty, setConfirmationModal, addToast } = useStore();
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [isCreating, setIsCreating] = useState<{ type: 'file' | 'folder', ext?: string, parentPath: string } | null>(null);
    const [selectedDirPath, setSelectedDirPath] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const isDark = theme === 'dark';

    // Drag and Drop state
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

    // Context Menu state
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, path: string, isDirectory: boolean } | null>(null);

    const loadFiles = async (dirPath: string): Promise<FileEntry[]> => {
        if (!window.electronAPI) return [];
        const result = (await window.electronAPI.readDir(dirPath)) as FileSystemEntry[];
        const ignored = ['.git', '.vscode', 'node_modules', '.block'];
        return result
            .filter((file: FileSystemEntry) => !ignored.includes(file.name))
            .sort((a: FileSystemEntry, b: FileSystemEntry) => {
                if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
                return a.isDirectory ? -1 : 1;
            })
            .map((file: FileSystemEntry) => ({
                name: file.name,
                path: `${dirPath}/${file.name}`,
                isDirectory: file.isDirectory
            }));
    };

    useEffect(() => {
        if (openedFolder) {
            if (openedFolder.endsWith('/.block') || openedFolder.endsWith('\\.block')) {
                setOpenedFolder(null);
                return;
            }
            setSelectedDirPath(openedFolder);
            void loadFiles(openedFolder).then(setFiles).catch(console.error);
        }
    }, [openedFolder, setOpenedFolder]);

    useEffect(() => {
        if (isCreating && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isCreating]);

    const toggleFolder = async (path: string, currentFiles: FileEntry[]): Promise<FileEntry[]> => {
        return Promise.all(currentFiles.map(async (file) => {
            if (file.path === path) {
                const nextIsOpen = !file.isOpen;
                let children = file.children;
                if (nextIsOpen && !children) {
                    children = await loadFiles(file.path);
                }
                return { ...file, isOpen: nextIsOpen, children };
            }
            if (file.isDirectory && file.children) {
                return { ...file, children: await toggleFolder(path, file.children) };
            }
            return file;
        }));
    };

    const handleFolderClick = async (path: string) => {
        setSelectedDirPath(path);
        const newFiles = await toggleFolder(path, files);
        setFiles(newFiles);
    };

    const handleFileClick = (path: string) => {
        // Find parent directory of this file if possible, or keep existing selectedDir
        void setSelectedFile(path);
    };

    const handleCreateSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newName || !isCreating) {
            setIsCreating(null);
            setNewName('');
            return;
        }

        const parentPath = isCreating.parentPath;

        try {
            if (!window.electronAPI) return;

            if (isCreating.type === 'folder') {
                const dirPath = `${parentPath}/${newName}`;
                await window.electronAPI.createDirectory(dirPath);
            } else {
                const ext = isCreating.ext ?? '';
                const fileName = newName.endsWith(ext) ? newName : `${newName}${ext}`;
                const filePath = `${parentPath}/${fileName}`;
                let initialContent = '';
                if (ext === '.block') initialContent = `// JS Block - New code note\n\n`;
                if (ext === '.md') initialContent = `# ${newName}\n\n`;
                await window.electronAPI.createFile(filePath, initialContent);
                void setSelectedFile(filePath);
            }

            // Refresh the specific folder or root
            if (openedFolder) {
                // For simplicity, a full refresh is easier but we could refresh only branches
                const updated = await refreshFiles(openedFolder);
                setFiles(updated);
            }
        } catch (err) {
            addToast({ type: 'error', message: t('app.errors.generic', { error: err }) });
        } finally {
            setIsCreating(null);
            setNewName('');
        }
    };

    const refreshFiles = async (rootPath: string): Promise<FileEntry[]> => {
        // Recursive reload of open folders
        const reloadNode = async (nodes: FileEntry[]): Promise<FileEntry[]> => {
            return Promise.all(nodes.map(async (node) => {
                if (node.isDirectory && node.isOpen) {
                    const children = await loadFiles(node.path);
                    return { ...node, children: await reloadNode(children) };
                }
                return node;
            }));
        };

        const topLevel = await loadFiles(rootPath);
        return reloadNode(topLevel);
    };

    // Drag and Drop handlers
    const onDragStart = (e: React.DragEvent, path: string) => {
        setDraggedItem(path);
        e.dataTransfer.setData('text/plain', path);
    };

    const onDragOver = (e: React.DragEvent, path: string, isDirectory: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDirectory && draggedItem !== path) {
            setDragOverTarget(path);
        } else {
            setDragOverTarget(null);
        }
    };

    const onDrop = async (e: React.DragEvent, targetPath: string, isDirectory: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverTarget(null);
        const sourcePath = e.dataTransfer.getData('text/plain');

        if (!sourcePath || !targetPath || sourcePath === targetPath || !isDirectory) return;

        // Prevent moving a folder into its own subfolder
        if (targetPath.startsWith(sourcePath + '/') || targetPath.startsWith(sourcePath + '\\')) {
            return;
        }

        try {
            const electronAPI = (window as unknown as { electronAPI?: ElectronAPI }).electronAPI;
            if (!electronAPI) return;

            const fileName = sourcePath.split(/[\\/]/).pop();
            const newPath = `${targetPath}/${fileName}`;

            // If the source and destination are the same, do nothing
            if (sourcePath.replace(/\\/g, '/') === newPath.replace(/\\/g, '/')) {
                return;
            }

            if (await electronAPI.checkPathExists(newPath)) {
                addToast({ type: 'warning', message: t('file_explorer.already_exists') ?? 'An item with this name already exists at the destination.' });
                return;
            }

            await electronAPI.moveFile(sourcePath, newPath);

            // Refresh tree
            if (openedFolder) {
                const updated = await refreshFiles(openedFolder);
                setFiles(updated);
            }
        } catch (err) {
            addToast({ type: 'error', message: t('app.errors.move', { error: err }) });
        }
        setDraggedItem(null);
    };

    const openFolderDialog = async () => {
        const electronAPI = (window as unknown as { electronAPI?: ElectronAPI }).electronAPI;
        if (!electronAPI) return;
        const path = await electronAPI.selectFolder();
        if (path) {
            setOpenedFolder(path);
        }
    };

    const handleMenuAction = async (type: 'file' | 'folder' | 'delete', ext?: string) => {
        if (!contextMenu) return;

        if (type === 'delete') {
            const fileName = contextMenu.path.split(/[\\/]/).pop();
            setConfirmationModal({
                isOpen: true,
                title: t('file_explorer.delete_title') ?? 'Excluir Item',
                message: t('file_explorer.delete_confirm', { name: fileName }),
                confirmLabel: t('app.common.delete') ?? 'Excluir',
                cancelLabel: t('app.common.cancel') ?? 'Cancelar',
                variant: 'danger',
                onConfirm: async () => {
                    try {
                        if (!window.electronAPI) return;

                        // Check if we are deleting the currently open file
                        const normalize = (p: string) => p.replace(/\\/g, '/');
                        const normalizedSelected = selectedFile ? normalize(selectedFile) : null;
                        const normalizedContext = normalize(contextMenu.path);

                        const isDeletingActiveFile = !contextMenu.isDirectory && normalizedSelected === normalizedContext;
                        const isDeletingActiveFolder = contextMenu.isDirectory && normalizedSelected &&
                            (normalizedSelected === normalizedContext || normalizedSelected.startsWith(normalizedContext + '/'));

                        if (contextMenu.isDirectory) {
                            await window.electronAPI.deleteDirectory(contextMenu.path);
                        } else {
                            await window.electronAPI.deleteFile(contextMenu.path);
                        }

                        // Close file if it's gone
                        if (isDeletingActiveFile || isDeletingActiveFolder) {
                            setDirty(false); // Bypasses the "Save changes?" modal since the file is being deleted
                            await setSelectedFile(null);
                        }

                        // Refresh
                        if (openedFolder) {
                            const updated = await refreshFiles(openedFolder);
                            setFiles(updated);
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
        } else {
            setIsCreating({ type, ext, parentPath: contextMenu.path });
        }
        setContextMenu(null);
    };

    const renderTree = (nodes: FileEntry[], depth = 0) => {
        return nodes.map((node) => (
            <div key={node.path}
                onDragOver={(e) => onDragOver(e, node.path, node.isDirectory)}
                onDrop={(e) => {
                    void onDrop(e, node.path, node.isDirectory);
                }}
                onDragLeave={() => setDragOverTarget(null)}
            >
                <div
                    onClick={() => node.isDirectory ? (() => { void handleFolderClick(node.path); })() : handleFileClick(node.path)}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            path: node.path,
                            isDirectory: node.isDirectory
                        });
                    }}
                    draggable
                    onDragStart={(e) => onDragStart(e, node.path)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px 8px',
                        paddingLeft: `${depth * 12 + 8}px`,
                        cursor: 'pointer',
                        backgroundColor: dragOverTarget === node.path
                            ? (isDark ? 'rgba(79, 195, 247, 0.25)' : 'rgba(0, 112, 243, 0.1)')
                            : (selectedFile === node.path || (node.isDirectory && selectedDirPath === node.path))
                                ? (isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(0, 112, 243, 0.05)')
                                : 'transparent',
                        color: (selectedFile === node.path || (node.isDirectory && selectedDirPath === node.path))
                            ? (isDark ? '#4fc3f7' : '#0070f3')
                            : (isDark ? '#ccc' : '#444'),
                        fontSize: '0.85rem',
                        transition: 'all 0.2s',
                        borderRadius: '4px',
                        margin: '1px 4px',
                        border: dragOverTarget === node.path ? `1px dashed ${isDark ? '#4fc3f7' : '#0070f3'}` : '1px solid transparent'
                    }}
                    className="file-item"
                >
                    {node.isDirectory ? (
                        <>
                            {node.isOpen ? <ChevronDown size={14} style={{ marginRight: 4, opacity: 0.6 }} /> : <ChevronRight size={14} style={{ marginRight: 4, opacity: 0.6 }} />}
                            {node.isOpen ? <FolderOpen size={16} style={{ marginRight: 8, color: '#eab308' }} /> : <Folder size={16} style={{ marginRight: 8, color: '#eab308' }} />}
                        </>
                    ) : (
                        <>
                            <div style={{ width: 18 }} />
                            {node.name.endsWith('.js') || node.name.endsWith('.ts') ? (
                                <FileCode size={16} style={{ marginRight: 8, color: node.name.endsWith('.ts') ? '#3178c6' : '#f7df1e' }} />
                            ) : node.name.endsWith('.md') ? (
                                <FileText size={16} style={{ marginRight: 8, color: '#0ea5e9' }} />
                            ) : node.name.endsWith('.block') ? (
                                <Box size={16} style={{ marginRight: 8, color: '#a855f7' }} />
                            ) : (
                                <FileIcon size={16} style={{ marginRight: 8, opacity: 0.6 }} />
                            )}
                        </>
                    )}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{node.name}</span>

                    {/* Dirty Indicator for the file in the tree */}
                    {!node.isDirectory && selectedFile === node.path && isDirty && (
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: isDark ? '#4fc3f7' : '#0070f3',
                            marginRight: '6px',
                            flexShrink: 0
                        }} />
                    )}

                    {node.isDirectory && (
                        <div style={{ display: 'flex', gap: '4px', opacity: 0, transition: 'opacity 0.2s' }} className="folder-actions">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setContextMenu({
                                        x: rect.left,
                                        y: rect.bottom + 4,
                                        path: node.path,
                                        isDirectory: true
                                    });
                                }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    color: isDark ? '#888' : '#666',
                                    borderRadius: '4px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <MoreVertical size={14} />
                            </button>
                        </div>
                    )}
                </div>
                {node.isDirectory && node.isOpen && node.children && renderTree(node.children, depth + 1)}
            </div>
        ));
    };

    const ActionButton = ({ icon: Icon, color, onClick, title, label }: {
        icon?: React.ElementType;
        color?: string;
        onClick: () => void;
        title: string;
        label: string;
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
                padding: '6px',
                borderRadius: '6px',
                transition: 'all 0.2s',
                flex: 1
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                e.currentTarget.style.color = color ?? (isDark ? '#fff' : '#000');
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = color ?? (isDark ? '#888' : '#666');
            }}
        >
            {Icon ? <Icon size={18} /> : <span style={{ fontSize: '10px', fontWeight: 900 }}>{label}</span>}
        </button>
    );

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            backgroundColor: isDark ? '#1e1e1e' : '#f3f4f6',
            borderRight: `1px solid ${isDark ? '#333' : '#e5e7eb'}`
        }}>


            {contextMenu && (
                <FolderContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    isDark={isDark}
                    t={t}
                    onClose={() => setContextMenu(null)}
                    onAction={(type, ext) => { void handleMenuAction(type, ext); }}
                />
            )}


            {openedFolder ? (
                <PanelSection
                    id="current-folder"
                    title={openedFolder.split(/[\\/]/).pop() ?? t('app.folder')}
                    icon={FolderOpen}
                    isDark={isDark}
                    defaultOpen={true}
                    actions={
                        <button
                            onClick={() => {
                                setOpenedFolder(null);
                                void setSelectedFile(null);
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
                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '8px 0',
                            position: 'relative',
                            minHeight: 0,
                            height: '100%'
                        }}
                        onDragOver={(e) => {
                            if (openedFolder) {
                                onDragOver(e, openedFolder, true);
                            }
                        }}
                        onDrop={(e) => {
                            if (openedFolder) {
                                void onDrop(e, openedFolder, true);
                            }
                        }}
                    >
                        {renderTree(files)}
                        {/* Hidden spacer to allow dropping at the end of the list to move to root */}
                        <div style={{ height: '100px', cursor: 'default' }} />
                    </div>
                </PanelSection>
            ) : (
                <div style={{ flex: 1, padding: '24px', textAlign: 'center', overflowY: 'auto' }}>
                    <div style={{ marginBottom: '28px' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: isDark ? '#fff' : '#000', opacity: 0.7 }}>
                            {t('recent.welcome')}
                        </h2>
                        <p style={{ fontSize: '0.85rem', opacity: 0.6, color: isDark ? '#ccc' : '#666' }}>
                            {t('recent.select_env')}
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            void openFolderDialog();
                        }}
                        style={{
                            backgroundColor: isDark ? '#2d2d2d' : '#fff',
                            border: `1px solid ${isDark ? '#444' : '#ccc'}`,
                            color: isDark ? '#ddd' : '#444',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            margin: '0 auto'
                        }}
                    >
                        <FolderPlus size={16} />
                        {t('file_explorer.open_button')}
                    </button>

                    <div style={{ marginTop: '16px', textAlign: 'left', borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}`, paddingTop: '12px' }}>
                        <RecentEnvironments embedded />
                    </div>
                </div>
            )}

            {openedFolder && (
                <div style={{ borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}` }}>
                    {isCreating && (
                        <div style={{ padding: '8px', background: isDark ? '#252525' : '#fff' }}>
                            <form
                                onSubmit={(e) => {
                                    void handleCreateSubmit(e);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setIsCreating(null);
                                        setNewName('');
                                    }
                                }}
                            >
                                <input
                                    ref={inputRef}
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder={isCreating.type === 'folder'
                                        ? t('file_explorer.new_folder_placeholder')
                                        : t('file_explorer.new_file_placeholder', { ext: isCreating.ext ?? '' })}
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        background: isDark ? '#1a1a1a' : '#f9f9f9',
                                        border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        color: isDark ? '#fff' : '#000',
                                        fontSize: '0.8rem',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreating(null);
                                        setNewName('');
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: isDark ? '#888' : '#666',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '4px'
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </form>
                        </div>
                    )}
                    <div style={{
                        height: DESIGN_TOKENS.RIBBON_WIDTH,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        padding: '0 4px',
                        background: 'transparent'
                    }}>
                        <ActionButton
                            icon={FolderPlus}
                            onClick={() => setIsCreating({ type: 'folder', parentPath: selectedDirPath ?? openedFolder ?? '' })}
                            title={t('file_explorer.actions.new_folder')}
                            label=""
                        />
                        <ActionButton
                            icon={FileCode}
                            color="#f7df1e"
                            onClick={() => setIsCreating({ type: 'file', ext: '.js', parentPath: selectedDirPath ?? openedFolder ?? '' })}
                            title={t('file_explorer.actions.new_js')}
                            label=""
                        />
                        <ActionButton
                            icon={FileCode}
                            color="#3178c6"
                            onClick={() => setIsCreating({ type: 'file', ext: '.ts', parentPath: selectedDirPath ?? openedFolder ?? '' })}
                            title={t('file_explorer.actions.new_ts')}
                            label=""
                        />
                        <ActionButton
                            icon={FileText}
                            color="#0ea5e9"
                            onClick={() => setIsCreating({ type: 'file', ext: '.md', parentPath: selectedDirPath ?? openedFolder ?? '' })}
                            title={t('file_explorer.actions.new_md')}
                            label=""
                        />
                        <ActionButton
                            icon={undefined}
                            label="Block"
                            color="#a855f7"
                            onClick={() => setIsCreating({ type: 'file', ext: '.block', parentPath: selectedDirPath ?? openedFolder ?? '' })}
                            title={t('file_explorer.actions.new_block')}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
