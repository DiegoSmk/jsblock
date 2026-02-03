import React, { useCallback, useState, useRef, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../../store/useStore';
import type { AppNode, NodeCustomStyle } from '../../types/store';
import { hexToRgba } from '../../utils/colors';

export const useNoteLogic = (id: string, data: AppNode['data'], isDark: boolean) => {
    const updateNodeData = useStore(state => state.updateNodeData);
    const setConfirmationModal = useStore(state => state.setConfirmationModal);
    const onNodesChange = useStore(state => state.onNodesChange);
    const spawnConnectedUtility = useStore(state => state.spawnConnectedUtility);
    const openModal = useStore(state => state.openModal);

    // Use store directly for spawn logic if needed, but we rely on spawnConnectedUtility action.

    const { allEdges, nodes } = useStore(useShallow(state => ({
        allEdges: state.edges,
        nodes: state.nodes
    })));

    // Filtered edges for handles
    const edges = useMemo(() =>
        allEdges.filter(edge => edge.source === id || edge.target === id),
        [allEdges, id]
    );

    const [menuState, setMenuState] = useState<'closed' | 'menu' | 'style' | 'details'>('closed');
    const popoverRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

    const taskStatus = useMemo(() => {
        const taskNodes = edges
            .filter(e => e.target === id)
            .map(e => nodes.find(n => n.id === e.source))
            .filter(n => n?.type === 'utilityNode' && n?.data.utilityType === 'task');

        if (taskNodes.length === 0) return 'none';

        const allChecked = taskNodes.every(n => n?.data.checked);
        return allChecked ? 'completed' : 'active';
    }, [edges, nodes, id]);

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

    const [detectedTask, setDetectedTask] = useState<{ label: string, checked: boolean, fullMatch: string } | null>(null);

    const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const visualText = e.target.value;
        const taskMatch = /^- \[(x| )\] (.*)$/m;
        const match = visualText.match(taskMatch);

        if (match) {
            const [fullMatch, checkedStr, taskLabel] = match;
            const isChecked = checkedStr === 'x';
            setDetectedTask({ label: taskLabel, checked: isChecked, fullMatch });
        } else {
            setDetectedTask(null);
        }

        updateNodeData(id, { ...data, text: visualText });
    }, [id, data, updateNodeData]);

    const confirmTaskConversion = useCallback(() => {
        if (!detectedTask) return;

        setConfirmationModal({
            isOpen: true,
            title: 'Converter para Tarefa?',
            message: `Deseja converter "${detectedTask.label}" em um nó de tarefa conectado?`,
            confirmLabel: 'Converter',
            cancelLabel: 'Cancelar',
            onConfirm: () => {
                const currentText = data.text || '';
                const newText = currentText.replace(detectedTask.fullMatch, '').trim();

                updateNodeData(id, { ...data, text: newText });

                if (spawnConnectedUtility) {
                    const currentNode = nodes.find(n => n.id === id);
                    const position = {
                        x: (currentNode?.position.x ?? 0) + 300,
                        y: (currentNode?.position.y ?? 0)
                    };

                    spawnConnectedUtility(id, 'task', detectedTask.label, position, detectedTask.checked);
                }
                setDetectedTask(null);
                setConfirmationModal(null);
            },
            onCancel: () => {
                setConfirmationModal(null);
                setDetectedTask(null); // Ignore this match for now? Or just close modal.
            }
        });

    }, [detectedTask, data, id, updateNodeData, nodes, spawnConnectedUtility, setConfirmationModal]);


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
        detectedTask,
        confirmTaskConversion
    };
};
