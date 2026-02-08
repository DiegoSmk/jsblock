from playwright.sync_api import sync_playwright
import time
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Page Error: {err}"))

        # Mock electron API
        mock_path = os.path.join(os.path.dirname(__file__), 'mock_electron.js')
        try:
            with open(mock_path, 'r') as f:
                mock_electron = f.read()
            page.add_init_script(mock_electron)
        except Exception as e:
            print(f"Error reading mock file: {e}")
            return

        # Wait for server to be ready (naive wait, loop is better)
        time.sleep(5)

        try:
            page.goto("http://localhost:5173")
        except Exception as e:
            print(f"Failed to load page: {e}")
            return

        # Wait for app to load
        try:
            # Click Open Folder to enable search
            open_folder_btn = page.wait_for_selector('text="Open Folder"', timeout=10000)
            open_folder_btn.click()

            # Wait for folder to be opened (store update)
            time.sleep(1)

            # Check if search button exists (title="Search")
            search_button = page.wait_for_selector('button[title="Search"]', timeout=10000)
            search_button.click()

            # Wait for search input
            search_input = page.wait_for_selector('input[placeholder="Search"]', timeout=5000)

            # Type 'test'
            search_input.fill('test')
            search_input.press('Enter')

            # Wait for results to appear
            # We expect "3 results" text or similar
            page.wait_for_selector('text=3 results', timeout=5000)

            # Take screenshot
            page.screenshot(path="verification/search_verification.png")
            print("Screenshot saved to verification/search_verification.png")

        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="verification/error_screenshot.png")

        browser.close()

if __name__ == "__main__":
    run()
