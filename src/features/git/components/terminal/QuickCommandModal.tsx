import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../../../components/ui/Modal';
import { Radio } from '../../../../components/ui/Radio';
import { Zap } from 'lucide-react';

interface QuickCommandModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDark: boolean;
    newCmdLabel: string;
    setNewCmdLabel: (val: string) => void;
    newCmdValue: string;
    setNewCmdValue: (val: string) => void;
    newCmdAutoExecute: boolean;
    setNewCmdAutoExecute: (val: boolean) => void;
    onAdd: () => void;
}

export const QuickCommandModal: React.FC<QuickCommandModalProps> = ({
    isOpen, onClose, isDark,
    newCmdLabel, setNewCmdLabel,
    newCmdValue, setNewCmdValue,
    newCmdAutoExecute, setNewCmdAutoExecute,
    onAdd
}) => {
    const { t } = useTranslation();

    const footer = (
        <>
            <button
                onClick={onClose}
                style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    color: isDark ? '#888' : '#666',
                    border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600
                }}
            >
                {t('git.terminal.modal.cancel')}
            </button>
            <button
                onClick={onAdd}
                disabled={!newCmdLabel.trim() || !newCmdValue.trim()}
                style={{
                    padding: '8px 20px',
                    background: (!newCmdLabel.trim() || !newCmdValue.trim()) ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)'),
                    color: (!newCmdLabel.trim() || !newCmdValue.trim()) ? (isDark ? '#444' : '#999') : (isDark ? '#4fc3f7' : '#0070f3'),
                    border: `1px solid ${(!newCmdLabel.trim() || !newCmdValue.trim()) ? (isDark ? '#333' : '#eee') : (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)')}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    transition: 'all 0.2s'
                }}
            >
                {t('git.terminal.modal.create')}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('git.terminal.modal.title')}
            isDark={isDark}
            headerIcon={<Zap size={16} color={isDark ? '#4fc3f7' : '#0070f3'} />}
            footer={footer}
            maxWidth="400px"
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', display: 'block', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase' }}>{t('git.terminal.modal.name_label')}</label>
                    <input
                        autoFocus
                        placeholder={t('git.terminal.modal.name_placeholder')}
                        value={newCmdLabel}
                        onChange={(e) => setNewCmdLabel(e.target.value)}
                        style={{
                            width: '100%',
                            background: isDark ? '#252525' : '#fff',
                            border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            padding: '10px 12px',
                            color: isDark ? '#fff' : '#000',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', display: 'block', marginBottom: '6px', fontWeight: 700, textTransform: 'uppercase' }}>{t('git.terminal.modal.cmd_label')}</label>
                    <input
                        placeholder={t('git.terminal.modal.cmd_placeholder')}
                        value={newCmdValue}
                        onChange={(e) => setNewCmdValue(e.target.value)}
                        style={{
                            width: '100%',
                            background: isDark ? '#252525' : '#fff',
                            border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            padding: '10px 12px',
                            color: isDark ? '#fff' : '#000',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && onAdd()}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.7rem', color: isDark ? '#666' : '#999', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>{t('git.terminal.modal.interaction_label')}</label>

                    <div
                        onClick={() => setNewCmdAutoExecute(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            borderRadius: '10px',
                            background: newCmdAutoExecute ? (isDark ? 'rgba(79, 195, 247, 0.08)' : 'rgba(0, 112, 243, 0.04)') : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                            border: `1px solid ${newCmdAutoExecute ? (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)') : (isDark ? '#333' : '#eee')}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Radio
                            checked={newCmdAutoExecute}
                            onChange={() => setNewCmdAutoExecute(true)}
                            activeColor={isDark ? '#4fc3f7' : '#0070f3'}
                            isDark={isDark}
                        />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#fff' : '#333', marginBottom: '2px' }}>{t('git.terminal.modal.auto_exec.title')}</div>
                            <div style={{ fontSize: '0.7rem', color: isDark ? '#888' : '#666', lineHeight: '1.4' }}>{t('git.terminal.modal.auto_exec.desc')}</div>
                        </div>
                    </div>

                    <div
                        onClick={() => setNewCmdAutoExecute(false)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            borderRadius: '10px',
                            background: !newCmdAutoExecute ? (isDark ? 'rgba(79, 195, 247, 0.08)' : 'rgba(0, 112, 243, 0.04)') : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                            border: `1px solid ${!newCmdAutoExecute ? (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)') : (isDark ? '#333' : '#eee')}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Radio
                            checked={!newCmdAutoExecute}
                            onChange={() => setNewCmdAutoExecute(false)}
                            activeColor={isDark ? '#4fc3f7' : '#0070f3'}
                            isDark={isDark}
                        />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#fff' : '#333', marginBottom: '2px' }}>{t('git.terminal.modal.fill_only.title')}</div>
                            <div style={{ fontSize: '0.7rem', color: isDark ? '#888' : '#666', lineHeight: '1.4' }}>{t('git.terminal.modal.fill_only.desc')}</div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
