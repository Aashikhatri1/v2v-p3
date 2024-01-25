
# import subprocess
# import time
# import pyautogui as pg

# def call_js_chat():
#     try:
#         # Run the JavaScript file using Node.js
#         result = subprocess.run(['node', 'integrated.mjs'], capture_output=True, text=True)
#         print(result.stdout)
#     except Exception as e:
#         print("Error running JavaScript code:", e)

# call_js_chat()


import subprocess
import time
import pyautogui as pg
import webbrowser

def call_js_chat():
    try:
        # Start the JavaScript file using Node.js in a subprocess
        process = subprocess.Popen(['node', 'integratedReceptionist.mjs'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        # Continuously read and print the output
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print(output.strip())

        # Capture any errors
        err = process.stderr.read()
        if err:
            print("Error:", err)
    except Exception as e:
        print("Error running JavaScript code:", e)


def open_website(url):
        webbrowser.open(url, new=2)

# Opening call hipppo dialer
website = 'https://dialer.callhippo.com/dial'
open_website(website)

time.sleep(15)

while True:  # Main loop for handling incoming calls
    accept = pg.locateOnScreen("buttons/accept.png", confidence=0.9)
    if accept:
        x, y, width, height = accept
        click_x, click_y = x + width // 2, y + height // 2  # Calculate the center of the button
        print("Call received at coordinates:", (click_x, click_y))
        pg.moveTo(click_x, click_y)  # Move to the center of the button
        time.sleep(0.5)  # Short delay
        pg.mouseDown()
        time.sleep(0.1)  # Short delay to simulate a real click
        pg.mouseUp()
        print("Call accepted")
        call_js_chat()  # Start chat with user

        print("Waiting for next call...")
        time.sleep(5)
    else:
        print("No call detected.")
        time.sleep(5) 
