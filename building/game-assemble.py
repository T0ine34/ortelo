import sys
import os
from zipfile import ZipFile
import subprocess
from config import Config
import shutil

PARENT_FOLDER = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class ProgressBar:
    def __init__(self, total = 100, width = 50):
        self.total = total
        self.current = 0
        self.last = 0
        self.width = width
        
    def update(self, current):
        self.current = current
        if self.current > self.total:
            self.current = self.total
        if self.current != self.last:
            self.last = self.current
            self.draw()
            
    def draw(self):
        percent = self.current / self.total
        filled = int(percent * self.width)
        print("\r[%s%s] %d%%" % ("#" * filled, " " * (self.width - filled), percent * 100), end = "")
    
    def erase(self):
        print("\r" + " " * (self.width + 10), end = "\r")
        
    def finish(self):
        print("\r[%s] %d%%" % ("#" * self.width, 100))
        
    def print(self, *values, sep = " ", end = "\n"):
        self.erase()
        print(*values, sep = sep, end = end)
        self.draw()
        
    
    
def exists(obj, parent_folder):
    if type(obj) == str:
        return os.path.exists(os.path.join(parent_folder, obj))
    elif type(obj) == list:
        return all([exists(o, parent_folder) for o in obj])
    elif type(obj) == dict:
        return all([exists(o, parent_folder) for o in obj.values()])
    else:
        return False
    
def flatten(d : dict, parent_key = "", sep = "."):
    items = []
    for k, v in d.items():
        new_key = parent_key + sep + k if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten(v, new_key, sep = sep).items())
        else:
            items.append((new_key, v))
    return dict(items)
    
class Game:
    def __init__(self, path):
        if not os.path.exists(path):
            raise FileNotFoundError("Game folder not found: " + path)
        if not os.path.isdir(path):
            raise NotADirectoryError("Game folder is not a directory: " + path)
        self.path = path
        
        self.index = Config(os.path.join(path, "index.json"))
        
        self.check_index_content()
        
    def check_index_content(self):
        for key in ["name", "version", "mainscript", "html", "server"]:
            if not self.index.has(key):
                raise KeyError("Key %s not found in index.json" % key)
            if not self.index[key]:
                raise ValueError("Key %s cannot be empty in index.json" % key)
        for key, path in self.index.items():
            if key not in ["name", "version", "description"]:
                if not exists(path, self.path):
                    raise FileNotFoundError("File %s not found" % path)

    def obfusc(self, p=None, tmp_path=None):
        if tmp_path is None:
            subprocess.check_call(["node", "obfusc.js", "public"])
        else:
            shutil.copyfile(os.path.join(self.path, p), tmp_path)
            subprocess.check_call(["node", "obfusc.js", "game", f"{tmp_path}"])
    def build(self, output_folder):
        # compress all files listed in index.json in a zip file name name.game
        self.obfusc()
        name = self.index["name"].lower()
        version = self.index["version"]
        filename = "%s.game" % name
        path = os.path.join(output_folder, filename)
        if os.path.exists(path):
            os.remove(path)
        flat = self.index.flatten()
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)
        with ZipFile(path, "w") as zip:
            for key, p in flat.items():
                if key not in ["name", "version", "description"]:
                    if ".js" == p[-3:]:
                        #depend of windows and linux
                        tmp_value = os.environ.get('TMP', '/tmp')
                        tmp_path = os.path.join(tmp_value, p)
                        open(tmp_path, "w", encoding="utf8").close()
                        self.obfusc(p, tmp_path)
                        zip.write(tmp_path, p)
                        os.remove(tmp_path)
                    else:
                        zip.write(os.path.join(self.path, p), p)
            zip.write(os.path.join(self.path, "index.json"), "index.json")
    
    
def get_game_list(folder):
    games = []
    abs_folder = os.path.abspath(folder)
    for folder in os.listdir(folder):
        path = os.path.join(abs_folder, folder, "index.json")
        if os.path.exists(path):
            games.append(os.path.join(abs_folder, folder))
    return games

def  build_game(game_path, output_folder):
    game = Game(game_path)
    game.build(output_folder)
    return game.index["name"]
    
def main(source_folder, output_folder):
    
    games = get_game_list(source_folder)
    
    pb = ProgressBar(len(games), 100)
    for game_path in games:
        gamename = build_game(game_path, output_folder)
        pb.print("Game %s built" % gamename)
        pb.update(pb.current + 1)
    pb.finish()
    
    
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python game-assemble.py <source_folder>")
        sys.exit(1)
        
    if sys.argv[1] == "--game" or sys.argv[1] == "-g":
        if len(sys.argv) < 3:
            print("Usage: python game-assemble.py --game <game_folder>")
            sys.exit(1)
        name = build_game(os.path.join(os.getcwd(), sys.argv[2]), Config("server.config")["games_dir"])
        print("Game %s built" % name)
    
    else:
        main(sys.argv[1], Config(PARENT_FOLDER+"/server.config")["games_dir"])