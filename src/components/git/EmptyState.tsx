import React from 'react';
import { GitBranch, History, BarChart3 } from 'lucide-react';

interface EmptyStateProps {
    isDark: boolean;
    type: 'no-repo' | 'no-commits' | 'no-data';
}

export const EmptyState: React.FC<EmptyStateProps> = ({ isDark, type }) => {
    const getContent = () => {
        switch (type) {
            case 'no-repo':
                return {
                    icon: <GitBranch size={48} />,
                    title: 'Nenhum repositório Git',
                    description: 'Esta pasta não é um repositório Git. Inicialize um repositório para começar.',
                    hint: 'Use o botão "Inicializar Git" na aba Git para criar um novo repositório.'
                };
            case 'no-commits':
                return {
                    icon: <History size={48} />,
                    title: 'Nenhum commit registrado',
                    description: 'Ainda não há commits neste repositório. Faça seu primeiro commit para começar a rastrear mudanças.',
                    hint: 'Crie arquivos, stage suas alterações e faça o primeiro commit.'
                };
            case 'no-data':
                return {
                    icon: <BarChart3 size={48} />,
                    title: 'Sem dados para exibir',
                    description: 'Não há informações suficientes para gerar estatísticas.',
                    hint: 'As estatísticas aparecerão após alguns commits serem feitos.'
                };
        }
    };

    const content = getContent();

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 32px',
                textAlign: 'center',
                animation: 'fadeIn 0.4s ease-out'
            }}
        >
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }

                .empty-state-icon {
                    animation: float 3s ease-in-out infinite;
                }
            `}</style>

            <div
                className="empty-state-icon"
                style={{
                    marginBottom: '24px',
                    color: isDark ? '#4ade80' : '#22c55e',
                    opacity: 0.6
                }}
            >
                {content.icon}
            </div>

            <h3
                style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: isDark ? '#fff' : '#333',
                    marginBottom: '8px',
                    letterSpacing: '-0.01em'
                }}
            >
                {content.title}
            </h3>

            <p
                style={{
                    fontSize: '0.85rem',
                    color: isDark ? '#aaa' : '#666',
                    marginBottom: '12px',
                    maxWidth: '400px',
                    lineHeight: 1.5
                }}
            >
                {content.description}
            </p>

            <div
                style={{
                    fontSize: '0.75rem',
                    color: isDark ? '#666' : '#999',
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    maxWidth: '450px'
                }}
            >
                💡 {content.hint}
            </div>
        </div>
    );
};
