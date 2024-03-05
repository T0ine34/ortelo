from sqlite3 import connect
import os
try:
    from json5 import load, dump
except ImportError:
    from install import install
    install("json5")
    from json5 import load, dump
from config import Config
from typing import Any


class Version:
    class Tag:
        def __init__(self, string):
            self.string = string
            self.parts = string.split(".")
            if not all(map(lambda x: str.isdigit(x) or x.isalpha() or x == "", self.parts)):
                raise ValueError("Invalid tag: " + string)
            
        def __str__(self):
            return self.string
        
        def __eq__(self, other):
            return self.string == other.string
        
        def __lt__(self, other):
            for i in range(min(len(self.parts), len(other.parts))):
                if str.isdigit(self.parts[i]) and str.isdigit(other.parts[i]): # compare as integers
                    if int(self.parts[i]) < int(other.parts[i]):
                        return True
                    elif int(self.parts[i]) > int(other.parts[i]):
                        return False
                else: # compare as strings using the ASCII order
                    if self.parts[i] < other.parts[i]:
                        return True
                    elif self.parts[i] > other.parts[i]:
                        return False
            return len(self.parts) < len(other.parts) # if all parts are equal, the shorter one is lesser
        
        def __gt__(self, other):
            return not self.__lt__(other)
        
        def __le__(self, other):
            return self.__lt__(other) or self.__eq__(other)
        
        def __ge__(self, other):
            return not self.__lt__(other)
        
        def __ne__(self, other):
            return not self.__eq__(other)
    
    
    def __init__(self, string):
        self.string = string
        tokens = string.split("-")
        if len(tokens) == 1: # no tag
            self.tag = Version.Tag("")
            self.version = tokens[0].split(".")
        elif len(tokens) == 2:
            self.tag = Version.Tag(tokens[1])
            self.version = tokens[0].split(".")
        else:
            raise ValueError("Invalid version string: " + string + " (version must be in the form major.minor.patch[-tag])")
        
        if len(self.version) != 3:
            raise ValueError("Invalid version string: " + string + " (version must be in the form major.minor.patch[-tag])")
        
        if not all(map(lambda x: str.isdigit(x) and int(x)>=0, self.version)):
            raise ValueError("Invalid version string: " + string + " (version must be in the form major.minor.patch[-tag] and each part must be a positive integer)")
        
        self.version = [int(x) for x in self.version]
    
    def __str__(self):
        return self.string
    
    def __eq__(self, other): # ==
        return self.string == other.string
    
    def __lt__(self, other): # <
        #compare the version first
        if self.version < other.version:
            return True
        elif self.version > other.version:
            return False
        # if the version is the same, compare the tag
        return self.tag < other.tag
    
    def __gt__(self, other): # >
        return not self.__lt__(other)
    
    def __le__(self, other): # <=
        return self.__lt__(other) or self.__eq__(other)
    
    def __ge__(self, other): # >=
        return not self.__lt__(other)
    
    def __ne__(self, other): # !=
        return not self.__eq__(other)
    
    def same_version(self, other):
        """Check if two versions have the same version number (excluding the tag)."""
        return self.version == other.version


def _is_version_greater(v1, v2):
    """Check if version1 is greater than version2."""
    v1 = [int(x) for x in v1.split(".")]
    v2 = [int(x) for x in v2.split(".")]
    return v1 > v2

def is_tag_greater(t1, t2):
    t1 = t1.split(".")
    t2 = t2.split(".")
    for i in range(min(len(t1), len(t2))):
        if str(t1[i]).isdigit() and str(t2[i]).isdigit(): # compare as integers
            if int(t1[i]) > int(t2[i]):
                return True
            elif int(t1[i]) < int(t2[i]):
                return False
        else:                                             # compare as strings
            if t1[i] > t2[i]:
                return True
            elif t1[i] < t2[i]:
                return False
    return len(t1) > len(t2) # if all tags are equal, the longer one is greater
    
def remove_extension(path):
    """Remove the extension of a file."""
    return ".".join(path.split(".")[:-1])


