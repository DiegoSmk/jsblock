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

export type UtilityType = 'copy' | 'task' | 'collector' | 'portal' | 'todo' | 'note' | 'link' | 'image';

export interface AppNodeData {
  label?: string;
  expression?: string;
  value?: unknown;
  scopeId?: string;
  isDecl?: boolean;
  isAsync?: boolean;
  isAwait?: boolean;
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
  // Destructuring
  destructuringKeys?: string[];
  destructuringSource?: string;
  // Metadata
  createdAt?: number;
  updatedAt?: number;
  [key: string]: unknown;
}

export type AppNode = Node<AppNodeData>;
