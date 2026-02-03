import type { AppNode } from '../types/store';
import { Copy, Check, ArrowUpRight, Merge } from 'lucide-react';
import React from 'react';

export type UtilityType = 'copy' | 'task' | 'collector' | 'portal';

export interface UtilityDefinition {
    type: UtilityType;
    label: string;
    icon: React.ElementType;
    defaultData: Partial<AppNode['data']>;
    description: string;
    color: {
        light: string;
        dark: string;
    };
    spawnLogic?: (center: { x: number, y: number }) => { x: number, y: number };
}

export const UTILITY_REGISTRY: Record<UtilityType, UtilityDefinition> = {
    copy: {
        type: 'copy',
        label: 'Copiar',
        icon: Copy,
        description: 'Copia o conteúdo da nota conectada',
        defaultData: {
            utilityType: 'copy',
            checked: false
        },
        color: {
            light: '#666',
            dark: '#ccc'
        }
    },
    task: {
        type: 'task',
        label: 'Tarefa',
        icon: Check,
        description: 'Checklist interativo com auto-conclusão',
        defaultData: {
            utilityType: 'task',
            checked: false,
            label: 'Tarefa'
        },
        color: {
            light: '#4caf50',
            dark: '#4caf50'
        }
    },
    collector: {
        type: 'collector',
        label: 'Coletor',
        icon: Merge,
        description: 'Concatena textos de múltiplas notas',
        defaultData: {
            utilityType: 'collector',
            text: ''
        },
        color: {
            light: '#9c27b0',
            dark: '#ab47bc'
        }
    },
    portal: {
        type: 'portal',
        label: 'Portal',
        icon: ArrowUpRight,
        description: 'Espelha conteúdo de outro local',
        defaultData: {
            utilityType: 'portal',
            targetId: null
        },
        color: {
            light: '#e91e63',
            dark: '#f06292'
        }
    }
};

export const getUtilityDefinition = (type: UtilityType) => UTILITY_REGISTRY[type];
export const getAllUtilities = () => Object.values(UTILITY_REGISTRY);
