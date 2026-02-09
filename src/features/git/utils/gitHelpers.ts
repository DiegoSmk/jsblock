import React from 'react';
import { Briefcase, User, Sparkles, Smile } from 'lucide-react';

/**
 * Returns the appropriate icon for a Git profile tag.
 */
export const getTagIcon = (tag: string) => {
    switch (tag) {
        case 'work': return React.createElement(Briefcase, { size: 14 });
        case 'personal': return React.createElement(User, { size: 14 });
        case 'ai': return React.createElement(Sparkles, { size: 14 });
        default: return React.createElement(Smile, { size: 14 });
    }
};

/**
 * Returns the color for a Git profile tag based on the theme.
 */
export const getTagColor = (tag: string, dark: boolean) => {
    switch (tag) {
        case 'work': return dark ? '#60a5fa' : '#0070f3';
        case 'personal': return dark ? '#10b981' : '#059669';
        case 'ai': return dark ? '#c084fc' : '#9333ea';
        default: return dark ? '#fbbf24' : '#f59e0b';
    }
};
