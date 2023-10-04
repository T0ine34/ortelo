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
    socket.emit('login', uin.value)
    let username
    socket.on('getSelectedUsername', (name) => {
        username = name
    })

    socket.on('new_message', (msg) => {
        console.log(msg)
        let item = document.createElement('li');
        item.textContent = username + " : " + msg;
        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
        
    })

    let form = document.querySelector('#messageForm');
    let messages = document.querySelector('#messages');
    let input = document.querySelector('#input');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (input.value) {
            socket.emit('send_message', input.value);
            input.value = '';
        }
    });
    
})




