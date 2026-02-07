export class CodeUtils {
    /**
     * Strips benchmark/performance blocks from the code while preserving line numbers.
     */
    static stripBenchmarkCode(code: string): string {
        const lines = code.split('\n');
        const strippedLines: string[] = [];
        let inBenchmark = false;
        let braceCount = 0;

        for (const line of lines) {
            // Unified regex for benchmark tags
            if (/\/\/\s*@(benchmark|performance|bench)/.test(line)) {
                inBenchmark = true;
                braceCount = 0;
                strippedLines.push(''); // Preserve line number
                continue;
            }

            if (inBenchmark) {
                const openBraces = (line.match(/{/g) ?? []).length;
                const closeBraces = (line.match(/}/g) ?? []).length;

                if (braceCount === 0 && openBraces > 0) {
                    braceCount += openBraces - closeBraces;
                } else if (braceCount > 0) {
                    braceCount += openBraces - closeBraces;
                } else if (line.trim() !== '') {
                    // One-liner after //@benchmark
                    inBenchmark = false;
                }

                if (braceCount <= 0 && (line.includes('}') || (openBraces === 0 && closeBraces === 0 && braceCount === 0))) {
                    inBenchmark = false;
                }

                strippedLines.push(''); // Preserve line number
                continue;
            }

            strippedLines.push(line);
        }

        return strippedLines.join('\n');
    }

    /**
     * Extracts a specific benchmark block for execution.
     */
    static extractBenchmark(code: string, line: number): string {
        const lines = code.split('\n');
        const strippedLines: string[] = [];
        let inCurrentBenchmark = false;
        let inOtherBenchmark = false;
        let braceCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const currentLine = lines[i];
            const isTargetLine = (i + 1) === line;

            if (/\/\/\s*@(benchmark|performance|bench)/.test(currentLine)) {
                if (isTargetLine) {
                    inCurrentBenchmark = true;
                    inOtherBenchmark = false;
                    braceCount = 0;
                    strippedLines.push(currentLine);
                } else {
                    inCurrentBenchmark = false;
                    inOtherBenchmark = true;
                    braceCount = 0;
                    strippedLines.push('');
                }
                continue;
            }

            if (inCurrentBenchmark) {
                const openBraces = (currentLine.match(/{/g) ?? []).length;
                const closeBraces = (currentLine.match(/}/g) ?? []).length;
                braceCount += openBraces - closeBraces;

                if (braceCount <= 0 && (currentLine.includes('}') || (openBraces === 0 && closeBraces === 0 && braceCount === 0))) {
                    inCurrentBenchmark = false;
                }
                strippedLines.push(currentLine);
                continue;
            }

            if (inOtherBenchmark) {
                const openBraces = (currentLine.match(/{/g) ?? []).length;
                const closeBraces = (currentLine.match(/}/g) ?? []).length;
                braceCount += openBraces - closeBraces;

                if (braceCount <= 0 && (currentLine.includes('}') || (openBraces === 0 && closeBraces === 0 && braceCount === 0))) {
                    inOtherBenchmark = false;
                }
                strippedLines.push('');
                continue;
            }

            strippedLines.push(currentLine);
        }

        return strippedLines.join('\n');
    }
}
