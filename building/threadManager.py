# import threading as th
import multiprocessing as mp
from multiprocessing import Queue
from time import sleep
from typing import Callable, Any


class Task:
    def __init__(self, target : Callable, args : tuple = (), kwargs : dict = {}, callback : Callable = None):
        self.target = target
        self.args = args
        self.kwargs = kwargs
        self.result = None
        self.error = None
        self.ran = False
        self._callback = callback
        
    def run(self):
        try:
            self.result = self.target(*self.args, **self.kwargs)
        except Exception as e:
            self.error = e
        self.ran = True
            
    def __call__(self):
        self.run()
        return self.result
    
    def callback(self):
        if self._callback:
            self._callback(self.result)
        
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
    
    def __init__(self, maxProcesses = mp.cpu_count() - 1):
        self.processes = []
        self.maxProcesses = maxProcesses
        self.lock = mp.Lock()
        self.queue = Queue()
        
    def add(self, target : Callable, args : tuple = (), kwargs : dict = {}, callback : Callable = None):
        task = Task(target, args, kwargs, callback)
        self.queue.put(task)
        return task
    
    @staticmethod
    def _threadRun(task : Task):
        task.run()
    
    
    def run(self):
        while not self.queue.empty():
            if len(self.processes) < self.maxProcesses: # we can start a new process
                task = self.queue.get()
                process = mp.Process(target = ThreadManager._threadRun, args = (task,))
                process.start()
                self.processes.append((process, task))
            else:
                for process, task in self.processes: # check if any process is done
                    if not process.is_alive():
                        process.join()
                        task.callback()
                        self.processes.remove((process, task))
                        break
                sleep(0.1)
        
    def __repr__(self):
        return f"ThreadManager({self.maxProcesses})"