import { app } from 'electron';
import { PathUtils } from './PathUtils';
import * as path from 'path';

/**
 * Security utility for managing and validating file system access in the Electron main process.
 * This helps prevent unrestricted file system access from a potentially compromised renderer.
 */
export class SecurityUtils {
    private static authorizedRoots: Set<string> = new Set();
    private static isInitialized = false;

    /**
     * Initializes the security utils with default authorized paths.
     */
    private static init() {
        if (this.isInitialized) return;

        try {
            // Pre-authorize the application's user data directory
            const userDataPath = app.getPath('userData');
            if (userDataPath) {
                this.authorizePath(userDataPath);
            }

            // Also authorize the app directory itself
            const appPath = app.getAppPath();
            if (appPath) {
                this.authorizePath(appPath);
            }

            this.isInitialized = true;
        } catch (err) {
            console.error('Failed to initialize SecurityUtils:', err);
        }
    }

    /**
     * Authorizes a root directory for file system operations.
     * @param rootPath The path to authorize.
     */
    static authorizePath(rootPath: string) {
        if (!rootPath) return;
        const normalizedRoot = PathUtils.normalize(rootPath);
        this.authorizedRoots.add(normalizedRoot);
    }

    /**
     * Checks if a path is within any authorized root.
     * @param p The path to check.
     * @returns True if the path is authorized.
     */
    static isPathAuthorized(p: string): boolean {
        this.init();
        if (!p) return false;

        const normalizedPath = PathUtils.normalize(p);

        for (const root of this.authorizedRoots) {
            if (PathUtils.isChildOf(root, normalizedPath)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Validates that a path is authorized, throwing an error if not.
     * @param p The path to validate.
     * @throws Error if access is denied.
     */
    static validatePath(p: string) {
        if (!p) return;

        if (!this.isPathAuthorized(p)) {
            console.error(`SECURITY ALERT: Unauthorized file system access attempt to: ${p}`);
            throw new Error(`Access Denied: The requested path is outside the authorized workspace.`);
        }
    }
}
