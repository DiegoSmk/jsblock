import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Command, RefreshCw, Search, Settings, Files, GitBranch, File as FileIcon, Clock } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { FileNode } from '../../features/workspace/types';
import { ScrollArea } from './ScrollArea';

export const CommandPalette: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'commands' | 'files'>('commands');
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const { toggleSidebar, setSidebarTab, workspace, recentFiles, setSelectedFile } = useStore();

    const commands = useMemo(() => [
        {
            id: 'reload',
            label: 'Developer: Reload Window',
            icon: RefreshCw,
            action: () => window.location.reload(),
            shortcut: 'Ctrl+R'
        },
        {
            id: 'settings',
            label: 'Preferences: Open Settings (JSON)',
            icon: Settings,
            action: () => setSidebarTab('settings'),
        },
        {
            id: 'explorer',
            label: 'View: Show Explorer',
            icon: Files,
            action: () => setSidebarTab('explorer'),
        },
        {
            id: 'git',
            label: 'View: Show Git',
            icon: GitBranch,
            action: () => setSidebarTab('git'),
        },
        {
            id: 'toggle_sidebar',
            label: 'View: Toggle Sidebar',
            icon: Command,
            action: () => toggleSidebar(),
        }
    ], [setSidebarTab, toggleSidebar]);

    const allFiles = useMemo(() => {
        const result: { name: string, path: string }[] = [];
        const traverse = (nodes: FileNode[]) => {
            for (const node of nodes) {
                if (!node.isDirectory) {
                    result.push({ name: node.name, path: node.path });
                }
                if (node.children) traverse(node.children);
            }
        };
        traverse(workspace.fileTree);
        return result;
    }, [workspace.fileTree]);

    const filteredItems = useMemo(() => {
        if (mode === 'commands') {
            return commands.filter(cmd =>
                cmd.label.toLowerCase().includes(search.toLowerCase())
            ).map(cmd => ({ ...cmd, path: '' }));
        } else {
            // Files Mode
            if (!search) {
                return recentFiles.slice(0, 5).map(path => {
                    const name = path.split(/[\\/]/).pop() ?? path;
                    return {
                        id: path,
                        label: name,
                        path,
                        icon: Clock,
                        isRecent: true,
                        action: () => setSelectedFile(path),
                        shortcut: undefined
                    };
                });
            }

            // Fuzzy Search
            const searchLower = search.toLowerCase();
            return allFiles.filter(file => {
                const nameLower = file.name.toLowerCase();
                let searchIndex = 0;
                for (const char of nameLower) {
                    if (char === searchLower[searchIndex]) {
                        searchIndex++;
                        if (searchIndex >= searchLower.length) return true;
                    }
                }
                return false;
            }).map(file => ({
                id: file.path,
                label: file.name,
                path: file.path,
                icon: FileIcon,
                action: () => setSelectedFile(file.path),
                shortcut: undefined
            })).slice(0, 50);
        }
    }, [mode, search, commands, recentFiles, allFiles, setSelectedFile]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'p' || e.key === 'P') && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                e.stopPropagation();

                const isShift = e.shiftKey;

                setIsOpen(prev => {
                    // If already open in same mode, close it
                    if (prev && ((isShift && mode === 'commands') || (!isShift && mode === 'files'))) {
                        return false;
                    }
                    // Otherwise open/switch
                    setSearch('');
                    setSelectedIndex(0);
                    setMode(isShift ? 'commands' : 'files');
                    return true;
                });
            }
            if (e.key === 'Escape') setIsOpen(false);
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [mode]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    }, [isOpen]);

    const handleSelect = (item: typeof filteredItems[0]) => {
        item.action();
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: '80px'
            }}
            onClick={() => setIsOpen(false)}
        >
            <div
                style={{
                    width: '600px',
                    backgroundColor: '#1e1e1e',
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    border: '1px solid #333',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Search Bar */}
                <div style={{ padding: '8px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={18} color="#666" />
                    <input
                        ref={inputRef}
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            setSelectedIndex(0);
                        }}
                        placeholder={mode === 'commands' ? "Type a command to run..." : "Type to search files..."}
                        style={{
                            flex: 1,
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#ccc',
                            fontSize: '14px',
                            outline: 'none',
                            padding: '8px 0'
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                                setSelectedIndex(prev => (prev + 1) % filteredItems.length);
                            } else if (e.key === 'ArrowUp') {
                                setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
                            } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
                                handleSelect(filteredItems[selectedIndex]);
                            }
                        }}
                    />
                    <div style={{ fontSize: '10px', color: '#666', border: '1px solid #333', padding: '2px 4px', borderRadius: '4px' }}>
                        {mode === 'commands' ? 'Cmd' : 'File'}
                    </div>
                </div>

                {/* Items List */}
                <ScrollArea maxHeight="400px">
                    <div style={{ padding: '4px' }}>
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleSelect(item)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    style={{
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        cursor: 'pointer',
                                        backgroundColor: selectedIndex === index ? '#2a2d2e' : 'transparent',
                                        borderRadius: '4px',
                                        color: selectedIndex === index ? '#fff' : '#ccc'
                                    }}
                                >
                                    <item.icon size={16} />
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                                        <span style={{ fontSize: '13px' }}>{item.label}</span>
                                        {item.path && mode === 'files' && (
                                            <span style={{ fontSize: '10px', opacity: 0.5, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                                {item.path}
                                            </span>
                                        )}
                                    </div>
                                    {item.shortcut && (
                                        <span style={{ fontSize: '11px', opacity: 0.5 }}>{item.shortcut}</span>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '12px', color: '#666', textAlign: 'center', fontSize: '13px' }}>
                                {mode === 'commands' ? 'No commands found' : 'No files found'}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};
