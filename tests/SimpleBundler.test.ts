import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bundleCode } from '../src/features/execution/utils/SimpleBundler';

// Mock Blob and URL
global.Blob = vi.fn().mockImplementation((content: unknown[], options?: BlobPropertyBag) => ({ content, options })) as unknown as typeof Blob;
global.URL = {
    createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
    revokeObjectURL: vi.fn(),
} as unknown as typeof URL;

describe('SimpleBundler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should bundle simple code without imports', () => {
        const entryCode = 'console.log("hello");';
        const entryPath = '/project/main.ts';
        const projectFiles = {};

        const result = bundleCode(entryCode, entryPath, projectFiles);

        expect(result.code).toBe(entryCode);
        expect(result.blobs).toHaveLength(0);
    });

    it('should resolve relative imports and create blobs', () => {
        const entryCode = 'import { add } from "./math"; console.log(add(1, 2));';
        const entryPath = '/project/main.ts';
        const projectFiles = {
            '/project/math.ts': 'export const add = (a, b) => a + b;'
        };

        const result = bundleCode(entryCode, entryPath, projectFiles);

        expect(result.code).toContain('blob:mock-url');
        expect(result.blobs).toContain('blob:mock-url');
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    });

    it('should handle recursive imports (nested dependencies)', () => {
        const entryCode = 'import "./a";';
        const entryPath = '/project/main.ts';
        const projectFiles = {
            '/project/a.ts': 'import "./b"; console.log("a");',
            '/project/b.ts': 'console.log("b");'
        };

        const result = bundleCode(entryCode, entryPath, projectFiles);

        expect(result.blobs).toHaveLength(2);
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    });

    it('should prevent infinite loops with circular dependencies', () => {
        const entryCode = 'import "./a";';
        const entryPath = '/project/main.ts';
        const projectFiles = {
            '/project/a.ts': 'import "./b";',
            '/project/b.ts': 'import "./a";'
        };

        const result = bundleCode(entryCode, entryPath, projectFiles);

        // Circular dependency detected, should not crash
        expect(result.blobs).toHaveLength(2);
    });

    it('should ignore non-relative imports', () => {
        const entryCode = 'import { useState } from "react";';
        const entryPath = '/project/main.ts';
        const projectFiles = {};

        const result = bundleCode(entryCode, entryPath, projectFiles);

        expect(result.code).toBe(entryCode);
        expect(result.blobs).toHaveLength(0);
    });
});
