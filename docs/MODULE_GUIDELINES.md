# 🧩 Manual de Desenvolvimento de Módulos (JS Block)

Este guia define as regras para criar e integrar novos módulos no **JS Block**, garantindo consistência visual e funcional na navegação lateral.

---

## 🏗️ A Estrutura de Navegação Dupla

Todo módulo deve interagir com as duas camadas de navegação da interface:

### 1. Side Ribbon (Nível Global)
A barra mais à esquerda. Representa o "Papel" ou "Contexto Principal" do usuário.
- **Registro**: Adicione seu módulo como uma nova `tab` no `useStore`.
- **Visibilidade**: Módulos imersivos podem desativar a Side Ribbon global via estado para focar 100% no conteúdo.
- **Troca de Conteúdo**: Ao clicar, o módulo deve decidir se abre em uma **Sidebar** (mantendo o editor) ou se assume a **Tela Cheia** (UI Exclusiva).

### 2. Context Ribbon (Nível de Módulo)
A fita auxiliar à direita da Side Ribbon. Usada para navegação **dentro** do módulo.
- **Regra de Exibição (N >= 2)**: Só deve aparecer se houverem 2 ou mais sub-visões no módulo. Se o módulo tiver apenas uma tela, esta fita deve permanecer oculta.
- **Diferenciação**: Use cores de fundo sutilmente diferentes da Side Ribbon e agrupe os ícones visualmente.

---

## 🛠️ Passo a Passo para Implementação

### 1. Definição no Store
Adicione o identificador do seu módulo no tipo das abas laterais e crie os estados necessários para sua navegação interna.

### 2. Criação do Painel Central
Desenvolva seu componente na pasta `src/features/`.
- **Padrão**: Crie `src/features/myModule/` contendo:
  - `components/` (Painéis e UI)
  - `store/` (Slices do Zustand)
  - `types/` (Definições TS)

### 3. Integração no `App.tsx`
Mapeie a renderização do seu componente baseado no valor de `activeSidebarTab`.
```tsx
{activeSidebarTab === 'my-module' ? <MyModulePanel /> : <DefaultLayout />}
```

### 4. Registro na `SideRibbon`
Adicione o ícone correspondente na `SideRibbon.tsx` usando a biblioteca `lucide-react`.

---

## 📏 Regras de Ouro (UX & UI)

1.  **Escape Hatch (Fuga)**: Sempre forneça uma maneira fácil de voltar ao Explorador de Arquivos/Editor Monaco através da Side Ribbon.
2.  **Acessibilidade**: Todos os botões de navegação devem ter `title` (tooltip) e ser navegáveis via teclado.
3.  **Performance**: Utilize `ResizeObserver` com o padrão de **Inner Wrapper** para áreas de scroll customizadas, garantindo que o módulo seja fluido.
4.  **Respeito ao Sistema**: Use as variáveis de tema (`isDark`) do store para garantir que o módulo suporte os modos Light e Dark nativamente.
5.  **Notificações**: Use o sistema de **Toasts** integrado para feedback de ações, evitando diálogos nativos.

---
*Seguir estas diretrizes garante que o JS Block continue parecendo uma ferramenta coesa e profissional, mesmo com múltiplos módulos externos.*
