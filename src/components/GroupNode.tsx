
import { useStore } from '../store/useStore';

export const GroupNode = ({ data }: { data: { label: string } }) => {
    const theme = useStore((state) => state.theme);
    const isDark = theme === 'dark';

    return (
        <div style={{
            width: '100%',
            height: '100%',
            padding: '40px 20px 20px 20px',
            border: `2px dashed ${isDark ? '#444' : '#ccc'}`,
            borderRadius: '12px',
            background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            boxSizing: 'border-box',
            pointerEvents: 'none',
            position: 'relative'
        }}>
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '20px',
                fontSize: '0.8rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                color: isDark ? '#666' : '#999',
                letterSpacing: '0.1em'
            }}>
                SCOPE: {data.label}
            </div>
        </div>
    );
};
