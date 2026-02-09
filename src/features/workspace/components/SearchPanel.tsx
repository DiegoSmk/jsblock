import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../../store/useStore';
import { Search, ArrowRight, Replace, Loader2, File, CaseSensitive, Code } from 'lucide-react';
import { SidebarPanel } from '../../../components/ui/SidebarPanel';
import type { SearchResult, SearchOptions } from '../../../types/electron';

export const SearchPanel: React.FC = () => {
    const { theme, openedFolder, setSelectedFile, settings } = useStore();
    const isDark = theme === 'dark';

    const [query, setQuery] = useState('');
    const [replaceQuery, setReplaceQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showReplace, setShowReplace] = useState(false);
    const [options, setOptions] = useState<SearchOptions>({
        caseSensitive: false,
        regex: false,
        maxDepth: settings?.searchMaxDepth ?? 50,
        maxFileSize: (settings?.searchMaxFileSize ?? 1) * 1024 * 1024 // Convert MB to Bytes
    });
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setOptions(prev => ({
            ...prev,
            maxDepth: settings?.searchMaxDepth ?? 50,
            maxFileSize: (settings?.searchMaxFileSize ?? 1) * 1024 * 1024 // Convert MB to Bytes
        }));
    }, [settings?.searchMaxDepth, settings?.searchMaxFileSize]);

    useEffect(() => {
        // Focus search input when panel is mounted
        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 50);
    }, []);

    const handleSearch = async () => {
        if (!query.trim() || !openedFolder) return;

        setIsSearching(true);
        setResults([]);

        try {
            const found = await window.electron.workspace.search(query, openedFolder, options);
            setResults(found);

            // Expand all by default if few results
            if (found.length < 50) {
                const files = new Set(found.map(r => r.file));
                setExpandedFiles(files);
            }
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleReplace = async () => {
        if (!query.trim() || !openedFolder) return;

        const confirm = window.confirm(`Replace "${query}" with "${replaceQuery}" in ${results.length} occurrences?`);
        if (!confirm) return;

        setIsSearching(true);
        try {
            await window.electron.workspace.replace(query, replaceQuery, openedFolder, options);
            await handleSearch(); // Refresh results
        } catch (err) {
            console.error('Replace failed:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            void handleSearch();
        }
    };

    const toggleFile = (filePath: string) => {
        const newExpanded = new Set(expandedFiles);
        if (newExpanded.has(filePath)) {
            newExpanded.delete(filePath);
        } else {
            newExpanded.add(filePath);
        }
        setExpandedFiles(newExpanded);
    };

    const openResult = (result: SearchResult) => {
        void setSelectedFile(result.file);
        // Ideally scroll to line, but setSelectedFile just opens it.
        // We might need a way to pass line number to openFile.
        // For now, at least we open the file.
    };

    // Group results by file
    const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.file]) {
            acc[result.file] = [];
        }
        acc[result.file].push(result);
        return acc;
    }, {} as Record<string, SearchResult[]>);

    return (
        <SidebarPanel title="Search" icon={Search} isDark={isDark}>
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Search Input */}
                <div style={{ position: 'relative' }}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search"
                        style={{
                            width: '100%',
                            padding: '6px 28px 6px 8px',
                            background: isDark ? '#2d2d2d' : '#f0f0f0',
                            border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                            borderRadius: '4px',
                            color: isDark ? '#eee' : '#333',
                            outline: 'none'
                        }}
                    />
                    <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '2px' }}>
                        <button
                            onClick={() => setOptions(o => ({ ...o, caseSensitive: !o.caseSensitive }))}
                            title="Match Case"
                            style={{
                                background: options.caseSensitive ? (isDark ? '#4fc3f722' : '#0070f322') : 'transparent',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                padding: '2px',
                                color: options.caseSensitive ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#666' : '#999')
                            }}
                        >
                            <CaseSensitive size={14} />
                        </button>
                        <button
                            onClick={() => setOptions(o => ({ ...o, regex: !o.regex }))}
                            title="Use Regular Expression"
                            style={{
                                background: options.regex ? (isDark ? '#4fc3f722' : '#0070f322') : 'transparent',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                padding: '2px',
                                color: options.regex ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#666' : '#999')
                            }}
                        >
                            <Code size={14} />
                        </button>
                    </div>
                </div>

                {/* Replace Input Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                        onClick={() => setShowReplace(!showReplace)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: isDark ? '#888' : '#666',
                            padding: 0
                        }}
                    >
                        {showReplace ? <ArrowRight size={12} style={{ transform: 'rotate(90deg)' }} /> : <ArrowRight size={12} />}
                    </button>
                    <span style={{ fontSize: '12px', color: isDark ? '#888' : '#666', userSelect: 'none' }}>Replace</span>
                </div>

                {showReplace && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <input
                            type="text"
                            value={replaceQuery}
                            onChange={(e) => setReplaceQuery(e.target.value)}
                            placeholder="Replace"
                            style={{
                                flex: 1,
                                padding: '6px 8px',
                                background: isDark ? '#2d2d2d' : '#f0f0f0',
                                border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                borderRadius: '4px',
                                color: isDark ? '#eee' : '#333',
                                outline: 'none'
                            }}
                        />
                        <button
                            onClick={() => void handleReplace()}
                            disabled={isSearching}
                            title="Replace All"
                            style={{
                                background: isDark ? '#2d2d2d' : '#f0f0f0',
                                border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: isDark ? '#eee' : '#333',
                                padding: '0 8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Replace size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Results List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px 10px' }}>
                {isSearching ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px', color: isDark ? '#666' : '#999' }}>
                        <Loader2 className="animate-spin" />
                    </div>
                ) : (
                    <>
                        {results.length > 0 && (
                            <div style={{ fontSize: '12px', color: isDark ? '#888' : '#666', marginBottom: '8px' }}>
                                {results.length} result{results.length !== 1 && 's'} in {Object.keys(groupedResults).length} file{Object.keys(groupedResults).length !== 1 && 's'}
                            </div>
                        )}

                        {Object.entries(groupedResults).map(([file, fileResults]) => {
                            const fileName = file.split(/[\\/]/).pop();
                            const isExpanded = expandedFiles.has(file);

                            return (
                                <div key={file} style={{ marginBottom: '8px' }}>
                                    <div
                                        onClick={() => toggleFile(file)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            borderRadius: '4px',
                                            background: isDark ? '#252525' : '#e5e5e5',
                                            fontSize: '13px',
                                            fontWeight: 500
                                        }}
                                    >
                                        <ArrowRight size={12} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.1s' }} />
                                        <File size={14} />
                                        <span title={file} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '11px', color: isDark ? '#888' : '#666', background: isDark ? '#333' : '#ddd', padding: '0 4px', borderRadius: '4px' }}>
                                            {fileResults.length}
                                        </span>
                                    </div>

                                    {isExpanded && (
                                        <div style={{ marginLeft: '12px', borderLeft: `1px solid ${isDark ? '#333' : '#ddd'}` }}>
                                            {fileResults.map((result) => (
                                                <div
                                                    key={`${result.file}-${result.line}-${result.matchIndex}`}
                                                    onClick={() => openResult(result)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        fontFamily: 'monospace',
                                                        color: isDark ? '#aaa' : '#555',
                                                        borderBottom: `1px solid ${isDark ? '#252525' : '#f5f5f5'}`,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#2a2a2a' : '#f0f0f0'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <span style={{ color: isDark ? '#666' : '#999', marginRight: '8px' }}>{result.line}:</span>
                                                    {result.text}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </SidebarPanel>
    );
};
