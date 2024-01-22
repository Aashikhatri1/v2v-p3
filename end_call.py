# end_call.py
import pyautogui as pg
import time
import os
import sys

def monitor_end_call_button():
    while True:
        end_call = pg.locateOnScreen("buttons/end_call.png", confidence=0.98)
        if end_call:
            print("Call ended")
            return True
        time.sleep(5)  # Check every second

if __name__ == "__main__":
    if monitor_end_call_button():
        # Send a signal to Node.js process to terminate it
        os.kill(int(sys.argv[1]), 9)  # Replace '9' with appropriate signal if needed

