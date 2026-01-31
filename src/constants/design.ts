/**
 * Design system constants for JS Block
 * Based on side_ribbon_spec.md and a.md
 */

export const DESIGN_TOKENS = {
    RIBBON_WIDTH: '40px',
    RIBBON_ICON_SIZE: 20,

    // Colors (Common palette used in both ribbons and nodes)
    COLORS: {
        ACCENT: {
            DARK: '#4fc3f7',
            LIGHT: '#0070f3'
        },
        BG: {
            RIBBON: {
                DARK: '#1a1a1a',
                LIGHT: '#e3e5e8'
            },
            CONTEXT_RIBBON: {
                DARK: '#222', // Slightly lighter/darker than main ribbon as per spec
                LIGHT: '#f0f0f0'
            }
        },
        BORDER: {
            DARK: '#2d2d2d',
            LIGHT: '#d1d1d1'
        }
    }
} as const;
