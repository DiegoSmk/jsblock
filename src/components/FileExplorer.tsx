import React, { useState, useEffect, useRef } from 'react';
import { Folder, File, ChevronRight, ChevronDown, FileCode, FolderOpen, Save, FileText, Box, FolderPlus, X } from 'lucide-react';
import 'allotment/dist/style.css';
import { useStore } from '../store/useStore';

interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    isOpen?: boolean;
    children?: FileEntry[];
}

export const FileExplorer: React.FC = () => {
    const { openedFolder, setOpenedFolder, selectedFile, setSelectedFile, saveFile, theme } = useStore();
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [isCreating, setIsCreating] = useState<{ type: 'file' | 'folder', ext?: string } | null>(null);
    const [newName, setNewName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const isDark = theme === 'dark';

    const loadFiles = async (dirPath: string): Promise<FileEntry[]> => {
        if (!(window as any).electronAPI) return [];
        const result = await (window as any).electronAPI.readDir(dirPath);
        const ignored = ['.git', '.vscode', 'node_modules', '.block'];
        return result
            .filter((file: any) => !ignored.includes(file.name))
            .sort((a: any, b: any) => {
                if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
                return a.isDirectory ? -1 : 1;
            });
    };

    useEffect(() => {
        if (openedFolder) {
            if (openedFolder.endsWith('/.block') || openedFolder.endsWith('\\.block')) {
                setOpenedFolder(null);
                return;
            }
            loadFiles(openedFolder).then(setFiles);
        }
    }, [openedFolder]);

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
        const newFiles = await toggleFolder(path, files);
        setFiles(newFiles);
    };

    const handleFileClick = (path: string) => {
        if (path.endsWith('.js') || path.endsWith('.ts') || path.endsWith('.md') || path.endsWith('.block')) {
            setSelectedFile(path);
        }
    };

    const handleCreateSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newName || !openedFolder || !isCreating) {
            setIsCreating(null);
            setNewName('');
            return;
        }

        try {
            if (isCreating.type === 'folder') {
                const dirPath = `${openedFolder}/${newName}`;
                await (window as any).electronAPI.createDirectory(dirPath);
            } else {
                const ext = isCreating.ext || '';
                const fileName = newName.endsWith(ext) ? newName : `${newName}${ext}`;
                const filePath = `${openedFolder}/${fileName}`;
                let initialContent = '';
                if (ext === '.block') initialContent = `// JS Block - Nova nota de código\n\n`;
                if (ext === '.md') initialContent = `# ${newName}\n\n`;
                await (window as any).electronAPI.createFile(filePath, initialContent);
                setSelectedFile(filePath);
            }
            const updated = await loadFiles(openedFolder);
            setFiles(updated);
        } catch (err) {
            alert('Erro: ' + err);
        } finally {
            setIsCreating(null);
            setNewName('');
        }
    };

    const openFolderDialog = async () => {
        if (!(window as any).electronAPI) return;
        const path = await (window as any).electronAPI.selectFolder();
        if (path) {
            setOpenedFolder(path);
        }
    };

    const renderTree = (nodes: FileEntry[], depth = 0) => {
        return nodes.map((node) => (
            <div key={node.path}>
                <div
                    onClick={() => node.isDirectory ? handleFolderClick(node.path) : handleFileClick(node.path)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px 8px',
                        paddingLeft: `${depth * 12 + 8}px`,
                        cursor: 'pointer',
                        backgroundColor: selectedFile === node.path ? (isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(0, 112, 243, 0.05)') : 'transparent',
                        color: selectedFile === node.path ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#ccc' : '#444'),
                        fontSize: '0.85rem',
                        transition: 'background 0.2s',
                        borderRadius: '4px',
                        margin: '1px 4px'
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
                                <File size={16} style={{ marginRight: 8, opacity: 0.6 }} />
                            )}
                        </>
                    )}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
                </div>
                {node.isDirectory && node.isOpen && node.children && renderTree(node.children, depth + 1)}
            </div>
        ));
    };

    const ActionButton = ({ icon: Icon, color, onClick, title, label }: any) => (
        <button
            onClick={onClick}
            title={title}
            style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: color || (isDark ? '#888' : '#666'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '6px',
                transition: 'all 0.2s',
                flex: 1
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                e.currentTarget.style.color = color || (isDark ? '#fff' : '#000');
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = color || (isDark ? '#888' : '#666');
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
            backgroundColor: isDark ? '#1e1e1e' : '#f3f4f6',
            borderRight: `1px solid ${isDark ? '#333' : '#e5e7eb'}`
        }}>
            <div style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
                    Explorador
                </span>
                {selectedFile && (
                    <button
                        onClick={saveFile}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#aaa' : '#666', padding: 4 }}
                        title="Salvar (Ctrl+S)"
                    >
                        <Save size={14} />
                    </button>
                )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                {openedFolder ? renderTree(files) : (
                    <div style={{ padding: '24px', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.85rem', opacity: 0.5, marginBottom: '16px' }}>Nenhuma pasta aberta</p>
                        <button
                            onClick={openFolderDialog}
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
                            Abrir Pasta
                        </button>
                    </div>
                )}
            </div>

            {openedFolder && (
                <div style={{ borderTop: `1px solid ${isDark ? '#333' : '#e5e7eb'}` }}>
                    {isCreating && (
                        <div style={{ padding: '8px', background: isDark ? '#252525' : '#fff' }}>
                            <form
                                onSubmit={handleCreateSubmit}
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
                                    placeholder={isCreating.type === 'folder' ? "Nome da pasta..." : `Nome do arquivo${isCreating.ext || ''}...`}
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
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        padding: '0 4px',
                        background: 'transparent'
                    }}>
                        <ActionButton
                            icon={FolderPlus}
                            onClick={() => setIsCreating({ type: 'folder' })}
                            title="Nova Pasta"
                        />
                        <ActionButton
                            icon={FileCode}
                            color="#f7df1e"
                            onClick={() => setIsCreating({ type: 'file', ext: '.js' })}
                            title="Novo JS"
                        />
                        <ActionButton
                            icon={FileCode}
                            color="#3178c6"
                            onClick={() => setIsCreating({ type: 'file', ext: '.ts' })}
                            title="Novo TS"
                        />
                        <ActionButton
                            icon={FileText}
                            color="#0ea5e9"
                            onClick={() => setIsCreating({ type: 'file', ext: '.md' })}
                            title="Nova Nota MD"
                        />
                        <ActionButton
                            label="BLK"
                            color="#a855f7"
                            onClick={() => setIsCreating({ type: 'file', ext: '.block' })}
                            title="Novo Bloco (.block)"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
