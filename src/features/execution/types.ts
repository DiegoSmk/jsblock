export interface ExecutionSlice {
    executionResults: Map<number, { value: string; type: 'spy' | 'log' }[]>;
    executionErrors: Map<number, string>;
    executionCoverage: Set<number>;
    isSimulating: boolean;
    livePreviewEnabled: boolean;
    runtimeValues: Record<string, unknown>;

    toggleSimulation: () => void;
    runExecution: (customCode?: string, customPath?: string) => void;
    runExecutionDebounced: (customCode?: string, customPath?: string) => void;
    setLivePreviewEnabled: (enabled: boolean) => void;
}
