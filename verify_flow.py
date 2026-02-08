import sys
import os
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Mock window.electron
    mock_path = os.path.join(os.path.dirname(__file__), 'verification/mock_electron.js')
    if not os.path.exists(mock_path):
        mock_path = 'verification/mock_electron.js'

    try:
        with open(mock_path, 'r') as f:
            mock_electron = f.read()
        page.add_init_script(mock_electron)
    except Exception as e:
        print(f"Error reading mock file: {e}")
        return

    page.goto("http://localhost:5173")

    try:
        # Click "Open Folder"
        print("Clicking Open Folder...")
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
        os.makedirs("verification", exist_ok=True)
        page.screenshot(path="verification/flow_content.png")
    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
