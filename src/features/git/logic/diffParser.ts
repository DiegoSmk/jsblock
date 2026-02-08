export interface DiffRange {
    startLine: number;
    endLine: number;
    type: 'added' | 'modified' | 'deleted';
}

export function parseGitDiff(diffOutput: string): DiffRange[] {
    const ranges: DiffRange[] = [];
    const lines = diffOutput.split('\n');

    let currentNewStart = 0;

    for (const line of lines) {
        if (line.startsWith('@@')) {
            // @@ -old_start,old_count +new_start,new_count @@
            const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
            if (match) {
                const oldStart = parseInt(match[1], 10);
                const oldCount = match[2] ? parseInt(match[2], 10) : 1;
                const newStart = parseInt(match[3], 10);
                const newCount = match[4] ? parseInt(match[4], 10) : 1;

                currentNewStart = newStart;

                if (oldCount === 0 && newCount > 0) {
                    // Added
                    ranges.push({
                        startLine: newStart,
                        endLine: newStart + newCount - 1,
                        type: 'added'
                    });
                } else if (oldCount > 0 && newCount === 0) {
                    // Deleted
                    // Mark at the line before, or the line itself if it exists
                    // Actually, deleted means content is gone. We show a marker at newStart.
                    // If newCount is 0, the line at newStart exists (it's the context or next line).
                    ranges.push({
                        startLine: newStart,
                        endLine: newStart,
                        type: 'deleted'
                    });
                } else {
                    // Modified (or mixed add/delete)
                    // For simplicity, treat as modified
                    ranges.push({
                        startLine: newStart,
                        endLine: newStart + newCount - 1,
                        type: 'modified'
                    });
                }
            }
        }
    }

    return ranges;
}
