
import { describe, it, expect } from 'vitest';
import { resolveGitPath, isAbsolutePath } from '../src/utils/pathUtils';

describe('pathUtils', () => {
    describe('isAbsolutePath', () => {
        it('should return true for Unix absolute paths', () => {
            expect(isAbsolutePath('/usr/bin/node')).toBe(true);
            expect(isAbsolutePath('/file.txt')).toBe(true);
        });

        it('should return true for Windows UNC paths', () => {
            expect(isAbsolutePath('\\\\server\\share\\file.txt')).toBe(true);
        });

        it('should return true for Windows drive paths', () => {
            expect(isAbsolutePath('C:\\Windows')).toBe(true);
            expect(isAbsolutePath('D:/Data/file.txt')).toBe(true);
            expect(isAbsolutePath('z:\\file')).toBe(true);
        });

        it('should return true for Windows root relative paths', () => {
            expect(isAbsolutePath('\\Program Files')).toBe(true);
        });

        it('should return false for relative paths', () => {
            expect(isAbsolutePath('file.txt')).toBe(false);
            expect(isAbsolutePath('src/file.txt')).toBe(false);
            expect(isAbsolutePath('.config')).toBe(false);
            expect(isAbsolutePath('folder\\file.txt')).toBe(false);
        });
    });

    describe('resolveGitPath', () => {
        it('should join folder and relative filePath', () => {
            expect(resolveGitPath('/home/user/repo', 'src/index.ts')).toBe('/home/user/repo/src/index.ts');
        });

        it('should handle trailing slash in folder', () => {
            expect(resolveGitPath('/home/user/repo/', 'src/index.ts')).toBe('/home/user/repo/src/index.ts');
        });

        it('should handle backslash in folder', () => {
             // If folder is C:\Repo, filePath is src/index.ts
             // It returns C:\Repo/src/index.ts which is valid in Node/Electron on Windows
             expect(resolveGitPath('C:\\Repo', 'src/index.ts')).toBe('C:\\Repo/src/index.ts');
        });

        it('should return filePath if absolute (Unix)', () => {
            expect(resolveGitPath('/home/user/repo', '/tmp/file.txt')).toBe('/tmp/file.txt');
        });

        it('should return filePath if absolute (Windows)', () => {
            expect(resolveGitPath('C:\\Repo', 'C:\\Other\\file.txt')).toBe('C:\\Other\\file.txt');
            expect(resolveGitPath('C:\\Repo', 'D:/Data/file.txt')).toBe('D:/Data/file.txt');
        });

        it('should return empty string if filePath is empty', () => {
            expect(resolveGitPath('/repo', '')).toBe('');
        });
    });
});
