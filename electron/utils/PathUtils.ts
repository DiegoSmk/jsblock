import * as path from 'path';

/**
 * Utility class for cross-platform path manipulation in the Electron main process.
 */
export class PathUtils {
    /**
     * Normalizes a path to use forward slashes and resolves it to an absolute path.
     * This ensures consistent internal state and prevents path traversal attacks.
     */
    static normalize(p: string): string {
        if (!p) return '';
        try {
            return path.resolve(p).replace(/\\/g, '/');
        } catch {
            // Fallback if path.resolve fails
            return p.replace(/\\/g, '/');
        }
    }

    /**
     * Checks if a child path is within a parent directory.
     */
    static isChildOf(parent: string, child: string): boolean {
        const normalizedParent = this.normalize(parent);
        const normalizedChild = this.normalize(child);

        if (normalizedChild === normalizedParent) return true;

        const prefix = normalizedParent.endsWith('/') ? normalizedParent : normalizedParent + '/';
        return normalizedChild.startsWith(prefix);
    }

    /**
     * Safely joins paths and returns a normalized version.
     */
    static join(...parts: string[]): string {
        return this.normalize(path.join(...parts));
    }

    /**
     * Gets the parent directory of a path.
     */
    static getParent(p: string): string {
        const normalized = this.normalize(p);
        const lastIdx = normalized.lastIndexOf('/');
        if (lastIdx === -1) return '';
        return normalized.substring(0, lastIdx);
    }

    /**
     * Gets the filename or directory name from a path.
     */
    static getName(p: string): string {
        const normalized = this.normalize(p);
        const lastIdx = normalized.lastIndexOf('/');
        return normalized.substring(lastIdx + 1);
    }
}
