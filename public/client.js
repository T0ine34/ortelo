let socket

let mydiv = document.createElement('div');
mydiv.id = 'usernameDiv'

let myForm = document.createElement('form')
myForm.id = 'usernameForm'
myForm.innerHTML = '<input id="usernameInput" autocomplete="on" placeholder="Choisir un pseudo" /><button>CHOISIR</button>'

mydiv.appendChild(myForm)
document.body.appendChild(mydiv);

myForm.addEventListener('submit', function(e){
    e.preventDefault()
    let uin = document.querySelector("#usernameInput")
    if(!uin.value) return;
    myForm.style.display = 'none'
    socket = io();

    let username = uin.value
    socket.emit('newUser', uin.value)

    socket.on('newUser', (name) => {
        let item = document.createElement('li');
        item.textContent = name + " a rejoint le chat ! ";
        item.innerHTML += "&#128075;"
        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
    })

    socket.on('new_message', (username, msg) => {
        receive_message(username, msg)
    })

    let form = document.querySelector('#messageForm');
    let messages = document.querySelector('#messages');
    let input = document.querySelector('#input');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (input.value) {
            socket.emit('send_message', username, input.value);
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