// Store types
export interface Scope {
  id: string;
  label: string;
}

export interface FunctionCallData {
  label: string;
  args: string[];
  isDecl?: boolean;
  isStandalone?: boolean;
  hasReturn?: boolean;
  usageCount?: number;
  connectedValues?: Record<string, string>;
  expression?: string;
  scopes?: {
    body?: Scope;
  };
}

export interface NodeData extends FunctionCallData {
  // Add other node data properties as needed
}

export interface StoreNode {
  id: string;
  type: string;
  data: {
    label: string;
    [key: string]: unknown;
  };
}

export interface StoreEdge {
  source: string;
  target: string;
  targetHandle: string;
}

export interface StoreState {
  theme: 'light' | 'dark';
  runtimeValues: Record<string, unknown>;
  edges: StoreEdge[];
  nodes: StoreNode[];
  navigateInto: (id: string, label: string) => void;
  addFunctionCall?: (data: unknown) => unknown;
}