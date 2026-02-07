# Execution Adapters Contract

This document defines the contract and lifecycle for execution adapters in the AI Code Blueprint system.

## Overview

The `ExecutionManager` uses the Adapter pattern to support multiple JavaScript/TypeScript runtimes (Node.js, Bun, Deno). Each adapter must implement a specific interface and handle runtime-specific telemetry and error mapping.

## The Adapter Interface

Every adapter must implement the `RuntimeAdapter` interface:

```typescript
export interface RuntimeAdapter {
    /** Unique identifier for the runtime (e.g., 'node', 'bun', 'deno') */
    id: string;
    
    /** Human-readable version string or availability check */
    getVersion(): Promise<string>;
    
    /** Executes the provided code and handles telemetry */
    execute(code: string, workingDir: string): Promise<ExecutionResult>;
    
    /** Executes a benchmark of the provided code */
    benchmark(code: string, line: number, workingDir: string): Promise<BenchmarkResult>;
}
```

## Lifecycle of an Execution

1.  **Preparation**: The `ExecutionManager` strips benchmark tags from the code for normal execution.
2.  **Instrumentation**: The code is wrapped with telemetry injection logic (see `TelemetryService.ts`).
3.  **Spawn**: The adapter spawns the runtime process with the instrumented code.
    -   Must use `execFile` or `spawn` for security.
    -   Must capture `stdout` and `stderr` separately.
4.  **Parsing**:
    -   Telemetry data is usually buffered and parsed from specialized JSON logs.
    -   Errors must be mapped to the original line numbers (offsetting any instrumentation overhead).
5.  **Completion**: The adapter returns a unified `ExecutionResult`.

## Benchmark Contract

Benchmarks follow a "multi-run" strategy:
1.  The adapter identifies the code block to benchmark.
2.  It creates a wrapper that executes the block $N$ times.
3.  It calculates:
    -   `avgTime`: Average execution time in milliseconds.
    -   `minTime`: Minimum time.
    -   `maxTime`: Maximum time.
4.  If multiple adapters are enabled, `ExecutionManager` compares the results and flags the `isWinner`.

## Current Implementations

-   [NodeAdapter.ts](file:///home/diego/Documentos/projeto/js+/js-blueprints-electron/electron/adapters/NodeAdapter.ts)
-   [BunAdapter.ts](file:///home/diego/Documentos/projeto/js+/js-blueprints-electron/electron/adapters/BunAdapter.ts)
-   [DenoAdapter.ts](file:///home/diego/Documentos/projeto/js+/js-blueprints-electron/electron/adapters/DenoAdapter.ts)

## Adding a New Adapter

To add a new runtime:
1.  Create a class implementing `RuntimeAdapter`.
2.  Register it in `ExecutionManager.ts`.
3.  Ensure the runtime is added to the `availableRuntimes` check in `executionSlice.ts`.
