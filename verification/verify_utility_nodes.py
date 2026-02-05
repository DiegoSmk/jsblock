from playwright.sync_api import Page, expect, sync_playwright
import time
import json

def verify_utility_nodes(page: Page):
    # Mock electronAPI
    page.add_init_script("""
        window.electron = {
            fileSystem: {
                checkExists: async () => true,
                ensureProjectConfig: async () => {},
                readFile: async (path) => {
                    if (path.endsWith('.block')) {
                        return JSON.stringify({ nodes: [], edges: [] });
                    }
                    return 'console.log("hello")';
                },
                writeFile: async () => {},
            },
            discoverPlugins: async () => [],
            togglePlugin: async () => {},
            installPlugin: async () => {},
            uninstallPlugin: async () => {}
        };
    """)

    page.goto("http://localhost:5173")

    # Wait for store to be exposed
    page.wait_for_function("() => window.useStore !== undefined")

    # 2. Verify Toolbar VISIBLE in Note Mode
    page.evaluate("window.useStore.getState().setSelectedFile('notes.block')")
    page.wait_for_selector(".canvas-toolbar", timeout=10000)

    # Add nodes
    buttons = page.locator(".canvas-toolbar button")
    utility_btn = buttons.nth(1)
    utility_btn.click()
    page.get_by_text("Tarefa").click()
    utility_btn.click()
    page.get_by_text("Tarefa").click()

    expect(page.locator(".react-flow__node-utilityNode")).to_have_count(2)

    # Get handles of first node
    # Since there are multiple nodes, we scope to first one.
    node1 = page.locator(".react-flow__node-utilityNode").nth(0)
    node2 = page.locator(".react-flow__node-utilityNode").nth(1)

    # Move node2 away
    node2_box = node2.bounding_box()
    page.mouse.move(node2_box["x"] + 10, node2_box["y"] + 10)
    page.mouse.down()
    page.mouse.move(node2_box["x"] + 300, node2_box["y"] + 100)
    page.mouse.up()
    time.sleep(0.5)

    # Find right handle of node 1
    # Note: UtilityNode uses Position.Right for the right handle.
    # React Flow renders it with class 'react-flow__handle-right'.
    handle1 = node1.locator(".react-flow__handle-right").nth(0)
    # Use nth(0) because there are Source and Target at same position (Hybrid).
    # Source handle is draggable. Target is connectable (receiving).
    # Actually, both are connectable=true.
    # But to start a connection, we usually drag from Source.
    # I have two handles at Right: Source and Target.
    # Which one is on top? They have same zIndex. DOM order matters.
    # In UtilityNode:
    # <Handle type="target" ... />
    # <Handle type="source" ... />
    # Source is rendered second, so it is on top. Good.

    # Ensure handle is visible/interactive.
    # It might be opacity 0.
    # Playwright can force hover on node to make it visible.
    node1.hover()
    time.sleep(0.2)

    handle1_box = handle1.bounding_box()
    if not handle1_box:
        raise Exception("Handle 1 not found")

    # Drag from handle 1 center
    page.mouse.move(handle1_box["x"] + handle1_box["width"] / 2, handle1_box["y"] + handle1_box["height"] / 2)
    page.mouse.down()

    # Move to handle 2 (Left of node 2)
    handle2 = node2.locator(".react-flow__handle-left").nth(0) # Target or Source, doesn't matter for target
    node2.hover() # Make handle visible
    handle2_box = handle2.bounding_box()

    page.mouse.move(handle2_box["x"] + handle2_box["width"] / 2, handle2_box["y"] + handle2_box["height"] / 2)
    page.mouse.up()

    time.sleep(1)

    # Screenshot
    page.screenshot(path="verification/verification.png")

    count = page.locator(".react-flow__edge").count()
    print(f"Edges found: {count}")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_utility_nodes(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
