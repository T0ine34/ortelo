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

def is_version_greater(v1, v2):
    """Check if version1 is greater than version2."""
    v1 = [int(x) for x in v1.split(".")]
    v2 = [int(x) for x in v2.split(".")]
    return v1 > v2

def is_version_lower_or_equal(v1, v2):
    """Check if version1 is lower or equal to version2."""
    return not is_version_greater(v1, v2)
    
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
        updates = sorted(os.listdir(update_dir), key=lambda s: s.split(".")[:-1])
        current_version = versionFile["database"]
        while is_version_lower_or_equal(remove_extension(updates[0]), current_version):
            updates.pop(0)
            if len(updates) == 0:
                print("Database is already up to date")
                return
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
        print("Error :", e)
        return 1
    return 0
    
if __name__ == "__main__":
    exit(main())