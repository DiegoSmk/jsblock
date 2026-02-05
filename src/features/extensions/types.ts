export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  entry: string;
  permissions?: string[];
  enabled?: boolean;
}
