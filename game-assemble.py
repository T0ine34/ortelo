import sys
import os
from json import load
from typing import Any
from zipfile import ZipFile
from shutil import copyfile

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
        
    

class Config:
    def __init__(self, path):
        if not os.path.exists(path):
            raise FileNotFoundError("Config file not found: " + path)
        with open(path) as f:
            self.data = load(f)
        self.path = path
    
    def get(self, _key):
        keys = _key.split(".")
        data = self.data
        for i, key in enumerate(keys):
            try:
                data = data[key]
            except KeyError:
                raise KeyError("Key %s not found in %s" % (key, '.'.join(keys[:i])))
            
        # replace all "%key%" by the value of key recursively
        if type(data) == str and "%" in data:
            data2 = ""
            i = 0
            while i < len(data):
                if data[i] == "%":
                    j = data.find("%", i + 1)
                    if j == -1:
                        raise ValueError("Invalid string: %s" % data)
                    key = data[i + 1:j]
                    if key not in self.data:
                        raise KeyError("Key %s not found in %s" % (key, _key))
                    data2 += str(self.get(key))
                    i = j+1
                else:
                    data2 += data[i]
                    i += 1
            data = data2
        return data
    
    def __getitem__(self, key):
        return self.get(key)
    
    def has(self, key):
        try:
            self.get(key)
            return True
        except KeyError:
            return False
        
    def __contains__(self, key):
        return self.has(key)
    
    def items(self):
        return self.data.items()
    
    def __iter__(self):
        return iter(self.data)
    
    def flatten(self):
        return self._flatten()
    
    def _flatten(self, data = None, parent_key = "", sep = "."):
        if data is None:
            data = self.data
        items = []
        for k, v in data.items():
            new_key = parent_key + sep + k if parent_key else k
            if isinstance(v, dict):
                items.extend(self._flatten(v, new_key, sep = sep).items())
            else:
                items.append((new_key, v))
        return dict(items)
    
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
    
    
    def build(self, output_folder):
        # compress all files listed in index.json in a zip file name name.game
        name = self.index["name"].lower()
        version = self.index["version"]
        filename = "%s.game" % name
        path = os.path.join(output_folder, filename)
        if os.path.exists(path):
            os.remove(path)
        flat = self.index.flatten()
        with ZipFile(path, "w") as zip:
            for key, p in flat.items():
                if key not in ["name", "version", "description"]:
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
    
def main(source_folder, output_folder):
    
    games = get_game_list(source_folder)
    
    pb = ProgressBar(len(games), 100)
    for game_path in games:
        game = Game(game_path)
        game.build(output_folder)
        pb.print("Game %s built" % game.index["name"])
        pb.update(pb.current + 1)
    pb.finish()
    
    
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python game-assemble.py <source_folder>")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else Config("server.config")["games_dir"])