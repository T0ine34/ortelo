import os, sys
from json5 import load
import subprocess as sp
import re
import shutil
from typing import Callable

from progressBar import ProgressBar

from threadManager import Task, ThreadManager

PROGRESS = ProgressBar()

def callback(file):
    global PROGRESS
    PROGRESS += 1

class Config:
    def __init__(self, path):
        with open(path, "r") as file:
            self.data = load(file) #type: dict
            
    def __getitem__(self, key):
        return self.data[key]
    
    def get(self, key, default):
        return self.data.get(key, default)



def scanRec(path):
    '''
    Scans a directory recursively and returns a list of all files in it.
    '''
    result = []
    for root, dirs, files in os.walk(path):
        for file in files:
            result.append(os.path.join(root, file))
    return result

def filterExt(files, ext):
    '''
    Filters a list of files by extension.
    '''
    return [file for file in files if file.endswith(ext)]

def docFile(file, outputFolder, callback : Callable|None = None):
    outputName = os.path.dirname(file)+".md" if os.path.dirname(file) != "." else '.'.join(file.split('.')[:-1]) + ".md"   
    os.makedirs(os.path.dirname(outputFolder + "\\" + outputName), exist_ok=True) # Create the output folder if it doesn't exist
    if not os.path.exists(outputFolder + "\\" + outputName):
        open(outputFolder + "\\" + outputName, "w").close()
    
    output = sp.run(f"npx jsdoc2md {file}", shell=True, stdout=sp.PIPE).stdout.decode("utf-8")
    with open(outputFolder + "\\" + outputName, "a", encoding="utf-8") as file:
        file.write(output)
        
    if callback:
        callback(outputFolder + "\\" + outputName)
        
    return outputFolder + "\\" + outputName

def scan(source : dict):
    result_tmp = []
    includePattern = source.get("includePattern", ".*")
    excludePattern = source.get("excludePattern", "^$")
    for include in source.get("include", []):
        paths = scanRec(include)
        paths = filterExt(paths, source.get("ext", ".js"))
        paths = [path.replace("\\", "/") for path in paths]
        for path in paths:
            if re.match(includePattern, path) and not re.match(excludePattern, path):
                result_tmp.append(path)
                
    result = result_tmp.copy()
    
    for res in result_tmp:
        for exclude in source.get("exclude", []):
            exclude = exclude.replace("\\", "/")
            if re.match(exclude, res) and res.startswith(exclude):
                result.remove(res)
                break
    return result
    
def main(configFile):   
    global PROGRESS 
    if not os.path.exists(configFile):
        raise FileNotFoundError(f"Config file {configFile} not found")
    config = Config(configFile)
    
    files = scan(config["source"])
    outputFolder = config["opts"]["MdDestination"]
    mainFile = config["opts"]["readme"]
    
    shutil.rmtree(outputFolder, ignore_errors=True)
    os.makedirs(outputFolder)
    
    print(len(files), "files found")
    
    PROGRESS.setTotal(len(files))
    PROGRESS.draw()
    
    TM = ThreadManager()
    
    for file in files:
        # docFile(file, outputFolder, callback)
        TM.add(docFile, (file, outputFolder), callback=callback)
    TM.run()
    
    shutil.copy(mainFile, outputFolder+"\\home.md")
    
    PROGRESS.erase()
    print("Done")
    
if __name__ == "__main__":
    configFile = sys.argv[1] if len(sys.argv) > 1 else "jsdoc.config"
    main(configFile)