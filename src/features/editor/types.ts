import type { Node } from '@xyflow/react';

export interface Scope {
  id: string;
  label: string;
}

export interface NodeCustomStyle {
  borderColor?: string;
  backgroundColor?: string;
  borderOpacity?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface EdgeCustomStyle {
  type?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  animated?: boolean;
}

export type UtilityType = 'copy' | 'task' | 'collector' | 'portal';

export interface AppNodeData {
  label?: string;
  expression?: string;
  value?: unknown;
  scopeId?: string;
  isDecl?: boolean;
  isExported?: boolean;
  isStandalone?: boolean;
  hasReturn?: boolean;
  usageCount?: number;
  connectedValues?: Record<string | number, string>;
  type?: string;
  typeAnnotation?: string;
  args?: string[];
  nestedArgsCall?: Record<string, { expression: string }>;
  nestedCall?: { name: string, args: string[] };
  scopes?: Record<string, { id: string; label: string }>;
  fallenIndex?: number;
  // Utility Props
  utilityType?: UtilityType;
  checked?: boolean;
  targetId?: string | null;
  text?: string;
  customStyle?: NodeCustomStyle;
  // Metadata
  createdAt?: number;
  updatedAt?: number;
  [key: string]: unknown;
}

export type AppNode = Node<AppNodeData>;
