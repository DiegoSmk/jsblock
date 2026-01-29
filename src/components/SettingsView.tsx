import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
    Terminal,
    Monitor,
    MousePointer2,
    Type,
    Save,
    CircleHelp,
    ChevronRight,
    Settings as SettingsIcon,
    Layout,
    Sun,
    Moon
} from 'lucide-react';

export const SettingsView: React.FC = () => {
    const {
        theme,
        toggleTheme,
        settings,
        updateSettings,
        autoSave,
        toggleAutoSave
    } = useStore();

    const [activeCategory, setActiveCategory] = useState<'general' | 'terminal' | 'appearance'>('general');
    const isDark = theme === 'dark';

    const categories = [
        { id: 'general', label: 'Geral', icon: SettingsIcon },
        { id: 'terminal', label: 'Terminal', icon: Terminal },
        { id: 'appearance', label: 'Aparência', icon: Monitor }
    ];

    const SettingGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <div style={{ marginBottom: '32px' }}>
            <h3 style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: isDark ? '#555' : '#aaa',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                {title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: isDark ? '#2d2d2d' : '#e5e7eb', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${isDark ? '#2d2d2d' : '#e5e7eb'}` }}>
                {children}
            </div>
        </div>
    );

    const SettingRow = ({ label, description, children, icon: Icon }: { label: string, description?: string, children: React.ReactNode, icon?: any }) => (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: isDark ? '#1a1a1a' : '#fff',
            transition: 'background 0.2s'
        }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {Icon && <div style={{ color: isDark ? '#666' : '#999' }}><Icon size={18} /></div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isDark ? '#eee' : '#111' }}>{label}</span>
                    {description && <span style={{ fontSize: '0.75rem', color: isDark ? '#666' : '#999' }}>{description}</span>}
                </div>
            </div>
            <div>
                {children}
            </div>
        </div>
    );

    const Switch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
        <button
            onClick={onChange}
            style={{
                width: '36px',
                height: '20px',
                backgroundColor: checked ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#333' : '#e5e7eb'),
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                padding: 0
            }}
        >
            <div style={{
                position: 'absolute',
                top: '2px',
                left: checked ? '18px' : '2px',
                width: '16px',
                height: '16px',
                backgroundColor: '#fff',
                borderRadius: '50%',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
        </button>
    );

    const renderContent = () => {
        switch (activeCategory) {
            case 'general':
                return (
                    <>
                        <SettingGroup title="Arquivos">
                            <SettingRow
                                label="Salvamento Automático"
                                description="Salva as alterações nos arquivos instantaneamente ao editar."
                                icon={Save}
                            >
                                <Switch checked={autoSave} onChange={toggleAutoSave} />
                            </SettingRow>
                        </SettingGroup>
                        <SettingGroup title="Canvas">
                            <SettingRow
                                label="Auto-Layout"
                                description="Organiza os nós automaticamente ao gerar código do canvas."
                                icon={Layout}
                            >
                                <Switch
                                    checked={settings.autoLayoutNodes}
                                    onChange={() => updateSettings({ autoLayoutNodes: !settings.autoLayoutNodes })}
                                />
                            </SettingRow>
                        </SettingGroup>
                    </>
                );
            case 'terminal':
                return (
                    <>
                        <SettingGroup title="Comportamento">
                            <SettingRow
                                label="Cópia Automática"
                                description="Copia o texto selecionado automaticamente para a área de transferência."
                                icon={MousePointer2}
                            >
                                <Switch
                                    checked={settings.terminalCopyOnSelect}
                                    onChange={() => updateSettings({ terminalCopyOnSelect: !settings.terminalCopyOnSelect })}
                                />
                            </SettingRow>
                            <SettingRow
                                label="Colar com Botão Direito"
                                description="Cola o conteúdo da área de transferência ao clicar com o botão direito no terminal."
                                icon={MousePointer2}
                            >
                                <Switch
                                    checked={settings.terminalRightClickPaste}
                                    onChange={() => updateSettings({ terminalRightClickPaste: !settings.terminalRightClickPaste })}
                                />
                            </SettingRow>
                        </SettingGroup>
                        <div style={{
                            padding: '16px',
                            background: isDark ? 'rgba(79, 195, 247, 0.05)' : 'rgba(0, 112, 243, 0.05)',
                            borderRadius: '12px',
                            border: `1px dashed ${isDark ? 'rgba(79, 195, 247, 0.2)' : 'rgba(0, 112, 243, 0.2)'}`,
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start'
                        }}>
                            <CircleHelp size={18} color={isDark ? '#4fc3f7' : '#0070f3'} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div style={{ fontSize: '0.8rem', color: isDark ? '#aaa' : '#666', lineHeight: 1.5 }}>
                                Estas opções estão ativadas por padrão para emular o comportamento de terminais profissionais (como Putty/XShell) e contornar o uso do Ctrl+C para controle de processos.
                            </div>
                        </div>
                    </>
                );
            case 'appearance':
                return (
                    <>
                        <SettingGroup title="Interface">
                            <SettingRow
                                label={isDark ? "Modo Escuro" : "Modo Claro"}
                                description="Alterna entre os temas claro e escuro da aplicação."
                                icon={isDark ? Moon : Sun}
                            >
                                <Switch checked={isDark} onChange={toggleTheme} />
                            </SettingRow>
                        </SettingGroup>
                        <SettingGroup title="Tipografia">
                            <SettingRow
                                label="Tamanho da Variável"
                                description="Define o tamanho base da fonte para os elementos da interface."
                                icon={Type}
                            >
                                <select
                                    value={settings.fontSize}
                                    onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        background: isDark ? '#222' : '#f5f5f5',
                                        color: isDark ? '#fff' : '#000',
                                        border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    {[12, 13, 14, 15, 16].map(size => (
                                        <option key={size} value={size}>{size}px</option>
                                    ))}
                                </select>
                            </SettingRow>
                        </SettingGroup>
                    </>
                );
        }
    };

    return (
        <div style={{
            flex: 1,
            display: 'flex',
            height: '100%',
            background: isDark ? '#0f0f0f' : '#f6f8fa',
        }}>
            {/* Settings Sidebar */}
            <div style={{
                width: '240px',
                borderRight: `1px solid ${isDark ? '#1f1f1f' : '#e1e4e8'}`,
                padding: '24px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
            }}>
                <h2 style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    padding: '0 12px 20px 12px',
                    color: isDark ? '#fff' : '#111'
                }}>
                    Configurações
                </h2>
                {categories.map(cat => {
                    const isActive = activeCategory === cat.id;
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id as any)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: isActive ? (isDark ? '#1a1a1a' : '#fff') : 'transparent',
                                color: isActive ? (isDark ? '#4fc3f7' : '#0070f3') : (isDark ? '#888' : '#666'),
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: isActive ? 700 : 500,
                                transition: 'all 0.2s',
                                textAlign: 'left',
                                boxShadow: isActive ? (isDark ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.05)') : 'none'
                            }}
                        >
                            <Icon size={18} />
                            <span style={{ flex: 1 }}>{cat.label}</span>
                            {isActive && <ChevronRight size={14} opacity={0.5} />}
                        </button>
                    );
                })}
            </div>

            {/* Settings Content */}
            <div style={{
                flex: 1,
                padding: '40px 60px',
                overflowY: 'auto'
            }} className="settings-content-scroll">
                <style>{`
                    .settings-content-scroll::-webkit-scrollbar {
                        width: 8px;
                    }
                    .settings-content-scroll::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .settings-content-scroll::-webkit-scrollbar-thumb {
                        background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
                        border-radius: 4px;
                    }
                `}</style>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
