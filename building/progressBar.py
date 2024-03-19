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
    
    def __iadd__(self, other : int):
        self.update(self.current + other)
        return self
    
    def __isub__(self, other : int):
        self.update(self.current - other)
        return self