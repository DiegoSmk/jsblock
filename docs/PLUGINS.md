# 🧩 JS Block - Plugin Development Guide

Welcome! This guide explains how to create your own plugins for **JS Block**. Our plugin system is designed to be secure, isolated, and easy to use.

---

## 🏗️ Architecture

Plugins in JS Block run in an isolated **Extension Host** (a separate child process). This means:
- **Stability**: A slow or crashed plugin won't freeze the main editor UI.
- **Security**: Plugins have no direct access to the Node.js API or the DOM. They interact with the app via a checked, restricted API called `JSBlock`.

---

## 📁 Plugin Structure

A plugin is simply a folder inside your app's `plugins` directory.

**Standard path:**
- **Linux**: `~/.config/js-blueprints-electron/plugins/`
- **Windows**: `%APPDATA%/js-blueprints-electron/plugins/`
- **macOS**: `~/Library/Application Support/js-blueprints-electron/plugins/`

### 1. `plugin.json` (Manifest)
This file tells JS Block who you are and where to start.

```json
{
    "id": "my-cool-plugin",
    "name": "My Cool Plugin",
    "version": "1.0.0",
    "description": "Adds awesome features to JS Block",
    "entry": "index.js"
}
```

### 2. Entry Point (`index.js`)
Your main code must export an `activate` function.

```javascript
module.exports = {
    /**
     * Called when the plugin is loaded.
     * @param {Object} jsBlock - The restricted API object.
     */
    activate: (jsBlock) => {
        console.log("My plugin is alive!");
        
        // Example: Show a notification
        jsBlock.notifications.show("Hello from My Cool Plugin!");
    },

    /**
     * Called when the plugin is disabled or the app closes.
     */
    deactivate: () => {
        console.log("Goodbye!");
    }
};
```

---

## 🛠️ The `JSBlock` API

The `jsBlock` object provided to your `activate` function is your gateway to the application.

### `jsBlock.notifications`
- `show(message)`: Displays a toast message in the main UI.

*(More API features like Workspace access and Sidebar contributions are coming soon!)*

---

## 🚀 Creating your first plugin

1.  Navigate to the `plugins` folder.
2.  Create a folder named `hello-world`.
3.  Inside, create `plugin.json` and `index.js`.
4.  Copy the examples above.
5.  Restart **JS Block**.
6.  You should see your notification appear after 2 seconds!

---

## 🛡️ Best Practices

1.  **Don't try to access global Node APIs**: `fs`, `path`, or `child_process` are not directly available. Use the `jsBlock` API instead.
2.  **Async/Await**: Feel free to use modern JS features; the host runs on a recent Node.js version.
3.  **Performance**: Keep your `activate` logic light. If you need heavy processing, use `setTimeout` or `Promise` to avoid blocking the host startup.
