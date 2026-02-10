/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGlobalEventListeners } from './useGlobalEventListeners';

const mockState = {
    setSidebarTab: vi.fn(),
    saveFile: vi.fn(() => Promise.resolve()),
    layout: { sidebar: { isVisible: false } },
    toggleSidebar: vi.fn(),
    updateSettingsConfig: vi.fn(),
};

vi.mock('../store/useStore', () => ({
    useStore: {
        getState: () => mockState,
    },
}));

describe('useGlobalEventListeners', () => {
    let addEventListenerSpy: any;
    let removeEventListenerSpy: any;

    beforeEach(() => {
        addEventListenerSpy = vi.spyOn(window, 'addEventListener');
        removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should register listeners on mount and unregister on unmount', () => {
        const { unmount } = renderHook(() => useGlobalEventListeners());

        expect(addEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
        expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });

    it('should trigger saveFile on Ctrl+S', () => {
        renderHook(() => useGlobalEventListeners());

        const event = new KeyboardEvent('keydown', {
            key: 's',
            ctrlKey: true,
            metaKey: false,
            bubbles: true
        });

        window.dispatchEvent(event);

        expect(mockState.saveFile).toHaveBeenCalled();
    });

    it('should trigger search on Ctrl+Shift+F', () => {
        renderHook(() => useGlobalEventListeners());

        const event = new KeyboardEvent('keydown', {
            key: 'f',
            ctrlKey: true,
            shiftKey: true,
            bubbles: true
        });

        window.dispatchEvent(event);

        expect(mockState.setSidebarTab).toHaveBeenCalledWith('search');
        expect(mockState.toggleSidebar).toHaveBeenCalled();
    });
});
