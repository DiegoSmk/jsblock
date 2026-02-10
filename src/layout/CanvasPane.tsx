import React from 'react';
import { Box } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ScopeBreadcrumbs } from '../features/editor/components/ScopeBreadcrumbs';
import { FlowContent } from '../features/editor/components/FlowContent';

interface CanvasPaneProps {
    isDark: boolean;
    selectedFile: string | null;
}

/**
 * Canvas/flow visualization pane with breadcrumbs overlay.
 * Extracted from App.tsx — all styles and behavior preserved exactly.
 */
export const CanvasPane: React.FC<CanvasPaneProps> = ({ isDark, selectedFile }) => {
    const { t } = useTranslation();

    return (
        <div style={{ width: '100%', height: '100%', background: isDark ? '#121212' : '#fafafa', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', zIndex: 10, pointerEvents: 'none' }}>
                <div style={{ pointerEvents: 'auto', display: 'inline-block' }}>
                    <ScopeBreadcrumbs />
                </div>
            </div>
            {!selectedFile ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#444' : '#ccc', flexDirection: 'column', gap: '20px' }}>
                    <Box size={64} style={{ opacity: 0.1, color: isDark ? '#fff' : '#000' }} />
                    <p style={{ fontSize: '1.1rem' }}>{t('app.open_folder_hint')}</p>
                </div>
            ) : (
                <FlowContent />
            )}
        </div>
    );
};
