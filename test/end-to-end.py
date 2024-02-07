import sys, os

for script in os.listdir("test/end-to-end"): # List all files in the test/client directory
    if script.startswith("test-") and script.endswith(".py"): #only execute files that start with test- and end with .py
        print("Running", script)
        result = os.system(sys.executable + " test/end-to-end/" + script) # Execute the script and store the output code
        if result != 0:
            print("Test failed")
            exit(1)
        print("Test passed")
exit(0)