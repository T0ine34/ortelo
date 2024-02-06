import sys
import os
import subprocess
from time import sleep
from typing import Callable


class Folder:
    def __init__(self, path):
        self.path = path
        self.files = {} # {path : edit_time}
        
    def first_scan(self):
        for root, dirs, files in os.walk(self.path):
            for file in files:
                self.files[os.path.join(root, file)] = os.path.getmtime(os.path.join(root, file))
    
    def get_edited_files(self):
        edited_files = []
        for file in self.files:
            if os.path.getmtime(file) != self.files[file]:
                edited_files.append(file)
                self.files[file] = os.path.getmtime(file)
        return edited_files
        
        
def watch_folder(path, callback: Callable):
    print("Watching folder %s for change..." % path)
    folder = Folder(path)
    folder.first_scan()
    try:
        while True:
            edited_files = folder.get_edited_files()
            if edited_files:
                callback(edited_files)
            sleep(1)
    except KeyboardInterrupt:
        print("Exiting...")
        

if __name__ == "__main__":
    PARENT_FOLDER = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    def callback(files):
        edited_games = []
        for file in files:
            rel_path = os.path.relpath(file, os.path.join(PARENT_FOLDER, "game"))
            gamename = rel_path.split(os.sep)[0]
            if gamename not in edited_games:
                edited_games.append(gamename)
        for game in edited_games:
            print("Building game %s" % game)
            subprocess.run([sys.executable, os.path.join(PARENT_FOLDER, "building", "game-assemble.py"), "--game", os.path.join(PARENT_FOLDER, "game", game)])
    
    watch_folder(os.path.join(PARENT_FOLDER, "game"), callback)
