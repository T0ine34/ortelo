class Stack {
    constructor() {
        this.items = [];
    }

    push(element) {
        this.items.push(element);
    }

    pop() {
        if (this.items.length == 0)
            return "Underflow";
        return this.items.pop();
    }

    peek() {
        return this.items[this.items.length - 1];
    }
}

class Queue {
    constructor() {
        this.items = [];
    }

    enqueue(element) {
        this.items.push(element);
    }

    dequeue() {
        if (this.isEmpty())
            return "Underflow";
        return this.items.shift();
    }

    front() {
        if (this.isEmpty())
            return "No elements in Queue";
        return this.items[0];
    }

    isEmpty() {
        return this.items.length == 0;
    }
}

try{
    module.exports = { Stack };
}
catch(e){
    // we are loading it in the browser
}
