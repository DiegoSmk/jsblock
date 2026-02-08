window.electron = {
    workspace: {
        search: async (query, root, options) => {
            console.log('Search called with:', query);
            if (query === 'test') {
                return [
                    { file: '/root/file1.ts', line: 10, text: 'const test = 1;', matchIndex: 6 },
                    { file: '/root/file1.ts', line: 15, text: 'console.log(test);', matchIndex: 12 },
                    { file: '/root/file2.ts', line: 5, text: 'test function', matchIndex: 0 }
                ];
            }
            return [];
        },
        replace: async () => {},
        onUpdated: () => () => {},
        getTree: async () => [],
        openFolder: async () => ({
            path: '/root',
            tree: [
                { name: 'test.js', path: '/root/test.js', kind: 'file' },
                { name: 'file1.ts', path: '/root/file1.ts', kind: 'file' },
                { name: 'file2.ts', path: '/root/file2.ts', kind: 'file' }
            ]
        })
    },
    fileSystem: {
        checkPathsExists: async () => Promise.resolve({'/root/test.js': true}),
        checkExists: async () => true,
        readFile: async (path) => 'const a = 1;',
        readFiles: async () => Promise.resolve({
            '/root/test.js': 'const a = 1;'
        }),
        readDir: async () => ([
            { name: 'test.js', isDirectory: false },
            { name: 'file1.ts', isDirectory: false },
            { name: 'file2.ts', isDirectory: false }
        ]),
        writeFile: async () => {},
        ensureProjectConfig: async () => {}
    },
    selectFolder: async () => '/root',
    executionStart: () => {},
    onExecutionLog: () => () => {},
    onExecutionError: () => () => {},
    onExecutionStarted: () => () => {},
    onExecutionDone: () => () => {},
    onExecutionClear: () => () => {},
    onSystemStats: () => () => {},
    executionCheckAvailability: async () => ({ node: true, bun: false, deno: false }),
    executionSetRuntime: () => {},
    discoverPlugins: async () => [],
    mcpSyncState: () => {},
    gitCommand: async () => ({ stdout: '', stderr: '' }),
    on: (channel, callback) => () => {}
};
