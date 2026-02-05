import React, { useState, useEffect, useRef } from 'react';
import { Command, RefreshCw, Search, Settings, Files, GitBranch } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const CommandPalette: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const { toggleSidebar, setSidebarTab } = useStore();

    const commands = [
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
    ];

    const filteredCommands = commands.filter(cmd =>
        cmd.label.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'P' && e.ctrlKey && e.shiftKey) {
                e.preventDefault();
                setIsOpen(prev => {
                    const next = !prev;
                    if (next) {
                        setSearch('');
                        setSelectedIndex(0);
                    }
                    return next;
                });
            }
            if (e.key === 'Escape') setIsOpen(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    }, [isOpen]);

    const handleSelect = (cmd: typeof commands[0]) => {
        cmd.action();
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
                    overflow: 'hidden'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Search Bar */}
                <div style={{ padding: '8px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={18} color="#666" />
                    <input
                        ref={inputRef}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Type a command to run..."
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
                                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
                            } else if (e.key === 'ArrowUp') {
                                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
                            } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
                                handleSelect(filteredCommands[selectedIndex]);
                            }
                        }}
                    />
                </div>

                {/* Commands List */}
                <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '4px' }}>
                    {filteredCommands.length > 0 ? (
                        filteredCommands.map((cmd, index) => (
                            <div
                                key={cmd.id}
                                onClick={() => handleSelect(cmd)}
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
                                <cmd.icon size={16} />
                                <span style={{ flex: 1, fontSize: '13px' }}>{cmd.label}</span>
                                {cmd.shortcut && (
                                    <span style={{ fontSize: '11px', opacity: 0.5 }}>{cmd.shortcut}</span>
                                )}
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '12px', color: '#666', textAlign: 'center', fontSize: '13px' }}>
                            No commands found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
