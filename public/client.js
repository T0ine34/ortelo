let socket

let mydiv = document.createElement('div');
mydiv.id = 'usernameDiv'

let myForm = document.createElement('form')
myForm.id = 'usernameForm'
myForm.innerHTML = '<input id="usernameInput" autocomplete="on" placeholder="Choisir un pseudo" /><button>CHOISIR</button>'

mydiv.appendChild(myForm)
document.body.appendChild(mydiv);

myForm.addEventListener('submit', function(e){                      //this is triggered when the user click on "CHOISIR"
    e.preventDefault()
    let uin = document.querySelector("#usernameInput")
    if(!uin.value) return;
    myForm.style.display = 'none'
    socket = io();

    let username = uin.value
    socket.emit('newUser', username);                               //sending the newUser event to the server, with the username as parameter

    socket.on('newUser', (name) => {                                //catching the newUser event, triggered by the server when a new user joins the chat
        let item = document.createElement('li');
        item.textContent = name + " a rejoint le chat ! ";
        item.innerHTML += "&#128075;"
        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
    })

    socket.on('new_message', (username, msg) => {                   //catching the new_message event, triggered by the server when a user sends a message
        receive_message(username, msg)
    })

    let form = document.querySelector('#message_form');
    let messages = document.querySelector('#messages');
    let input = document.querySelector('#send_message');

    form.addEventListener('submit', function(e) {                   //this is triggered when the user click on "Send"
        e.preventDefault();
        if (input.value) {
            socket.emit('send_message', username, input.value);     //sending the send_message event to the server, with the username and the message as parameters
            input.value = '';
        }
    });
    
})


let receive_message = (username, msg) => {
    let item = document.createElement('li');
    item.textContent = username + " : " + msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
}