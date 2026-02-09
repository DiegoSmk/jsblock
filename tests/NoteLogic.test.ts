import { describe, it, expect } from 'vitest';
import { detectTasksFromMarkdown } from '../src/features/editor/nodes/NoteNode/noteUtils';

describe('NoteNode Utilities', () => {
    describe('detectTasksFromMarkdown', () => {
        it('should detect a single unchecked task', () => {
            const text = '- [ ] Buy milk';
            const tasks = detectTasksFromMarkdown(text);
            expect(tasks).toHaveLength(1);
            expect(tasks![0]).toEqual({
                fullMatch: '- [ ] Buy milk',
                checked: false,
                label: 'Buy milk'
            });
        });

        it('should detect a single checked task', () => {
            const text = '- [x] Clean room';
            const tasks = detectTasksFromMarkdown(text);
            expect(tasks).toHaveLength(1);
            expect(tasks![0].checked).toBe(true);
            expect(tasks![0].label).toBe('Clean room');
        });

        it('should detect multiple tasks among other text', () => {
            const text = `
# My Tasks
Some intro text.
- [ ] Task 1
Middle text.
- [x] Task 2
Done.
            `;
            const tasks = detectTasksFromMarkdown(text);
            expect(tasks).toHaveLength(2);
            expect(tasks![0].label).toBe('Task 1');
            expect(tasks![1].label).toBe('Task 2');
        });

        it('should handle indentation', () => {
            const text = '  - [ ] Indented task';
            const tasks = detectTasksFromMarkdown(text);
            expect(tasks).toHaveLength(1);
            expect(tasks![0].label).toBe('Indented task');
        });

        it('should return null if no tasks found', () => {
            const text = 'Just some text without tasks.';
            const tasks = detectTasksFromMarkdown(text);
            expect(tasks).toBeNull();
        });

        it('should not match malformed tasks', () => {
            const malformed = [
                '-[] No space',
                '- [  ] Too many spaces',
                '* [ ] Wrong bullet',
                '[ ] Missing bullet'
            ];
            malformed.forEach(text => {
                expect(detectTasksFromMarkdown(text)).toBeNull();
            });
        });
    });
});
