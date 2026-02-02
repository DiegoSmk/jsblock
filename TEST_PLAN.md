# Test Plan for Sidebar Refactor

## Objectives
Verify that the new sidebar architecture is robust, deterministic, and performs well.

## Automated Tests
- `src/store/layoutStore.test.ts`: Covers `setSidebarWidth`, `toggleSidebar`, constraints (min/max width), and persistence to `settingsConfig`.
- Run via: `npm run test src/store/layoutStore.test.ts`

## Manual Verification Steps

### 1. Initial State
- Launch the app (`npm run electron:dev`).
- Verify the sidebar is visible on the left.
- Verify it has a default width (approx 300px).

### 2. Resizing
- Hover over the right edge of the sidebar. The cursor should change to `col-resize`.
- Click and drag. The sidebar should resize smoothly.
- **Constraints**: Try to shrink it very small. It should stop at 200px. Try to expand it very wide. It should stop at 800px.
- Release the mouse. The width should stay fixed.

### 3. Navigation Stability (The Fix)
- Click on "Explorer" (Files icon).
- Click on "Function Library" (Network icon).
- Click on "Extensions" (Blocks icon).
- Click on "Git" (Branch icon).
- **Pass Criteria**: The sidebar width MUST NOT change when switching between these tabs. The content inside should adapt or scroll.

### 4. Visibility Toggle
- Click the Sidebar Toggle button (Panel Left icon) in the header (or SideRibbon if applicable).
- The sidebar should disappear.
- The Main Content (Editor/Canvas) should expand to fill the space.
- Click again to show. It should restore to the *same width* as before.

### 5. Settings
- Go to Settings (Gear icon).
- Verify the old "Layout > Sidebar Widths" inputs are gone.
- Toggle "Show App Border" or other settings to ensure Settings view still works.

### 6. Persistence
- Resize the sidebar to a distinct width (e.g., very wide).
- Close the app or reload the window (Ctrl+R).
- **Pass Criteria**: The app should start with the sidebar at the restored width.

### 7. Window Resizing
- Resize the main Electron window.
- Verify the window cannot be shrunk below 800x600 (min size).
- Ensure the sidebar stays at its fixed pixel width while the main content shrinks/grows.
