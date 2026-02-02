// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from './useStore';

describe('Layout Store', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset store state
    useStore.setState({
      layout: {
        sidebar: {
          width: 300,
          isVisible: true
        }
      },
      settingsConfig: JSON.stringify({
          appearance: { theme: 'dark', showAppBorder: false },
          layout: { sidebar: { width: 300 } },
          editor: { fontSize: 14, autoLayoutNodes: false },
          terminal: { copyOnSelect: true, rightClickPaste: true },
          files: { autoSave: false }
      })
    });
  });

  it('should initialize with default values', () => {
    const { layout } = useStore.getState();
    // Default might be read from localStorage (empty -> default code path)
    // In beforeEach we reset it.
    expect(layout.sidebar.width).toBe(300);
    expect(layout.sidebar.isVisible).toBe(true);
  });

  it('should update sidebar width', () => {
    const { setSidebarWidth } = useStore.getState();

    setSidebarWidth(400);
    expect(useStore.getState().layout.sidebar.width).toBe(400);
  });

  it('should constrain sidebar width', () => {
    const { setSidebarWidth } = useStore.getState();

    setSidebarWidth(100); // Below min (200)
    expect(useStore.getState().layout.sidebar.width).toBe(200);

    setSidebarWidth(1000); // Above max (800)
    expect(useStore.getState().layout.sidebar.width).toBe(800);
  });

  it('should toggle sidebar visibility', () => {
    const { toggleSidebar } = useStore.getState();

    toggleSidebar();
    expect(useStore.getState().layout.sidebar.isVisible).toBe(false);

    toggleSidebar();
    expect(useStore.getState().layout.sidebar.isVisible).toBe(true);

    toggleSidebar(false);
    expect(useStore.getState().layout.sidebar.isVisible).toBe(false);
  });

  it('should persist width to settingsConfig', () => {
    vi.useFakeTimers();
    const { setSidebarWidth } = useStore.getState();

    setSidebarWidth(450);

    // Fast forward time (debounce is 500ms)
    vi.advanceTimersByTime(1000);

    const config = JSON.parse(useStore.getState().settingsConfig);
    expect(config.layout.sidebar.width).toBe(450);
    vi.useRealTimers();
  });
});
