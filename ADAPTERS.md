# Execution Adapters Contract

This document defines the contract and lifecycle for execution adapters in the AI Code Blueprint system.

## Overview

The `ExecutionManager` uses the Adapter pattern to support multiple JavaScript/TypeScript runtimes (Node.js, Bun, Deno). Each adapter must implement the `IExecutionAdapter` interface and handle runtime-specific execution and error mapping.

## The Adapter Interface

Every adapter must implement the `IExecutionAdapter` interface (defined in [types.ts](file:///home/diego/Documentos/projeto/js+/js-blueprints-electron/electron/execution/types.ts)):

```typescript
export interface IExecutionAdapter {
    id: string;
    
    /** Checks if the runtime is installed and usable */
    isAvailable(): Promise<boolean>;
    
    /** Resolves the absolute path to the runtime executable */
    resolveExecutable(): Promise<string>;
    
    /** Executes the provided code asynchronously */
    execute(code: string, filePath: string): Promise<void>;
    
    /** Forcefully stops the current execution */
    stop(): void;

    /** Event listeners for streaming communication */
    onMessage(callback: (msg: RunnerMessage) => void): void;
    onError(callback: (err: ExecutionError) => void): void;
    onDone(callback: () => void): void;
}
```

## Lifecycle of an Execution

1.  **Preparation**: The `ExecutionManager` calls `stopExecution()` to kill any previous processes.
2.  **Instrumentation**: Code is instrumented via `Instrumenter.ts` to inject spies and coverage helpers.
3.  **Transpilation**: If needed (TS/TSX), `esbuild` converts the code to CJS.
4.  **Spawn**: The adapter spawns a `StdioClientTransport` (MCP) using the resolved executable.
5.  **Steady State**: Telemetry (logs, values, coverage) is streamed back via MCP notifications.
6.  **Cleanup**: When finished (or on error), the temporary `.js` file is deleted from `temp_runs`.

## Current Implementations

-   [NodeAdapter.ts](file:///home/diego/Documentos/projeto/js+/js-blueprints-electron/electron/execution/adapters/NodeAdapter.ts)
-   [BunAdapter.ts](file:///home/diego/Documentos/projeto/js+/js-blueprints-electron/electron/execution/adapters/BunAdapter.ts)
-   [DenoAdapter.ts](file:///home/diego/Documentos/projeto/js+/js-blueprints-electron/electron/execution/adapters/DenoAdapter.ts)

## Adding a New Adapter

To add a new runtime:
1.  Extend `BaseAdapter` or implement `IExecutionAdapter`.
2.  Register the new case in `ExecutionFactory.ts`.
3.  Update `ExecutionManager` and front-end types if a new runtime ID is introduced.
