
/**
 * Checks if a file path is absolute.
 * Supports Unix-style (starting with /) and Windows-style (Drive letter or UNC).
 */
function isAbsolutePath(filePath: string): boolean {
    if (!filePath) return false;
    // Unix absolute
    if (filePath.startsWith('/')) return true;
    // Windows UNC
    if (filePath.startsWith('\\\\')) return true;
    // Windows Drive Letter (e.g., C:\ or C:/)
    if (/^[a-zA-Z]:[\\/]/.test(filePath)) return true;
    // Windows root relative (e.g., \Users) - treated as absolute for concatenation purposes
    if (filePath.startsWith('\\')) return true;

    return false;
}

/**
 * Resolves the full path for a git file.
 * If the filePath is absolute, it returns it directly.
 * Otherwise, it joins folder and filePath.
 */
export function resolveGitPath(folder: string, filePath: string): string {
    if (!filePath) return '';
    if (isAbsolutePath(filePath)) {
        return filePath;
    }

    if (!folder) return filePath;

    // Normalize folder to remove trailing slash
    const cleanFolder = folder.replace(/[/\\]$/, '');

    // Use forward slash for consistency in internal logic,
    // but if the folder clearly uses backslashes, we might want to respect that.
    // However, Node.js generally handles forward slashes fine on Windows.
    // Git paths often come as forward slashes.

    // If we want to be safe, we can just use template literal with /
    // but if path is win32, maybe we should use \?
    // Let's stick to what GitDiffEditor was doing mostly, but safer.

    return `${cleanFolder}/${filePath}`;
}
