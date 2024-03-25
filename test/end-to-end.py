import sys, os
import subprocess as sp

def exec(cmd, *args):
    return sp.run([cmd, *args], stdout=sys.stdout, stderr=sys.stderr, shell=True)


for script in os.listdir("test/end-to-end"): # List all files in the test/client directory
    if script.startswith("test-") and script.endswith(".py"): #only execute files that start with test- and end with .py
        print("Running", script)
        print(f"\"{sys.executable} test/end-to-end/{script}\"") 
        result = exec(sys.executable, f"test/end-to-end/{script}").returncode # Execute the script and store the output code
        if result != 0:
            print("Test failed")
            exit(1)
        print("Test passed")
exit(0)