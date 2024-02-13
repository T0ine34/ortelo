from sqlite3 import connect
import os

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
