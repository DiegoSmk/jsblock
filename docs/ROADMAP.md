# 🗺️ JS Block - Roadmap to v1.0.0

Este documento descreve a visão estratégica e os marcos técnicos necessários para evoluir o **JS Block** da versão atual para o lançamento oficial 1.0.0.

---

## 🏗️ Fase 1: Cobertura de Linguagem e Projetos (v0.6.0)
*Foco: Transformar o editor de arquivos em uma ferramenta de projetos completa.*

- [ ] **Paridade AST Total**: Suporte a 100% das estruturas ES2022+ (Classes, Herança, Object Pattern Matching).
- [ ] **Gerenciamento de Workspace**: Suporte a abertura de pastas completas com árvore de arquivos integrada.
- [ ] **Busca Global**: Implementar `Ctrl+Shift+F` para busca de texto e tipos em todo o projeto.
- [ ] **Auto-Layout Inteligente**: Botão para organizar automaticamente o grafo usando algoritmos de fluxo (Dagre/ELK).

## 🔌 Fase 2: Ecossistema de Extensões (v0.7.0)
*Foco: Abrir a plataforma para a comunidade e personalização.*

- [ ] **SDK de Plugins 1.0**: Estabilizar a API `jsBlock` para criação de nós customizados e temas.
- [ ] **Extension Marketplace**: Interface interna para busca e instalação de plugins via NPM/GitHub.
- [ ] **Theming Engine**: Suporte a temas definidos via JSON para cores de nós, canvas e editor.

## ⚡ Fase 3: Performance e Escalabilidade (v0.8.0)
*Foco: Garantir fluidez em projetos de larga escala.*

- [ ] **Virtualização de Grafo**: Otimizar renderização para suportar +1000 nós simultâneos.
- [ ] **WebContainer Integration**: Estudar portabilidade para rodar o app via Browser usando WebContainers.
- [ ] **Deep Benchmarking**: Adicionar métricas de consumo de memória (Heap) e I/O aos relatórios de performance.

## 🌍 Fase 4: Globalização e Distribuição (v0.9.0 - RC)
*Foco: Alcance internacional e facilidade de instalação.*

- [ ] **I18n Completo**: Localização para PT-BR, EN-US e ES.
- [ ] **Certificações de Build**: Assinatura de binários para Windows e macOS.
- [ ] **User Onboarding**: Tutorial interativo para novos usuários dentro do canvas.

## 🚀 Fase 5: Estabilidade e Lançamento (v1.0.0)
*Foco: Qualidade industrial e lançamento oficial.*

- [ ] **Public Beta**: Período de auditoria aberta para caça de bugs.
- [ ] **Crash Analytics**: Sistema de reporte de erros anônimo para estabilidade pró-ativa.
- [ ] **Official Showcase**: Galeria de Blueprints oficiais e site institucional.

---
*Última Atualização: 06 de Fevereiro de 2026*
