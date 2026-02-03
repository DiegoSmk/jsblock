from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_utility_nodes(page: Page):
    # Mock electronAPI
    page.add_init_script("""
        window.electronAPI = {
            checkPathExists: async () => true,
            ensureProjectConfig: async () => {},
            readFile: async () => 'console.log("hello")',
            writeFile: async () => {},
            discoverPlugins: async () => [],
            togglePlugin: async () => {},
            installPlugin: async () => {},
            uninstallPlugin: async () => {}
        };
    """)

    # Try multiple times to connect to localhost
    for i in range(10):
        try:
            page.goto("http://localhost:5173")
            break
        except:
            time.sleep(1)

    # Wait for store to be exposed
    page.wait_for_function("() => window.useStore !== undefined")

    # Open a dummy file to enable FlowContent
    page.evaluate("window.useStore.getState().setSelectedFile('test.js')")

    # Wait for app to load
    page.wait_for_selector(".canvas-toolbar", timeout=10000)

    # Click utility menu
    buttons = page.locator(".canvas-toolbar button")
    utility_btn = buttons.nth(1)
    utility_btn.click()

    # Click "Tarefa"
    page.get_by_text("Tarefa").click()

    # Add another one
    utility_btn.click()
    page.get_by_text("Tarefa").click()

    # Wait for nodes
    expect(page.locator(".react-flow__node-utilityNode")).to_have_count(2)

    nodes = page.locator(".react-flow__node-utilityNode")
    node1 = nodes.nth(0)
    node2 = nodes.nth(1)

    # Move nodes apart
    node2_box = node2.bounding_box()
    if node2_box:
        page.mouse.move(node2_box["x"] + 10, node2_box["y"] + 10)
        page.mouse.down()
        page.mouse.move(node2_box["x"] + 300, node2_box["y"] + 100)
        page.mouse.up()
        time.sleep(0.5)

    # Re-acquire boxes
    node1_box = node1.bounding_box()
    node2_box = node2.bounding_box()

    # Drag from node1 right to node2 left
    page.mouse.move(node1_box["x"] + node1_box["width"], node1_box["y"] + node1_box["height"] / 2)
    page.mouse.down()
    page.mouse.move(node2_box["x"], node2_box["y"] + node2_box["height"] / 2)
    page.mouse.up()

    time.sleep(1)

    # Screenshot normal
    page.screenshot(path="verification/verification.png")

    # Enable Debug Mode
    page.evaluate("window.useStore.getState().updateSettings({ showDebugHandles: true })")
    time.sleep(0.5)

    # Screenshot debug
    page.screenshot(path="verification/debug.png")

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
