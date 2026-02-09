
import { describe, it, expect } from 'vitest';
import { resolveGitPath } from '../src/utils/pathUtils';

describe('pathUtils', () => {
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
            expect(resolveGitPath('C:\\Repo', 'z:\\file')).toBe('z:\\file');
        });

        it('should return filePath if it is a Windows UNC path', () => {
            expect(resolveGitPath('C:\\Repo', '\\\\server\\share\\file.txt')).toBe('\\\\server\\share\\file.txt');
        });

        it('should return filePath if it is a Windows root relative path', () => {
            expect(resolveGitPath('C:\\Repo', '\\Program Files')).toBe('\\Program Files');
        });

        it('should return empty string if filePath is empty', () => {
            expect(resolveGitPath('/repo', '')).toBe('');
        });
    });
});
