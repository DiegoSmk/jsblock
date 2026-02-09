import React, { useCallback, useState, useRef, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../../../../store/useStore';
import type { AppNode, NodeCustomStyle } from '../../../../types/store';
import { hexToRgba } from '../../../../utils/colors';
import { detectTasksFromMarkdown, type DetectedTask } from './noteUtils';

export const useNoteLogic = (id: string, data: AppNode['data'], isDark: boolean) => {
    const updateNodeData = useStore(state => state.updateNodeData);
    const setConfirmationModal = useStore(state => state.setConfirmationModal);
    const onNodesChange = useStore(state => state.onNodesChange);
    const spawnMultipleConnectedUtilities = useStore(state => state.spawnMultipleConnectedUtilities);
    // const openModal = useStore(state => state.openModal);

    // Use store directly for spawn logic if needed, but we rely on spawnConnectedUtility action.

    // Optimized store usage to prevent re-renders on node move
    const edges = useStore(useShallow(state =>
        state.edges.filter(edge => edge.source === id || edge.target === id)
    ));

    const taskStatus = useStore(useShallow(state => {
        const connectedEdges = state.edges.filter(e => e.source === id || e.target === id);
        const taskNodes = connectedEdges
            .map(e => {
                const otherId = e.source === id ? e.target : e.source;
                return state.nodes.find(n => n.id === otherId);
            })
            .filter(n => n?.type === 'utilityNode' && n?.data.utilityType === 'task');

        if (taskNodes.length === 0) return 'none';
        const allChecked = taskNodes.every(n => n?.data.checked);
        return allChecked ? 'completed' : 'active';
    }));

    const [menuState, setMenuState] = useState<'closed' | 'menu' | 'style' | 'details'>('closed');
    const popoverRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

    const customStyle = data.customStyle ?? {};
    const borderOpacity = customStyle.borderOpacity ?? 1;
    const borderStyle = customStyle.borderStyle ?? 'solid';

    const effectiveBorderColor = useMemo(() => hexToRgba(
        customStyle.borderColor ?? (isDark ? '#444444' : '#94a3b8'),
        borderOpacity
    ), [customStyle.borderColor, borderOpacity, isDark]);

    const scrollThumbColor = useMemo(() => hexToRgba(
        customStyle.borderColor ?? (isDark ? '#444444' : '#94a3b8'),
        Math.min(1, borderOpacity * 0.5)
    ), [customStyle.borderColor, borderOpacity, isDark]);

    const backgroundColor = useMemo(() => {
        if (taskStatus === 'completed') {
            return isDark ? 'rgba(40, 40, 40, 0.6)' : 'rgba(230, 230, 230, 0.6)';
        }
        if (taskStatus === 'active') {
            return isDark ? 'rgba(79, 195, 247, 0.15)' : 'rgba(0, 112, 243, 0.08)';
        }
        return customStyle.backgroundColor ?? (isDark ? '#1a1a1a' : '#fff');
    }, [taskStatus, customStyle.backgroundColor, isDark]);

    const [detectedTasks, setDetectedTasks] = useState<DetectedTask[] | null>(null);



    // --- Local Text Buffer for Dead Key Support ---
    const [localText, setLocalText] = useState(data.text ?? '');
    const [prevDataText, setPrevDataText] = useState(data.text);

    if (data.text !== prevDataText) {
        setLocalText(data.text ?? '');
        setPrevDataText(data.text);
    }

    const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const visualText = e.target.value;
        setLocalText(visualText);
        setDetectedTasks(detectTasksFromMarkdown(visualText));
    }, []);



    const handleTextBlur = useCallback(() => {
        updateNodeData(id, { ...data, text: localText });
    }, [id, data, localText, updateNodeData]);

    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        updateNodeData(id, { ...data, label: e.target.value });
    }, [id, data, updateNodeData]);

    const handleStyleUpdate = (updates: Partial<NodeCustomStyle>) => {
        updateNodeData(id, {
            customStyle: {
                ...customStyle,
                ...updates
            }
        });
    };

    const confirmTaskConversion = useCallback(() => {
        if (!detectedTasks || detectedTasks.length === 0) return;

        const count = detectedTasks.length;
        const message = count === 1
            ? `Deseja converter a tarefa "${detectedTasks[0].label}" em um nó de tarefa conectado?`
            : `Deseja converter ${count} tarefas encontradas em nós de tarefa conectados?`;

        setConfirmationModal({
            isOpen: true,
            title: 'Converter Tarefas',
            message,
            confirmLabel: 'Converter',
            cancelLabel: 'Cancelar',
            onConfirm: () => {
                let currentText = localText || '';

                detectedTasks.forEach(task => {
                    currentText = currentText.replace(task.fullMatch, '');
                });

                currentText = currentText.replace(/\n\s*\n/g, '\n').trim();

                // Update both local and global
                setLocalText(currentText);
                updateNodeData(id, { ...data, text: currentText });

                if (spawnMultipleConnectedUtilities) {
                    const currentNode = useStore.getState().nodes.find(n => n.id === id);
                    const baseX = (currentNode?.position.x ?? 0) + 300;
                    const baseY = (currentNode?.position.y ?? 0);

                    const utilitiesToSpawn = detectedTasks.map((task, index) => ({
                        type: 'task' as const,
                        label: task.label,
                        position: {
                            x: baseX,
                            y: baseY + (index * 60)
                        },
                        checked: task.checked
                    }));

                    spawnMultipleConnectedUtilities(id, utilitiesToSpawn);
                }
                setDetectedTasks(null);
                setConfirmationModal(null);
            },
            onCancel: () => {
                setConfirmationModal(null);
            }
        });
    }, [detectedTasks, data, id, updateNodeData, spawnMultipleConnectedUtilities, setConfirmationModal, localText]);

    const toggleMenu = () => {
        if (menuState === 'closed') {
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                let top = rect.top - 10;
                let left = rect.right + 10;

                if (left + 220 > window.innerWidth) {
                    left = rect.left - 230;
                }
                if (top + 300 > window.innerHeight) {
                    top = window.innerHeight - 310;
                }
                if (top < 10) top = 10;

                setPopupPosition({ top, left });
            }
            setMenuState('menu');
        } else {
            setMenuState('closed');
        }
    };

    return {
        edges,
        menuState,
        setMenuState,
        popoverRef,
        buttonRef,
        popupPosition,
        taskStatus,
        effectiveBorderColor,
        scrollThumbColor,
        backgroundColor,
        handleTextChange,
        handleTitleChange,
        handleStyleUpdate,
        toggleMenu,
        onNodesChange,
        setConfirmationModal,
        borderStyle,
        customStyle,
        detectedTasks,
        confirmTaskConversion,
        localText,
        handleTextBlur
    };
};
