# 🏗️ JS Block - UI Architecture

O layout do **JS Block** foi redesenhado para proporcionar uma experiência de edição profissional, minimalista e focada em produtividade. O sistema utiliza uma estrutura de camadas para separar preocupações e maximizar o espaço de trabalho.

---

### 📏 Estrutura de Navegação (As 3 Barras)

O sistema é composto por 4 elementos horizontais de interface:

1.  **Side Ribbon (Faixa Global)**: Barra vertical de 40px na extrema esquerda. Define qual **Ambiente** está ativo (Blueprints, Busca ou Git).
    *   *Nota*: Esta barra permanece sempre visível e funcional, independente de os painéis laterais estarem abertos ou fechados.
2.  **Context Ribbon (Faixa de Contexto)**: Barra secundária de 40px que aparece à direita da Side Ribbon em ambientes complexos. Fornece navegação de "perspectiva".
    *   *Comportamento Inteligente*: Só é exibida se o módulo atual registrar 2 ou mais perspectivas de navegação.
3.  **Sidebar Panel (Painel Lateral)**: Painel expansível (através do ícone de layout no topo) que contém ferramentas específicas do ambiente.
    *   *Visibilidade*: O botão de expandir/ocultar no header só aparece em módulos que fazem uso deste painel (Blueprints e Git). No ambiente de Busca (atualmente sem painel), o botão é ocultado.
4.  **Main Workspace (Área de Trabalho)**: A grande área central onde o conteúdo principal é visualizado e editado.

---

### 🎨 Ambientes do Sistema

#### 1. 🟦 Ambiente de Blueprints (Vanilla)
Ambiente principal de construção lógica do projeto.
*   **Ícone na Side Ribbon**: 📦 (Box)
*   **Sidebar Panel**: Exibe no topo os botões de alternância entre **Explorador de Arquivos** e **Biblioteca de Funções**.
*   **Main Workspace**: Dividido entre o **Editor de Código (Monaco)** e o **Canvas de Blocos**.
*   **Canvas Toolbar**: Barra flutuante inferior no Canvas para criação rápida de Notas, Utilitários e disparar o **Auto-Layout**.
    *   *Atalhos*: `Shift+Alt+F` dispara a organização automática do grafo.

---

### 💎 Inteligência Visual (Node System)

Os nós do JS Block não são apenas caixas estáticas, mas interfaces inteligentes:
- **Badges de Contexto**: Nós como `MethodNode` exibem indicadores dinâmicos para `ASYNC`, `STATIC`, `GET` e `SET`.
- **Type Hints**: handles de dados possuem tooltips que exibem o tipo inferido (ex: `string`, `number`, `boolean`) ao passar o mouse.
- **Runtime Monitoring**: Variáveis exibem o valor em tempo real capturado durante a execução através de um badge rosa de "Runtime Value".
- **Recursive Destructuring**: O sistema visualiza padrões complexos de objetos através de cadeias de `DestructuringNodes`.

#### 2. 🔍 Ambiente de Busca
Interface para localização global de termos e arquivos.
*   **Ícone na Side Ribbon**: 🔍 (Search)
*   **Sidebar Panel**: Oculto (não utilizado neste módulo).
*   **Status**: Em desenvolvimento.

#### 3. 🌿 Ambiente Git
Controle de versão e histórico do repositório.
*   **Ícone na Side Ribbon**: 🌿 (GitBranch).
*   **Context Ribbon**: Permite alternar entre as visualizações de **Status & Changes** (Estado) e **Integrated Terminal** (Terminal).
*   **Quick Commands**: Barra de comandos rápidos no terminal, permitindo automação de tarefas frequentes através de um sistema de gatilhos visuais.
*   **Sidebar Panel**: Exibe exclusivamente o **Histórico de Commits** (Git Log) de forma persistente.
*   **Main Workspace**: Área onde aparecem os grupos de mudanças, campo de mensagem de commit e o Terminal integrado.

---

### 🧠 Logica de Controle: `activeSidebarTab`
O estado `activeSidebarTab` do Store é o motor do sistema:
*   **Orquestração**: Sincroniza ícones, ativa faixas de contexto e define o roteamento de conteúdo entre o Painel Lateral e a Área de Trabalho.

---

### 📜 Componentes Core

#### ScrollArea
Componente de scroll customizado com performance nativa e visual minimalista.

#### Modal
Componente reutilizável para diálogos de interface.
*   **Design**: Mantém a estética premium com backdrop blur e suporte nativo aos temas light/dark.
*   **Comportamento**: Suporta layouts variados através de slots para Header Icon, Title e Footer dinâmico.
*   **Flexibilidade**: Utilizado tanto para fluxos complexos (Gerenciador de Perfis Git) quanto para prompts simples (Novo Comando Rápido).

---

### 🔌 Extensibilidade
O sistema suporta plugins externos para expandir suas funcionalidades.
*   **Documentação**: [Guia de Desenvolvimento de Plugins (PT-BR)](PLUGINS_PT-BR.md) | [Plugin Development Guide (EN)](PLUGINS.md)


#### Radio
Seletor de opção única customizado.
*   **Estética**: Design quadrado com indicador interno circular, fugindo do padrão arredondado comum para um visual mais técnico e moderno.
*   **Customização**: Suporta cores dinâmicas passadas via props para se adequar ao contexto visual do grupo (ex: azul para Local, verde para Global).

#### Dropdown
Seletor de menu personalizado com suporte a Portals.
*   **Posicionamento Inteligente**: Utiliza React Portals para renderizar o menu sobre o `body`, evitando cortes por `overflow: hidden` em containers pai.
*   **Adaptabilidade**: Detecta automaticamente o espaço disponível na viewport para decidir se abre para baixo ou para cima.
*   **Estética Premium**: Inclui animações de entrada suaves, indicador de seleção minimalista (dot) e sombras projetadas para profundidade visual.

---
*Atualizado em: 08 de Fevereiro de 2026*
