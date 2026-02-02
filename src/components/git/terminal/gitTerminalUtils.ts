export interface TerminalProgress {
    percent: number;
    label: string;
}

export function parseProgress(data: string, t: (key: string) => string): TerminalProgress | null {
    const percentMatch = /(\d+)%/.exec(data);
    if (percentMatch) {
        const percent = parseInt(percentMatch[1], 10);
        if (percent > 0 || (percent === 0 && data.includes('progress'))) {
            const label = data.includes('npm') ? t('git.terminal.progress.npm') :
                          data.includes('git') ? t('git.terminal.progress.git') :
                          t('git.terminal.progress.default');
            return { percent, label };
        }
    }
    return null;
}

export function parseSuggestion(data: string): string | null {
    if (data.includes('not a git command') || data.includes('The most similar command')) {
        const suggestionMatch = (/The most similar command(?:s)? is\s+([a-z-]+)/.exec(data)) ??
                                (/Did you mean this\?\s+([a-z-]+)/.exec(data));
        return suggestionMatch?.[1] ?? null;
    }
    return null;
}

export function parseCommitHash(data: string): string | null {
    if (data.includes('] ') && (data.includes('create mode') || data.includes('files changed'))) {
        const commitMatch = /\[[a-zA-Z0-9\-_./]+\s+([a-f0-9]+)\]/.exec(data);
        return commitMatch?.[1] ?? null;
    }
    return null;
}

export function parseYesNoPrompt(data: string): boolean {
    return !!(/(?:\(y\/n\)|\(Y\/n\)|\(y\/N\)|\? \[y\/N\]|\[S\/n\]|\[s\/N\]|Are you sure.*y\/n|want to continue\?|quer continuar\?)/i.exec(data));
}
