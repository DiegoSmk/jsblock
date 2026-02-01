import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export interface DropdownOption<T> {
    value: T;
    label: string;
    icon?: React.ReactNode;
}

interface DropdownProps<T> {
    value: T;
    options: DropdownOption<T>[];
    onChange: (val: T) => void;
    width?: string;
    isDark?: boolean;
    placeholder?: string;
}

interface DropdownPos {
    top: number;
    left: number;
    width: number;
    isUpwards: boolean;
}

export function Dropdown<T extends string | number>({
    value,
    options,
    onChange,
    width = '180px',
    isDark = true,
    placeholder = 'Select...'
}: DropdownProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState<DropdownPos>({ top: 0, left: 0, width: 0, isUpwards: false });
    const selectedOption = options.find(opt => opt.value === value);

    const updatePosition = useCallback(() => {
        if (dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const menuHeightHint = options.length * 40 + 20; // Rough estimate of menu height

            // If there's not enough space below, open upwards
            if (spaceBelow < menuHeightHint && rect.top > menuHeightHint) {
                setDropdownPos({
                    top: rect.top - 8,
                    left: rect.left,
                    width: rect.width,
                    isUpwards: true
                });
            } else {
                setDropdownPos({
                    top: rect.bottom + 8,
                    left: rect.left,
                    width: rect.width,
                    isUpwards: false
                });
            }
        }
    }, [options.length]);

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);
        }
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen, updatePosition]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const dropdownMenu = isOpen && createPortal(
        <div style={{
            position: 'fixed',
            top: dropdownPos.isUpwards ? 'auto' : dropdownPos.top,
            bottom: dropdownPos.isUpwards ? (window.innerHeight - (dropdownPos.top + 8)) : 'auto',
            left: dropdownPos.left,
            width: dropdownPos.width,
            background: isDark ? '#1a1a1a' : '#fff',
            border: `1px solid ${isDark ? '#333' : '#e5e7eb'}`,
            borderRadius: '12px',
            boxShadow: isDark
                ? '0 10px 30px -5px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
                : '0 10px 30px -5px rgba(0,0,0,0.15)',
            zIndex: 99999,
            padding: '6px',
            animation: dropdownPos.isUpwards ? 'dropdownAppearUp 0.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'dropdownAppear 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            pointerEvents: 'auto'
        }}>
            <style>{`
        @keyframes dropdownAppear {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dropdownAppearUp {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => {
                            onChange(option.value);
                            setIsOpen(false);
                        }}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: 'none',
                            borderRadius: '8px',
                            background: option.value === value
                                ? (isDark ? 'rgba(79, 195, 247, 0.1)' : 'rgba(0, 112, 243, 0.05)')
                                : 'transparent',
                            color: option.value === value
                                ? (isDark ? '#4fc3f7' : '#0070f3')
                                : (isDark ? '#aaa' : '#555'),
                            fontSize: '0.85rem',
                            fontWeight: option.value === value ? 700 : 500,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                            if (option.value !== value) {
                                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
                                e.currentTarget.style.color = isDark ? '#fff' : '#111';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (option.value !== value) {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = isDark ? '#aaa' : '#555';
                            }
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {option.icon}
                            <span>{option.label}</span>
                        </div>
                        {option.value === value && (
                            <div style={{
                                background: isDark ? '#4fc3f7' : '#0070f3',
                                borderRadius: '50%',
                                width: '6px',
                                height: '6px'
                            }} />
                        )}
                    </button>
                ))}
            </div>
        </div>,
        document.body
    );

    return (
        <div ref={dropdownRef} style={{ position: 'relative', width }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
                    border: `1px solid ${isDark ? (isOpen ? '#4fc3f7' : '#333') : (isOpen ? '#0070f3' : '#ddd')}`,
                    borderRadius: '10px',
                    color: selectedOption ? (isDark ? '#fff' : '#111') : (isDark ? '#666' : '#999'),
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                    boxShadow: isOpen
                        ? (isDark ? '0 0 0 3px rgba(79, 195, 247, 0.15)' : '0 0 0 3px rgba(0, 112, 243, 0.1)')
                        : 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedOption ? (
                        <>
                            {selectedOption.icon}
                            <span>{selectedOption.label}</span>
                        </>
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </div>
                <ChevronDown size={14} style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: 0.5,
                    marginLeft: '8px'
                }} />
            </button>
            {dropdownMenu}
        </div>
    );
}
