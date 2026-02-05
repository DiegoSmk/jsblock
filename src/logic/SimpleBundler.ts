
export const bundleCode = (
    entryCode: string,
    entryPath: string,
    projectFiles: Record<string, string>
): { code: string; blobs: string[] } => {
    const blobs: string[] = [];
    const processedFiles = new Map<string, string>(); // absolutePath -> blobUrl

    // Helper: Normalize path to be absolute within the project structure
    // We assume all paths in projectFiles are absolute or consistent with entryPath mechanism
    // But entryPath might be '/home/user/project/file.ts'

    const resolvePath = (basePath: string, relativePath: string): string | null => {
        try {
            // Simple path resolution for "virtual" file system
            const baseDir = basePath.substring(0, basePath.lastIndexOf('/'));
            const parts = relativePath.split('/');
            const stack = baseDir.split('/').filter(Boolean); // absolute path has empty string at start

            for (const part of parts) {
                if (part === '.' || part === '') continue;
                if (part === '..') {
                    if (stack.length > 0) stack.pop();
                } else {
                    stack.push(part);
                }
            }

            const resolved = '/' + stack.join('/');

            // Try extensions
            if (projectFiles[resolved]) return resolved;
            if (projectFiles[resolved + '.ts']) return resolved + '.ts';
            if (projectFiles[resolved + '.js']) return resolved + '.js';
            if (projectFiles[resolved + '.tsx']) return resolved + '.tsx';

            return null;
        } catch {
            return null;
        }
    };

    const visiting = new Set<string>();

    const processFileContent = (path: string, content: string): string => {
        if (visiting.has(path)) return content; // Cycle detected
        visiting.add(path);

        // Recursive replacer
        // Match: import ... from '...'
        // or: export ... from '...'

        // We only care about the source string in quotes
        // Handles: import X from "Y"; import {X} from "Y"; export {X} from "Y"; import "Y";

        const result = content.replace(/((?:import|export)\s+(?:(?:[\w\s{},*]*)\s+from\s+)?['"])(.*?)(['"])/g, (match: string, prefix: string, importPath: string, suffix: string) => {
            if (!importPath.startsWith('.')) return match; // External import? Ignore or handle via CDN?

            const resolvedPath = resolvePath(path, importPath);
            if (resolvedPath && projectFiles[resolvedPath]) {
                if (!processedFiles.has(resolvedPath)) {
                    // Recursively process the child file first
                    if (visiting.has(resolvedPath)) {
                        // Cycle detected during dependency resolution
                        // We can't resolve this yet.
                        return match;
                    }

                    const childContent = processFileContent(resolvedPath, projectFiles[resolvedPath]);
                    const blob = new Blob([childContent], { type: 'text/javascript' });
                    const blobUrl = URL.createObjectURL(blob);
                    blobs.push(blobUrl);
                    processedFiles.set(resolvedPath, blobUrl);
                }

                const blobUrl = processedFiles.get(resolvedPath);
                return `${prefix}${blobUrl}${suffix}`;
            }

            return match;
        });

        visiting.delete(path);
        return result;
    };

    // Process entry code. It's not in projectFiles necessarily (it's the buffer code).
    // We treat it as if it's at entryPath.
    const finalCode = processFileContent(entryPath, entryCode);

    return { code: finalCode, blobs };
};
