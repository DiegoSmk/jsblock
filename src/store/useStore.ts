import { create } from 'zustand';
import type { AppState } from '../types/store';
import { createGitSlice } from '../features/git/store/slice';
import { createExecutionSlice } from '../features/execution/store/executionSlice';
import { createBenchmarkSlice } from '../features/execution/store/benchmarkSlice';
import { createWorkspaceSlice } from '../features/workspace/store/workspaceSlice';
import { createConfigSlice } from './slices/configSlice';
import { createFlowSlice } from './slices/flowSlice';
import { createUISlice } from './slices/uiSlice';
import { createFileSlice } from './slices/fileSlice';
import { createExtensionSlice } from './slices/extensionSlice';
import { createActionSlice } from './slices/actionSlice';

export const useStore = create<AppState>((set, get, api) => ({
    ...createGitSlice(set, get, api),
    ...createExecutionSlice(set, get, api),
    ...createBenchmarkSlice(set, get, api),
    ...createWorkspaceSlice(set, get, api),
    ...createConfigSlice(set, get, api),
    ...createFlowSlice(set, get, api),
    ...createUISlice(set, get, api),
    ...createFileSlice(set, get, api),
    ...createExtensionSlice(set, get, api),
    ...createActionSlice(set, get, api),
}));
