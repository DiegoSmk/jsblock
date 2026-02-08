export interface Settings {
  terminalCopyOnSelect: boolean;
  terminalRightClickPaste: boolean;
  autoLayoutNodes: boolean;
  fontSize: number;
  showAppBorder: boolean;
  showDebugHandles: boolean;
  windowTransparency: number;
  windowBackground: string;
  windowAlwaysOnTop: boolean;
}

export interface SettingsConfig {
  appearance?: {
    theme?: 'light' | 'dark';
    showAppBorder?: boolean;
    windowTransparency?: number;
    windowBackground?: string;
    windowAlwaysOnTop?: boolean;
  };
  layout?: {
    sidebar?: {
      width?: number;
    };
  };
  editor?: {
    fontSize?: number;
    autoLayoutNodes?: boolean;
  };
  terminal?: {
    copyOnSelect?: boolean;
    rightClickPaste?: boolean;
  };
  developer?: {
    showDebugHandles?: boolean;
  };
  files?: {
    autoSave?: boolean;
  };
}