class Database:
    @staticmethod
    def exists(path):
        return os.path.exists(path)
    
    def __init__(self, path):
        self.path = path
        self.conn = connect(path)
        self.conn.row_factory = self.dict_factory
        self.cursor = self.conn.cursor()
        
    def __del__(self):
        self.conn.close()
        
    def dict_factory(self, cursor, row):
        """Convert a row to a dictionary.
        """
        return {col[0]: row[i] for i, col in enumerate(cursor.description)}
    
    def execute(self, *args, **kwargs):
        """Execute a SQL query."""
        return self.cursor.execute(*args, **kwargs)
    
    def executescript(self, *args, **kwargs):
        """Execute a SQL script."""
        return self.cursor.executescript(*args, **kwargs)
    
    def commit(self):
        self.conn.commit()
        
    def run(self, *args, **kwargs):
        self.execute(*args, **kwargs)
        return self.fetchall()
    
    def run_file(self, path):
        """Run a SQL file."""
        with open(path) as f:
            self.executescript(f.read())
        return self.fetchall()
        
    def fetchall(self):
        return self.cursor.fetchall()
    
    def contain_table(self, table_name):
        """Check if a table exists."""
        self.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        return len(self.fetchall()) > 0
    
class VersionFile:
    def __init__(self, path):
        self.path = path
        if not os.path.exists(path):
            with open(path, "w") as f:
                dump({"database": "0.0.0"}, f)
        with open(path) as f:
            self.data = load(f) # type: Any
    
    def __getitem__(self, key):
        return self.data[key]
    
    def __setitem__(self, key, value):
        self.data[key] = value
        with open(self.path, "w") as f:
            dump(self.data, f, indent=4, quote_keys=True, trailing_commas=False)
    
    def __contains__(self, key):
        return key in self.data
    
    def __str__(self):
        return str(self.data)

class ServerDatabase:
    def __init__(self, config : Config|str):
        if isinstance(config, str):
            config = Config(config)
        self.config = config
        self.db = Database(config["database.path"])
        if not self.db.contain_table("player"):
            self.init()
    
    def init(self):
        """Initialize the database."""
        self.db.run_file(self.config["database.createTablesPath"])
        self.db.commit()
        
    def __del__(self):
        del self.db
        
    def update(self):
        """Update the database to the latest version."""
        versionFile = VersionFile(self.config["versionFile"])
        update_dir = self.config["database.updateTablesFolder"]
        if not os.path.isdir(update_dir):
            raise FileNotFoundError("Update directory not found: " + update_dir)
        updates = sorted(os.listdir(update_dir), key=lambda s: s.split(".")[:-1]) # contains the list of updates available in the update directory
        current_version = Version(versionFile["database"]) #the current version of the database
        version = Version(remove_extension(updates[0])) # the version of the first update
        # while is_version_lower_or_equal(remove_extension(updates[0]), current_version):
        while version <= current_version: #skip the updates that are already applied
            updates.pop(0) # remove the updates that are already applied
            if len(updates) == 0:
                print("Database is already up to date")
                return
            version = Version(remove_extension(updates[0])) # the version of the next candidate update
        print("Updates to apply:", updates)
        for update in updates:
            print("Applying update:", update)
            try:
                self.db.run_file(os.path.join(update_dir, update))
            except Exception as e:
                print("Error while applying update %s: %s" % (update, e))
                break
            finally: # always update the version
                versionFile["database"] = ".".join(update.split(".")[:-1])
                
        self.db.commit()
        
        
        

def main():
    config = Config("server.config")
    db = ServerDatabase(config)
    try:
        db.update()
    except Exception as e:
        print("Error :", e, "on line", e.__traceback__.tb_next.tb_lineno if hasattr(e, "__traceback__") else 0, #type: ignore
                "in file", e.__traceback__.tb_next.tb_frame.f_code.co_filename if hasattr(e, "__traceback__") else "unknown") #type: ignore
        return 1
    return 0
    
if __name__ == "__main__":
    exit(main())