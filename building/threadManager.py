import threading as th
from queue import Queue
from time import sleep
from typing import Callable


class Task:
    def __init__(self, target : Callable, args : tuple = (), kwargs : dict = {}):
        self.target = target
        self.args = args
        self.kwargs = kwargs
        self.result = None
        self.error = None
        self.ran = False
        
    def run(self):
        try:
            self.result = self.target(*self.args, **self.kwargs)
        except Exception as e:
            self.error = e
        self.ran = True
            
    def __call__(self):
        self.run()
        return self.result
        
    def __repr__(self):
        return f"Task({self.target.__name__}, {self.args}, {self.kwargs})"

    def get(self):
        if not self.ran:
            raise Exception("Task not run yet")
        return self.result
    
    def getError(self):
        if not self.ran:
            raise Exception("Task not run yet")
        return self.error
    
    def isDone(self):
        return self.ran
    


class ThreadManager:
    __instance = None
    @staticmethod
    def __new__(cls, *args, **kwargs):
        if cls.__instance is None:
            cls.__instance = super(ThreadManager, cls).__new__(cls)
            cls.__instance.__init__()
        return cls.__instance
    
    def __init__(self, maxThreads = 10):
        self.threads = []
        self.maxThreads = maxThreads
        self.lock = th.Lock()
        self.queue = Queue()
        
    def add(self, target : Callable, args : tuple = (), kwargs : dict = {}):
        task = Task(target, args, kwargs)
        self.queue.put(task)
        return task
    
    def _threadRun(self):
        while not self.queue.empty():
            self.lock.acquire()
            task = self.queue.get()
            self.lock.release()
            task.run()
    
    def run(self):
        for _ in range(min(self.maxThreads, self.queue.qsize())):
            thread = th.Thread(target=self._threadRun)
            self.threads.append(thread)
            thread.start()
            
        # Wait for all threads to finish
        for thread in self.threads:
            thread.join()
        self.threads = []
        
    def clear(self):
        self.queue = Queue()
        self.threads = []
        
    def __repr__(self):
        return f"ThreadManager({self.maxThreads})"