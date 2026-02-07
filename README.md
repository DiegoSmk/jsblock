<div align="center">
  <img src="./jsblock_banner.png" alt="JS Block Banner" width="100%" />

  # 🚀 JS Block

  **The visual evolution of JavaScript/TypeScript development.**

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Electron](https://img.shields.io/badge/Electron-Latest-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
  [![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Code Style: ESLint](https://img.shields.io/badge/Code%20Style-ESLint-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)

  [Features](#-key-features) • [Installation](#-quick-start) • [Architecture](#-modular-architecture) • [Git Integration](#-professional-git-workflow)
</div>

---

## 🌟 Overview

**JS Block** is a professional, node-based visual programming environment designed to bridge the gap between logical flow and raw code. Built for power users and visual architects, it provides a high-performance canvas to design, document, and execute JavaScript/TypeScript logic through a sleek, modern interface.

## ✨ Key Features

- 🧠 **XYFlow Canvas**: High-performance node-based architecture for complex logic mapping.
- ⚡ **Multi-Runtime Execution**: Native support for **Node.js**, **Bun**, and **Deno** with automated detection.
- 📊 **Live Benchmarking**: Compare real-time performance across runtimes with microsecond precision.
- 📝 **Advanced Note System**: Proximity-sensitive connection handles and markdown-flavored sticky notes.
- ⚡ **Dual-View Sync**: Instantly switch between the visual graph and a full **Monaco-powered** code editor.
- 🛠️ **Command Palette**: VS Code-inspired productivity with `Ctrl+Shift+P` for quick actions.
- 🎨 **Premium UI/UX**: Glassmorphism aesthetic, dynamic themes (Light/Dark), and smooth micro-animations.
- 📂 **Native Integration**: Full file system access via Electron, with workspace management and [Execution Adapters](ADAPTERS.md) for cross-platform reliability.

## 🏗️ Modular Architecture

The application is structured for scalability and performance:

- **Allotment Panels**: A flexible, persistence-aware layout system that remembers your sidebar widths.
- **Zustand State Management**: Precise, reactive global state handling for the graph and system configurations.
- **Context-Aware Sidebar**: Dynamic modules (Explorer, Library, Git, Settings) that adapt to your currently active task.

## 📊 Professional Git Workflow

JS Block features a built-in, modular Git dashboard designed for modern developers:

- **Integrated Terminal**: Run native commands without leaving the environment.
- **Visual Log & History**: Interactive commit graph with detailed diff information.
- **Context Ribbon**: Quick navigation between status, terminal, and repository metrics.
- **Productivity Tools**: Branch switching, tag management, and clean commit templates.

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)
- *Optional*: [Bun](https://bun.sh/) or [Deno](https://deno.com/) for multi-runtime benchmarking

### Installation

```bash
# Clone the repository
git clone https://github.com/DiegoSmk/jsblock.git

# Navigate to project
cd jsblock

# Install dependencies
npm install
```

### Development

```bash
# Start the Vite dev server and Electron
npm run electron:dev
```

## 🤝 Contributing

We follow **Conventional Commits** for clear versioning and changelogs:

- `feat`: New features
- `fix`: Bug fixes
- `refactor`: Code restructuring
- `style`: Visual/CSS improvements
- `docs`: Documentation updates

---

<div align="center">
  <p>Built with ❤️ by <b>DiegoSmk</b> and the JS Visual Architects.</p>
</div>
