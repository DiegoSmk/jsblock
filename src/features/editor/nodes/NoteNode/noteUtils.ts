export interface DetectedTask {
    label: string;
    checked: boolean;
    fullMatch: string;
}

export const detectTasksFromMarkdown = (text: string): DetectedTask[] | null => {
    const taskRegex = /^\s*- \[(x| )\] (.*)$/gm;
    const matches = [...text.matchAll(taskRegex)];

    if (matches.length > 0) {
        return matches.map(match => ({
            fullMatch: match[0],
            checked: match[1] === 'x',
            label: match[2]
        }));
    }
    return null;
};
