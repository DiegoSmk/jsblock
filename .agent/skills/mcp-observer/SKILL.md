---
name: mcp-observer
description: Allows the agent to monitor application logs and state via a Model Context Protocol (MCP) server.
---

# MCP Observer Skill

This skill enables the agent to interact with the JS Blueprints MCP server to observe the application's runtime behavior.

## Capabilities
- **Proactive Debugging:** Automatically read and analyze `app.log` from the Electron process.
- **State Inspection:** Monitor the actual Zustand state (nodes, variables, active file) via `state.json`.
- **Live Feedback:** Map execution values to the application's current context.

## How to use
Run the MCP server in `js-blueprints-mcp/index.js` and connect.

### Tools:
- `get_recent_logs`: Fetches the last console messages (Main & Renderer).
- `get_zustand_state`: Fetches the current UI state (Zustand snapshot).
- `clear_app_logs`: Clears history.

### Resources:
- `file:///app.log`: The raw log file.
- `file:///state.json`: The live state JSON.

## Setup Note
The Electron app must be running with log-to-file enabled (managed in `main.ts`).
