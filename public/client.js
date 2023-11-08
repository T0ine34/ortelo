const MAX_HISTORY_SIZE = 100;

let username
while (username == null || username == "") {
    username = prompt("Enter your username")
}

let csocket = new CSocket(io());

csocket.emit(EVENTS.MISC.USERNAME, username);                               //sending the newUser event to the server, with the username as parameter
csocket.on(EVENTS.CHAT.USER_JOINED, (timestamp, name) => {                                //catching the newUser event, triggered by the server when a new user joins the chat
    let item = document.createElement('li');
    item.textContent = name + " a rejoint le chat ! ";
    item.innerHTML += "&#128075;"
    item.innerHTML += String(timestamp);
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
})

csocket.on(EVENTS.CHAT.MESSAGE, (timestamp, username, msg) => {                   //catching the new_message event, triggered by the server when a user sends a message
    receive_message(timestamp, username, msg)
})

csocket.on(EVENTS.CHAT.USER_LEFT, (timestamp, username) => {                   //catching the new_message event, triggered by the server when a user sends a message
    let item = document.createElement('li');
    item.textContent = username + " a quitté le chat ! ";
    item.innerHTML += "&#128078;"
    let d = new Date(timestamp);
    item.innerHTML += "<span class=\"timestamp\">"+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+"</span>";
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

csocket.on(EVENTS.SYSTEM.ERROR, (timestamp, msg) => {                   //catching the new_message event, triggered by the server when a user sends a message
    let item = document.createElement('li');
    item.textContent = "Erreur : " + msg;
    let d = new Date(timestamp);
    item.innerHTML += "<span class=\"timestamp\">"+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+"</span>";
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

csocket.on(EVENTS.SYSTEM.WARNING, (timestamp, msg) => {                   //catching the new_message event, triggered by the server when a user sends a message
    let item = document.createElement('li');
    item.textContent = "Warning : " + msg;
    let d = new Date(timestamp);
    item.innerHTML += "<span class=\"timestamp\">"+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+"</span>";
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});


csocket.on(EVENTS.SYSTEM.BROADCAST, (timestamp, msg) => {              //catching the new_message event, triggered by the server when a user sends a message
    let item = document.createElement('li');
    item.textContent = "Broadcast : " + msg;
    let d = new Date(timestamp);
    item.innerHTML += "<span class=\"timestamp\">"+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+"</span>";
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

csocket.on(EVENTS.SYSTEM.INFO, (timestamp, msg) => {                   //catching the new_message event, triggered by the server when a user sends a message
    let item = document.createElement('li');
    item.textContent = "Info : " + msg;
    let d = new Date(timestamp);
    item.innerHTML += "<span class=\"timestamp\">"+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+"</span>";
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

let form = document.querySelector('#message_form');
let messages = document.querySelector('#messages');
let input = document.querySelector('#send_message');

let history = [];
let history_index = 0;

function history_up(){
    if(history_index > 0){
        history_index--;
        input.value = history[history_index];
    }
}
function history_down(){
    if(history_index < history.length){
        history_index++;
        if(history_index == history.length){
            input.value = "";
        }
        else{
            input.value = history[history_index];
        }
    }
}

input.addEventListener('keydown', function(e) {
    if(e.keyCode == 38){ //arrow up
        history_up();
    }
    else if(e.keyCode == 40){ //arrow down
        history_down();
    }
});

form.addEventListener('submit', function(e) {                   //this is triggered when the user click on "Send"
    e.preventDefault();
    if (input.value) {
        csocket.emit(EVENTS.CHAT.MESSAGE, username, input.value);     //sending the send_message event to the server, with the username and the message as parameters
        history.push(input.value);
        history_index = history.length;

        while(history.length > MAX_HISTORY_SIZE){
            history.shift(); //remove the first element
        }
        
        input.value = '';
    }
});


let receive_message = (timestamp, username, msg) => {
    let item = document.createElement('li');
    item.textContent = username + " : " + msg;
    let d = new Date(timestamp);
    item.innerHTML += "<span class=\"timestamp\">"+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+"</span>";
    messages.appendChild(item);
    //window.scrollTo(0, document.body.scrollHeight);
}