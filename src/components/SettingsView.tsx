import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import Editor from '@monaco-editor/react';
import {
    Terminal,
    Monitor,
    Type,
    Save,
    CircleHelp,
    ChevronRight,
    Settings as SettingsIcon,
    Sun,
    Moon,
    FileJson,
    Layers,
    RotateCcw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from './ui/ScrollArea';
import { Dropdown } from './ui/Dropdown';

const SettingGroup = ({ title, children }: { title: string, children: React.ReactNode }) => {
    const isDark = useStore(state => state.theme === 'dark');
    return (
        <div style={{ marginBottom: '32px' }}>
            <h3 style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: isDark ? '#555' : '#aaa',
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
};

const SettingRow = ({ label, description, children, icon: Icon }: { label: string, description?: string, children: React.ReactNode, icon?: React.ElementType }) => {
    const isDark = useStore(state => state.theme === 'dark');
    return (
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
};

const Switch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => {
    const isDark = useStore(state => state.theme === 'dark');
    return (
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
};

export const SettingsView: React.FC = () => {
    const { t } = useTranslation();
    const {
        theme,
        toggleTheme,
        settings,
        updateSettings,
        settingsConfig,
        updateSettingsConfig,
        autoSave,
        toggleAutoSave
    } = useStore();

    const [activeCategory, setActiveCategory] = useState<'general' | 'terminal' | 'appearance' | 'json'>('general');
    const [localJson, setLocalJson] = useState(settingsConfig);
    const [lastSettingsConfig, setLastSettingsConfig] = useState(settingsConfig);
    const [isModified, setIsModified] = useState(false);
    const isDark = theme === 'dark';

    if (settingsConfig !== lastSettingsConfig) {
        setLocalJson(settingsConfig);
        setLastSettingsConfig(settingsConfig);
        setIsModified(false);
    }

    const categories = [
        { id: 'general', label: t('app.settings.categories.general'), icon: SettingsIcon },
        { id: 'terminal', label: t('app.settings.categories.terminal'), icon: Terminal },
        { id: 'appearance', label: t('app.settings.categories.appearance'), icon: Monitor },
        { id: 'json', label: 'JSON Configuration', icon: FileJson }
    ];



    const renderCategoryContent = (categoryId: string) => {
        switch (categoryId) {
            case 'general':
                return (
                    <>
                        <SettingGroup title={t('app.settings.groups.files')}>
                            <SettingRow
                                label={t('app.settings.fields.auto_save.label')}
                                description={t('app.settings.fields.auto_save.desc')}
                                icon={Save}
                            >
                                <Switch checked={autoSave} onChange={toggleAutoSave} />
                            </SettingRow>
                        </SettingGroup>
                    </>
                );
            case 'terminal':
                return (
                    <>
                        <SettingGroup title={t('app.settings.categories.terminal')}>
                            <SettingRow
                                label="Copiar ao selecionar"
                                description="Copia automaticamente o texto selecionado para a área de transferência."
                                icon={ChevronRight}
                            >
                                <Switch
                                    checked={settings.terminalCopyOnSelect}
                                    onChange={() => updateSettings({ terminalCopyOnSelect: !settings.terminalCopyOnSelect })}
                                />
                            </SettingRow>
                            <SettingRow
                                label="Colar com botão direito"
                                description="Cola o conteúdo da área de transferência ao clicar com o botão direito."
                                icon={ChevronRight}
                            >
                                <Switch
                                    checked={settings.terminalRightClickPaste}
                                    onChange={() => updateSettings({ terminalRightClickPaste: !settings.terminalRightClickPaste })}
                                />
                            </SettingRow>
                        </SettingGroup>
                        <div style={{ padding: '8px 4px' }}>
                            <div style={{ fontSize: '0.8rem', color: isDark ? '#aaa' : '#666', lineHeight: 1.5, opacity: 0.7 }}>
                                {t('app.settings.terminal_info')}
                            </div>
                        </div>
                    </>
                );
            case 'appearance':
                return (
                    <>
                        <SettingGroup title={t('app.settings.groups.interface')}>
                            <SettingRow
                                label={isDark ? t('app.settings.fields.theme.label') : t('app.settings.fields.theme.label_light')}
                                description={t('app.settings.fields.theme.desc')}
                                icon={isDark ? Moon : Sun}
                            >
                                <Switch checked={isDark} onChange={toggleTheme} />
                            </SettingRow>
                            <SettingRow
                                label="Borda do Aplicativo"
                                description="Adiciona uma borda colorida animada em volta de todo o aplicativo."
                                icon={Layers}
                            >
                                <Switch
                                    checked={settings.showAppBorder}
                                    onChange={() => updateSettings({ showAppBorder: !settings.showAppBorder })}
                                />
                            </SettingRow>
                        </SettingGroup>

                        <SettingGroup title="Layout">
                            <SettingRow
                                label="Auto Layout de Nodes"
                                description="Organiza automaticamente os nós quando novas conexões são feitas."
                                icon={ChevronRight}
                            >
                                <Switch
                                    checked={settings.autoLayoutNodes}
                                    onChange={() => updateSettings({ autoLayoutNodes: !settings.autoLayoutNodes })}
                                />
                            </SettingRow>
                        </SettingGroup>
                        <SettingGroup title={t('app.settings.groups.typography')}>
                            <SettingRow
                                label={t('app.settings.fields.font_size.label')}
                                description={t('app.settings.fields.font_size.desc')}
                                icon={Type}
                            >
                                <Dropdown
                                    value={settings.fontSize}
                                    options={[12, 13, 14, 15, 16].map(size => ({
                                        value: size,
                                        label: `${size}px`
                                    }))}
                                    onChange={(val: number) => updateSettings({ fontSize: val })}
                                    width="100px"
                                    isDark={isDark}
                                />
                            </SettingRow>
                        </SettingGroup>
                    </>
                );
            case 'json':
                return (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
                        <div style={{
                            flexShrink: 0,
                            padding: '16px',
                            background: isDark ? 'rgba(255, 193, 7, 0.05)' : 'rgba(255, 193, 7, 0.05)',
                            border: `1px solid ${isDark ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.3)'}`,
                            borderRadius: '8px',
                            color: isDark ? '#ffc107' : '#d97706',
                            fontSize: '0.85rem',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center'
                        }}>
                            <CircleHelp size={16} />
                            <span>
                                {t('app.settings.json_info', 'Configurações via JSON são aplicadas em tempo real.')}
                            </span>
                        </div>
                        <div style={{
                            flex: 1,
                            border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: isDark ? '#1e1e1e' : '#fff',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 16px',
                                background: isDark ? '#252526' : '#f3f3f3',
                                borderBottom: `1px solid ${isDark ? '#333' : '#ddd'}`,
                                flexShrink: 0
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileJson size={14} color={isDark ? '#4fc3f7' : '#0070f3'} />
                                    <span style={{ fontSize: '12px', color: isDark ? '#ccc' : '#666', fontFamily: 'monospace' }}>
                                        settings.json
                                        {isModified && <span style={{ marginLeft: '4px', color: '#ffc107' }}>●</span>}
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        updateSettingsConfig(localJson);
                                        setIsModified(false);
                                    }}
                                    disabled={!isModified}
                                    style={{
                                        padding: '6px 16px',
                                        borderRadius: '6px',
                                        border: `1px solid ${isModified
                                            ? (isDark ? 'rgba(79, 195, 247, 0.3)' : 'rgba(0, 112, 243, 0.2)')
                                            : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')}`,
                                        background: isModified
                                            ? (isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.1)')
                                            : (isDark ? 'transparent' : 'transparent'),
                                        color: isModified
                                            ? (isDark ? '#4fc3f7' : '#0070f3')
                                            : (isDark ? '#666' : '#999'),
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        cursor: isModified ? 'pointer' : 'default',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: 'none'
                                    }}
                                >
                                    <Save size={14} />
                                    {t('app.confirm_save.save', 'Save')}
                                </button>
                            </div>

                            <div style={{ flex: 1, minHeight: 0 }}>
                                <Editor
                                    height="100%"
                                    value={localJson}
                                    language="json"
                                    onChange={(value) => {
                                        setLocalJson(value ?? '');
                                        setIsModified(value !== settingsConfig);
                                    }}
                                    theme={isDark ? 'vs-dark' : 'light'}
                                    options={{
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                        fontSize: 14,
                                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                        lineNumbers: 'on',
                                        padding: { top: 16, bottom: 16 },
                                        renderLineHighlight: 'all',
                                        hideCursorInOverviewRuler: true,
                                        overviewRulerBorder: false,
                                        automaticLayout: true,
                                        suggest: { preview: true, showWords: false },
                                        cursorBlinking: 'smooth',
                                        smoothScrolling: true,
                                        contextmenu: false,
                                        folding: true
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const renderContent = () => {
        const category = categories.find(c => c.id === activeCategory);
        return (
            <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <div style={{ marginBottom: '24px', flexShrink: 0 }}>
                    <h2 style={{ fontSize: '1.5rem', color: isDark ? '#fff' : '#1e1e1e', marginBottom: '8px', fontWeight: 800 }}>
                        {category?.label}
                    </h2>
                </div>
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    {activeCategory === 'json' ? (
                        renderCategoryContent(activeCategory)
                    ) : (
                        <ScrollArea visibility="hover">
                            <div style={{ paddingRight: '20px', paddingBottom: '40px' }}>
                                {renderCategoryContent(activeCategory)}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{
            flex: 1,
            display: 'flex',
            height: '100%',
            background: isDark ? '#0f0f0f' : '#f6f8fa',
        }}>
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
                    {t('app.settings.title')}
                </h2>
                {categories.map(cat => {
                    const isActive = activeCategory === cat.id;
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id as 'general' | 'terminal' | 'appearance' | 'json')}
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
            <div style={{
                flex: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                backgroundColor: isDark ? '#0a0a0a' : '#fff'
            }}>
                <div style={{
                    maxWidth: '900px',
                    margin: '0 auto',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    padding: '40px 60px'
                }}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
