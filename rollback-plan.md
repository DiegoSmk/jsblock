# Rollback Plan

## Refactor: Split Store and App Component

**Risk Level:** Medium
**Impact:** Affects State Management and Main UI Layout.

### Triggers for Rollback
- App fails to load (White Screen of Death).
- Git functionality is broken (cannot fetch, commit, or switch branches).
- State loss on reload (Settings or Sidebar width not persisting).

### Rollback Steps

1. **Revert Git Slice Integration:**
   - Restore `src/store/useStore.ts` to its previous state (monolithic).
   - Delete `src/store/slices/createGitSlice.ts`.
   - Revert `src/types/store.ts` to remove `GitSlice` interface.

2. **Revert App Component:**
   - Restore `src/App.tsx` to include `FlowContent` definition.
   - Delete `src/components/FlowContent.tsx`.

### Feature Flag (Future)
- To feature flag this refactor in the future, we could introduce a `useStoreV2` hook that uses the sliced store, while `useStore` remains the legacy one. Components can switch based on a build-time flag.
