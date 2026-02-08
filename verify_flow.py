import sys
import os
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Mock window.electron
    mock_electron = """
    window.electron = {
        selectFolder: async () => '/test',
        workspace: {
            openFolder: async () => ({
                path: '/test',
                tree: [
                    { name: 'test.js', path: '/test/test.js', kind: 'file' }
                ]
            }),
            search: async () => [],
            replace: async () => []
        },
        fileSystem: {
            checkPathsExists: async () => Promise.resolve({'/test/test.js': true}),
            readDir: async () => ([
                { name: 'test.js', isDirectory: false }
            ]),
            readFiles: async () => Promise.resolve({
                '/test/test.js': 'const a = 1;'
            }),
            readFile: async (path) => 'const a = 1;',
            writeFile: async () => {},
            ensureProjectConfig: async () => {}
        },
        executionStart: () => {},
        onExecutionStarted: () => {},
        onExecutionDone: () => {},
        onExecutionLog: () => {},
        onExecutionError: () => {},
        onExecutionClear: () => {},
        onSystemStats: () => {},
        checkExists: async () => true,
        discoverPlugins: async () => [],
        executionCheckAvailability: async () => ({ node: true, bun: false, deno: false }),
        executionSetRuntime: () => {}
    };
    """
    page.add_init_script(mock_electron)

    page.goto("http://localhost:5173")

    try:
        # Click "Open Folder"
        print("Clicking Open Folder...")
        # The button text might be inside a span or icon?
        # The code says: {t('file_explorer.open_button')}
        # I'll try to find button with text "Open Folder" or similar.
        # But wait, localization?
        # Assuming English or key fallback.
        # "file_explorer.open_button" translation.
        # I'll try to find by role button.

        # In the screenshot it says "Open Folder" inside the button.
        page.get_by_role("button", name="Open Folder").click()

        # Wait for file in explorer
        print("Waiting for file...")
        page.wait_for_selector("text=test.js", timeout=5000)

        # Click the file to open it
        print("Clicking file...")
        page.click("text=test.js")

        # Wait for ReactFlow to load
        print("Waiting for ReactFlow...")
        page.wait_for_selector(".react-flow", timeout=10000)
        print("ReactFlow found!")

        # Take screenshot
        os.makedirs("/home/jules/verification", exist_ok=True)
        page.screenshot(path="/home/jules/verification/flow_content.png")
    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="/home/jules/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
