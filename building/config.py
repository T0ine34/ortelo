from json import load
from typing import Any
import os

class Config:
    def __init__(self, path):
        if not os.path.exists(path):
            raise FileNotFoundError("Config file not found: " + path+ " absolute path : "+os.path.abspath(path))
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