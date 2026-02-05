# Tests Added

## Unit Tests

### Git Slice (`src/store/slices/gitSlice.test.ts`)
- `should set git view`: Verifies that `setGitView` updates the store correctly.
- `should initialize git if repo`: Mocks `window.electron.gitCommand` to simulate a valid git repository and checks if `isRepo` and `currentBranch` are updated.

### Commands to Run
```bash
npm test src/store/slices/gitSlice.test.ts
```
