import type { StateCreator } from 'zustand';
import type { AppState } from '../../../types/store';
import type { BenchmarkSlice, BenchmarkRecord } from '../types';

export const createBenchmarkSlice: StateCreator<AppState, [], [], BenchmarkSlice> = (set, get) => ({
    isBenchmarking: false,
    benchmarkResults: null,
    benchmarkHistory: (() => {
        try {
            const raw = localStorage.getItem('benchmark_history');
            if (!raw) return [];
            const data = JSON.parse(raw) as unknown;
            return Array.isArray(data) ? (data as BenchmarkRecord[]) : [];
        } catch (e) {
            console.error('Failed to parse benchmark_history', e);
            return [];
        }
    })(),

    runBenchmark: async (code: string, line: number) => {
        const { selectedFile } = get();
        localStorage.setItem('last_bench_line', String(line));
        if (window.electron) {
            set({ isBenchmarking: true, benchmarkResults: null });
            window.electron.benchmarkStart(code, line, selectedFile ?? undefined);
        }
        return Promise.resolve();
    },

    setBenchmarkResults: (results) => set({ benchmarkResults: results }),

    clearBenchmarkHistory: () => {
        localStorage.removeItem('benchmark_history');
        set({ benchmarkHistory: [] });
    },

    removeBenchmarkRecord: (id: string) => {
        const newHistory = get().benchmarkHistory.filter(r => r.id !== id);
        localStorage.setItem('benchmark_history', JSON.stringify(newHistory));
        set({ benchmarkHistory: newHistory });
    },
});
