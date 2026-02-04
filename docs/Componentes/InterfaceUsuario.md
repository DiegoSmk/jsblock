# Interface de Usuário (React)

A interface é construída com React e utiliza componentes funcionais com Hooks.

## Layout Principal (`src/App.tsx`)

O layout utiliza um sistema de Sidebar redimensionável personalizado (migrado de `allotment` para uma solução Flexbox + Zustand).
- **Sidebar Esquerda**: Navegação (Arquivos, Biblioteca, Git).
- **Área Central**: Editor dividido (Canvas Visual e/ou Editor de Código Monaco).
- **Sidebar Direita** (Opcional): Propriedades ou Assistente (não implementado totalmente).

## Editor Visual (`src/components/FlowContent.tsx`)

Este é o wrapper do `@xyflow/react`.
- Configura os tipos de nós (`nodeTypes`).
- Gerencia eventos de drop (drag and drop da sidebar).
- Gerencia callbacks de conexão (`onConnect`).

### Nós Customizados
Os nós residem em `src/components/*.Node.tsx`.
Cada nó segue o padrão:
```tsx
export const FunctionCallNode = ({ data, id }: NodeProps<AppNodeData>) => {
  // 1. Hooks para interatividade (ex: inputs)
  // 2. Renderização do corpo do nó (CSS Modules ou Tailwind)
  // 3. Handles (entradas e saídas de fluxo/dados)
  return (
    <div className="node-container">
      <Handle type="target" position={Position.Top} id="flow-in" />
      {/* Conteúdo UI */}
      <Handle type="source" position={Position.Bottom} id="flow-next" />
    </div>
  );
};
```

## Sidebar (`src/components/SidebarContainer.tsx`)
Gerencia a largura e visibilidade da barra lateral. Persiste a largura no `localStorage` via Zustand (`layoutStore`).

## Estilização
O projeto utiliza uma mistura de CSS global (`index.css`, `App.css`) e estilos inline/modules para nós específicos.
- **Tema**: Suporte a Dark/Light mode controlado pelo Zustand.
- **Cores**: Paleta consistente para tipos de dados (Azul=Função, Roxo=Lógica, etc.).
