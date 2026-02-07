import type { StateCreator } from 'zustand';
import type { AppState } from '../../../types/store';
import type { BenchmarkSlice, BenchmarkRecord } from '../types';
import type { BenchmarkResult } from '../../../types/electron';

let benchmarkListenersInitialized = false;

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

        if (window.electron) {
            if (!benchmarkListenersInitialized) {
                window.electron.onBenchmarkResult((results: BenchmarkResult[]) => {
                    const currentHistory = get().benchmarkHistory;
                    const newRecord: BenchmarkRecord = {
                        id: Math.random().toString(36).substring(2, 9),
                        timestamp: Date.now(),
                        filePath: get().selectedFile ?? undefined,
                        line: Number(localStorage.getItem('last_bench_line') ?? 0),
                        results
                    };
                    const newHistory = [newRecord, ...currentHistory].slice(0, 50);
                    localStorage.setItem('benchmark_history', JSON.stringify(newHistory));

                    set({
                        benchmarkResults: results,
                        isBenchmarking: false,
                        benchmarkHistory: newHistory
                    });
                });
                benchmarkListenersInitialized = true;
            }

            localStorage.setItem('last_bench_line', String(line));
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
